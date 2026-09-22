import type { ModelDefinition } from "../../../../../types/model";
import { formatGigabytes } from "../../../../../utils/format";

export function ModelSpecifications({ model }: { model: ModelDefinition }) {
  return (
    <dl className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg border border-control-border bg-muted/45">
      <Specification className="border-b border-r border-control-border" label="预计下载" value={formatGigabytes(model.estimatedDownloadBytes)} />
      <Specification className="border-b border-control-border" label="建议内存" value={`${model.recommendedMemoryGiB} GB+`} />
      <Specification className="border-r border-control-border" label="最低内存" value={`${model.minimumMemoryGiB} GB`} />
      <Specification label="许可证" value={model.license} />
    </dl>
  );
}

function Specification({ className = "", label, value }: { className?: string; label: string; value: string }) {
  return (
    <div className={`min-w-0 px-3.5 py-3 ${className}`}>
      <dt className="text-[11px] font-medium leading-4 tracking-wide text-subtle">{label}</dt>
      <dd className="m-0 mt-1 text-[15px] font-semibold leading-5 tracking-tight text-ink tabular-nums">{value}</dd>
    </div>
  );
}
