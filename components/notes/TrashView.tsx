"use client";

import type { Note } from "@/lib/types/notes";
import { RestoreIcon, TrashIcon } from "@/components/icons";

type TrashViewProps = {
  notes: Note[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
};

export function TrashView({ notes, onRestore, onPermanentDelete }: TrashViewProps) {
  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[12px] text-muted-foreground">
        Trash is empty
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {notes.map((note) => (
        <div
          key={note.id}
          className="px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[12px] font-semibold text-foreground">
                {note.title}
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {note.content.slice(0, 60) || "Empty note"}
              </p>
              <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                Deleted {new Date(note.deleted_at!).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onRestore(note.id)}
                className="p-1.5 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                title="Restore"
              >
                <RestoreIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onPermanentDelete(note.id)}
                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete permanently"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
