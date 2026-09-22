import { createDownloadNetworkModuleActions } from "./actions";
import { DownloadNetworkButtons } from "./components/download-network-buttons";
import { DownloadNetworkFields } from "./components/download-network-fields";
import { DownloadNetworkStatus } from "./components/download-network-status";
import { useDownloadNetworkModuleState } from "./state";
import type { DownloadNetworkModuleProps } from "./types";

export function DownloadNetworkSettings({ state, actions }: DownloadNetworkModuleProps) {
  const moduleState = useDownloadNetworkModuleState(state.settings);
  const moduleActions = createDownloadNetworkModuleActions(moduleState.form, actions);
  return (
    <section className="app-card mt-5 p-5">
      <h2 className="text-lg font-semibold">模型下载网络</h2>
      <p className="mt-1 text-sm leading-6 text-subtle">
        默认优先直连 Hugging Face。直连失败时，才尝试你配置的 HTTPS 镜像；无论使用哪个来源，模型都必须通过固定 SHA-256 校验。
      </p>
      <DownloadNetworkFields state={moduleState} />
      <DownloadNetworkButtons actions={moduleActions} isChecking={state.isChecking} isSaving={state.isSaving} />
      <DownloadNetworkStatus error={state.error} preflight={state.preflight} />
    </section>
  );
}
