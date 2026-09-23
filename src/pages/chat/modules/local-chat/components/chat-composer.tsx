import type { LocalChatModuleActions, LocalChatModuleState } from "../types";

export function ChatComposer({ actions, disabled, state }: { actions: LocalChatModuleActions; disabled: boolean; state: LocalChatModuleState }) {
  return (
    <div className="shrink-0 border-t border-border pt-4">
      <textarea className="app-input min-h-16 max-h-32 resize-none px-3 py-2 text-sm" disabled={disabled || state.isSending} onChange={(event) => state.setInput(event.target.value)} onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          void actions.send();
        }
      }} placeholder={disabled ? "请先启动本地模型" : "输入消息，Enter 发送，Shift+Enter 换行"} value={state.input} />
      <div className="mt-3 flex flex-nowrap items-center gap-3 overflow-x-auto whitespace-nowrap text-xs text-subtle">
        <label className="flex shrink-0 items-center gap-2">
          回答多样性
          <input className="app-input w-20 px-2 py-1" disabled={state.isSending} max={2} min={0} onChange={(event) => state.setTemperature(Number(event.target.value))} step={0.1} type="number" value={state.temperature} />
        </label>
        <label className="flex shrink-0 items-center gap-2">
          回答长度上限
          <input className="app-input w-24 px-2 py-1" disabled={state.isSending} max={4096} min={1} onChange={(event) => state.setMaxTokens(Number(event.target.value))} step={1} type="number" value={state.maxTokens} />
        </label>
        <span className="shrink-0">上下文窗口 4096</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-subtle">对话仅发送到本机运行时。</p>
        {state.isSending ? (
          <button className="app-button" disabled={state.isCancelling} onClick={() => void actions.stop()} type="button">
            {state.isCancelling ? "正在停止…" : "停止生成"}
          </button>
        ) : (
          <button className="app-button app-button-primary" disabled={disabled || !state.input.trim()} onClick={() => void actions.send()} type="button">发送</button>
        )}
      </div>
      {state.error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
    </div>
  );
}
