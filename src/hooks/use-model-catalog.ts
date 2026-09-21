import { useEffect, useState } from "react";
import { getDeviceInfo, getModelCatalog } from "../lib/tauri/model-api";
import type { DeviceInfo, ModelCatalog } from "../types/model";

export function useModelCatalog() {
  const [catalog, setCatalog] = useState<ModelCatalog>();
  const [device, setDevice] = useState<DeviceInfo>();

  useEffect(() => {
    void Promise.all([getModelCatalog(), getDeviceInfo()]).then(([nextCatalog, nextDevice]) => {
      setCatalog(nextCatalog);
      setDevice(nextDevice);
    });
  }, []);

  return { catalog, device };
}
