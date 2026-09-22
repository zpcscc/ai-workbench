import type { GlobalState } from "../../state/global";
import type { DownloadNetworkSettings, ModelStorageSettings } from "../../types/model";
import type { Theme } from "../../types/theme";

export type SettingsPageState = {
  theme: Theme;
  downloadNetwork: GlobalState["downloadNetwork"];
  modelStorage: GlobalState["modelStorage"];
};

export type SettingsPageActions = {
  setTheme: (theme: Theme) => void;
  saveDownloadNetworkSettings: (settings: DownloadNetworkSettings) => Promise<DownloadNetworkSettings>;
  checkDownloadNetwork: () => Promise<void>;
  saveModelStorageSettings: (settings: ModelStorageSettings) => Promise<ModelStorageSettings>;
};
