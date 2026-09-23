use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

const MODEL_MANIFEST: &str = include_str!("../../src/config/model-manifest.json");

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub operating_system: String,
    pub architecture: String,
    pub logical_cpu_cores: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCatalog {
    pub schema_version: u32,
    pub generated_at: String,
    pub models: Vec<ModelDefinition>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelDefinition {
    pub id: String,
    pub name: String,
    pub family: String,
    pub capability: String,
    pub quantization: String,
    pub estimated_download_bytes: u64,
    pub minimum_memory_gi_b: u32,
    pub recommended_memory_gi_b: u32,
    pub recommended: bool,
    pub license: String,
    pub source: String,
    pub download: DownloadSource,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadSource {
    pub enabled: bool,
    pub provider: String,
    pub base_url: String,
    pub repository: String,
    pub filename: String,
    pub revision: String,
    pub sha256: Option<String>,
}

impl ModelDefinition {
    pub fn is_installable(&self) -> bool {
        self.download.enabled && self.has_verified_source()
    }

    pub fn has_verified_source(&self) -> bool {
        !self.download.base_url.is_empty()
            && self.download.revision != "main"
            && self.download.sha256.is_some()
    }
}

static MODEL_CATALOG: OnceLock<Result<ModelCatalog, String>> = OnceLock::new();

pub fn load_model_catalog() -> Result<ModelCatalog, String> {
    MODEL_CATALOG
        .get_or_init(|| {
            let catalog: ModelCatalog = serde_json::from_str(MODEL_MANIFEST)
                .map_err(|error| format!("无法解析内置模型清单：{error}"))?;
            if catalog.schema_version != 1 {
                return Err(format!("不支持的模型清单版本：{}", catalog.schema_version));
            }
            for model in &catalog.models {
                validate_path_segment(&model.id, "模型 ID")?;
                validate_path_segment(&model.download.filename, "模型文件名")?;
                validate_path_segment(&model.download.revision, "模型版本")?;
                validate_repository(&model.download.repository)?;
            }
            Ok(catalog)
        })
        .clone()
}

fn validate_path_segment(value: &str, label: &str) -> Result<(), String> {
    if value.is_empty()
        || value.len() > 255
        || value == "."
        || value == ".."
        || value.contains('/')
        || value.contains('\\')
        || !value.chars().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.')
        })
    {
        return Err(format!("内置模型清单中的{label}无效。"));
    }
    Ok(())
}

fn validate_repository(value: &str) -> Result<(), String> {
    let mut parts = value.split('/');
    let owner = parts.next().unwrap_or_default();
    let repository = parts.next().unwrap_or_default();
    if parts.next().is_some() {
        return Err("内置模型清单中的仓库路径无效。".to_string());
    }
    validate_path_segment(owner, "仓库所有者")?;
    validate_path_segment(repository, "仓库名称")
}

pub fn device_info() -> DeviceInfo {
    DeviceInfo {
        operating_system: std::env::consts::OS.to_string(),
        architecture: std::env::consts::ARCH.to_string(),
        logical_cpu_cores: std::thread::available_parallelism()
            .map(|value| value.get())
            .unwrap_or(1),
    }
}

pub fn find_model(model_id: &str) -> Result<ModelDefinition, String> {
    load_model_catalog()?
        .models
        .into_iter()
        .find(|model| model.id == model_id)
        .ok_or_else(|| format!("未找到模型：{model_id}"))
}

pub fn active_download_source() -> Result<DownloadSource, String> {
    load_model_catalog()?
        .models
        .into_iter()
        .find(ModelDefinition::is_installable)
        .map(|model| model.download)
        .ok_or_else(|| "模型清单中没有已开放的下载源。".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_catalog_is_valid() {
        let catalog = load_model_catalog().expect("embedded catalog should be valid");
        assert_eq!(catalog.schema_version, 1);
        assert!(!catalog.models.is_empty());
    }

    #[test]
    fn path_segments_reject_traversal_and_separators() {
        assert!(validate_path_segment("../model", "test").is_err());
        assert!(validate_path_segment("folder/model.gguf", "test").is_err());
        assert!(validate_path_segment("folder\\model.gguf", "test").is_err());
        assert!(validate_path_segment("model.gguf?download=false", "test").is_err());
        assert!(validate_path_segment("model.gguf", "test").is_ok());
    }

    #[test]
    fn repository_requires_exactly_owner_and_name() {
        assert!(validate_repository("owner/model").is_ok());
        assert!(validate_repository("owner/model/extra").is_err());
        assert!(validate_repository("model").is_err());
    }
}
