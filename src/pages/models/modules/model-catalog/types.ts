import type {
  LocalRuntimeStatus,
  ModelDefinition,
  ModelDownloadProgress,
  ModelInstallationStatus,
} from "../../../../types/model";

export type ModelCatalogModuleState = {
  models?: ModelDefinition[];
  pendingModel?: ModelDefinition;
  installationStatuses: ModelInstallationStatus[];
  downloadProgress?: ModelDownloadProgress;
  downloadError?: string;
  cancellingModelId?: string;
  runtimeStatus: LocalRuntimeStatus;
  runtimeError?: string;
};

export type ModelCatalogModuleActions = {
  selectDownload: (modelId: string) => void;
  dismissDownload: () => void;
  confirmDownload: () => void;
  cancelDownload: (modelId: string) => void;
  startRuntime: (modelId: string) => void;
  stopRuntime: () => void;
};
