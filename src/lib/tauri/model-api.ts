import { invoke } from "@tauri-apps/api/core";
import type { DeviceInfo, ModelCatalog } from "../../types/model";

const browserFallbackCatalog: ModelCatalog = {
  schemaVersion: 1,
  generatedAt: "2026-09-20",
  models: [
    {
      id: "qwen3-4b-q4-k-m",
      name: "Qwen3 4B",
      family: "Qwen3",
      capability: "chat",
      quantization: "Q4_K_M",
      estimatedDownloadBytes: 2_500_000_000,
      minimumMemoryGiB: 12,
      recommendedMemoryGiB: 16,
      recommended: true,
      license: "Apache-2.0",
      source: "official",
      download: {
        provider: "huggingface",
        repository: "Qwen/Qwen3-4B-GGUF",
        filename: "qwen3-4b-q4_k_m.gguf",
        revision: "main",
        sha256: null,
      },
    },
  ],
};

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
