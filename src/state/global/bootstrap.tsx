import { useEffect, type PropsWithChildren } from "react";
import type { Theme } from "../../types/theme";
import { useAppStore } from "./store";

export function AppStateBootstrap({ children }: PropsWithChildren) {
  const initialize = useAppStore((state) => state.initialize);
  const subscribeToDownloadProgress = useAppStore((state) => state.subscribeToDownloadProgress);
  const theme = useAppStore((state) => state.theme);

  useEffect(() => void initialize(), [initialize]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: () => void = () => undefined;
    void subscribeToDownloadProgress().then((nextUnsubscribe) => {
      if (disposed) nextUnsubscribe();
      else unsubscribe = nextUnsubscribe;
    });
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [subscribeToDownloadProgress]);

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => theme === "system" && applyTheme(theme);
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, [theme]);

  return children;
}

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.style.colorScheme = document.documentElement.dataset.theme;
}
