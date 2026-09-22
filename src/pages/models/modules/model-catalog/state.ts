import { useModelCenterPageState } from "../../state";
import type { ModelCatalogModuleState } from "./types";

export function useModelCatalogModuleState(): ModelCatalogModuleState {
  const pageState = useModelCenterPageState();
  return {
    models: pageState.catalog?.models,
    pendingModel: pageState.catalog?.models.find((model) => model.id === pageState.pendingModelId),
    installationStatuses: pageState.installationStatuses,
    downloadProgress: pageState.downloadProgress,
    downloadError: pageState.downloadError,
    cancellingModelId: pageState.cancellingModelId,
    runtimeStatus: pageState.runtime.status,
    runtimeError: pageState.runtime.error,
  };
}
