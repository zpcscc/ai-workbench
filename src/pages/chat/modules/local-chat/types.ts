import type { LocalChatMessage } from "../../../../types/model";
import type { ChatPageActions, ChatPageState } from "../../types";

export type LocalChatProps = {
  state: ChatPageState;
  actions: ChatPageActions;
};

export type LocalChatModuleState = {
  messages: LocalChatMessage[];
  input: string;
  isSending: boolean;
  error?: string;
  setInput: (value: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<LocalChatMessage[]>>;
  setIsSending: (value: boolean) => void;
  setError: (value?: string) => void;
};

export type LocalChatModuleActions = {
  send: () => Promise<void>;
};
