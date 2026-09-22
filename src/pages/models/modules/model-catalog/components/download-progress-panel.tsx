import type { ModelDownloadProgress } from "../../../../../types/model";
import { formatGigabytes } from "../../../../../utils/format";

export function DownloadProgressPanel({ modelName, progress }: { modelName: string; progress?: ModelDownloadProgress }) {
  if (!progress) return null;
  const percentage = Math.min(100, Math.round((progress.downloadedBytes / Math.max(1, progress.totalBytes)) * 100));
  return <div aria-label={`${modelName} 下载进度`} className="mt-5"><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-[width]" style={{ width: `${percentage}%` }} /></div><p className="mt-2 text-xs text-subtle">{formatGigabytes(progress.downloadedBytes)} / {formatGigabytes(progress.totalBytes)} · {percentage}%{progress.state === "verifying" ? " · 正在校验 SHA-256…" : ""}{progress.state === "cancelled" ? " · 已取消，可继续下载" : ""}</p></div>;
}
