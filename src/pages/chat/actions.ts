import { useAppStore } from "../../state/global";
import type { ChatPageActions, ChatPageState } from "./types";

export function useChatPageActions(state: ChatPageState): ChatPageActions {
  const startLocalRuntime = useAppStore((store) => store.startLocalRuntime);
  const stopLocalRuntime = useAppStore((store) => store.stopLocalRuntime);
  const streamLocalChat = useAppStore((store) => store.streamLocalChat);
  const cancelLocalChat = useAppStore((store) => store.cancelLocalChat);
  return {
    startRuntime: () => state.installedModel && void startLocalRuntime(state.installedModel.id),
    stopRuntime: () => void stopLocalRuntime(),
    sendMessage: streamLocalChat,
    stopMessage: async (requestId) => {
      await cancelLocalChat(requestId);
    },
  };
}
