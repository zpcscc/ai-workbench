use std::{
    collections::HashMap,
    fs::{self, OpenOptions},
    net::TcpListener,
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
    time::Duration,
};

use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::Notify;

use crate::model_installation;

const RUNTIME_HOST: &str = "127.0.0.1";
struct RuntimeProcess {
    child: Child,
    model_id: String,
    port: u16,
    api_key: String,
}

#[derive(Clone)]
struct RuntimeConnection {
    model_id: String,
    port: u16,
    api_key: String,
}

struct ChatCancellation {
    cancelled: AtomicBool,
    notify: Notify,
}

struct ActiveChatGuard {
    request_id: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    state: String,
    model_id: Option<String>,
    detail: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatGenerationOptions {
    temperature: f32,
    max_tokens: u32,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatStreamChunk {
    request_id: String,
    content: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatStreamResult {
    request_id: String,
    cancelled: bool,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionChunk {
    choices: Vec<ChatStreamChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatStreamChoice {
    delta: ChatStreamDelta,
}

#[derive(Debug, Deserialize)]
struct ChatStreamDelta {
    content: Option<String>,
    reasoning_content: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatCancellationResult {
    request_id: String,
    cancellation_requested: bool,
}

static RUNTIME: OnceLock<Mutex<Option<RuntimeProcess>>> = OnceLock::new();
static ACTIVE_CHATS: OnceLock<Mutex<HashMap<String, Arc<ChatCancellation>>>> = OnceLock::new();

impl ChatCancellation {
    fn cancel(&self) {
        self.cancelled.store(true, Ordering::Release);
        self.notify.notify_one();
    }

    fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::Acquire)
    }
}

impl Drop for ActiveChatGuard {
    fn drop(&mut self) {
        if let Ok(mut chats) = active_chats().lock() {
            chats.remove(&self.request_id);
        }
    }
}

pub async fn status() -> Result<RuntimeStatus, String> {
    let Some(connection) = current_runtime()? else {
        return Ok(stopped_status());
    };
    if health_check(&connection).await {
        Ok(RuntimeStatus {
            state: "ready".to_string(),
            model_id: Some(connection.model_id),
            detail: "本地运行时已就绪。".to_string(),
        })
    } else {
        Ok(RuntimeStatus {
            state: "starting".to_string(),
            model_id: Some(connection.model_id),
            detail: "正在加载本地模型…".to_string(),
        })
    }
}

pub async fn start(app: &AppHandle, model_id: String) -> Result<RuntimeStatus, String> {
    if let Some(current) = current_runtime()? {
        if current.model_id == model_id && health_check(&current).await {
            return status().await;
        }
        stop()?;
    }

    let model_path = model_installation::installed_model_path(app, &model_id)?;
    let executable = runtime_executable(app)?;
    let runtime_dir = executable
        .parent()
        .ok_or_else(|| "无法定位本地运行时目录。".to_string())?;
    let log_dir = app
        .path()
        .app_log_dir()
        .map_err(|error| format!("无法定位日志目录：{error}"))?;
    fs::create_dir_all(&log_dir).map_err(|error| format!("无法创建日志目录：{error}"))?;
    let log_path = log_dir.join("llama-server.log");
    let stdout = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|error| format!("无法创建运行时日志：{error}"))?;
    let stderr = stdout
        .try_clone()
        .map_err(|error| format!("无法打开运行时日志：{error}"))?;
    let port = available_port()?;
    let api_key = generate_api_key()?;
    let port_argument = port.to_string();

    let mut command = Command::new(&executable);
    command
        .current_dir(runtime_dir)
        .args([
            "--model",
            &model_path.to_string_lossy(),
            "--host",
            RUNTIME_HOST,
            "--port",
            &port_argument,
            "--api-key",
            &api_key,
            "--ctx-size",
            "4096",
            "--parallel",
            "1",
            "--jinja",
            "--no-ui",
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::from(stdout))
        .stderr(Stdio::from(stderr));
    #[cfg(target_os = "macos")]
    command.env("DYLD_LIBRARY_PATH", runtime_dir);
    #[cfg(target_os = "linux")]
    command.env("LD_LIBRARY_PATH", runtime_dir);

    let child = command.spawn().map_err(|error| {
        format!(
            "无法启动本地运行时 {}：{error}",
            executable.to_string_lossy()
        )
    })?;
    *runtime()
        .lock()
        .map_err(|_| "无法访问本地运行时状态。".to_string())? = Some(RuntimeProcess {
        child,
        model_id,
        port,
        api_key,
    });

    for _ in 0..240 {
        if process_exited()? {
            return Err(format!(
                "本地运行时启动失败，请查看日志：{}",
                log_path.to_string_lossy()
            ));
        }
        let connection =
            current_runtime()?.ok_or_else(|| "本地运行时在启动期间意外退出。".to_string())?;
        if health_check(&connection).await {
            return status().await;
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
    stop()?;
    Err("本地模型加载超时，请检查运行时日志。".to_string())
}

pub fn stop() -> Result<RuntimeStatus, String> {
    cancel_all_chats();
    if let Some(mut process) = runtime()
        .lock()
        .map_err(|_| "无法访问本地运行时状态。".to_string())?
        .take()
    {
        let _ = process.child.kill();
        let _ = process.child.wait();
    }
    Ok(stopped_status())
}

pub async fn chat(
    app: AppHandle,
    request_id: String,
    messages: Vec<ChatMessage>,
    options: ChatGenerationOptions,
) -> Result<ChatStreamResult, String> {
    validate_request_id(&request_id)?;
    validate_chat_options(&options)?;
    let cancellation = Arc::new(ChatCancellation {
        cancelled: AtomicBool::new(false),
        notify: Notify::new(),
    });
    let _guard = register_chat(&request_id, cancellation.clone())?;
    let connection = current_runtime()?.ok_or_else(|| "本地运行时尚未启动。".to_string())?;
    if !health_check(&connection).await {
        return Err("本地运行时尚未就绪。".to_string());
    }
    let request = chat_client()
        .post(format!(
            "http://{RUNTIME_HOST}:{}/v1/chat/completions",
            connection.port
        ))
        .bearer_auth(&connection.api_key)
        .json(&json!({
            "model": "local",
            "messages": messages,
            "temperature": options.temperature,
            "max_tokens": options.max_tokens,
            "stream": true,
            "chat_template_kwargs": { "enable_thinking": false }
        }));
    let response = tokio::select! {
        _ = cancellation.notify.notified() => {
            return Ok(ChatStreamResult {
                request_id,
                cancelled: true,
                content: String::new(),
            });
        }
        response = request.send() => {
            response.map_err(|error| format!("本地推理请求失败：{error}"))?
        }
    };
    if !response.status().is_success() {
        let status = response.status();
        let detail = response.text().await.unwrap_or_default();
        return Err(format!("本地运行时返回 HTTP {status}：{detail}"));
    }
    let mut stream = response.bytes_stream();
    let mut buffer = Vec::new();
    let mut full_content = String::new();
    let mut stream_finished = false;

    while !stream_finished {
        if cancellation.is_cancelled() {
            return Ok(ChatStreamResult {
                request_id,
                cancelled: true,
                content: full_content,
            });
        }
        let next_chunk = tokio::select! {
            _ = cancellation.notify.notified() => {
                return Ok(ChatStreamResult {
                    request_id,
                    cancelled: true,
                    content: full_content,
                });
            }
            chunk = stream.next() => chunk,
        };
        if cancellation.is_cancelled() {
            return Ok(ChatStreamResult {
                request_id,
                cancelled: true,
                content: full_content,
            });
        }
        let Some(chunk) = next_chunk else {
            break;
        };
        let chunk = chunk.map_err(|error| format!("本地推理流读取失败：{error}"))?;
        buffer.extend_from_slice(&chunk);
        for data in take_sse_data_lines(&mut buffer)? {
            if handle_stream_data(&app, &request_id, &data, &mut full_content)? {
                stream_finished = true;
                break;
            }
        }
    }

    if !stream_finished && !buffer.is_empty() {
        buffer.push(b'\n');
        for data in take_sse_data_lines(&mut buffer)? {
            if handle_stream_data(&app, &request_id, &data, &mut full_content)? {
                break;
            }
        }
    }

    if cancellation.is_cancelled() {
        return Ok(ChatStreamResult {
            request_id,
            cancelled: true,
            content: full_content,
        });
    }
    if full_content.is_empty() {
        return Err("本地运行时返回了空内容。".to_string());
    }
    Ok(ChatStreamResult {
        request_id,
        cancelled: false,
        content: full_content,
    })
}

pub fn cancel_chat(request_id: String) -> Result<ChatCancellationResult, String> {
    validate_request_id(&request_id)?;
    let cancellation = active_chats()
        .lock()
        .map_err(|_| "无法访问本地对话任务。".to_string())?
        .get(&request_id)
        .cloned();
    let cancellation_requested = cancellation.is_some();
    if let Some(cancellation) = cancellation {
        cancellation.cancel();
    }
    Ok(ChatCancellationResult {
        request_id,
        cancellation_requested,
    })
}

fn active_chats() -> &'static Mutex<HashMap<String, Arc<ChatCancellation>>> {
    ACTIVE_CHATS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn register_chat(
    request_id: &str,
    cancellation: Arc<ChatCancellation>,
) -> Result<ActiveChatGuard, String> {
    let mut chats = active_chats()
        .lock()
        .map_err(|_| "无法访问本地对话任务。".to_string())?;
    if chats.contains_key(request_id) {
        return Err("相同的本地对话请求正在处理中。".to_string());
    }
    chats.insert(request_id.to_string(), cancellation);
    Ok(ActiveChatGuard {
        request_id: request_id.to_string(),
    })
}

fn cancel_all_chats() {
    let cancellations = active_chats()
        .lock()
        .map(|chats| chats.values().cloned().collect::<Vec<_>>())
        .unwrap_or_default();
    for cancellation in cancellations {
        cancellation.cancel();
    }
}

fn validate_request_id(request_id: &str) -> Result<(), String> {
    if request_id.is_empty()
        || request_id.len() > 128
        || !request_id
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '-')
    {
        return Err("本地对话请求 ID 无效。".to_string());
    }
    Ok(())
}

fn validate_chat_options(options: &ChatGenerationOptions) -> Result<(), String> {
    if !options.temperature.is_finite() || !(0.0..=2.0).contains(&options.temperature) {
        return Err("温度必须在 0 到 2 之间。".to_string());
    }
    if !(1..=4096).contains(&options.max_tokens) {
        return Err("最大生成长度必须在 1 到 4096 之间。".to_string());
    }
    Ok(())
}

fn take_sse_data_lines(buffer: &mut Vec<u8>) -> Result<Vec<String>, String> {
    let mut data_lines = Vec::new();
    while let Some(newline) = buffer.iter().position(|byte| *byte == b'\n') {
        let mut line = buffer.drain(..=newline).collect::<Vec<_>>();
        line.pop();
        if line.last() == Some(&b'\r') {
            line.pop();
        }
        let line = std::str::from_utf8(&line)
            .map_err(|error| format!("本地推理流包含无效 UTF-8：{error}"))?;
        if let Some(data) = line.strip_prefix("data:") {
            data_lines.push(data.trim_start().to_string());
        }
    }
    Ok(data_lines)
}

fn parse_stream_content(data: &str) -> Result<Option<String>, String> {
    let chunk: ChatCompletionChunk =
        serde_json::from_str(data).map_err(|error| format!("无法解析本地推理分片：{error}"))?;
    Ok(chunk.choices.into_iter().next().and_then(|choice| {
        choice
            .delta
            .content
            .filter(|content| !content.is_empty())
            .or(choice.delta.reasoning_content)
    }))
}

fn handle_stream_data(
    app: &AppHandle,
    request_id: &str,
    data: &str,
    full_content: &mut String,
) -> Result<bool, String> {
    if data == "[DONE]" {
        return Ok(true);
    }
    if let Some(content) = parse_stream_content(data)? {
        full_content.push_str(&content);
        app.emit(
            "local-chat-chunk",
            ChatStreamChunk {
                request_id: request_id.to_string(),
                content,
            },
        )
        .map_err(|error| format!("无法发布本地对话分片：{error}"))?;
    }
    Ok(false)
}

fn chat_client() -> &'static Client {
    static CLIENT: OnceLock<Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        Client::builder()
            .connect_timeout(Duration::from_secs(5))
            .read_timeout(Duration::from_secs(60))
            .build()
            .expect("failed to create local runtime chat client")
    })
}

fn runtime() -> &'static Mutex<Option<RuntimeProcess>> {
    RUNTIME.get_or_init(|| Mutex::new(None))
}

fn current_runtime() -> Result<Option<RuntimeConnection>, String> {
    let mut runtime = runtime()
        .lock()
        .map_err(|_| "无法访问本地运行时状态。".to_string())?;
    let Some(process) = runtime.as_mut() else {
        return Ok(None);
    };
    if process
        .child
        .try_wait()
        .map_err(|error| format!("无法读取本地运行时进程：{error}"))?
        .is_some()
    {
        *runtime = None;
        return Ok(None);
    }
    Ok(runtime.as_ref().map(|process| RuntimeConnection {
        model_id: process.model_id.clone(),
        port: process.port,
        api_key: process.api_key.clone(),
    }))
}

fn process_exited() -> Result<bool, String> {
    Ok(current_runtime()?.is_none())
}

async fn health_check(connection: &RuntimeConnection) -> bool {
    health_client()
        .get(format!("http://{RUNTIME_HOST}:{}/health", connection.port))
        .bearer_auth(&connection.api_key)
        .send()
        .await
        .map(|response| response.status().is_success())
        .unwrap_or(false)
}

fn available_port() -> Result<u16, String> {
    TcpListener::bind((RUNTIME_HOST, 0))
        .and_then(|listener| listener.local_addr())
        .map(|address| address.port())
        .map_err(|error| format!("无法分配本地运行时端口：{error}"))
}

fn generate_api_key() -> Result<String, String> {
    let mut bytes = [0_u8; 32];
    getrandom::fill(&mut bytes).map_err(|error| format!("无法生成本地运行时访问密钥：{error}"))?;
    Ok(bytes.iter().map(|byte| format!("{byte:02x}")).collect())
}

fn health_client() -> &'static Client {
    static CLIENT: OnceLock<Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        Client::builder()
            .timeout(Duration::from_secs(1))
            .build()
            .expect("failed to create local runtime health client")
    })
}

