import { ModelCatalog } from "../modules/model-catalog";
import { useModelCenterPageState } from "../state";
import { ModelCenterHeader } from "./model-center-header";
import { ModelDeviceSummary } from "./model-device-summary";

export function ModelCenterPageContent() {
  const state = useModelCenterPageState();
  return (
    <>
      <ModelCenterHeader />
      <ModelDeviceSummary device={state.device} />
      <ModelCatalog />
    </>
  );
}
