import type { DownloadNetworkModuleState } from "../types";

export function DownloadNetworkFields({ state }: { state: DownloadNetworkModuleState }) {
  return (
    <div className="mt-5 grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        Hugging Face 镜像地址（可选）
        <input className="app-input px-3 py-2 text-sm font-normal" onChange={(event) => state.setMirrorUrl(event.target.value)} placeholder="https://your-mirror.example" type="url" value={state.form.mirrorUrl ?? ""} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        HTTP(S) 代理地址（可选）
        <input className="app-input px-3 py-2 text-sm font-normal" onChange={(event) => state.setProxyUrl(event.target.value)} placeholder="http://127.0.0.1:7890" type="url" value={state.form.proxyUrl ?? ""} />
      </label>
    </div>
  );
}
