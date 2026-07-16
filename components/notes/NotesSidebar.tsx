"use client";

import type { Note } from "@/lib/types/notes";
import { PlusIcon, SearchIcon, TrashIcon, PinIcon, PencilIcon, CheckIcon } from "@/components/icons";

type NotesSidebarProps = {
  notes: Note[];
  activeNoteId: string | null;
  showTrash: boolean;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: (title?: string, content?: string) => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleTrash: () => void;
  onSearchChange: (query: string) => void;
};

export function NotesSidebar({
  notes,
  activeNoteId,
  showTrash,
  searchQuery,
  loading,
  error,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentDelete,
  onTogglePin,
  onToggleTrash,
  onSearchChange,
}: NotesSidebarProps) {
  return (
    <div className="w-64 border-r border-border flex flex-col bg-muted/30">
      <div className="p-3 border-b border-border space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCreateNote()}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors"
            title="Create Blank Note"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New Note
          </button>
          <button
            onClick={() => onCreateNote("Todo List", "- [ ] \n- [ ] \n- [ ] ")}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-primary text-primary text-[12px] font-semibold hover:bg-primary/10 transition-colors"
            title="Create Todo Note"
          >
            <CheckIcon className="h-3.5 w-3.5" />
            New Todo
          </button>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full h-8 pl-8 pr-3 rounded-lg text-[12px] bg-background border border-border focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-[12px] text-muted-foreground">
            Loading...
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-[12px] text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div className="p-4 text-center text-[12px] text-muted-foreground">
            {showTrash ? "Trash is empty" : "No notes yet"}
          </div>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className={`group px-3 py-2.5 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
              activeNoteId === note.id ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {note.is_pinned && (
                    <PinIcon className="h-3 w-3 text-primary shrink-0" />
                  )}
                  <span className="text-[12px] font-semibold text-foreground truncate">
                    {note.title}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {note.content.slice(0, 60) || "Empty note"}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {showTrash ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreNote(note.id);
                      }}
                      className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                      title="Restore"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPermanentDelete(note.id);
                      }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Delete permanently"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(note.id);
                      }}
                      className={`p-1 rounded hover:bg-background ${
                        note.is_pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={note.is_pinned ? "Unpin" : "Pin"}
                    >
                      <PinIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      title="Move to trash"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <span className="text-[10px] text-muted-foreground/60 mt-1 block">
              {new Date(note.updated_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-border">
        <button
          onClick={onToggleTrash}
          className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-semibold transition-colors ${
            showTrash
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <TrashIcon className="h-3.5 w-3.5" />
          {showTrash ? "Back to Notes" : "Trash"}
        </button>
      </div>
    </div>
  );
}
