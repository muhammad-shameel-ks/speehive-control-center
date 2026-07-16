"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyConnect } from "@/components/dashboard/panels/EmptyConnect";
import { EmptyState } from "@/components/dashboard/panels/EmptyState";
import { LoadingSpinner } from "@/components/dashboard/panels/LoadingSpinner";
import { TaskRow } from "@/components/dashboard/panels/TaskRow";
import type { AsanaTask } from "@/lib/types/integrations";
import { partitionByCompleted } from "@/lib/utils/array";
import { ClickableDigest } from "@/components/dashboard/panels/ClickableDigest";

type TasksSummary = {
  text: string | null;
  loading: boolean;
  error: boolean;
  collapsed: boolean;
};

export function TasksPanel({
  asanaStatus,
  tasks,
  syncing,
  tasksSummary,
  onToggleSummaryCollapsed,
  onToggleTask,
  onSyncAsana,
  inlineInput,
  onInlineInputChange,
  onInlineAddTask,
  onOpenTask,
}: {
  asanaStatus: "loading" | "connected" | "disconnected" | "unconfigured" | "unauthorized";
  tasks: AsanaTask[] | null;
  syncing: boolean;
  tasksSummary: TasksSummary;
  onToggleSummaryCollapsed: () => void;
  onToggleTask: (gid: string, currentlyCompleted: boolean) => void;
  onSyncAsana: () => void;
  inlineInput: string;
  onInlineInputChange: (value: string) => void;
  onInlineAddTask: (e: React.FormEvent) => void;
  onOpenTask?: (task: AsanaTask) => void;
}) {
  const { pending, done } = partitionByCompleted(tasks);

  return (
    <div
      className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm"
      style={{ height: "calc(100vh - 200px)", minHeight: 500 }}
    >
      <div
        className="h-[3px] shrink-0"
        style={{ background: "linear-gradient(90deg, var(--panel-tasks) 0%, #8DE85A 100%)" }}
      />

      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <img src="/images/asana.svg" alt="Asana" className="h-3.5 w-3.5 shrink-0 object-contain" />
          <span className="text-[12px] font-semibold text-foreground">Asana Tasks</span>
        </div>
        <div className="flex items-center gap-2.5">
          {syncing && <LoadingSpinner />}
          {(tasksSummary.text || tasksSummary.loading) && (
            <button
              onClick={onToggleSummaryCollapsed}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              AI
            </button>
          )}
          <button
            onClick={onSyncAsana}
            disabled={syncing || asanaStatus !== "connected"}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Sync
          </button>
        </div>
      </div>

      {!tasksSummary.collapsed && (tasksSummary.text || tasksSummary.loading) && (
        <div className="px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Task Digest</span>
            <button
              onClick={onToggleSummaryCollapsed}
              className="text-muted-foreground hover:text-foreground text-[12px] leading-none"
            >
              ×
            </button>
          </div>
          {tasksSummary.loading ? (
            <div className="space-y-1 animate-pulse">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
            </div>
          ) : (
            <div className="leading-relaxed">
              <ClickableDigest
                text={tasksSummary.text ?? ""}
                source="ASANA"
                asanaTasks={tasks}
                onOpenTask={onOpenTask}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto flex flex-col">
        {asanaStatus === "loading" ? (
          <LoadingSpinner />
        ) : asanaStatus !== "connected" ? (
          <EmptyConnect
            message="Connect your Asana account to see tasks."
            ctaLabel="Sign in with Asana"
            onCta={() => {
              window.location.href = "/api/asana/login";
            }}
          />
        ) : syncing ? (
          <LoadingSpinner />
        ) : tasks ? (
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="pending" className="flex flex-col h-full">
              <div className="px-4 pt-3 pb-0 shrink-0">
                <TabsList className="bg-muted/40 border border-border rounded-md p-0.5 h-7 w-full grid grid-cols-3">
                  <TabsTrigger
                    value="pending"
                    className="text-[11px] font-semibold h-6 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground cursor-pointer rounded"
                  >
                    Pending{" "}
                    <span className="ml-1 text-[10px] text-muted-foreground">({pending.length})</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="text-[11px] font-semibold h-6 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground cursor-pointer rounded"
                  >
                    Done
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="text-[11px] font-semibold h-6 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground cursor-pointer rounded"
                  >
                    All
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="pending"
                className="flex-1 overflow-y-auto mt-2 px-2 space-y-0.5"
              >
                {pending.length > 0 ? (
                  pending.map((task) => (
                    <TaskRow key={task.gid} task={task} onToggle={() => onToggleTask(task.gid, false)} />
                  ))
                ) : (
                  <EmptyState message="No pending tasks." />
                )}
              </TabsContent>

              <TabsContent
                value="completed"
                className="flex-1 overflow-y-auto mt-2 px-2 space-y-0.5"
              >
                {done.length > 0 ? (
                  done.map((task) => (
                    <TaskRow key={task.gid} task={task} onToggle={() => onToggleTask(task.gid, true)} />
                  ))
                ) : (
                  <EmptyState message="No completed tasks." />
                )}
              </TabsContent>

              <TabsContent value="all" className="flex-1 overflow-y-auto mt-2 px-2 space-y-0.5">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.gid}
                    task={task}
                    onToggle={() => onToggleTask(task.gid, task.completed)}
                  />
                ))}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <EmptyState message="No tasks retrieved." />
        )}

        {asanaStatus === "connected" && (
          <div className="shrink-0 border-t border-border p-3">
            <form onSubmit={onInlineAddTask}>
              <input
                type="text"
                value={inlineInput}
                onChange={(e) => onInlineInputChange(e.target.value)}
                placeholder="Add a task and press Enter…"
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

