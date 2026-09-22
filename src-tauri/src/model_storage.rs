use std::{
    fs,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE: &str = "model-storage.json";

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ModelStorageConfiguration {
    download_directory: Option<String>,
    install_directory: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStorageSettings {
    pub download_directory: Option<String>,
    pub install_directory: Option<String>,
    pub resolved_download_directory: String,
    pub resolved_install_directory: String,
}

pub fn load_settings(app: &AppHandle) -> Result<ModelStorageSettings, String> {
    let configuration = load_configuration(app)?;
    resolve_settings(app, configuration)
}

pub fn save_settings(
    app: &AppHandle,
    settings: ModelStorageSettings,
) -> Result<ModelStorageSettings, String> {
    let configuration = ModelStorageConfiguration {
        download_directory: normalize_directory(settings.download_directory, "模型下载位置")?,
        install_directory: normalize_directory(settings.install_directory, "模型安装位置")?,
    };
    let resolved = resolve_settings(app, configuration.clone())?;
    ensure_writable_directory(
        Path::new(&resolved.resolved_download_directory),
        "模型下载位置",
    )?;
    ensure_writable_directory(
        Path::new(&resolved.resolved_install_directory),
        "模型安装位置",
    )?;

    let path = settings_path(app)?;
    let parent = path
        .parent()
        .ok_or_else(|| "无法定位模型存储设置目录。".to_string())?;
    fs::create_dir_all(parent).map_err(|error| format!("无法创建设置目录：{error}"))?;
    let content = serde_json::to_vec_pretty(&configuration)
        .map_err(|error| format!("无法序列化模型存储设置：{error}"))?;
    let temporary_path = path.with_extension("json.tmp");
    fs::write(&temporary_path, content)
        .map_err(|error| format!("无法写入模型存储设置：{error}"))?;
    fs::rename(&temporary_path, &path).map_err(|error| {
        let _ = fs::remove_file(&temporary_path);
        format!("无法保存模型存储设置：{error}")
    })?;
    Ok(resolved)
}

pub fn download_directory(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(PathBuf::from(
        load_settings(app)?.resolved_download_directory,
    ))
}

pub fn install_directory(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(PathBuf::from(
        load_settings(app)?.resolved_install_directory,
    ))
}

pub fn registry_directory(app: &AppHandle) -> Result<PathBuf, String> {
    default_models_directory(app)
}

fn load_configuration(app: &AppHandle) -> Result<ModelStorageConfiguration, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(ModelStorageConfiguration::default());
    }
    let content =
        fs::read_to_string(path).map_err(|error| format!("无法读取模型存储设置：{error}"))?;
    serde_json::from_str(&content).map_err(|error| format!("模型存储设置格式无效：{error}"))
}

fn resolve_settings(
    app: &AppHandle,
    configuration: ModelStorageConfiguration,
) -> Result<ModelStorageSettings, String> {
    let default_directory = default_models_directory(app)?;
    let download_directory = configuration
        .download_directory
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or_else(|| default_directory.clone());
    let install_directory = configuration
        .install_directory
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or(default_directory);
    Ok(ModelStorageSettings {
        download_directory: configuration.download_directory,
        install_directory: configuration.install_directory,
        resolved_download_directory: download_directory.to_string_lossy().to_string(),
        resolved_install_directory: install_directory.to_string_lossy().to_string(),
    })
}

fn default_models_directory(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|error| format!("无法定位应用数据目录：{error}"))?
        .join("models"))
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|error| format!("无法定位应用数据目录：{error}"))?
        .join(SETTINGS_FILE))
}

fn normalize_directory(value: Option<String>, label: &str) -> Result<Option<String>, String> {
    let Some(value) = value
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
    else {
        return Ok(None);
    };
    let path = Path::new(&value);
    if !path.is_absolute() {
        return Err(format!("{label}必须使用绝对路径。"));
    }
    Ok(Some(path.to_string_lossy().to_string()))
}

fn ensure_writable_directory(path: &Path, label: &str) -> Result<(), String> {
    fs::create_dir_all(path).map_err(|error| format!("无法创建{label}：{error}"))?;
    if !path.is_dir() {
        return Err(format!("{label}不是文件夹。"));
    }
    let probe = path.join(format!(".ai-workbench-write-test-{}", std::process::id()));
    fs::write(&probe, []).map_err(|error| format!("{label}不可写：{error}"))?;
    fs::remove_file(&probe).map_err(|error| format!("无法清理{label}写入测试文件：{error}"))
}