fn runtime_executable(app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(debug_assertions)]
    if let Some(path) = std::env::var_os("AI_WORKBENCH_LLAMA_SERVER").map(PathBuf::from) {
        if path.is_file() {
            return Ok(path);
        }
    }
    let platform = if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
        "macos-arm64"
    } else if cfg!(all(target_os = "macos", target_arch = "x86_64")) {
        "macos-x64"
    } else if cfg!(all(target_os = "windows", target_arch = "x86_64")) {
        "windows-x64"
    } else if cfg!(all(target_os = "linux", target_arch = "x86_64")) {
        "linux-x64"
    } else {
        return Err("当前平台暂未提供本地运行时。".to_string());
    };
    let executable_name = if cfg!(target_os = "windows") {
        "llama-server.exe"
    } else {
        "llama-server"
    };
    let bundled = app
        .path()
        .resource_dir()
        .map_err(|error| format!("无法定位应用资源目录：{error}"))?
        .join("runtime")
        .join(platform)
        .join(executable_name);
    if bundled.is_file() {
        return Ok(bundled);
    }
    #[cfg(debug_assertions)]
    {
        let development = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("resources/runtime")
            .join(platform)
            .join(executable_name);
        if development.is_file() {
            return Ok(development);
        }
    }
    Err("未找到本地 llama.cpp 运行时，请重新安装包含运行时资源的应用。".to_string())
}

