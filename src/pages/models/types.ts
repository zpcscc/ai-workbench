import type { GlobalState } from "../../state/global";

export type ModelCenterPageState = GlobalState["models"] & {
  pendingModelId?: string;
  runtime: GlobalState["runtime"];
};

export type ModelCenterPageAction =
  | { type: "selectDownload"; modelId: string }
  | { type: "dismissDownload" };

export type ModelCenterPageActions = {
  selectDownload: (modelId: string) => void;
  dismissDownload: () => void;
  confirmDownload: () => void;
  cancelDownload: (modelId: string) => void;
  startRuntime: (modelId: string) => void;
  stopRuntime: () => void;
};
