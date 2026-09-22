import type { LocalChatModuleActions, LocalChatModuleState } from "../types";

export function ChatComposer({ actions, disabled, state }: { actions: LocalChatModuleActions; disabled: boolean; state: LocalChatModuleState }) {
  return (
    <div className="shrink-0 border-t border-border bg-surface pt-4">
      <textarea className="app-input min-h-16 max-h-32 resize-none px-3 py-2 text-sm" disabled={disabled || state.isSending} onChange={(event) => state.setInput(event.target.value)} onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          void actions.send();
        }
      }} placeholder={disabled ? "请先启动本地模型" : "输入消息，Enter 发送，Shift+Enter 换行"} value={state.input} />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-subtle">对话仅发送到本机运行时。</p>
        <button className="app-button app-button-primary" disabled={disabled || state.isSending || !state.input.trim()} onClick={() => void actions.send()} type="button">发送</button>
      </div>
      {state.error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </div>
  );
}
