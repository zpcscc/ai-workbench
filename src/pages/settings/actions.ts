import { useAppStore } from "../../state/global";
import type { SettingsPageActions } from "./types";

export function useSettingsPageActions(): SettingsPageActions {
  const setTheme = useAppStore((state) => state.setTheme);
  const saveDownloadNetworkSettings = useAppStore((state) => state.saveDownloadNetworkSettings);
  const checkDownloadNetwork = useAppStore((state) => state.checkDownloadNetwork);
  const saveModelStorageSettings = useAppStore((state) => state.saveModelStorageSettings);
  return {
    setTheme,
    saveDownloadNetworkSettings,
    checkDownloadNetwork,
    saveModelStorageSettings,
  };
}
