import type { ModelStorageSettings } from "../../../../../types/model";

export function ModelStoragePaths({ settings }: { settings?: ModelStorageSettings }) {
  if (!settings) return <p className="mt-4 text-sm text-subtle">正在读取默认存储位置…</p>;
  return (
    <dl className="mt-4 grid gap-2 rounded-md bg-muted p-3 text-xs leading-5 text-subtle">
      <PathRow label="当前下载目录" value={settings.resolvedDownloadDirectory} />
      <PathRow label="当前安装目录" value={settings.resolvedInstallDirectory} />
    </dl>
  );
}

function PathRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)]">
      <dt>{label}</dt>
      <dd className="break-all font-mono text-ink">{value}</dd>
    </div>
  );
}
