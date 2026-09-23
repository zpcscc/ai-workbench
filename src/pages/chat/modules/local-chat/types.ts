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
  isCancelling: boolean;
  activeRequestId?: string;
  temperature: number;
  maxTokens: number;
  error?: string;
  setInput: (value: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<LocalChatMessage[]>>;
  setIsSending: (value: boolean) => void;
  setIsCancelling: (value: boolean) => void;
  setActiveRequestId: (value?: string) => void;
  setTemperature: (value: number) => void;
  setMaxTokens: (value: number) => void;
  setError: (value?: string) => void;
};

export type LocalChatModuleActions = {
  send: () => Promise<void>;
  stop: () => Promise<void>;
};
