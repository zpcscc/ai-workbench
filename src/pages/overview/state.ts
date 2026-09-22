import { useAppStore } from "../../state/global";
import type { OverviewPageState } from "./types";

export function useOverviewPageState(): OverviewPageState {
  const catalog = useAppStore((state) => state.models.catalog);
  const device = useAppStore((state) => state.models.device);
  return { catalog, device };
}
