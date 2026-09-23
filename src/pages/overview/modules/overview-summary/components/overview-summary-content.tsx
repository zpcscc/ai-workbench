import { useOverviewSummaryActions } from "../actions";
import { useOverviewSummaryState } from "../state";
import { DeviceSummaryCard } from "./device-summary-card";
import { RecommendedModelCard } from "./recommended-model-card";

export function OverviewSummaryContent() {
  const state = useOverviewSummaryState();
  const actions = useOverviewSummaryActions();
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <RecommendedModelCard model={state.recommendedModel} onOpenModels={actions.openModels} />
      <DeviceSummaryCard device={state.device} />
    </div>
  );
}
