import { createContext, useContext, useReducer, type Dispatch, type PropsWithChildren } from "react";
import { useAppStore } from "../../state/global";
import type { ModelCenterPageAction, ModelCenterPageState } from "./types";

const ModelCenterPageStateContext = createContext<ModelCenterPageState | undefined>(undefined);
const ModelCenterPageDispatchContext = createContext<Dispatch<ModelCenterPageAction> | undefined>(undefined);

function pageReducer(state: Pick<ModelCenterPageState, "pendingModelId">, action: ModelCenterPageAction) {
  if (action.type === "selectDownload") return { pendingModelId: action.modelId };
  return { pendingModelId: undefined };
}

export function ModelCenterPageStateProvider({ children }: PropsWithChildren) {
  const models = useAppStore((state) => state.models);
  const runtime = useAppStore((state) => state.runtime);
  const [pageState, dispatch] = useReducer(pageReducer, { pendingModelId: undefined });
  return (
    <ModelCenterPageDispatchContext.Provider value={dispatch}>
      <ModelCenterPageStateContext.Provider value={{ ...models, ...pageState, runtime }}>
        {children}
      </ModelCenterPageStateContext.Provider>
    </ModelCenterPageDispatchContext.Provider>
  );
}

export function useModelCenterPageState() {
  const state = useContext(ModelCenterPageStateContext);
  if (!state) throw new Error("useModelCenterPageState 必须在 ModelCenterPageStateProvider 内使用。");
  return state;
}

export function useModelCenterPageDispatch() {
  const dispatch = useContext(ModelCenterPageDispatchContext);
  if (!dispatch) throw new Error("useModelCenterPageDispatch 必须在 ModelCenterPageStateProvider 内使用。");
  return dispatch;
}
