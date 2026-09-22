import { useEffect, useState } from "react";
import type { DownloadNetworkSettings } from "../../../../types/model";
import type { DownloadNetworkModuleState } from "./types";

export function useDownloadNetworkModuleState(settings: DownloadNetworkSettings): DownloadNetworkModuleState {
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);
  return {
    form,
    setMirrorUrl: (value) => setForm((current) => ({ ...current, mirrorUrl: value })),
    setProxyUrl: (value) => setForm((current) => ({ ...current, proxyUrl: value })),
  };
}
