import { useState } from "react";
import type { LocalChatMessage } from "../../../../types/model";
import type { LocalChatModuleState } from "./types";

export function useLocalChatModuleState(): LocalChatModuleState {
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  return { messages, input, isSending, error, setInput, setMessages, setIsSending, setError };
}
