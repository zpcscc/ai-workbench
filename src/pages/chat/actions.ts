import { useAppStore } from "../../state/global";
import type { ChatPageActions, ChatPageState } from "./types";

export function useChatPageActions(state: ChatPageState): ChatPageActions {
  const startLocalRuntime = useAppStore((store) => store.startLocalRuntime);
  const stopLocalRuntime = useAppStore((store) => store.stopLocalRuntime);
  const sendLocalChat = useAppStore((store) => store.sendLocalChat);
  return {
    startRuntime: () => state.installedModel && void startLocalRuntime(state.installedModel.id),
    stopRuntime: () => void stopLocalRuntime(),
    sendMessage: sendLocalChat,
  };
}
