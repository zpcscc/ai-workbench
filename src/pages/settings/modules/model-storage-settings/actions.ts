import { open } from "@tauri-apps/plugin-dialog";
import type { ModelStorageSettings } from "../../../../types/model";
import type {
  ModelStorageForm,
  ModelStorageModuleActions,
  ModelStorageModuleProps,
  ModelStorageModuleState,
} from "./types";

export function createModelStorageModuleActions(
  form: ModelStorageForm,
  settings: ModelStorageSettings | undefined,
  moduleState: ModelStorageModuleState,
  actions: ModelStorageModuleProps["actions"],
): ModelStorageModuleActions {
  async function selectDirectory(kind: "download" | "install") {
    moduleState.setSelectionError();
    moduleState.setSelecting(kind);
    try {
      const selected = await open({
        defaultPath:
          kind === "download"
            ? form.downloadDirectory || settings?.resolvedDownloadDirectory
            : form.installDirectory || settings?.resolvedInstallDirectory,
        directory: true,
        multiple: false,
        title: kind === "download" ? "选择模型下载文件夹" : "选择模型安装文件夹",
      });
      if (!selected) return;
      if (kind === "download") moduleState.setDownloadDirectory(selected);
      else moduleState.setInstallDirectory(selected);
    } catch (error) {
      moduleState.setSelectionError(formatDialogError(error));
    } finally {
      moduleState.setSelecting(null);
    }
  }

  return {
    selectDownloadDirectory: () => selectDirectory("download"),
    selectInstallDirectory: () => selectDirectory("install"),
    save: async () => {
      if (!settings) return;
      await actions.saveModelStorageSettings({
        ...settings,
        downloadDirectory: form.downloadDirectory?.trim() || null,
        installDirectory: form.installDirectory?.trim() || null,
      });
    },
    reset: () => {
      moduleState.setDownloadDirectory("");
      moduleState.setInstallDirectory("");
      moduleState.setSelectionError();
    },
  };
}

function formatDialogError(error: unknown) {
  const detail = error instanceof Error ? error.message : typeof error === "string" ? error : "未知错误";
  return `无法打开文件夹选择器：${detail}`;
}
