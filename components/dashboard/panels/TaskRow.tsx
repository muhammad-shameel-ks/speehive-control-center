import type { AsanaTask } from "@/lib/types/integrations";

export function TaskRow({ task, onToggle }: { task: AsanaTask; onToggle: () => void }) {
  return (
    <div
      className={`group flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors ${task.completed ? "opacity-55" : ""}`}
    >
      <button
        onClick={onToggle}
        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
          task.completed
            ? "border-[var(--panel-tasks)] bg-[var(--panel-tasks)]/15"
            : "border-border group-hover:border-primary/60"
        }`}
      >
        {task.completed && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" style={{ color: "var(--panel-tasks)" }}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-[13px] leading-snug ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
      >
        {task.name}
      </span>
      {task.due_on && (
        <span className="text-[11px] font-mono text-muted-foreground shrink-0 tabular-nums">
          {task.due_on}
        </span>
      )}
    </div>
  );
}
