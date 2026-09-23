import { AppSidebar } from "../components/layout/app-sidebar";
import { ChatPage } from "../pages/chat";
import { ModelCenterPage } from "../pages/models";
import { OverviewPage } from "../pages/overview";
import { SettingsPage } from "../pages/settings";
import { useAppStore } from "../state/global";

export function WorkbenchApp() {
  const activeSection = useAppStore((state) => state.activeSection);
  const navigate = useAppStore((state) => state.navigate);

  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-canvas text-ink">
      <AppSidebar activeSection={activeSection} onSectionChange={navigate} />
      <main className={`min-w-0 min-h-0 flex-1 overscroll-contain p-5 sm:p-6 ${activeSection === "chat" ? "overflow-hidden" : "overflow-y-auto"}`}>
        {activeSection === "overview" && <OverviewPage />}
        {activeSection === "models" && <ModelCenterPage />}
        {activeSection === "chat" && <ChatPage />}
        {activeSection === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
