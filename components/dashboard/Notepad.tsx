"use client";

import { useNotepadMigration } from "@/hooks/useNotepad";
import { useNotes } from "@/hooks/useNotes";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { PencilIcon, ExpandIcon, PlusIcon } from "@/components/icons";

type NotepadProps = {
  onExpand: () => void;
};

export function Notepad({ onExpand }: NotepadProps) {
  useNotepadMigration();

  const {
    activeNote,
    loading,
    updateNote,
    createNote,
  } = useNotes();

  const {
    title,
    content,
    saveStatus,
    onTitleChange,
    onContentChange,
    persist,
  } = useNoteEditor(activeNote, updateNote);

  if (loading) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: 220, minHeight: 180 }}>
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border shrink-0">
          <PencilIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] font-semibold text-foreground">Scratchpad</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-[12px] text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  if (!activeNote) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: 220, minHeight: 180 }}>
        <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <PencilIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-[12px] font-semibold text-foreground">Scratchpad</span>
          </div>
          <button
            onClick={() => createNote()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Create note"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <span className="text-[12px] text-muted-foreground">No notes yet.</span>
          <button
            onClick={() => createNote()}
            className="text-[11px] font-semibold px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 transition-colors shadow-sm"
          >
            Create a note
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: 220, minHeight: 180 }}>
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <PencilIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[12px] font-semibold text-foreground">Scratchpad</span>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="text-[10px] text-muted-foreground">saving...</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[10px] text-emerald-500">saved</span>
          )}
          <button
            onClick={() => createNote()}
            className="text-muted-foreground hover:text-foreground transition-colors mr-1"
            title="Create note"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onExpand}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Expand"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={() => persist(title, content)}
        placeholder="Note title..."
        className="px-3.5 pt-2 text-[13px] font-semibold text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none border-b border-border"
      />
      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        onBlur={() => persist(title, content)}
        placeholder="IP addresses, serial numbers, quick notes..."
        className="flex-1 w-full resize-none p-3.5 text-[12px] font-mono text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none leading-relaxed"
      />
    </div>
  );
}
