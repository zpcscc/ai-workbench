import { useOverviewPageActions } from "../../actions";
import type { OverviewSummaryActions } from "./types";

export function useOverviewSummaryActions(): OverviewSummaryActions {
  return useOverviewPageActions();
}
