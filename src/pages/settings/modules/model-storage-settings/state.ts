import { useEffect, useState } from "react";
import type { ModelStorageSettings } from "../../../../types/model";
import type { ModelStorageForm, ModelStorageModuleState } from "./types";

export function useModelStorageModuleState(settings?: ModelStorageSettings): ModelStorageModuleState {
  const [form, setForm] = useState<ModelStorageForm>(() => createForm(settings));
  const [selecting, setSelecting] = useState<ModelStorageModuleState["selecting"]>(null);
  const [selectionError, setSelectionError] = useState<string>();
  useEffect(() => setForm(createForm(settings)), [settings]);
  return {
    form,
    selecting,
    selectionError,
    setDownloadDirectory: (value) => setForm((current) => ({ ...current, downloadDirectory: value })),
    setInstallDirectory: (value) => setForm((current) => ({ ...current, installDirectory: value })),
    setSelecting,
    setSelectionError,
  };
}

function createForm(settings?: ModelStorageSettings): ModelStorageForm {
  return {
    downloadDirectory: settings?.downloadDirectory ?? null,
    installDirectory: settings?.installDirectory ?? null,
  };
}
