use std::{
    collections::HashMap,
    fs::{self, File, OpenOptions},
    io::{BufReader, Read, Write},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use futures_util::StreamExt;
use reqwest::{
    header::{CONTENT_RANGE, RANGE},
    Client, Response, StatusCode,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter};

use crate::{
    download_network,
    model_catalog::{self, ModelDefinition},
    model_storage,
};

const INSTALLATIONS_FILE: &str = "installations.json";
static ACTIVE_DOWNLOADS: OnceLock<Mutex<HashMap<String, Arc<AtomicBool>>>> = OnceLock::new();
static REGISTRY_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInstallStatus {
    pub model_id: String,
    pub state: String,
    pub installed_bytes: u64,
    pub partial_bytes: u64,
    pub installable: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelDownloadProgress {
    pub model_id: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub state: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelDownloadResult {
    pub model_id: String,
    pub installed_path: String,
    pub verified_sha256: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelDownloadError {
    pub code: String,
    pub message: String,
    pub resumable: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCancellationResult {
    pub model_id: String,
    pub cancellation_requested: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct InstallationRecord {
    model_id: String,
    filename: String,
    sha256: String,
    installed_bytes: u64,
    installed_at_unix_seconds: u64,
}

#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct InstallationRegistry {
    schema_version: u32,
    installations: Vec<InstallationRecord>,
}

struct ActiveDownloadGuard {
    model_id: String,
}

impl Drop for ActiveDownloadGuard {
    fn drop(&mut self) {
        if let Ok(mut downloads) = active_downloads().lock() {
            downloads.remove(&self.model_id);
        }
    }
}

pub fn installation_statuses(app: &AppHandle) -> Result<Vec<ModelInstallStatus>, String> {
    let registry = load_installation_registry(app)?;
    model_catalog::load_model_catalog()?
        .models
        .iter()
        .map(|model| installation_status(app, model, &registry))
        .collect()
}

pub fn installed_model_path(app: &AppHandle, model_id: &str) -> Result<PathBuf, String> {
    let model = model_catalog::find_model(model_id)?;
    let registry = load_installation_registry(app)?;
    let status = installation_status(app, &model, &registry)?;
    if status.state != "installed" {
        return Err("模型尚未完成安装或安装记录无效。".to_string());
    }
    installed_path(app, &model)
}

fn installation_status(
    app: &AppHandle,
    model: &ModelDefinition,
    registry: &InstallationRegistry,
) -> Result<ModelInstallStatus, String> {
    let installed_path = installed_path(app, model)?;
    let partial_path = partial_path(app, model)?;
    let installed_bytes = file_size(&installed_path);
    let partial_bytes = file_size(&partial_path);
    let expected_sha256 = model.download.sha256.as_deref();
    let has_valid_record = registry.installations.iter().any(|record| {
        record.model_id == model.id
            && record.filename == model.download.filename
            && Some(record.sha256.as_str()) == expected_sha256
            && record.installed_bytes == installed_bytes
            && installed_bytes > 0
    });
    let state = if has_valid_record {
        "installed"
    } else if partial_bytes > 0 {
        "partial"
    } else if model.is_installable() {
        "notInstalled"
    } else if model.has_verified_source() {
        "comingSoon"
    } else {
        "sourceUnverified"
    };

    Ok(ModelInstallStatus {
        model_id: model.id.clone(),
        state: state.to_string(),
        installed_bytes: if has_valid_record { installed_bytes } else { 0 },
        partial_bytes,
        installable: model.is_installable(),
    })
}

pub async fn download_model(
    app: AppHandle,
    model_id: String,
) -> Result<ModelDownloadResult, ModelDownloadError> {
    let model = model_catalog::find_model(&model_id)
        .map_err(|message| download_error("modelNotFound", message, false))?;
    if !model.is_installable() {
        return Err(download_error(
            "sourceUnverified",
            "该模型的下载来源尚未锁定版本或校验值，拒绝下载。",
            false,
        ));
    }

    let cancellation = Arc::new(AtomicBool::new(false));
    let _guard = register_download(&model.id, cancellation.clone())?;
    let result = download_and_install(&app, &model, &cancellation).await;
    if let Err(error) = &result {
        let state = if error.code == "cancelled" {
            "cancelled"
        } else {
            "failed"
        };
        let downloaded_bytes = partial_path(&app, &model)
            .map(|path| file_size(&path))
            .unwrap_or(0);
        emit_progress(
            &app,
            &model.id,
            downloaded_bytes,
            model.estimated_download_bytes,
            state,
        );
    }
    result
}

async fn download_and_install(
    app: &AppHandle,
    model: &ModelDefinition,
    cancellation: &AtomicBool,
) -> Result<ModelDownloadResult, ModelDownloadError> {
    let final_path = installed_path(app, model).map_err(configuration_error)?;
    let temp_path = partial_path(app, model).map_err(configuration_error)?;
    let download_dir = temp_path
        .parent()
        .ok_or_else(|| fatal_error("createDirectory", "无法定位模型下载目录。"))?;
    let install_dir = final_path
        .parent()
        .ok_or_else(|| fatal_error("createDirectory", "无法定位模型安装目录。"))?;
    fs::create_dir_all(download_dir).map_err(|error| {
        fatal_error("createDirectory", format!("无法创建模型下载目录：{error}"))
    })?;
    fs::create_dir_all(install_dir).map_err(|error| {
        fatal_error("createDirectory", format!("无法创建模型安装目录：{error}"))
    })?;
    if final_path.exists() {
        let result = verify_existing_file(model, &final_path)?;
        persist_installation(app, model, &final_path, &result.verified_sha256)?;
        return Ok(result);
    }

    let mut downloaded_bytes = file_size(&temp_path);
    let settings = download_network::load_settings(app).map_err(configuration_error)?;
    let client = download_network::build_client(&settings).map_err(configuration_error)?;
    let mut response =
        match request_download_response(&client, model, downloaded_bytes, &settings).await {
            Ok(response) => response,
            Err(_) if cancellation.load(Ordering::Relaxed) => {
                return Err(download_error(
                    "cancelled",
                    "下载已取消，已保留当前进度，可稍后继续。",
                    true,
                ));
            }
            Err(message) => return Err(download_error("requestFailed", message, true)),
        };

    if cancellation.load(Ordering::Relaxed) {
        return Err(download_error(
            "cancelled",
            "下载已取消，已保留当前进度，可稍后继续。",
            true,
        ));
    }

    let mut resumes_download =
        downloaded_bytes > 0 && valid_content_range(&response, downloaded_bytes);
    if downloaded_bytes > 0 && response.status() == StatusCode::PARTIAL_CONTENT && !resumes_download
    {
        response = request_download_response(&client, model, 0, &settings)
            .await
            .map_err(|message| download_error("resumeMismatch", message, true))?;
        resumes_download = false;
    }
    if !resumes_download {
        downloaded_bytes = 0;
    }
    let total_bytes = response
        .content_length()
        .map(|value| value + downloaded_bytes)
        .unwrap_or(model.estimated_download_bytes);
    let mut output = open_download_file(&temp_path, resumes_download)
        .map_err(|message| download_error("openPartialFile", message, true))?;

    emit_progress(app, &model.id, downloaded_bytes, total_bytes, "downloading");
    let mut stream = response.bytes_stream();
    let mut last_progress_at = Instant::now();
    let mut last_progress_bytes = downloaded_bytes;
    while let Some(chunk) = stream.next().await {
        if cancellation.load(Ordering::Relaxed) {
            output.flush().map_err(|error| {
                download_error(
                    "flushPartialFile",
                    format!("模型文件落盘失败：{error}"),
                    true,
                )
            })?;
            return Err(download_error(
                "cancelled",
                "下载已取消，已保留当前进度，可稍后继续。",
                true,
            ));
        }
        let chunk = chunk.map_err(|error| {
            download_error("streamFailed", format!("下载数据读取失败：{error}"), true)
        })?;
        output.write_all(&chunk).map_err(|error| {
            download_error("writeFailed", format!("模型文件写入失败：{error}"), true)
        })?;
        downloaded_bytes += chunk.len() as u64;
        if last_progress_at.elapsed() >= Duration::from_millis(100)
            || downloaded_bytes.saturating_sub(last_progress_bytes) >= 1024 * 1024
        {
            emit_progress(app, &model.id, downloaded_bytes, total_bytes, "downloading");
            last_progress_at = Instant::now();
            last_progress_bytes = downloaded_bytes;
        }
    }
    output.flush().map_err(|error| {
        download_error("flushFailed", format!("模型文件落盘失败：{error}"), true)
    })?;

    if cancellation.load(Ordering::Relaxed) {
        return Err(download_error(
            "cancelled",
            "下载已取消，已保留当前进度，可稍后继续。",
            true,
        ));
    }
    emit_progress(app, &model.id, downloaded_bytes, total_bytes, "verifying");
    let expected_sha256 = model
        .download
        .sha256
        .as_deref()
        .ok_or_else(|| download_error("missingChecksum", "模型缺少 SHA-256 校验值。", false))?;
    let actual_sha256 = calculate_sha256(&temp_path)
        .map_err(|message| download_error("checksumReadFailed", message, false))?;
    if cancellation.load(Ordering::Relaxed) {
        return Err(download_error(
            "cancelled",
            "下载已取消，已保留已完成的文件，可稍后继续校验。",
            true,
        ));
    }
    if !actual_sha256.eq_ignore_ascii_case(expected_sha256) {
        remove_file_if_exists(&temp_path).map_err(|message| {
            fatal_error("cleanupFailed", format!("SHA-256 校验失败，且{message}"))
        })?;
        return Err(download_error(
            "checksumMismatch",
            "模型文件 SHA-256 校验失败，损坏的临时文件已清理，请重新下载。",
            false,
        ));
    }

    install_verified_file(&temp_path, &final_path)?;
    if let Err(error) = persist_installation(app, model, &final_path, &actual_sha256) {
        restore_download_after_install_failure(&temp_path, &final_path);
        return Err(error);
    }
    remove_file_if_exists(&temp_path).map_err(|message| fatal_error("cleanupFailed", message))?;
    emit_progress(app, &model.id, downloaded_bytes, total_bytes, "installed");

    Ok(ModelDownloadResult {
        model_id: model.id.clone(),
        installed_path: final_path.to_string_lossy().to_string(),
        verified_sha256: actual_sha256,
    })
}

pub fn cancel_model_download(model_id: String) -> Result<ModelCancellationResult, String> {
    let downloads = active_downloads()
        .lock()
        .map_err(|_| "无法访问当前下载任务。".to_string())?;
    let cancellation_requested = downloads
        .get(&model_id)
        .map(|signal| {
            signal.store(true, Ordering::Relaxed);
            true
        })
        .unwrap_or(false);
    Ok(ModelCancellationResult {
        model_id,
        cancellation_requested,
    })
}

pub fn save_storage_settings(
    app: &AppHandle,
    settings: model_storage::ModelStorageSettings,
) -> Result<model_storage::ModelStorageSettings, String> {
    let downloads = active_downloads()
        .lock()
        .map_err(|_| "无法访问当前下载任务。".to_string())?;
    if !downloads.is_empty() {
        return Err("模型下载期间不能修改存储位置，请先取消或等待下载完成。".to_string());
    }
    model_storage::save_settings(app, settings)
}

fn register_download(
    model_id: &str,
    cancellation: Arc<AtomicBool>,
) -> Result<ActiveDownloadGuard, ModelDownloadError> {
    let mut downloads = active_downloads()
        .lock()
        .map_err(|_| fatal_error("downloadStateUnavailable", "无法访问当前下载任务。"))?;
    if downloads.contains_key(model_id) {
        return Err(download_error(
            "alreadyDownloading",
            "该模型已经在下载中。",
            true,
        ));
    }
    downloads.insert(model_id.to_string(), cancellation);
    Ok(ActiveDownloadGuard {
        model_id: model_id.to_string(),
    })
}

fn active_downloads() -> &'static Mutex<HashMap<String, Arc<AtomicBool>>> {
    ACTIVE_DOWNLOADS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn verify_existing_file(
    model: &ModelDefinition,
    path: &Path,
) -> Result<ModelDownloadResult, ModelDownloadError> {
    let expected_sha256 = model
        .download
        .sha256
        .as_deref()
        .ok_or_else(|| download_error("missingChecksum", "模型缺少 SHA-256 校验值。", false))?;
    let actual_sha256 =
        calculate_sha256(path).map_err(|message| fatal_error("checksumReadFailed", message))?;
    if !actual_sha256.eq_ignore_ascii_case(expected_sha256) {
        remove_file_if_exists(path).map_err(|message| fatal_error("cleanupFailed", message))?;
        return Err(download_error(
            "checksumMismatch",
            "本地模型的 SHA-256 校验失败，损坏文件已清理，请重新下载。",
            false,
        ));
    }

    Ok(ModelDownloadResult {
        model_id: model.id.clone(),
        installed_path: path.to_string_lossy().to_string(),
        verified_sha256: actual_sha256,
    })
}

fn emit_progress(
    app: &AppHandle,
    model_id: &str,
    downloaded_bytes: u64,
    total_bytes: u64,
    state: &str,
) {
    if let Err(error) = app.emit(
        "model-download-progress",
        ModelDownloadProgress {
            model_id: model_id.to_string(),
            downloaded_bytes,
            total_bytes,
            state: state.to_string(),
        },
    ) {
        eprintln!("无法发布模型下载进度：{error}");
    }
}

fn download_model_directory(app: &AppHandle, model: &ModelDefinition) -> Result<PathBuf, String> {
    Ok(model_storage::download_directory(app)?.join(&model.id))
}

fn install_model_directory(app: &AppHandle, model: &ModelDefinition) -> Result<PathBuf, String> {
    Ok(model_storage::install_directory(app)?.join(&model.id))
}

fn installed_path(app: &AppHandle, model: &ModelDefinition) -> Result<PathBuf, String> {
    Ok(install_model_directory(app, model)?.join(&model.download.filename))
}

fn partial_path(app: &AppHandle, model: &ModelDefinition) -> Result<PathBuf, String> {
    Ok(download_model_directory(app, model)?.join(format!("{}.part", model.download.filename)))
}

async fn request_download_response(
    client: &Client,
    model: &ModelDefinition,
    downloaded_bytes: u64,
    settings: &download_network::DownloadNetworkSettings,
) -> Result<Response, String> {
    if model.download.provider != "huggingface" {
        return Err(format!("不支持的模型下载源：{}", model.download.provider));
    }
    let mut errors = Vec::new();
    for base in download_network::download_bases(settings, &model.download.base_url) {
        let url = format!(
            "{base}/{}/resolve/{}/{}?download=true",
            model.download.repository, model.download.revision, model.download.filename
        );
        let mut request = client.get(url);
        if downloaded_bytes > 0 {
            request = request.header(RANGE, format!("bytes={downloaded_bytes}-"));
        }
        match request.send().await {
            Ok(response) if response.status().is_success() => return Ok(response),
            Ok(response) => errors.push(format!("{base} 返回 HTTP {}", response.status())),
            Err(error) => errors.push(format!("{base} 连接失败：{error}")),
        }
    }
    Err(format!("模型下载请求失败：{}。", errors.join("；")))
}

fn valid_content_range(response: &Response, downloaded_bytes: u64) -> bool {
    if response.status() != StatusCode::PARTIAL_CONTENT {
        return false;
    }
    response
        .headers()
        .get(CONTENT_RANGE)
        .and_then(|value| value.to_str().ok())
        .map(|value| value.starts_with(&format!("bytes {downloaded_bytes}-")))
        .unwrap_or(false)
}

fn open_download_file(path: &Path, append: bool) -> Result<File, String> {
    let mut options = OpenOptions::new();
    options.write(true).create(true);
    if append {
        options.append(true);
    } else {
        options.truncate(true);
    }
    options
        .open(path)
        .map_err(|error| format!("无法打开模型临时文件：{error}"))
}

fn install_verified_file(temp_path: &Path, final_path: &Path) -> Result<(), ModelDownloadError> {
    if temp_path.parent() == final_path.parent() {
        return fs::rename(temp_path, final_path).map_err(|error| {
            fatal_error(
                "installFailed",
                format!("模型安装完成时重命名失败：{error}"),
            )
        });
    }

    let installing_path = final_path.with_extension("installing");
    remove_file_if_exists(&installing_path)
        .map_err(|message| fatal_error("cleanupFailed", message))?;
    fs::copy(temp_path, &installing_path).map_err(|error| {
        fatal_error(
            "installFailed",
            format!("无法将模型复制到安装位置：{error}"),
        )
    })?;
    fs::rename(&installing_path, final_path).map_err(|error| {
        let _ = remove_file_if_exists(&installing_path);
        fatal_error("installFailed", format!("无法完成模型安装：{error}"))
    })
}

fn restore_download_after_install_failure(temp_path: &Path, final_path: &Path) {
    if !temp_path.exists() && fs::rename(final_path, temp_path).is_ok() {
        return;
    }
    let _ = remove_file_if_exists(final_path);
}

fn calculate_sha256(path: &Path) -> Result<String, String> {
    let file = File::open(path).map_err(|error| format!("无法读取模型文件进行校验：{error}"))?;
    let mut reader = BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 1024 * 1024];
    loop {
        let bytes_read = reader
            .read(&mut buffer)
            .map_err(|error| format!("模型哈希读取失败：{error}"))?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn load_installation_registry(app: &AppHandle) -> Result<InstallationRegistry, String> {
    let path = model_storage::registry_directory(app)?.join(INSTALLATIONS_FILE);
    if !path.exists() {
        return Ok(InstallationRegistry {
            schema_version: 1,
            installations: Vec::new(),
        });
    }
    let content =
        fs::read_to_string(path).map_err(|error| format!("无法读取本地模型安装记录：{error}"))?;
    let registry: InstallationRegistry = serde_json::from_str(&content)
        .map_err(|error| format!("本地模型安装记录格式无效：{error}"))?;
    if registry.schema_version != 1 {
        return Err(format!(
            "不支持的本地模型安装记录版本：{}",
            registry.schema_version
        ));
    }
    Ok(registry)
}

fn persist_installation(
    app: &AppHandle,
    model: &ModelDefinition,
    installed_path: &Path,
    sha256: &str,
) -> Result<(), ModelDownloadError> {
    let _registry_guard = registry_lock()
        .lock()
        .map_err(|_| fatal_error("persistInstallState", "无法锁定模型安装记录。"))?;
    let models_dir = model_storage::registry_directory(app).map_err(configuration_error)?;
    fs::create_dir_all(&models_dir).map_err(|error| {
        fatal_error(
            "persistInstallState",
            format!("无法创建模型状态目录：{error}"),
        )
    })?;
    let mut registry = load_installation_registry(app).map_err(configuration_error)?;
    let installed_bytes = file_size(installed_path);
    if registry.installations.iter().any(|record| {
        record.model_id == model.id
            && record.filename == model.download.filename
            && record.sha256.eq_ignore_ascii_case(sha256)
            && record.installed_bytes == installed_bytes
    }) {
        return Ok(());
    }
    registry
        .installations
        .retain(|record| record.model_id != model.id);
    registry.installations.push(InstallationRecord {
        model_id: model.id.clone(),
        filename: model.download.filename.clone(),
        sha256: sha256.to_string(),
        installed_bytes,
        installed_at_unix_seconds: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
    });
    let content = serde_json::to_vec_pretty(&registry).map_err(|error| {
        fatal_error(
            "persistInstallState",
            format!("无法序列化模型安装记录：{error}"),
        )
    })?;
    let path = models_dir.join(INSTALLATIONS_FILE);
    let temporary_path = models_dir.join(format!("{INSTALLATIONS_FILE}.tmp"));
    fs::write(&temporary_path, content).map_err(|error| {
        fatal_error(
            "persistInstallState",
            format!("无法写入模型安装记录：{error}"),
        )
    })?;
    fs::rename(&temporary_path, &path).map_err(|error| {
        let _ = remove_file_if_exists(&temporary_path);
        fatal_error(
            "persistInstallState",
            format!("无法保存模型安装记录：{error}"),
        )
    })
}

fn registry_lock() -> &'static Mutex<()> {
    REGISTRY_LOCK.get_or_init(|| Mutex::new(()))
}

fn remove_file_if_exists(path: &Path) -> Result<(), String> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("无法清理损坏的模型文件：{error}")),
    }
}

fn file_size(path: &Path) -> u64 {
    path.metadata().map(|metadata| metadata.len()).unwrap_or(0)
}

fn configuration_error(message: String) -> ModelDownloadError {
    fatal_error("configurationError", message)
}

fn fatal_error(code: impl Into<String>, message: impl Into<String>) -> ModelDownloadError {
    download_error(code, message, false)
}

fn download_error(
    code: impl Into<String>,
    message: impl Into<String>,
    resumable: bool,
) -> ModelDownloadError {
    ModelDownloadError {
        code: code.into(),
        message: message.into(),
        resumable,
    }
}
