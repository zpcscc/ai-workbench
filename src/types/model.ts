export type DeviceInfo = {
  operatingSystem: string;
  architecture: string;
  logicalCpuCores: number;
};

export type ModelDefinition = {
  id: string;
  name: string;
  family: string;
  capability: "chat";
  quantization: string;
  estimatedDownloadBytes: number;
  minimumMemoryGiB: number;
  recommendedMemoryGiB: number;
  recommended: boolean;
  license: string;
  source: "official";
  download: {
    provider: string;
    repository: string;
    filename: string;
    revision: string;
    sha256: string | null;
  };
};

export type ModelCatalog = {
  schemaVersion: number;
  generatedAt: string;
  models: ModelDefinition[];
};
