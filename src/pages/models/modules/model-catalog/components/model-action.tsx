import type { LocalRuntimeStatus, ModelInstallationStatus } from "../../../../../types/model";

export function ModelAction({ isCancelling, isDownloading, modelId, onCancel, onDownload, onStartRuntime, onStopRuntime, runtimeStatus, status }: { isCancelling: boolean; isDownloading: boolean; modelId: string; onCancel: () => void; onDownload: () => void; onStartRuntime: () => void; onStopRuntime: () => void; runtimeStatus: LocalRuntimeStatus; status?: ModelInstallationStatus }) {
  if (isDownloading) return <button className="app-button mt-5" disabled={isCancelling} onClick={onCancel} type="button">{isCancelling ? "正在取消…" : "取消下载"}</button>;
  if (status?.state === "installed" && runtimeStatus.modelId === modelId && runtimeStatus.state === "starting") return <button className="app-button mt-5" disabled type="button">正在加载模型…</button>;
  if (status?.state === "installed" && runtimeStatus.modelId === modelId && runtimeStatus.state === "ready") return <button className="app-button mt-5" onClick={onStopRuntime} type="button">停止运行</button>;
  if (status?.state === "installed") return <button className="app-button app-button-primary mt-5" onClick={onStartRuntime} type="button">运行模型</button>;
  if (status?.state === "partial") return <button className="app-button app-button-primary mt-5" onClick={onDownload} type="button">继续下载</button>;
  if (status?.installable) return <button className="app-button app-button-primary mt-5" onClick={onDownload} type="button">选择下载</button>;
  if (status?.state === "comingSoon") return <button className="app-button mt-5 disabled:text-subtle" disabled type="button">后续开放</button>;
  return <button className="app-button mt-5 disabled:text-subtle" disabled type="button" data-model-id={modelId}>来源待验证</button>;
}
