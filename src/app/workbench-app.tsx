import { AppSidebar } from "../components/layout/app-sidebar";
import { ChatPage } from "../features/chat/chat-page";
import { ModelCenterPage } from "../features/models/model-center-page";
import { OverviewPage } from "../features/overview/overview-page";
import { SettingsPage } from "../features/settings/settings-page";
import { useModelCatalog } from "../hooks/use-model-catalog";
import { useTheme } from "../hooks/use-theme";
import type { WorkspaceSection } from "../types/navigation";
import { useState } from "react";

export function WorkbenchApp() {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("overview");
  const { catalog, device } = useModelCatalog();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-canvas text-ink md:flex">
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="min-w-0 flex-1 p-6 sm:p-8">
        {activeSection === "overview" && <OverviewPage catalog={catalog} device={device} onOpenModels={() => setActiveSection("models")} />}
        {activeSection === "models" && <ModelCenterPage catalog={catalog} device={device} />}
        {activeSection === "chat" && <ChatPage />}
        {activeSection === "settings" && <SettingsPage onThemeChange={setTheme} theme={theme} />}
      </main>
    </div>
  );
}
