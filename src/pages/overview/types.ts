import type { DeviceInfo, ModelCatalog } from "../../types/model";

export type OverviewPageState = {
  catalog?: ModelCatalog;
  device?: DeviceInfo;
};

export type OverviewPageActions = {
  openModels: () => void;
};
