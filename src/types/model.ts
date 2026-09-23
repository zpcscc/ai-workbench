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
    enabled: boolean;
    provider: string;
    baseUrl: string;
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

export type ModelInstallState = "notInstalled" | "partial" | "installed" | "comingSoon" | "sourceUnverified";

export type ModelInstallationStatus = {
  modelId: string;
  state: ModelInstallState;
  installedBytes: number;
  partialBytes: number;
  installable: boolean;
};

export type ModelDownloadProgress = {
  modelId: string;
  downloadedBytes: number;
  totalBytes: number;
  state: "downloading" | "verifying" | "cancelled" | "failed" | "installed";
};

export type ModelDownloadResult = {
  modelId: string;
  installedPath: string;
  verifiedSha256: string;
};

export type ModelDownloadError = {
  code: string;
  message: string;
  resumable: boolean;
};

export type ModelCancellationResult = {
  modelId: string;
  cancellationRequested: boolean;
};

export type DownloadNetworkSettings = {
  mirrorUrl: string | null;
  proxyUrl: string | null;
};

export type DownloadConnectionStatus = {
  endpoint: string;
  available: boolean;
  detail: string;
};

export type DownloadNetworkPreflight = {
  direct: DownloadConnectionStatus;
  mirror: DownloadConnectionStatus | null;
};

export type ModelStorageSettings = {
  downloadDirectory: string | null;
  installDirectory: string | null;
  resolvedDownloadDirectory: string;
  resolvedInstallDirectory: string;
};

export type LocalRuntimeState = "stopped" | "starting" | "ready" | "error";

export type LocalRuntimeStatus = {
  state: LocalRuntimeState;
  modelId: string | null;
  detail: string;
};

export type LocalChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
};

export type LocalChatGenerationOptions = {
  temperature: number;
  maxTokens: number;
};

export type LocalChatStreamChunk = {
  requestId: string;
  content: string;
};

export type LocalChatStreamResult = {
  requestId: string;
  cancelled: boolean;
  content: string;
};

export type LocalChatCancellationResult = {
  requestId: string;
  cancellationRequested: boolean;
};
