import { createModelStorageModuleActions } from "./actions";
import { ModelStorageButtons } from "./components/model-storage-buttons";
import { ModelStorageFields } from "./components/model-storage-fields";
import { ModelStoragePaths } from "./components/model-storage-paths";
import { useModelStorageModuleState } from "./state";
import type { ModelStorageModuleProps } from "./types";

export function ModelStorageSettings({ state, actions }: ModelStorageModuleProps) {
  const moduleState = useModelStorageModuleState(state.settings);
  const moduleActions = createModelStorageModuleActions(moduleState.form, state.settings, moduleState, actions);
  return (
    <section className="app-card mt-5 p-5">
      <h2 className="text-lg font-semibold">模型存储</h2>
      <p className="mt-1 text-sm leading-6 text-subtle">
        分别选择断点下载临时文件和校验后模型的存放文件夹；未选择时使用应用专属数据目录。
      </p>
      <ModelStorageFields actions={moduleActions} state={moduleState} />
      <ModelStoragePaths settings={state.settings} />
      {moduleState.selectionError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{moduleState.selectionError}</p>}
      {state.error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <ModelStorageButtons actions={moduleActions} disabled={!state.settings} isSaving={state.isSaving} />
      <p className="mt-3 text-xs leading-5 text-subtle">修改位置不会自动移动已有文件；模型下载期间不能修改。</p>
    </section>
  );
}
