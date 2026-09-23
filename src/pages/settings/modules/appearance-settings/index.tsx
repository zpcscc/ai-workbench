import { ThemeSelector } from "../../../../components/settings/theme-selector";
import type { Theme } from "../../../../types/theme";

export function AppearanceSettings({ theme, onThemeChange }: { theme: Theme; onThemeChange: (theme: Theme) => void }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">外观</h2>
      <p className="mt-1 text-sm leading-6 text-subtle">选择工作台的显示模式。</p>
      <div className="mt-4"><ThemeSelector onChange={onThemeChange} theme={theme} /></div>
    </section>
  );
}
