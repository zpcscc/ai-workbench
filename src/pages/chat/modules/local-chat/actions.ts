import type { LocalChatModuleActions, LocalChatModuleState, LocalChatProps } from "./types";

export function createLocalChatModuleActions(
  state: LocalChatModuleState,
  pageActions: LocalChatProps["actions"],
): LocalChatModuleActions {
  return {
    send: async () => {
      const content = state.input.trim();
      if (!content || state.isSending) return;
      const userMessage = { role: "user" as const, content };
      const messages = [...state.messages, userMessage];
      state.setMessages(messages);
      state.setInput("");
      state.setError();
      state.setIsSending(true);
      try {
        const reply = await pageActions.sendMessage(messages);
        state.setMessages((current) => [...current, reply]);
      } catch (error) {
        state.setError(error instanceof Error ? error.message : typeof error === "string" ? error : "本地对话失败。");
      } finally {
        state.setIsSending(false);
      }
    },
  };
}
