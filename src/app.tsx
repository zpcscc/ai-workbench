import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

const themeLabels: Record<Theme, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.style.colorScheme = document.documentElement.dataset.theme;
}

export function App() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => theme === "system" && applyTheme(theme);
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, [theme]);

  return (
    <main className="min-h-screen bg-canvas p-6 text-ink sm:p-8">
      <section className="mx-auto max-w-4xl">
        <header className="mb-12 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-[0.16em] text-accent uppercase">AI Workbench</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">本地 AI 工作台</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-subtle">
              桌面端基础框架已就绪。本地模型、对话和更多 AI 工具将在这里逐步接入。
            </p>
          </div>
          <label className="flex shrink-0 flex-col gap-1 text-xs text-subtle">
            外观
            <select
              aria-label="选择界面主题"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent/40"
              value={theme}
              onChange={(event) => setTheme(event.target.value as Theme)}
            >
              {(Object.keys(themeLabels) as Theme[]).map((value) => (
                <option key={value} value={value}>{themeLabels[value]}</option>
              ))}
            </select>
          </label>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="app-card p-5">
            <p className="text-sm font-medium text-subtle">第一步</p>
            <h2 className="mt-2 text-lg font-semibold">桌面框架</h2>
            <p className="mt-2 text-sm leading-6 text-subtle">Tauri、React、TypeScript 与 UnoCSS 已配置。</p>
          </article>
          <article className="app-card p-5">
            <p className="text-sm font-medium text-subtle">下一步</p>
            <h2 className="mt-2 text-lg font-semibold">本地模型管理</h2>
            <p className="mt-2 text-sm leading-6 text-subtle">接入模型目录、下载状态与 llama.cpp 运行时。</p>
          </article>
          <article className="app-card p-5">
            <p className="text-sm font-medium text-subtle">目标</p>
            <h2 className="mt-2 text-lg font-semibold">离线基础对话</h2>
            <p className="mt-2 text-sm leading-6 text-subtle">让每台设备都能在本地安全运行 AI。</p>
          </article>
        </div>
      </section>
    </main>
  );
}
