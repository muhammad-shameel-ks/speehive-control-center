"use client";

import { useClock } from "@/hooks/useClock";
import { RefreshIcon, SunIcon, MoonIcon } from "@/components/icons";
import type { DashboardTab } from "@/components/dashboard/Sidebar";

export function Header({
  activeTab,
  isRefreshing,
  canRefresh,
  onRefresh,
  resolvedTheme,
  onToggleTheme,
}: {
  activeTab: DashboardTab;
  isRefreshing: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
  resolvedTheme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const currentTime = useClock();

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-5">
      <div className="flex items-center gap-3">
        <h1 className="text-[14px] font-semibold text-foreground tracking-tight">
          {activeTab === "dashboard" ? "Workspace" : "Integrations"}
        </h1>
        {activeTab === "dashboard" && (
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-full px-2 py-0.5 hidden lg:inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onRefresh}
          disabled={isRefreshing || !canRefresh}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary/20"
          aria-label="Refresh all integrations"
          title="Refresh Gmail, Chat, Calendar, Teams, Outlook and Asana"
        >
          <RefreshIcon className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing…" : "Refresh All"}
        </button>

        {currentTime && (
          <div className="text-right font-mono hidden sm:block leading-tight">
            <div className="text-[13px] font-medium text-foreground tabular-nums">
              {currentTime.toLocaleTimeString("en-US", { hour12: false })}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
        )}

        <button
          onClick={onToggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
        </button>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 text-[12px] font-bold text-primary flex items-center justify-center shrink-0">
            S
          </div>
          <div className="hidden sm:block leading-tight">
            <div className="text-[13px] font-semibold text-foreground">Shameel</div>
            <div className="text-[10px] text-muted-foreground">IT Lead Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
}
