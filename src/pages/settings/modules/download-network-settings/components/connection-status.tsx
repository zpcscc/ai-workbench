import type { DownloadConnectionStatus } from "../../../../../types/model";

export function ConnectionStatus({ label, status }: { label: string; status: DownloadConnectionStatus }) {
  return <p className="rounded border border-border bg-canvas px-3 py-2"><span className={status.available ? "font-semibold text-accent" : "font-semibold text-ink"}>{label}：{status.available ? "可用" : "不可用"}</span><span className="text-subtle"> · {status.endpoint} · {status.detail}</span></p>;
}
