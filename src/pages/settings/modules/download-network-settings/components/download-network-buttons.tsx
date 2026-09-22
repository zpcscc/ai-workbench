import type { DownloadNetworkModuleActions } from "../types";

export function DownloadNetworkButtons({ actions, isChecking, isSaving }: { actions: DownloadNetworkModuleActions; isChecking: boolean; isSaving: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button className="app-button app-button-primary" disabled={isSaving} onClick={() => void actions.save()} type="button">{isSaving ? "正在保存…" : "保存网络设置"}</button>
      <button className="app-button" disabled={isChecking} onClick={() => void actions.check()} type="button">{isChecking ? "正在检测…" : "检测连接"}</button>
    </div>
  );
}
