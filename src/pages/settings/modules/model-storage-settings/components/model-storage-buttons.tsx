import type { ModelStorageModuleActions } from "../types";

export function ModelStorageButtons({
  actions,
  disabled,
  isSaving,
}: {
  actions: ModelStorageModuleActions;
  disabled: boolean;
  isSaving: boolean;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button
        className="app-button app-button-primary"
        disabled={disabled || isSaving}
        onClick={() => void actions.save().catch(() => undefined)}
        type="button"
      >
        {isSaving ? "正在保存…" : "保存存储位置"}
      </button>
      <button className="app-button" disabled={isSaving} onClick={actions.reset} type="button">
        恢复默认
      </button>
    </div>
  );
}
