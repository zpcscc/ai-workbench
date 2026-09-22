import { useEffect, useRef } from "react";
import type { LocalChatModuleState } from "../types";

export function ChatMessages({ state }: { state: LocalChatModuleState }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state.isSending, state.messages]);

  if (!state.messages.length) {
    return <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto overscroll-contain"><p className="px-4 text-center text-sm text-subtle">模型启动后，在这里开始完全离线的本地对话。</p></div>;
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 pr-1">
      <div className="grid gap-4">
        {state.messages.map((message, index) => (
          <div className={message.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-accent px-3 py-1.5 text-accent-ink" : "max-w-[90%] rounded-lg bg-muted px-3 py-2"} key={`${message.role}-${index}`}>
            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
          </div>
        ))}
        {state.isSending && <p className="text-sm text-subtle">模型正在生成回复…</p>}
        <div aria-hidden="true" ref={endRef} />
      </div>
    </div>
  );
}
