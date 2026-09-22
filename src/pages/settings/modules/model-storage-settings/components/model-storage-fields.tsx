import type { ModelStorageModuleActions, ModelStorageModuleState } from "../types";

export function ModelStorageFields({
  actions,
  state,
}: {
  actions: ModelStorageModuleActions;
  state: ModelStorageModuleState;
}) {
  return (
    <div className="mt-5 grid gap-4">
      <StorageLocation
        isSelecting={state.selecting === "download"}
        label="模型下载位置"
        onSelect={() => void actions.selectDownloadDirectory()}
        value={state.form.downloadDirectory ?? ""}
      />
      <StorageLocation
        isSelecting={state.selecting === "install"}
        label="模型安装位置"
        onSelect={() => void actions.selectInstallDirectory()}
        value={state.form.installDirectory ?? ""}
      />
    </div>
  );
}

function StorageLocation({
  isSelecting,
  label,
  onSelect,
  value,
}: {
  isSelecting: boolean;
  label: string;
  onSelect: () => void;
  value: string;
}) {
  return (
    <div className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <div className="flex min-w-0 gap-2">
        <div className="app-input min-w-0 flex-1 px-3 py-2 text-sm font-normal text-subtle" title={value}>
          <span className="block truncate">{value || "应用默认位置"}</span>
        </div>
        <button className="app-button shrink-0" disabled={isSelecting} onClick={onSelect} type="button">
          {isSelecting ? "正在打开…" : "选择文件夹"}
        </button>
      </div>
    </div>
  );
}
