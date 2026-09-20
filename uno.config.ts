import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
} from "unocss";

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetTypography(), presetIcons()],
  theme: {
    colors: {
      canvas: "rgb(var(--canvas) / <alpha-value>)",
      surface: "rgb(var(--surface) / <alpha-value>)",
      muted: "rgb(var(--muted) / <alpha-value>)",
      ink: "rgb(var(--ink) / <alpha-value>)",
      subtle: "rgb(var(--subtle) / <alpha-value>)",
      accent: "rgb(var(--accent) / <alpha-value>)",
      "accent-ink": "rgb(var(--accent-ink) / <alpha-value>)",
      border: "rgb(var(--border) / <alpha-value>)",
    },
  },
  shortcuts: {
    "app-button": "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50",
    "app-card": "rounded-xl border border-border bg-surface shadow-sm",
  },
});
