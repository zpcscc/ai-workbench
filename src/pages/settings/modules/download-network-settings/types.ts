import type { SettingsPageActions } from "../../types";
import type { GlobalState } from "../../../../state/global";
import type { DownloadNetworkSettings } from "../../../../types/model";

export type DownloadNetworkModuleProps = {
  state: GlobalState["downloadNetwork"];
  actions: Pick<SettingsPageActions, "saveDownloadNetworkSettings" | "checkDownloadNetwork">;
};

export type DownloadNetworkModuleState = {
  form: DownloadNetworkSettings;
  setMirrorUrl: (value: string) => void;
  setProxyUrl: (value: string) => void;
};

export type DownloadNetworkModuleActions = {
  save: () => Promise<void>;
  check: () => Promise<void>;
};
