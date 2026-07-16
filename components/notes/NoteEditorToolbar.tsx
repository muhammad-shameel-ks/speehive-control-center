"use client";

import type { SaveStatus } from "@/lib/types/notes";
import { HistoryIcon, DownloadIcon, CloseIcon } from "@/components/icons";
import { TOOLBAR_ACTIONS } from "@/lib/notes/format";
import { DialogClose } from "@/components/ui/dialog";

type NoteEditorToolbarProps = {
  saveStatus: SaveStatus;
  previewMode: boolean;
  historyOpen: boolean;
  onTogglePreview: () => void;
  onToggleHistory: () => void;
  onSaveVersion: () => void;
  onDownload: () => void;
};

export function NoteEditorToolbar({
  saveStatus,
  previewMode,
  historyOpen,
  onTogglePreview,
  onToggleHistory,
  onSaveVersion,
  onDownload,
}: NoteEditorToolbarProps) {
  const statusDot = {
    idle: "bg-muted-foreground/30",
    saving: "bg-yellow-500",
    saved: "bg-emerald-500",
    error: "bg-destructive",
  }[saveStatus];

  const statusLabel = {
    idle: "",
    saving: "Saving...",
    saved: "Saved",
    error: "Error saving",
  }[saveStatus];

  return (
    <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0 bg-muted/30">
      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePreview}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
            previewMode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          {previewMode ? "Preview" : "Edit"}
        </button>

        {Object.entries(TOOLBAR_ACTIONS).map(([key]) => (
          <button
            key={key}
            className="px-1.5 py-1 rounded text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title={key}
          >
            {key === "bold" && "B"}
            {key === "italic" && "I"}
            {key === "heading1" && "H1"}
            {key === "heading2" && "H2"}
            {key === "heading3" && "H3"}
            {key === "list" && "•"}
            {key === "code" && "<>"}
            {key === "codeBlock" && "{ }"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
          {statusLabel && (
            <span className="text-[10px] text-muted-foreground">{statusLabel}</span>
          )}
        </div>

        <button
          onClick={onSaveVersion}
          className="px-2 py-1 rounded text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Save version"
        >
          Save v.
        </button>

        <button
          onClick={onToggleHistory}
          className={`p-1 rounded transition-colors ${
            historyOpen
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
          title="Version history"
        >
          <HistoryIcon className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onDownload}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Download as Markdown"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
        </button>

        <DialogClose render={<button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ml-1 border-l border-border pl-2" title="Close notes" />}>
          <CloseIcon className="h-3.5 w-3.5" />
        </DialogClose>
      </div>
    </div>
  );
}
