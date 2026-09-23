import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import modelManifest from "../../config/model-manifest.json";
import type {
  DeviceInfo,
  DownloadNetworkPreflight,
  DownloadNetworkSettings,
  ModelCatalog,
  ModelCancellationResult,
  ModelDownloadResult,
  ModelDownloadProgress,
  ModelInstallationStatus,
  ModelStorageSettings,
  LocalChatMessage,
  LocalChatGenerationOptions,
  LocalChatCancellationResult,
  LocalChatStreamChunk,
  LocalChatStreamResult,
  LocalRuntimeStatus,
} from "../../types/model";

const browserFallbackCatalog = modelManifest as ModelCatalog;
const isTauri = "__TAURI_INTERNALS__" in window;

export async function getModelCatalog(): Promise<ModelCatalog> {
  try {
    return await invoke<ModelCatalog>("get_model_catalog");
  } catch (error) {
    if (isTauri) throw error;
    return browserFallbackCatalog;
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  try {
    return await invoke<DeviceInfo>("get_device_info");
  } catch (error) {
    if (isTauri) throw error;
    return {
      operatingSystem: navigator.userAgent.includes("Windows") ? "windows" : "browser",
      architecture: "unknown",
      logicalCpuCores: navigator.hardwareConcurrency || 1,
    };
  }
}

export async function getModelInstallationStatuses(): Promise<ModelInstallationStatus[]> {
  try {
    return await invoke<ModelInstallationStatus[]>("get_model_installation_statuses");
  } catch (error) {
    if (isTauri) throw error;
    return [];
  }
}

export async function getDownloadNetworkSettings(): Promise<DownloadNetworkSettings> {
  try {
    return await invoke<DownloadNetworkSettings>("get_download_network_settings");
  } catch (error) {
    if (isTauri) throw error;
    return { mirrorUrl: null, proxyUrl: null };
  }
}

export async function getModelStorageSettings(): Promise<ModelStorageSettings> {
  try {
    return await invoke<ModelStorageSettings>("get_model_storage_settings");
  } catch (error) {
    if (isTauri) throw error;
    return {
      downloadDirectory: null,
      installDirectory: null,
      resolvedDownloadDirectory: "由桌面应用确定",
      resolvedInstallDirectory: "由桌面应用确定",
    };
  }
}

export async function saveModelStorageSettings(settings: ModelStorageSettings): Promise<ModelStorageSettings> {
  return invoke<ModelStorageSettings>("save_model_storage_settings", { settings });
}

export async function saveDownloadNetworkSettings(settings: DownloadNetworkSettings): Promise<DownloadNetworkSettings> {
  return invoke<DownloadNetworkSettings>("save_download_network_settings", { settings });
}

export async function checkDownloadNetwork(): Promise<DownloadNetworkPreflight> {
  return invoke<DownloadNetworkPreflight>("check_download_network");
}

export async function downloadModel(modelId: string): Promise<ModelDownloadResult> {
  return invoke<ModelDownloadResult>("download_model", { modelId });
}

export async function cancelModelDownload(modelId: string): Promise<ModelCancellationResult> {
  return invoke<ModelCancellationResult>("cancel_model_download", { modelId });
}

export async function onModelDownloadProgress(
  callback: (progress: ModelDownloadProgress) => void,
): Promise<UnlistenFn> {
  try {
    return await listen<ModelDownloadProgress>("model-download-progress", (event) => callback(event.payload));
  } catch (error) {
    console.error("无法订阅模型下载进度。", error);
    return () => undefined;
  }
}

export async function getLocalRuntimeStatus(): Promise<LocalRuntimeStatus> {
  if (!isTauri) return { state: "stopped", modelId: null, detail: "本地运行时仅在桌面应用中可用。" };
  return invoke<LocalRuntimeStatus>("get_local_runtime_status");
}

export async function startLocalRuntime(modelId: string): Promise<LocalRuntimeStatus> {
  return invoke<LocalRuntimeStatus>("start_local_runtime", { modelId });
}

export async function stopLocalRuntime(): Promise<LocalRuntimeStatus> {
  return invoke<LocalRuntimeStatus>("stop_local_runtime");
}

export async function streamLocalChat(
  requestId: string,
  messages: LocalChatMessage[],
  options: LocalChatGenerationOptions,
  onChunk: (chunk: LocalChatStreamChunk) => void,
): Promise<LocalChatStreamResult> {
  if (!isTauri) throw new Error("流式本地对话仅在桌面应用中可用。");
  const unlisten = await listen<LocalChatStreamChunk>("local-chat-chunk", (event) => {
    if (event.payload.requestId === requestId) onChunk(event.payload);
  });
  try {
    return await invoke<LocalChatStreamResult>("send_local_chat", { requestId, messages, options });
  } finally {
    unlisten();
  }
}

export async function cancelLocalChat(requestId: string): Promise<LocalChatCancellationResult> {
  return invoke<LocalChatCancellationResult>("cancel_local_chat", { requestId });
}
