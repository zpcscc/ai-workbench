import type { LocalChatProps } from "../types";

export function RuntimeControl({ state, actions }: LocalChatProps) {
  const { status, error } = state.runtime;
  return (
    <section aria-label="本地运行时" className="mt-3 shrink-0 border-y border-border py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-subtle">{status.detail}</p>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
        {status.state === "ready" ? (
          <button className="app-button" onClick={actions.stopRuntime} type="button">停止模型</button>
        ) : (
          <button className="app-button app-button-primary" disabled={!state.installedModel || status.state === "starting"} onClick={actions.startRuntime} type="button">
            {status.state === "starting" ? "正在加载…" : state.installedModel ? `运行 ${state.installedModel.name}` : "请先安装模型"}
          </button>
        )}
      </div>
    </section>
  );
}
