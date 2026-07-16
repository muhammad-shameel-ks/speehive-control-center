"use client";

import { useState, useRef, useEffect } from "react";
import { useTodos } from "@/hooks/useTodos";
import { CheckCircleIcon, CircleIcon, XIcon, ExpandIcon, PlusIcon } from "@/components/icons";
import type { Todo } from "@/lib/types/todos";

type NotepadProps = {
  onExpand: () => void;
};

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
    <div className="group flex items-center gap-2 px-2.5 py-1.5 hover:bg-accent/50 rounded-md transition-colors">
      <button
        onClick={() => onToggle(todo.id)}
        className="shrink-0 transition-colors"
        title={todo.is_done ? "Mark pending" : "Mark done"}
      >
        {todo.is_done ? (
          <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
        ) : (
          <CircleIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
          className="flex-1 min-w-0 text-[12px] text-foreground bg-transparent border-b border-border focus:outline-none"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 min-w-0 text-[12px] cursor-text truncate transition-colors ${
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
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Notepad({ onExpand }: NotepadProps) {
  const {
    todos,
    loading,
    add,
    toggleDone,
    updateText,
    remove,
  } = useTodos();

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleAdd = async () => {
    if (!input.trim()) return;
    await add(input.trim());
    setInput("");
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: 220, minHeight: 180 }}>
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border shrink-0">
          <CheckCircleIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] font-semibold text-foreground">Tasks</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-[12px] text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (todos.length === 0 && !input) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: 220, minHeight: 180 }}>
        <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[12px] font-semibold text-foreground">Tasks</span>
          </div>
          <button
            onClick={onExpand}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Expand"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
          <span className="text-[12px] text-muted-foreground">No tasks yet.</span>
        </div>
        <div className="border-t border-border px-2.5 py-2">
          <div className="flex items-center gap-1.5">
            <PlusIcon className="h-3 w-3 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="Add a task..."
              className="flex-1 min-w-0 text-[12px] text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: 220, minHeight: 180 }}>
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] font-semibold text-foreground">Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExpand}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Expand"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto py-1">
        {todos.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            onToggle={toggleDone}
            onUpdate={updateText}
            onDelete={remove}
          />
        ))}
      </div>

      <div className="border-t border-border px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <PlusIcon className="h-3 w-3 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder="Add a task..."
            className="flex-1 min-w-0 text-[12px] text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
