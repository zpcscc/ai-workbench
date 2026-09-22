import { useAppStore } from "../../state/global";
import { useModelCenterPageDispatch, useModelCenterPageState } from "./state";
import type { ModelCenterPageActions } from "./types";

export function useModelCenterPageActions(): ModelCenterPageActions {
  const pageState = useModelCenterPageState();
  const dispatch = useModelCenterPageDispatch();
  const startModelDownload = useAppStore((state) => state.startModelDownload);
  const cancelModelDownload = useAppStore((state) => state.cancelModelDownload);
  const startLocalRuntime = useAppStore((state) => state.startLocalRuntime);
  const stopLocalRuntime = useAppStore((state) => state.stopLocalRuntime);
  return {
    selectDownload: (modelId) => dispatch({ type: "selectDownload", modelId }),
    dismissDownload: () => dispatch({ type: "dismissDownload" }),
    confirmDownload: () => {
      if (!pageState.pendingModelId) return;
      void startModelDownload(pageState.pendingModelId);
      dispatch({ type: "dismissDownload" });
    },
    cancelDownload: (modelId) => void cancelModelDownload(modelId),
    startRuntime: (modelId) => void startLocalRuntime(modelId),
    stopRuntime: () => void stopLocalRuntime(),
  };
}
