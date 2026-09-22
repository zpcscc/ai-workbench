import { create } from "zustand";
import {
  cancelModelDownload,
  checkDownloadNetwork,
  downloadModel,
  getDeviceInfo,
  getDownloadNetworkSettings,
  getModelCatalog,
  getModelInstallationStatuses,
  getModelStorageSettings,
  getLocalRuntimeStatus,
  onModelDownloadProgress,
  saveDownloadNetworkSettings,
  saveModelStorageSettings,
  sendLocalChat,
  startLocalRuntime,
  stopLocalRuntime,
} from "../../lib/tauri/model-api";
import type { ModelDownloadError } from "../../types/model";
import type { GlobalStore } from "./types";

const defaultNetworkSettings = { mirrorUrl: null, proxyUrl: null };

export const useAppStore = create<GlobalStore>()((set, get) => ({
  activeSection: "overview",
  theme: "system",
  models: { installationStatuses: [] },
  downloadNetwork: {
    settings: defaultNetworkSettings,
    isSaving: false,
    isChecking: false,
  },
  modelStorage: { isSaving: false },
  runtime: {
    status: { state: "stopped", modelId: null, detail: "本地运行时未启动。" },
  },
  isInitialized: false,
  isInitializing: false,

  initialize: async () => {
    if (get().isInitialized || get().isInitializing) return;
    set({ isInitializing: true });
    try {
      const [catalog, device, installationStatuses, settings, storageSettings, runtimeStatus] = await Promise.all([
        getModelCatalog(),
        getDeviceInfo(),
        getModelInstallationStatuses(),
        getDownloadNetworkSettings(),
        getModelStorageSettings(),
        getLocalRuntimeStatus().catch(() => ({ state: "stopped" as const, modelId: null, detail: "本地运行时未启动。" })),
      ]);
      set((state) => ({
        models: { ...state.models, catalog, device, installationStatuses },
        downloadNetwork: { ...state.downloadNetwork, settings },
        modelStorage: { ...state.modelStorage, settings: storageSettings },
        runtime: { status: runtimeStatus },
        isInitialized: true,
      }));
    } finally {
      set({ isInitializing: false });
    }
  },

  subscribeToDownloadProgress: () =>
    onModelDownloadProgress((downloadProgress) => {
      set((state) => ({ models: { ...state.models, downloadProgress } }));
    }),

  navigate: (activeSection) => set({ activeSection }),
  setTheme: (theme) => set({ theme }),

  startModelDownload: async (modelId) => {
    const { catalog, installationStatuses } = get().models;
    const model = catalog?.models.find((item) => item.id === modelId);
    const status = installationStatuses.find((item) => item.modelId === modelId);
    set((state) => ({
      models: {
        ...state.models,
        downloadError: undefined,
        downloadProgress: {
          modelId,
          downloadedBytes: status?.partialBytes ?? 0,
          totalBytes: model?.estimatedDownloadBytes ?? 0,
          state: "downloading",
        },
      },
    }));
    try {
      await downloadModel(modelId);
    } catch (error) {
      const failure = normalizeDownloadError(error);
      if (failure.code !== "cancelled") {
        set((state) => ({
          models: {
            ...state.models,
            downloadError: `${failure.message}${failure.resumable ? " 已保留下载进度，可稍后继续。" : ""}`,
          },
        }));
      }
    } finally {
      const installationStatuses = await getModelInstallationStatuses();
      set((state) => ({ models: { ...state.models, installationStatuses } }));
    }
  },

  cancelModelDownload: async (modelId) => {
    set((state) => ({ models: { ...state.models, cancellingModelId: modelId } }));
    try {
      const result = await cancelModelDownload(modelId);
      if (!result.cancellationRequested) {
        set((state) => ({
          models: { ...state.models, downloadError: "下载任务已经结束，无需取消。" },
        }));
      }
    } catch (error) {
      set((state) => ({
        models: {
          ...state.models,
          downloadError: error instanceof Error ? error.message : "无法取消模型下载，请稍后重试。",
        },
      }));
    } finally {
      set((state) => ({ models: { ...state.models, cancellingModelId: undefined } }));
    }
  },

  saveDownloadNetworkSettings: async (settings) => {
    set((state) => ({
      downloadNetwork: { ...state.downloadNetwork, isSaving: true, error: undefined },
    }));
    try {
      const saved = await saveDownloadNetworkSettings(settings);
      set((state) => ({ downloadNetwork: { ...state.downloadNetwork, settings: saved } }));
      return saved;
    } catch (error) {
      set((state) => ({
        downloadNetwork: {
          ...state.downloadNetwork,
          error: error instanceof Error ? error.message : "保存下载网络设置失败。",
        },
      }));
      throw error;
    } finally {
      set((state) => ({ downloadNetwork: { ...state.downloadNetwork, isSaving: false } }));
    }
  },

  checkDownloadNetwork: async () => {
    set((state) => ({
      downloadNetwork: { ...state.downloadNetwork, isChecking: true, error: undefined },
    }));
    try {
      const preflight = await checkDownloadNetwork();
      set((state) => ({ downloadNetwork: { ...state.downloadNetwork, preflight } }));
    } catch (error) {
      set((state) => ({
        downloadNetwork: {
          ...state.downloadNetwork,
          error: error instanceof Error ? error.message : "网络检测失败。",
        },
      }));
    } finally {
      set((state) => ({ downloadNetwork: { ...state.downloadNetwork, isChecking: false } }));
    }
  },

  saveModelStorageSettings: async (settings) => {
    set((state) => ({ modelStorage: { ...state.modelStorage, isSaving: true, error: undefined } }));
    try {
      const saved = await saveModelStorageSettings(settings);
      const installationStatuses = await getModelInstallationStatuses();
      set((state) => ({
        modelStorage: { ...state.modelStorage, settings: saved },
        models: { ...state.models, installationStatuses },
      }));
      return saved;
    } catch (error) {
      set((state) => ({
        modelStorage: {
          ...state.modelStorage,
          error: errorMessage(error, "保存模型存储设置失败。"),
        },
      }));
      throw error;
    } finally {
      set((state) => ({ modelStorage: { ...state.modelStorage, isSaving: false } }));
    }
  },

  startLocalRuntime: async (modelId) => {
    set({ runtime: { status: { state: "starting", modelId, detail: "正在加载本地模型…" } } });
    try {
      const status = await startLocalRuntime(modelId);
      set({ runtime: { status } });
    } catch (error) {
      const message = errorMessage(error, "本地运行时启动失败。");
      set({ runtime: { status: { state: "error", modelId, detail: message }, error: message } });
    }
  },

  stopLocalRuntime: async () => {
    try {
      const status = await stopLocalRuntime();
      set({ runtime: { status } });
    } catch (error) {
      const message = errorMessage(error, "无法停止本地运行时。");
      set((state) => ({ runtime: { ...state.runtime, error: message } }));
    }
  },

  sendLocalChat,
}));

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "string" && error) return error;
  return error instanceof Error ? error.message : fallback;
}

function normalizeDownloadError(error: unknown): ModelDownloadError {
  if (typeof error === "object" && error !== null && "message" in error) {
    const value = error as Partial<ModelDownloadError>;
    return {
      code: typeof value.code === "string" ? value.code : "unknown",
      message: typeof value.message === "string" ? value.message : "模型下载失败，请稍后重试。",
      resumable: value.resumable === true,
    };
  }
  return {
    code: "unknown",
    message: typeof error === "string" ? error : "模型下载失败，请稍后重试。",
    resumable: false,
  };
}
