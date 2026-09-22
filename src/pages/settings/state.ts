import { useAppStore } from "../../state/global";
import type { SettingsPageState } from "./types";

export function useSettingsPageState(): SettingsPageState {
  const theme = useAppStore((state) => state.theme);
  const downloadNetwork = useAppStore((state) => state.downloadNetwork);
  const modelStorage = useAppStore((state) => state.modelStorage);
  return { theme, downloadNetwork, modelStorage };
}
