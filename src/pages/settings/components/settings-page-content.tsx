import { useSettingsPageActions } from "../actions";
import { AppearanceSettings } from "../modules/appearance-settings";
import { DownloadNetworkSettings } from "../modules/download-network-settings";
import { ModelStorageSettings } from "../modules/model-storage-settings";
import { useSettingsPageState } from "../state";
import { SettingsHeader } from "./settings-header";

export function SettingsPageContent() {
  const state = useSettingsPageState();
  const actions = useSettingsPageActions();
  return (
    <>
      <SettingsHeader />
      <AppearanceSettings onThemeChange={actions.setTheme} theme={state.theme} />
      <ModelStorageSettings actions={actions} state={state.modelStorage} />
      <DownloadNetworkSettings actions={actions} state={state.downloadNetwork} />
    </>
  );
}
