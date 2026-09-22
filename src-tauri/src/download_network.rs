use std::{fs, time::Duration};

use reqwest::{Client, Proxy, Url};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE: &str = "download-network.json";

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadNetworkSettings {
    pub mirror_url: Option<String>,
    pub proxy_url: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadConnectionStatus {
    pub endpoint: String,
    pub available: bool,
    pub detail: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadNetworkPreflight {
    pub direct: DownloadConnectionStatus,
    pub mirror: Option<DownloadConnectionStatus>,
}

pub fn load_settings(app: &AppHandle) -> Result<DownloadNetworkSettings, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(DownloadNetworkSettings::default());
    }
    let content =
        fs::read_to_string(&path).map_err(|error| format!("无法读取下载网络设置：{error}"))?;
    serde_json::from_str(&content).map_err(|error| format!("下载网络设置格式无效：{error}"))
}

pub fn save_settings(
    app: &AppHandle,
    settings: DownloadNetworkSettings,
) -> Result<DownloadNetworkSettings, String> {
    let normalized = normalize_settings(settings)?;
    let path = settings_path(app)?;
    let parent = path
        .parent()
        .ok_or_else(|| "无法定位下载网络设置目录。".to_string())?;
    fs::create_dir_all(parent).map_err(|error| format!("无法创建设置目录：{error}"))?;
    let content = serde_json::to_string_pretty(&normalized)
        .map_err(|error| format!("无法序列化下载网络设置：{error}"))?;
    fs::write(path, content).map_err(|error| format!("无法保存下载网络设置：{error}"))?;
    Ok(normalized)
}

pub fn build_client(settings: &DownloadNetworkSettings) -> Result<Client, String> {
    let mut builder = Client::builder()
        .connect_timeout(Duration::from_secs(15))
        .read_timeout(Duration::from_secs(90))
        .user_agent("AI-Workbench/0.1 model-downloader");
    if let Some(proxy_url) = &settings.proxy_url {
        builder =
            builder.proxy(Proxy::all(proxy_url).map_err(|error| format!("代理地址无效：{error}"))?);
    }
    builder
        .build()
        .map_err(|error| format!("无法初始化下载客户端：{error}"))
}

pub async fn preflight(
    app: &AppHandle,
    base_url: &str,
    repository: &str,
) -> Result<DownloadNetworkPreflight, String> {
    let settings = load_settings(app)?;
    let client = build_client(&settings)?;
    let direct = check_endpoint(&client, base_url, repository).await;
    let mirror = match settings.mirror_url.as_deref() {
        Some(url) => Some(check_endpoint(&client, url, repository).await),
        None => None,
    };
    Ok(DownloadNetworkPreflight { direct, mirror })
}

pub fn download_bases<'a>(
    settings: &'a DownloadNetworkSettings,
    default_base_url: &'a str,
) -> Vec<&'a str> {
    let mut bases = vec![default_base_url];
    if let Some(mirror_url) = settings.mirror_url.as_deref() {
        if mirror_url != default_base_url {
            bases.push(mirror_url);
        }
    }
    bases
}

pub fn normalize_settings(
    settings: DownloadNetworkSettings,
) -> Result<DownloadNetworkSettings, String> {
    Ok(DownloadNetworkSettings {
        mirror_url: normalize_url(settings.mirror_url, "镜像地址", true)?,
        proxy_url: normalize_url(settings.proxy_url, "代理地址", false)?,
    })
}

async fn check_endpoint(
    client: &Client,
    endpoint: &str,
    repository: &str,
) -> DownloadConnectionStatus {
    let display_endpoint = endpoint.to_string();
    let url = format!("{endpoint}/api/models/{repository}");
    match client.get(url).send().await {
        Ok(response) if response.status().is_success() => DownloadConnectionStatus {
            endpoint: display_endpoint,
            available: true,
            detail: "连接正常".to_string(),
        },
        Ok(response) => DownloadConnectionStatus {
            endpoint: display_endpoint,
            available: false,
            detail: format!("服务器返回 HTTP {}", response.status()),
        },
        Err(error) => DownloadConnectionStatus {
            endpoint: display_endpoint,
            available: false,
            detail: format!("连接失败：{error}"),
        },
    }
}

fn settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|error| format!("无法定位应用数据目录：{error}"))?
        .join(SETTINGS_FILE))
}

fn normalize_url(
    value: Option<String>,
    label: &str,
    https_only: bool,
) -> Result<Option<String>, String> {
    let Some(value) = value
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
    else {
        return Ok(None);
    };
    let url = Url::parse(&value).map_err(|error| format!("{label}无效：{error}"))?;
    let allowed_scheme = if https_only {
        url.scheme() == "https"
    } else {
        matches!(url.scheme(), "http" | "https")
    };
    if !allowed_scheme || url.host_str().is_none() {
        return Err(if https_only {
            format!("{label}必须是有效的 HTTPS 地址。")
        } else {
            format!("{label}必须是有效的 HTTP 或 HTTPS 地址。")
        });
    }
    Ok(Some(value.trim_end_matches('/').to_string()))
}
