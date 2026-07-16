"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTodos } from "@/hooks/useTodos";
import { CheckCircleIcon, CircleIcon, XIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/icons";
import type { Todo } from "@/lib/types/todos";

function TodoRow({
  todo,
  onToggle,
  onUpdate,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.content);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const saveDraft = () => {
    if (draft.trim() && draft.trim() !== todo.content) {
      onUpdate(todo.id, draft.trim());
    } else {
      setDraft(todo.content);
    }
    setEditing(false);
  };

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 rounded-lg transition-colors">
      <button
        onClick={() => onToggle(todo.id)}
        className="shrink-0 transition-colors"
        title={todo.is_done ? "Mark pending" : "Mark done"}
      >
        {todo.is_done ? (
          <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
        ) : (
          <CircleIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              if (e.target.value.trim()) onUpdate(todo.id, e.target.value.trim());
            }, 300);
          }}
          onBlur={saveDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveDraft();
            if (e.key === "Escape") {
              setDraft(todo.content);
              setEditing(false);
            }
          }}
          className="flex-1 min-w-0 text-[13px] text-foreground bg-transparent border-b border-border focus:outline-none"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 min-w-0 text-[13px] cursor-text transition-colors ${
            todo.is_done ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {todo.content}
        </span>
      )}

      <button
        onClick={() => onDelete(todo.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
        title="Delete"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

type TodosModalProps = {
  open: boolean;
  onClose: () => void;
};

export function TodosModal({ open, onClose }: TodosModalProps) {
  const {
    todos,
    loading,
    searchQuery,
    setSearchQuery,
    add,
    toggleDone,
    updateText,
    remove,
    clearCompleted,
  } = useTodos();

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const doneCount = todos.filter((t) => t.is_done).length;
  const pendingCount = todos.length - doneCount;

  const handleAdd = async () => {
    if (!input.trim()) return;
    await add(input.trim());
    setInput("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-[500px] h-[70vh] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
            <span className="text-[14px] font-semibold text-foreground">Tasks</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {pendingCount} pending · {doneCount} done
              </span>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-2.5 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="flex-1 min-w-0 text-[12px] text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto py-1">
            {loading ? (
              <div className="flex items-center justify-center h-24 text-[12px] text-muted-foreground">
                Loading...
              </div>
            ) : todos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[12px] text-muted-foreground">
                <span>No tasks yet.</span>
                <span>Add one below.</span>
              </div>
            ) : (
              todos.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleDone}
                  onUpdate={updateText}
                  onDelete={remove}
                />
              ))
            )}
          </div>

          <div className="border-t border-border px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <PlusIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                placeholder="Add a task..."
                className="flex-1 min-w-0 text-[13px] text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
              />
              {doneCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Clear completed"
                >
                  <TrashIcon className="h-3 w-3" />
                  Clear done
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
