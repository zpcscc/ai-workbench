use std::{
    env,
    fs::{self, OpenOptions},
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::{Mutex, OnceLock},
    time::Duration,
};

use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Manager};

use crate::model_installation;

const RUNTIME_HOST: &str = "127.0.0.1";
const RUNTIME_PORT: u16 = 18433;

struct RuntimeProcess {
    child: Child,
    model_id: String,
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

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChatResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ChatResponseMessage {
    content: Option<String>,
    reasoning_content: Option<String>,
}

static RUNTIME: OnceLock<Mutex<Option<RuntimeProcess>>> = OnceLock::new();

pub async fn status() -> Result<RuntimeStatus, String> {
    let model_id = current_model_id()?;
    let Some(model_id) = model_id else {
        return Ok(stopped_status());
    };
    if health_check().await {
        Ok(RuntimeStatus {
            state: "ready".to_string(),
            model_id: Some(model_id),
            detail: "本地运行时已就绪。".to_string(),
        })
    } else {
        Ok(RuntimeStatus {
            state: "starting".to_string(),
            model_id: Some(model_id),
            detail: "正在加载本地模型…".to_string(),
        })
    }
}

pub async fn start(app: &AppHandle, model_id: String) -> Result<RuntimeStatus, String> {
    if let Some(current) = current_model_id()? {
        if current == model_id && health_check().await {
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

    let mut command = Command::new(&executable);
    command
        .current_dir(runtime_dir)
        .args([
            "--model",
            &model_path.to_string_lossy(),
            "--host",
            RUNTIME_HOST,
            "--port",
            &RUNTIME_PORT.to_string(),
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

    let child = command.spawn().map_err(|error| {
        format!(
            "无法启动本地运行时 {}：{error}",
            executable.to_string_lossy()
        )
    })?;
    *runtime()
        .lock()
        .map_err(|_| "无法访问本地运行时状态。".to_string())? =
        Some(RuntimeProcess { child, model_id });

    for _ in 0..240 {
        if process_exited()? {
            return Err(format!(
                "本地运行时启动失败，请查看日志：{}",
                log_path.to_string_lossy()
            ));
        }
        if health_check().await {
            return status().await;
        }
        tokio::time::sleep(Duration::from_millis(500)).await;
    }
    stop()?;
    Err("本地模型加载超时，请检查运行时日志。".to_string())
}

pub fn stop() -> Result<RuntimeStatus, String> {
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

pub async fn chat(messages: Vec<ChatMessage>) -> Result<ChatMessage, String> {
    if !health_check().await {
        return Err("本地运行时尚未就绪。".to_string());
    }
    let client = Client::builder()
        .timeout(Duration::from_secs(180))
        .build()
        .map_err(|error| format!("无法初始化本地对话客户端：{error}"))?;
    let response = client
        .post(format!(
            "http://{RUNTIME_HOST}:{RUNTIME_PORT}/v1/chat/completions"
        ))
        .json(&json!({
            "model": "local",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 512,
            "stream": false,
            "chat_template_kwargs": { "enable_thinking": false }
        }))
        .send()
        .await
        .map_err(|error| format!("本地推理请求失败：{error}"))?;
    if !response.status().is_success() {
        let status = response.status();
        let detail = response.text().await.unwrap_or_default();
        return Err(format!("本地运行时返回 HTTP {status}：{detail}"));
    }
    let completion: ChatCompletionResponse = response
        .json()
        .await
        .map_err(|error| format!("无法解析本地推理结果：{error}"))?;
    let message = completion
        .choices
        .into_iter()
        .next()
        .ok_or_else(|| "本地运行时没有返回对话结果。".to_string())?
        .message;
    let content = message
        .content
        .filter(|value| !value.trim().is_empty())
        .or(message.reasoning_content)
        .ok_or_else(|| "本地运行时返回了空内容。".to_string())?;
    Ok(ChatMessage {
        role: "assistant".to_string(),
        content,
    })
}

fn runtime() -> &'static Mutex<Option<RuntimeProcess>> {
    RUNTIME.get_or_init(|| Mutex::new(None))
}

fn current_model_id() -> Result<Option<String>, String> {
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
    Ok(runtime.as_ref().map(|process| process.model_id.clone()))
}

fn process_exited() -> Result<bool, String> {
    Ok(current_model_id()?.is_none())
}

async fn health_check() -> bool {
    let Ok(client) = Client::builder().timeout(Duration::from_secs(1)).build() else {
        return false;
    };
    client
        .get(format!("http://{RUNTIME_HOST}:{RUNTIME_PORT}/health"))
        .send()
        .await
        .map(|response| response.status().is_success())
        .unwrap_or(false)
}

fn runtime_executable(app: &AppHandle) -> Result<PathBuf, String> {
    if let Some(path) = env::var_os("AI_WORKBENCH_LLAMA_SERVER").map(PathBuf::from) {
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
    let development = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("resources/runtime")
        .join(platform)
        .join(executable_name);
    if development.is_file() {
        return Ok(development);
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
