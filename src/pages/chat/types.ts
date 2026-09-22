import type { GlobalState } from "../../state/global";
import type { LocalChatMessage, ModelDefinition } from "../../types/model";

export type ChatPageState = {
  runtime: GlobalState["runtime"];
  installedModel?: ModelDefinition;
};

export type ChatPageActions = {
  startRuntime: () => void;
  stopRuntime: () => void;
  sendMessage: (messages: LocalChatMessage[]) => Promise<LocalChatMessage>;
};
