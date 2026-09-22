import type { LocalRuntimeState } from "../../../types/model";

export function ChatHeader({ runtimeState }: { runtimeState: LocalRuntimeState }) {
  return (
    <header>
      <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">AI 对话</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{runtimeState === "ready" ? "本地模型已就绪" : "启动本地模型"}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-subtle">
        使用已安装并校验通过的 GGUF 模型，在设备上完成离线文本对话。
      </p>
    </header>
  );
}
