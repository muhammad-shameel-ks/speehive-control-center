"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  SearchIcon,
  SparklesIcon,
  RefreshIcon,
  PlusIcon,
  PencilIcon,
  GridIcon,
  SettingsIcon,
  SunIcon,
  MoonIcon,
  CloseIcon,
} from "@/components/icons";
import { showToast } from "@/components/ui/ToastContainer";

export type CommandAction = {
  id: string;
  category: "Actions" | "Navigation" | "Theme";
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  perform: () => void;
};

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
  onRefreshAll: () => void;
  onOpenCreateTask: () => void;
  onOpenNotes: () => void;
  onTabChange: (tab: "dashboard" | "settings") => void;
  resolvedTheme: "dark" | "light";
  onToggleTheme: () => void;
};

export function CommandPalette({
  isOpen,
  onClose,
  onOpenChat,
  onRefreshAll,
  onOpenCreateTask,
  onOpenNotes,
  onTabChange,
  resolvedTheme,
  onToggleTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions: CommandAction[] = useMemo(
    () => [
      {
        id: "open-chat",
        category: "Actions",
        title: "Ask AI Assistant",
        description: "Open the AI Copilot chat drawer",
        icon: SparklesIcon,
        shortcut: "⌘ C",
        perform: () => {
          onOpenChat();
          onClose();
        },
      },
      {
        id: "refresh-all",
        category: "Actions",
        title: "Refresh All Integrations",
        description: "Sync latest Outlook mail, Teams chat, and Asana tasks",
        icon: RefreshIcon,
        shortcut: "⌘ R",
        perform: () => {
          onRefreshAll();
          showToast({
            type: "info",
            title: "Sync Triggered",
            description: "Refreshing all connected integrations...",
          });
          onClose();
        },
      },
      {
        id: "create-task",
        category: "Actions",
        title: "Create Asana Task",
        description: "Add a new task directly to your Asana workspace",
        icon: PlusIcon,
        shortcut: "⌘ T",
        perform: () => {
          onOpenCreateTask();
          onClose();
        },
      },
      {
        id: "open-notes",
        category: "Actions",
        title: "Open Quick Notes & To-Dos",
        description: "View local persistent scratchpad and quick notes",
        icon: PencilIcon,
        shortcut: "⌘ N",
        perform: () => {
          onOpenNotes();
          onClose();
        },
      },
      {
        id: "nav-workspace",
        category: "Navigation",
        title: "Go to Workspace Dashboard",
        description: "View main 3-column executive briefing dashboard",
        icon: GridIcon,
        perform: () => {
          onTabChange("dashboard");
          onClose();
        },
      },
      {
        id: "nav-settings",
        category: "Navigation",
        title: "Go to Integration Settings",
        description: "Manage Microsoft 365 & Asana connection credentials",
        icon: SettingsIcon,
        perform: () => {
          onTabChange("settings");
          onClose();
        },
      },
      {
        id: "toggle-theme",
        category: "Theme",
        title: `Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`,
        description: "Toggle app color scheme",
        icon: resolvedTheme === "dark" ? SunIcon : MoonIcon,
        perform: () => {
          onToggleTheme();
          showToast({
            type: "success",
            title: `Switched to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`,
          });
          onClose();
        },
      },
    ],
    [
      onOpenChat,
      onRefreshAll,
      onOpenCreateTask,
      onOpenNotes,
      onTabChange,
      resolvedTheme,
      onToggleTheme,
      onClose,
    ]
  );

  const filteredActions = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
    );
  }, [actions, query]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  const handleClose = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredActions.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filteredActions.length - 1) : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].perform();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-background/80 backdrop-blur-md transition-all animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
            ESC
          </kbd>
          <button
            onClick={handleClose}
            className="ml-2 text-muted-foreground hover:text-foreground p-1 sm:hidden"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-muted-foreground">
              No matching commands found for &quot;{query}&quot;
            </div>
          ) : (
            filteredActions.map((action, index) => {
              const Icon = action.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => action.perform()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate leading-tight">
                        {action.title}
                      </div>
                      {action.description && (
                        <div
                          className={`text-[11px] truncate leading-tight mt-0.5 ${
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          {action.description}
                        </div>
                      )}
                    </div>
                  </div>
                  {action.shortcut && (
                    <kbd
                      className={`ml-3 shrink-0 rounded px-2 py-0.5 text-[10px] font-mono border ${
                        isSelected
                          ? "border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {action.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground bg-muted/30">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-[10px]">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-[10px]">
                ↵
              </kbd>{" "}
              Select
            </span>
          </div>
          <span>SpeeHive Command Palette</span>
        </div>
      </div>
    </div>
  );
}
