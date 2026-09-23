import type { LocalChatModuleActions, LocalChatModuleState, LocalChatProps } from "./types";
import { errorToString } from "../../../../utils/error";

export function createLocalChatModuleActions(
  state: LocalChatModuleState,
  pageActions: LocalChatProps["actions"],
): LocalChatModuleActions {
  return {
    send: async () => {
      const content = state.input.trim();
      if (!content || state.isSending) return;
      const userMessage = { id: crypto.randomUUID(), role: "user" as const, content };
      const messages = [...state.messages, userMessage];
      const requestId = crypto.randomUUID();
      state.setMessages([...messages, { id: requestId, role: "assistant", content: "" }]);
      state.setInput("");
      state.setError();
      state.setIsSending(true);
      state.setActiveRequestId(requestId);
      try {
        const result = await pageActions.sendMessage(requestId, messages, {
          temperature: state.temperature,
          maxTokens: state.maxTokens,
        }, (chunk) => {
          state.setMessages((current) =>
            current.map((message) =>
              message.id === chunk.requestId
                ? { ...message, content: message.content + chunk.content }
                : message,
            ),
          );
        });
        state.setMessages((current) =>
          current.map((message) =>
            message.id === requestId ? { ...message, content: result.content } : message,
          ),
        );
        if (result.cancelled) {
          state.setMessages((current) =>
            current.filter((message) => message.id !== requestId || message.content.length > 0),
          );
        }
      } catch (error) {
        state.setMessages((current) =>
          current.filter((message) => message.id !== requestId || message.content.length > 0),
        );
        state.setError(errorToString(error, "本地对话失败。"));
      } finally {
        state.setIsSending(false);
        state.setIsCancelling(false);
        state.setActiveRequestId();
      }
    },
    stop: async () => {
      const requestId = state.activeRequestId;
      if (!requestId || state.isCancelling) return;
      state.setIsCancelling(true);
      state.setError();
      try {
        await pageActions.stopMessage(requestId);
      } catch (error) {
        state.setError(errorToString(error, "无法停止本地对话。"));
        state.setIsCancelling(false);
      }
    },
  };
}
