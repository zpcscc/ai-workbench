import { useAppStore } from "../../state/global";
import type { OverviewPageActions } from "./types";

export function useOverviewPageActions(): OverviewPageActions {
  const navigate = useAppStore((state) => state.navigate);
  return { openModels: () => navigate("models") };
}
