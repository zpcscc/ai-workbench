import { themeLabels, type Theme } from "../../types/theme";

type ThemeSelectorProps = {
  theme: Theme;
  onChange: (theme: Theme) => void;
};

export function ThemeSelector({ theme, onChange }: ThemeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {(Object.keys(themeLabels) as Theme[]).map((value) => (
        <button
          aria-pressed={theme === value}
          className="app-choice p-4"
          key={value}
          onClick={() => onChange(value)}
          type="button"
        >
          <span className="block text-sm font-semibold">{themeLabels[value]}</span>
          <span className="mt-1 block text-xs leading-5 text-subtle">{value === "system" ? "自动匹配操作系统外观" : `始终使用${themeLabels[value]}模式`}</span>
        </button>
      ))}
    </div>
  );
}
