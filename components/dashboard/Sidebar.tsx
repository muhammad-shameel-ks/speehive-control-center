"use client";

import { SidebarNavItem } from "@/components/dashboard/panels/SidebarNavItem";
import { SpeeHiveMark, SparklesIcon, GridIcon, SettingsIcon } from "@/components/icons";

export type DashboardTab = "dashboard" | "settings";

export function Sidebar({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapsed,
  onOpenChat,
}: {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenChat: () => void;
}) {
  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out ${
        collapsed ? "w-[52px]" : "w-[220px]"
      }`}
    >
      <div
        className={`flex h-[52px] shrink-0 items-center border-b border-sidebar-border ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-4"
        }`}
      >
        <SpeeHiveMark className="h-7 w-7 shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-sidebar-foreground leading-tight">SpeeHive</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em]">Control Centre</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        <SidebarNavItem
          active={activeTab === "dashboard"}
          collapsed={collapsed}
          onClick={() => onTabChange("dashboard")}
          icon={<GridIcon className="h-4 w-4" />}
          label="Workspace"
        />
        <SidebarNavItem
          active={activeTab === "settings"}
          collapsed={collapsed}
          onClick={() => onTabChange("settings")}
          icon={<SettingsIcon className="h-4 w-4" />}
          label="Settings"
        />
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-1.5">
        <button
          onClick={onOpenChat}
          className={`flex items-center gap-2 rounded-lg bg-primary/12 text-primary hover:bg-primary/20 transition-colors font-semibold text-[12px] py-2 w-full ${
            collapsed ? "justify-center" : "px-3"
          }`}
        >
          <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && "Ask Assistant"}
        </button>

        <button
          onClick={onToggleCollapsed}
          className="flex w-full items-center justify-center rounded-md py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          {collapsed ? "›" : "‹ Collapse"}
        </button>
      </div>
    </aside>
  );
}
