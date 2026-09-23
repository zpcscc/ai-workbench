import type { LocalRuntimeState } from "../../../types/model";

export function ChatHeader({ runtimeState }: { runtimeState: LocalRuntimeState }) {
  return (
    <header className="shrink-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI 对话</h1>
        <span className={runtimeState === "ready" ? "text-xs font-medium text-accent" : "text-xs text-subtle"}>{runtimeState === "ready" ? "本地模型已就绪" : "本地模型未启动"}</span>
      </div>
      <p className="mt-1 text-sm leading-6 text-subtle">使用已校验的 GGUF 模型在设备上完成离线对话。</p>
    </header>
  );
}
