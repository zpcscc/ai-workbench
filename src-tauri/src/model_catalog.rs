use serde::Serialize;

const MODEL_MANIFEST: &str = include_str!("../../src/config/model-manifest.json");

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub operating_system: String,
    pub architecture: String,
    pub logical_cpu_cores: usize,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelCatalog {
    pub schema_version: u32,
    pub generated_at: String,
    pub models: Vec<ModelDefinition>,
}

#[derive(Clone, Debug, Serialize)]
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

#[derive(Clone, Debug, Serialize)]
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

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ManifestDocument {
    schema_version: u32,
    generated_at: String,
    models: Vec<ModelDefinitionDocument>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ModelDefinitionDocument {
    id: String,
    name: String,
    family: String,
    capability: String,
    quantization: String,
    estimated_download_bytes: u64,
    minimum_memory_gi_b: u32,
    recommended_memory_gi_b: u32,
    recommended: bool,
    license: String,
    source: String,
    download: DownloadSourceDocument,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct DownloadSourceDocument {
    enabled: bool,
    provider: String,
    base_url: String,
    repository: String,
    filename: String,
    revision: String,
    sha256: Option<String>,
}

impl From<ModelDefinitionDocument> for ModelDefinition {
    fn from(model: ModelDefinitionDocument) -> Self {
        Self {
            id: model.id,
            name: model.name,
            family: model.family,
            capability: model.capability,
            quantization: model.quantization,
            estimated_download_bytes: model.estimated_download_bytes,
            minimum_memory_gi_b: model.minimum_memory_gi_b,
            recommended_memory_gi_b: model.recommended_memory_gi_b,
            recommended: model.recommended,
            license: model.license,
            source: model.source,
            download: DownloadSource {
                enabled: model.download.enabled,
                provider: model.download.provider,
                base_url: model.download.base_url,
                repository: model.download.repository,
                filename: model.download.filename,
                revision: model.download.revision,
                sha256: model.download.sha256,
            },
        }
    }
}

pub fn load_model_catalog() -> Result<ModelCatalog, String> {
    let document: ManifestDocument = serde_json::from_str(MODEL_MANIFEST)
        .map_err(|error| format!("无法解析内置模型清单：{error}"))?;

    if document.schema_version != 1 {
        return Err(format!("不支持的模型清单版本：{}", document.schema_version));
    }

    Ok(ModelCatalog {
        schema_version: document.schema_version,
        generated_at: document.generated_at,
        models: document.models.into_iter().map(Into::into).collect(),
    })
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
