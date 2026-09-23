import type { WorkspaceSection } from "../../types/navigation";

type SidebarProps = {
  activeSection: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
};

const navigation: Array<{ id: WorkspaceSection; label: string; icon: string; group: "main" | "bottom" }> = [
  { id: "overview", label: "工作台", icon: "◌", group: "main" },
  { id: "models", label: "本地模型", icon: "◇", group: "main" },
  { id: "chat", label: "AI 对话", icon: "◒", group: "main" },
  { id: "settings", label: "设置", icon: "⚙", group: "bottom" },
];

export function AppSidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-8 shrink-0 flex items-center gap-3 px-2">
        <span className="grid h-8 w-8 place-items-center rounded bg-accent text-sm font-bold text-accent-ink">A</span>
        <div>
          <p className="text-sm font-semibold">AI Workbench</p>
          <p className="text-xs text-subtle">本地优先</p>
        </div>
      </div>

      <nav aria-label="工作台功能" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
        {navigation.filter((item) => item.group === "main").map((item) => (
          <NavigationButton active={activeSection === item.id} item={item} key={item.id} onClick={onSectionChange} />
        ))}
      </nav>

      <nav aria-label="应用设置" className="mt-4 flex shrink-0 flex-col gap-1">
        {navigation.filter((item) => item.group === "bottom").map((item) => (
          <NavigationButton active={activeSection === item.id} item={item} key={item.id} onClick={onSectionChange} />
        ))}
      </nav>
    </aside>
  );
}

function NavigationButton({ active, item, onClick }: { active: boolean; item: (typeof navigation)[number]; onClick: SidebarProps["onSectionChange"] }) {
  return (
    <button
      className={`flex border-0 bg-transparent items-center gap-3 rounded px-3 py-2.5 text-left text-sm transition-colors ${active ? "bg-muted font-semibold text-ink" : "text-subtle hover:bg-muted hover:text-ink"}`}
      onClick={() => onClick(item.id)}
      type="button"
    >
      <span aria-hidden="true" className="w-4 text-center">{item.icon}</span>
      {item.label}
    </button>
  );
}
