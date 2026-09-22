import type { GlobalState } from "../../../../state/global";
import type { ModelStorageSettings } from "../../../../types/model";
import type { SettingsPageActions } from "../../types";

export type ModelStorageModuleProps = {
  state: GlobalState["modelStorage"];
  actions: Pick<SettingsPageActions, "saveModelStorageSettings">;
};

export type ModelStorageForm = Pick<ModelStorageSettings, "downloadDirectory" | "installDirectory">;

export type ModelStorageModuleState = {
  form: ModelStorageForm;
  selecting: "download" | "install" | null;
  selectionError?: string;
  setDownloadDirectory: (value: string) => void;
  setInstallDirectory: (value: string) => void;
  setSelecting: (value: "download" | "install" | null) => void;
  setSelectionError: (value?: string) => void;
};

export type ModelStorageModuleActions = {
  selectDownloadDirectory: () => Promise<void>;
  selectInstallDirectory: () => Promise<void>;
  save: () => Promise<void>;
  reset: () => void;
};
