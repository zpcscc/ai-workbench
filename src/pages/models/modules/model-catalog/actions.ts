import { useModelCenterPageActions } from "../../actions";
import type { ModelCatalogModuleActions } from "./types";

export function useModelCatalogModuleActions(): ModelCatalogModuleActions {
  return useModelCenterPageActions();
}
