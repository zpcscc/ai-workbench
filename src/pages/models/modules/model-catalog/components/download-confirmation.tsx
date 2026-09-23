import type { ModelDefinition } from "../../../../../types/model";
import { formatGigabytes } from "../../../../../utils/format";

export function DownloadConfirmation({ model, onCancel, onConfirm }: { model?: ModelDefinition; onCancel: () => void; onConfirm: () => void }) {
  if (!model) return null;
  return (
    <section aria-live="polite" className="mt-6 rounded border border-accent/40 bg-muted p-5">
      <h2 className="text-lg font-semibold">确认下载 {model.name}</h2>
      <p className="mt-2 text-sm leading-6 text-subtle">将下载约 {formatGigabytes(model.estimatedDownloadBytes)} 的模型文件，并在本地完成 SHA-256 校验。下载过程可在中断后续传。</p>
      <div className="mt-4 flex flex-wrap gap-3"><button className="app-button app-button-primary" onClick={onConfirm} type="button">下载并校验</button><button className="app-button" onClick={onCancel} type="button">取消</button></div>
    </section>
  );
}
