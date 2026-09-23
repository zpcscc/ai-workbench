import type { GlobalState } from "../../state/global";
import type { LocalChatGenerationOptions, LocalChatMessage, LocalChatStreamChunk, LocalChatStreamResult, ModelDefinition } from "../../types/model";

export type ChatPageState = {
  runtime: GlobalState["runtime"];
  installedModel?: ModelDefinition;
};

export type ChatPageActions = {
  startRuntime: () => void;
  stopRuntime: () => void;
  sendMessage: (
    requestId: string,
    messages: LocalChatMessage[],
    options: LocalChatGenerationOptions,
    onChunk: (chunk: LocalChatStreamChunk) => void,
  ) => Promise<LocalChatStreamResult>;
  stopMessage: (requestId: string) => Promise<void>;
};