fn stopped_status() -> RuntimeStatus {
    RuntimeStatus {
        state: "stopped".to_string(),
        model_id: None,
        detail: "本地运行时未启动。".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sse_lines_support_split_chunks_and_crlf() {
        let mut buffer = b"data: {\"choices\":[{\"delta\":{\"content\":\"\xe4\xbd".to_vec();
        assert!(take_sse_data_lines(&mut buffer).unwrap().is_empty());
        buffer.extend_from_slice(b"\xa0\xe5\xa5\xbd\"}}]}\r\ndata: [DONE]\r\n\r\n");
        let lines = take_sse_data_lines(&mut buffer).unwrap();
        assert_eq!(lines.len(), 2);
        assert_eq!(
            parse_stream_content(&lines[0]).unwrap(),
            Some("你好".to_string())
        );
        assert_eq!(lines[1], "[DONE]");
    }

    #[test]
    fn stream_content_accepts_reasoning_fallback() {
        let data = r#"{"choices":[{"delta":{"content":null,"reasoning_content":"思考"}}]}"#;
        assert_eq!(
            parse_stream_content(data).unwrap(),
            Some("思考".to_string())
        );
    }

    #[test]
    fn chat_options_are_bounded() {
        assert!(validate_chat_options(&ChatGenerationOptions {
            temperature: 0.7,
            max_tokens: 2048,
        })
        .is_ok());
        assert!(validate_chat_options(&ChatGenerationOptions {
            temperature: 2.1,
            max_tokens: 2048,
        })
        .is_err());
        assert!(validate_chat_options(&ChatGenerationOptions {
            temperature: 0.7,
            max_tokens: 0,
        })
        .is_err());
    }
}
