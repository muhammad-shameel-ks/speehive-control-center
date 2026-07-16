"use client";

import type { NoteVersion } from "@/lib/types/notes";
import { CloseIcon, RestoreIcon } from "@/components/icons";

type NoteHistoryPanelProps = {
  versions: NoteVersion[];
  loading: boolean;
  onRestore: (version: NoteVersion) => void;
  onClose: () => void;
};

const sourceLabels: Record<string, string> = {
  auto: "Auto",
  manual: "Manual",
  restore: "Restore",
  pre_delete: "Pre-delete",
};

export function NoteHistoryPanel({
  versions,
  loading,
  onRestore,
  onClose,
}: NoteHistoryPanelProps) {
  return (
    <div className="w-72 border-l border-border flex flex-col bg-muted/30">
      <div className="flex items-center justify-between px-3 h-10 border-b border-border shrink-0">
        <span className="text-[12px] font-semibold text-foreground">Version History</span>
        <button
          onClick={onClose}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-[12px] text-muted-foreground">
            Loading versions...
          </div>
        )}

        {!loading && versions.length === 0 && (
          <div className="p-4 text-center text-[12px] text-muted-foreground">
            No versions saved yet
          </div>
        )}

        {versions.map((version) => (
          <div
            key={version.id}
            className="px-3 py-2.5 border-b border-border hover:bg-accent/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(version.created_at).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 bg-muted px-1 rounded">
                    {sourceLabels[version.trigger_source] ?? version.trigger_source}
                  </span>
                </div>
                <p className="text-[11px] text-foreground mt-1 line-clamp-2">
                  {version.title}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {version.content.slice(0, 100) || "Empty"}
                </p>
              </div>

              <button
                onClick={() => onRestore(version)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                title="Restore this version"
              >
                <RestoreIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
