"use client";

import { useEffect, useState } from "react";
import { BriefingDigestStrip } from "@/components/dashboard/briefing/BriefingDigestStrip";
import { EmptyState } from "@/components/dashboard/panels/EmptyState";
import { partitionByCompleted } from "@/lib/utils/array";
import type { AsanaTask } from "@/lib/types/integrations";

export function BriefingAsanaPage({
  asanaTasks,
  initialTask,
  syncing,
  summary,
  loading,
  error,
  onRetry,
  onToggleTask,
  onInlineAddTask,
  inlineTaskInput,
  setInlineTaskInput,
}: {
  asanaTasks: AsanaTask[] | null;
  initialTask?: AsanaTask | null;
  syncing: boolean;
  summary: string | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onToggleTask: (gid: string, currentlyCompleted: boolean) => void;
  onInlineAddTask: (e: React.FormEvent) => void;
  inlineTaskInput: string;
  setInlineTaskInput: (v: string) => void;
}) {
  const [tab, setTab] = useState<"pending" | "done" | "all">("pending");
  const [selected, setSelected] = useState<AsanaTask | null>(initialTask ?? null);

  useEffect(() => {
    if (initialTask) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(initialTask);
      setTab(initialTask.completed ? "done" : "pending");
    }
  }, [initialTask]);
  const { pending, done } = partitionByCompleted(asanaTasks);
  const list = tab === "pending" ? pending : tab === "done" ? done : asanaTasks ?? [];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <BriefingDigestStrip
        summary={summary}
        loading={loading}
        error={error}
        onRetry={onRetry}
        color="#60C83A"
        source="ASANA"
        asanaTasks={asanaTasks}
        onOpenTask={setSelected}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[320px] shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="px-3 pt-3 pb-2 shrink-0 border-b border-border">
            <div className="flex gap-1">
              {(["pending", "done", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setSelected(null);
                  }}
                  className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                    tab === t
                      ? "bg-card border border-border text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {t === "pending"
                    ? `Pending (${pending.length})`
                    : t === "done"
                      ? `Done (${done.length})`
                      : `All (${asanaTasks?.length ?? 0})`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {syncing ? (
              <div className="flex h-full items-center justify-center py-16">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : list.length === 0 ? (
              <EmptyState
                message={tab === "pending" ? "No pending tasks." : tab === "done" ? "No completed tasks." : "No tasks."}
              />
            ) : (
              <div className="divide-y divide-border px-1 py-1">
                {list.map((task) => (
                  <button
                    key={task.gid}
                    onClick={() => setSelected(task)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-muted/40 ${
                      selected?.gid === task.gid ? "bg-muted/60" : ""
                    } ${task.completed ? "opacity-55" : ""}`}
                  >
                    <div
                      className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                        task.completed ? "border-[#60C83A] bg-[#60C83A]/15" : "border-border"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTask(task.gid, task.completed);
                      }}
                    >
                      {task.completed && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#60C83A" strokeWidth="3.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`flex-1 text-[12px] leading-snug ${
                        task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"
                      }`}
                    >
                      {task.name}
                    </span>
                    {task.due_on && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{task.due_on}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border p-3">
            <form onSubmit={onInlineAddTask}>
              <input
                type="text"
                value={inlineTaskInput}
                onChange={(e) => setInlineTaskInput(e.target.value)}
                placeholder="Add a task and press Enter…"
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </form>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${
                      selected.completed ? "bg-[#60C83A]/15 text-[#60C83A]" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {selected.completed ? "Completed" : "Pending"}
                  </span>
                  {selected.due_on && (
                    <span className="text-[11px] font-mono text-muted-foreground">Due {selected.due_on}</span>
                  )}
                </div>
                <h3 className="text-[16px] font-bold text-foreground leading-snug">{selected.name}</h3>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="rounded-xl bg-muted/30 border border-border p-5">
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Task Details
                  </p>
                  <dl className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <dt className="text-[12px] text-muted-foreground w-16 shrink-0">Status</dt>
                      <dd className="text-[12px] font-semibold text-foreground">
                        {selected.completed ? "Done" : "In progress"}
                      </dd>
                    </div>
                    {selected.due_on && (
                      <div className="flex items-center gap-3">
                        <dt className="text-[12px] text-muted-foreground w-16 shrink-0">Due</dt>
                        <dd className="text-[12px] font-semibold text-foreground font-mono">
                          {selected.due_on}
                        </dd>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <dt className="text-[12px] text-muted-foreground w-16 shrink-0">ID</dt>
                      <dd className="text-[11px] text-muted-foreground font-mono">{selected.gid}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
                <button
                  onClick={() => {
                    onToggleTask(selected.gid, selected.completed);
                    setSelected({ ...selected, completed: !selected.completed });
                  }}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                >
                  {selected.completed ? "Mark Pending" : "Mark Complete"}
                </button>
                <a
                  href={`https://app.asana.com/0/0/${selected.gid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                >
                  <img src="/images/asana.svg" alt="Asana" className="h-3.5 w-3.5 object-contain" />
                  Open in Asana
                </a>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1">
                <img src="/images/asana.svg" alt="Asana" className="h-[18px] w-[18px] object-contain" />
              </div>
              <p className="text-[13px] font-medium text-foreground">Select a task</p>
              <p className="text-[12px] text-muted-foreground">Click any task to see details and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
