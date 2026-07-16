"use client";

import type { SaveStatus } from "@/lib/types/notes";
import { NoteEditorToolbar } from "@/components/notes/NoteEditorToolbar";
import { renderMarkdown } from "@/lib/notes/markdown";

type NoteEditorProps = {
  title: string;
  content: string;
  saveStatus: SaveStatus;
  previewMode: boolean;
  historyOpen: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onTogglePreview: () => void;
  onToggleHistory: () => void;
  onSaveVersion: () => void;
  onDownload: () => void;
};

export function NoteEditor({
  title,
  content,
  saveStatus,
  previewMode,
  historyOpen,
  onTitleChange,
  onContentChange,
  onTogglePreview,
  onToggleHistory,
  onSaveVersion,
  onDownload,
}: NoteEditorProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <NoteEditorToolbar
        saveStatus={saveStatus}
        previewMode={previewMode}
        historyOpen={historyOpen}
        onTogglePreview={onTogglePreview}
        onToggleHistory={onToggleHistory}
        onSaveVersion={onSaveVersion}
        onDownload={onDownload}
      />

      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled note"
        className="px-4 py-3 text-[16px] font-semibold text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none border-b border-border shrink-0"
      />

      {previewMode ? (
        <div
          className="flex-1 overflow-y-auto px-4 py-3 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      ) : (
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Start writing..."
          className="flex-1 w-full resize-none px-4 py-3 text-[13px] font-mono text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none leading-relaxed"
        />
      )}
    </div>
  );
}
