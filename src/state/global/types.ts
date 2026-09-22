import type { Theme } from "../../types/theme";
import type {
  DeviceInfo,
  DownloadNetworkPreflight,
  DownloadNetworkSettings,
  ModelCatalog,
  ModelDownloadProgress,
  ModelInstallationStatus,
  ModelStorageSettings,
  LocalChatMessage,
  LocalRuntimeStatus,
} from "../../types/model";
import type { WorkspaceSection } from "../../types/navigation";

export type GlobalState = {
  activeSection: WorkspaceSection;
  theme: Theme;
  models: {
    catalog?: ModelCatalog;
    device?: DeviceInfo;
    installationStatuses: ModelInstallationStatus[];
    downloadProgress?: ModelDownloadProgress;
    downloadError?: string;
    cancellingModelId?: string;
  };
  downloadNetwork: {
    settings: DownloadNetworkSettings;
    preflight?: DownloadNetworkPreflight;
    isSaving: boolean;
    isChecking: boolean;
    error?: string;
  };
  modelStorage: {
    settings?: ModelStorageSettings;
    isSaving: boolean;
    error?: string;
  };
  runtime: {
    status: LocalRuntimeStatus;
    error?: string;
  };
};

export type GlobalActions = {
  navigate: (section: WorkspaceSection) => void;
  setTheme: (theme: Theme) => void;
  startModelDownload: (modelId: string) => Promise<void>;
  cancelModelDownload: (modelId: string) => Promise<void>;
  saveDownloadNetworkSettings: (settings: DownloadNetworkSettings) => Promise<DownloadNetworkSettings>;
  checkDownloadNetwork: () => Promise<void>;
  saveModelStorageSettings: (settings: ModelStorageSettings) => Promise<ModelStorageSettings>;
  startLocalRuntime: (modelId: string) => Promise<void>;
  stopLocalRuntime: () => Promise<void>;
  sendLocalChat: (messages: LocalChatMessage[]) => Promise<LocalChatMessage>;
};

export type GlobalStore = {
  isInitialized: boolean;
  isInitializing: boolean;
  initialize: () => Promise<void>;
  subscribeToDownloadProgress: () => Promise<() => void>;
} & GlobalState & GlobalActions;
