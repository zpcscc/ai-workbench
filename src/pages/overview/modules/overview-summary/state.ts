import { useOverviewPageState } from "../../state";
import type { OverviewSummaryState } from "./types";

export function useOverviewSummaryState(): OverviewSummaryState {
  const pageState = useOverviewPageState();
  return {
    recommendedModel: pageState.catalog?.models.find((model) => model.recommended),
    device: pageState.device,
  };
}
