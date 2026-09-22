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
  LocalRuntimeStatus,
} from "../../types/model";

const browserFallbackCatalog = modelManifest as ModelCatalog;

export async function getModelCatalog(): Promise<ModelCatalog> {
  try {
    return await invoke<ModelCatalog>("get_model_catalog");
  } catch {
    return browserFallbackCatalog;
  }
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
  try {
    return await invoke<DeviceInfo>("get_device_info");
  } catch {
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
  } catch {
    return [];
  }
}

export async function getDownloadNetworkSettings(): Promise<DownloadNetworkSettings> {
  try {
    return await invoke<DownloadNetworkSettings>("get_download_network_settings");
  } catch {
    return { mirrorUrl: null, proxyUrl: null };
  }
}

export async function getModelStorageSettings(): Promise<ModelStorageSettings> {
  try {
    return await invoke<ModelStorageSettings>("get_model_storage_settings");
  } catch {
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
  } catch {
    return () => undefined;
  }
}

export async function getLocalRuntimeStatus(): Promise<LocalRuntimeStatus> {
  return invoke<LocalRuntimeStatus>("get_local_runtime_status");
}

export async function startLocalRuntime(modelId: string): Promise<LocalRuntimeStatus> {
  return invoke<LocalRuntimeStatus>("start_local_runtime", { modelId });
}

export async function stopLocalRuntime(): Promise<LocalRuntimeStatus> {
  return invoke<LocalRuntimeStatus>("stop_local_runtime");
}

export async function sendLocalChat(messages: LocalChatMessage[]): Promise<LocalChatMessage> {
  return invoke<LocalChatMessage>("send_local_chat", { messages });
}
