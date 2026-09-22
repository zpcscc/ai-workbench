import type { DownloadNetworkModuleActions, DownloadNetworkModuleProps } from "./types";
import type { DownloadNetworkSettings } from "../../../../types/model";

export function createDownloadNetworkModuleActions(
  form: DownloadNetworkSettings,
  actions: DownloadNetworkModuleProps["actions"],
): DownloadNetworkModuleActions {
  return {
    save: async () => {
      await actions.saveDownloadNetworkSettings({
        mirrorUrl: form.mirrorUrl?.trim() || null,
        proxyUrl: form.proxyUrl?.trim() || null,
      });
    },
    check: actions.checkDownloadNetwork,
  };
}
