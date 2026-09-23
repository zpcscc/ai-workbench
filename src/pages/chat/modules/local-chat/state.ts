import { useState } from "react";
import type { LocalChatMessage } from "../../../../types/model";
import type { LocalChatModuleState } from "./types";

const SETTINGS_KEY = "ai-workbench.local-chat-settings";

export function useLocalChatModuleState(): LocalChatModuleState {
  const [initialSettings] = useState(readGenerationSettings);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string>();
  const [temperature, setTemperatureState] = useState(initialSettings.temperature);
  const [maxTokens, setMaxTokensState] = useState(initialSettings.maxTokens);
  const [error, setError] = useState<string>();
  return {
    messages,
    input,
    isSending,
    isCancelling,
    activeRequestId,
    temperature,
    maxTokens,
    error,
    setInput,
    setMessages,
    setIsSending,
    setIsCancelling,
    setActiveRequestId,
    setTemperature: (value) => {
      if (!validTemperature(value)) return;
      setTemperatureState(value);
      persistGenerationSettings(value, maxTokens);
    },
    setMaxTokens: (value) => {
      if (!validMaxTokens(value)) return;
      setMaxTokensState(value);
      persistGenerationSettings(temperature, value);
    },
    setError,
  };
}

function readGenerationSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Partial<{
      temperature: number;
      maxTokens: number;
    }>;
    return {
      temperature: validTemperature(value.temperature) ? value.temperature : 0.7,
      maxTokens: validMaxTokens(value.maxTokens) ? value.maxTokens : 2048,
    };
  } catch {
    return { temperature: 0.7, maxTokens: 2048 };
  }
}

function persistGenerationSettings(temperature: number, maxTokens: number) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ temperature, maxTokens }));
  } catch {
    // 会话设置持久化失败不应阻断本地对话。
  }
}

function validTemperature(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 2;
}

function validMaxTokens(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 4096;
}
