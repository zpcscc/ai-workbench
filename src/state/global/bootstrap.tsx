import { useEffect, type PropsWithChildren } from "react";
import type { Theme } from "../../types/theme";
import { useAppStore } from "./store";

export function AppStateBootstrap({ children }: PropsWithChildren) {
  const initialize = useAppStore((state) => state.initialize);
  const subscribeToDownloadProgress = useAppStore((state) => state.subscribeToDownloadProgress);
  const theme = useAppStore((state) => state.theme);
  const initError = useAppStore((state) => state.initError);
  const isInitializing = useAppStore((state) => state.isInitializing);

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

  if (initError) {
    return (
      <main className="grid min-h-screen place-items-center bg-canvas p-6 text-ink" role="alert">
        <section className="app-card max-w-xl p-6">
          <h1 className="text-lg font-semibold">应用初始化失败</h1>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{initError}</p>
          <button className="app-button app-button-primary mt-4" disabled={isInitializing} onClick={() => void initialize()} type="button">
            {isInitializing ? "正在重试…" : "重试"}
          </button>
        </section>
      </main>
    );
  }

  return children;
}

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.style.colorScheme = document.documentElement.dataset.theme;
}
