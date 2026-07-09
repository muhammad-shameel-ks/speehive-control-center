"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { CreateTaskFormState, TaskPriority } from "@/hooks/useTaskMutations";

export function CreateTaskDialog({
  open,
  onOpenChange,
  form,
  isCreating,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateTaskFormState;
  isCreating: boolean;
  onFormChange: (next: CreateTaskFormState) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-card border border-border text-foreground rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold text-foreground">Create Asana Task</DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
            Add this item to your Asana workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <label htmlFor="taskName" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Task name
            </label>
            <input
              id="taskName"
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="taskDesc" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <textarea
              id="taskDesc"
              rows={4}
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              className="w-full resize-none rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="taskDate" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Due date
              </label>
              <input
                id="taskDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => onFormChange({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="taskPriority" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Priority
              </label>
              <select
                id="taskPriority"
                value={form.priority}
                onChange={(e) => onFormChange({ ...form, priority: e.target.value as TaskPriority })}
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-transparent hover:bg-muted/40 px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isCreating || !form.name.trim()}
            className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 px-4 py-2 text-[12px] font-semibold transition-colors flex items-center gap-1.5"
          >
            {isCreating ? "Creating…" : "Create Task"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
