import type { DeviceInfo, ModelDefinition } from "../../../../types/model";

export type OverviewSummaryState = { recommendedModel?: ModelDefinition; device?: DeviceInfo };
export type OverviewSummaryActions = { openModels: () => void };
