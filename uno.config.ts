import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
} from "unocss";
import { presetWind3 } from "@unocss/preset-wind3";

export default defineConfig({
  presets: [presetWind3(), presetAttributify(), presetTypography(), presetIcons()],
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
      control: "rgb(var(--control) / <alpha-value>)",
      "control-hover": "rgb(var(--control-hover) / <alpha-value>)",
      "control-pressed": "rgb(var(--control-pressed) / <alpha-value>)",
      "control-border": "rgb(var(--control-border) / <alpha-value>)",
    },
  },
  shortcuts: {
    "app-card": "rounded-xl border border-control-border bg-surface",
  },
});
