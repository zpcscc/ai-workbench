import type { LocalRuntimeStatus, ModelDefinition, ModelDownloadProgress, ModelInstallationStatus } from "../../../../../types/model";
import { DownloadProgressPanel } from "./download-progress-panel";
import { ModelAction } from "./model-action";
import { ModelSource } from "./model-source";
import { ModelSpecifications } from "./model-specifications";

export function ModelCard({ downloadProgress, isCancelling, model, onCancel, onDownload, onStartRuntime, onStopRuntime, runtimeStatus, status }: { downloadProgress?: ModelDownloadProgress; isCancelling: boolean; model: ModelDefinition; onCancel: () => void; onDownload: () => void; onStartRuntime: () => void; onStopRuntime: () => void; runtimeStatus: LocalRuntimeStatus; status?: ModelInstallationStatus }) {
  const isDownloading = Boolean(downloadProgress && ["downloading", "verifying"].includes(downloadProgress.state));
  return (
    <article className="app-card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-lg font-semibold">{model.name}</h2><p className="mt-1 text-sm text-subtle">{model.quantization} · 仅本地运行</p></div>{model.recommended && <span className="shrink-0 whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-xs font-semibold leading-4 text-accent-ink">推荐</span>}</div>
      <ModelSpecifications model={model} />
      <ModelSource model={model} />
      <DownloadProgressPanel modelName={model.name} progress={downloadProgress} />
      <ModelAction isCancelling={isCancelling} isDownloading={isDownloading} modelId={model.id} onCancel={onCancel} onDownload={onDownload} onStartRuntime={onStartRuntime} onStopRuntime={onStopRuntime} runtimeStatus={runtimeStatus} status={status} />
    </article>
  );
}
