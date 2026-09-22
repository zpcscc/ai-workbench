import { useModelCatalogModuleActions } from "../actions";
import { useModelCatalogModuleState } from "../state";
import { DownloadConfirmation } from "./download-confirmation";
import { DownloadErrorAlert } from "./download-error-alert";
import { ModelGrid } from "./model-grid";

export function ModelCatalogContent() {
  const state = useModelCatalogModuleState();
  const actions = useModelCatalogModuleActions();
  return (
    <>
      <DownloadConfirmation model={state.pendingModel} onCancel={actions.dismissDownload} onConfirm={actions.confirmDownload} />
      <DownloadErrorAlert message={state.downloadError ?? state.runtimeError} />
      <ModelGrid actions={actions} state={state} />
    </>
  );
}
