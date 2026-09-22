import type { DownloadNetworkPreflight } from "../../../../../types/model";
import { ConnectionStatus } from "./connection-status";

export function DownloadNetworkStatus({ error, preflight }: { error?: string; preflight?: DownloadNetworkPreflight }) {
  return <>{error && <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm text-ink" role="alert">{error}</p>}{preflight && <div className="mt-4 grid gap-2 text-sm"><ConnectionStatus label="直连" status={preflight.direct} />{preflight.mirror && <ConnectionStatus label="镜像" status={preflight.mirror} />}</div>}</>;
}
