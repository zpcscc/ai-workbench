import { ModelCard } from "./model-card";
import type { ModelCatalogModuleActions, ModelCatalogModuleState } from "../types";

export function ModelGrid({ state, actions }: { state: ModelCatalogModuleState; actions: ModelCatalogModuleActions }) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {state.models?.map((model) => (
        <ModelCard
          downloadProgress={state.downloadProgress[model.id]}
          isCancelling={state.cancellingModelId === model.id}
          key={model.id}
          model={model}
          onCancel={() => actions.cancelDownload(model.id)}
          onDownload={() => actions.selectDownload(model.id)}
          onStartRuntime={() => actions.startRuntime(model.id)}
          onStopRuntime={actions.stopRuntime}
          runtimeStatus={state.runtimeStatus}
          status={state.installationStatuses.find((item) => item.modelId === model.id)}
        />
      ))}
    </div>
  );
}
