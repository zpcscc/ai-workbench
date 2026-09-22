#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod download_network;
mod local_runtime;
mod model_catalog;
mod model_installation;
mod model_storage;

#[tauri::command]
fn get_model_catalog() -> Result<model_catalog::ModelCatalog, String> {
    model_catalog::load_model_catalog()
}

#[tauri::command]
fn get_device_info() -> model_catalog::DeviceInfo {
    model_catalog::device_info()
}

#[tauri::command]
fn get_download_network_settings(
    app: tauri::AppHandle,
) -> Result<download_network::DownloadNetworkSettings, String> {
    download_network::load_settings(&app)
}

#[tauri::command]
fn save_download_network_settings(
    app: tauri::AppHandle,
    settings: download_network::DownloadNetworkSettings,
) -> Result<download_network::DownloadNetworkSettings, String> {
    download_network::save_settings(&app, settings)
}

#[tauri::command]
async fn check_download_network(
    app: tauri::AppHandle,
) -> Result<download_network::DownloadNetworkPreflight, String> {
    let source = model_catalog::active_download_source()?;
    download_network::preflight(&app, &source.base_url, &source.repository).await
}

#[tauri::command]
fn get_model_installation_statuses(
    app: tauri::AppHandle,
) -> Result<Vec<model_installation::ModelInstallStatus>, String> {
    model_installation::installation_statuses(&app)
}

#[tauri::command]
fn get_model_storage_settings(
    app: tauri::AppHandle,
) -> Result<model_storage::ModelStorageSettings, String> {
    model_storage::load_settings(&app)
}

#[tauri::command]
fn save_model_storage_settings(
    app: tauri::AppHandle,
    settings: model_storage::ModelStorageSettings,
) -> Result<model_storage::ModelStorageSettings, String> {
    if model_installation::has_active_downloads()? {
        return Err("模型下载期间不能修改存储位置，请先取消或等待下载完成。".to_string());
    }
    model_storage::save_settings(&app, settings)
}

#[tauri::command]
async fn download_model(
    app: tauri::AppHandle,
    model_id: String,
) -> Result<model_installation::ModelDownloadResult, model_installation::ModelDownloadError> {
    model_installation::download_model(app, model_id).await
}

#[tauri::command]
fn cancel_model_download(
    model_id: String,
) -> Result<model_installation::ModelCancellationResult, String> {
    model_installation::cancel_model_download(model_id)
}

#[tauri::command]
async fn get_local_runtime_status() -> Result<local_runtime::RuntimeStatus, String> {
    local_runtime::status().await
}

#[tauri::command]
async fn start_local_runtime(
    app: tauri::AppHandle,
    model_id: String,
) -> Result<local_runtime::RuntimeStatus, String> {
    local_runtime::start(&app, model_id).await
}

#[tauri::command]
fn stop_local_runtime() -> Result<local_runtime::RuntimeStatus, String> {
    local_runtime::stop()
}

#[tauri::command]
async fn send_local_chat(
    messages: Vec<local_runtime::ChatMessage>,
) -> Result<local_runtime::ChatMessage, String> {
    local_runtime::chat(messages).await
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_model_catalog,
            get_device_info,
            get_download_network_settings,
            save_download_network_settings,
            check_download_network,
            get_model_storage_settings,
            save_model_storage_settings,
            get_model_installation_statuses,
            download_model,
            cancel_model_download,
            get_local_runtime_status,
            start_local_runtime,
            stop_local_runtime,
            send_local_chat
        ])
        .build(tauri::generate_context!())
        .expect("failed to build AI Workbench")
        .run(|_, event| {
            if matches!(event, tauri::RunEvent::Exit) {
                let _ = local_runtime::stop();
            }
        });
}
