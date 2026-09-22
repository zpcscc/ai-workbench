import { useAppStore } from "../../state/global";
import type { ChatPageState } from "./types";

export function useChatPageState(): ChatPageState {
  const runtime = useAppStore((state) => state.runtime);
  const models = useAppStore((state) => state.models);
  const installed = models.installationStatuses.find((status) => status.state === "installed");
  return {
    runtime,
    installedModel: models.catalog?.models.find((model) => model.id === installed?.modelId),
  };
}
