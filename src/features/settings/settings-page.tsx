import { ThemeSelector } from "../../components/settings/theme-selector";
import type { Theme } from "../../hooks/use-theme";

type SettingsPageProps = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export function SettingsPage({ theme, onThemeChange }: SettingsPageProps) {
  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">设置</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">应用设置</h1>
      <p className="mt-3 leading-7 text-subtle">偏好设置与模型配置分开管理；主题只在这里调整，不占用工作区页面。</p>
      <section className="app-card mt-8 p-5">
        <h2 className="text-lg font-semibold">外观</h2>
        <p className="mt-1 text-sm leading-6 text-subtle">选择工作台的显示模式。</p>
        <div className="mt-5"><ThemeSelector onChange={onThemeChange} theme={theme} /></div>
      </section>
    </section>
  );
}
