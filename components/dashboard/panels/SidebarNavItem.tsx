import type { ReactNode } from "react";

export function SidebarNavItem({
  active,
  collapsed,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      }`}
    >
      <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
