#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod model_catalog;

#[tauri::command]
fn get_model_catalog() -> Result<model_catalog::ModelCatalog, String> {
    model_catalog::load_model_catalog()
}

#[tauri::command]
fn get_device_info() -> model_catalog::DeviceInfo {
    model_catalog::device_info()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_model_catalog, get_device_info])
        .run(tauri::generate_context!())
        .expect("failed to run AI Workbench");
}
