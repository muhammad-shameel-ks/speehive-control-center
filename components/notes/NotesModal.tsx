"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNotes } from "@/hooks/useNotes";
import { useNoteEditor } from "@/hooks/useNoteEditor";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteHistoryPanel } from "@/components/notes/NoteHistoryPanel";

type NotesModalProps = {
  open: boolean;
  onClose: () => void;
};

export function NotesModal({ open, onClose }: NotesModalProps) {
  const {
    notes,
    activeNote,
    activeNoteId,
    setActiveNoteId,
    showTrash,
    setShowTrash,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    togglePin,
  } = useNotes();

  const {
    title,
    content,
    saveStatus,
    versions,
    versionsLoading,
    historyOpen,
    setHistoryOpen,
    previewMode,
    setPreviewMode,
    onTitleChange,
    onContentChange,
    saveVersion,
    restoreVersion,
    persist,
  } = useNoteEditor(activeNote, updateNote);

  const handleCreateNote = async (title?: string, content?: string) => {
    await createNote(title, content);
  };

  const handleDownload = () => {
    if (!activeNote) return;
    const blob = new Blob([`# ${title}\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[75vw] xl:max-w-[1100px] h-[85vh] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        <div className="flex h-full">
          <NotesSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            showTrash={showTrash}
            searchQuery={searchQuery}
            loading={loading}
            error={error}
            onSelectNote={setActiveNoteId}
            onCreateNote={handleCreateNote}
            onDeleteNote={deleteNote}
            onRestoreNote={restoreNote}
            onPermanentDelete={permanentlyDeleteNote}
            onTogglePin={togglePin}
            onToggleTrash={() => setShowTrash(!showTrash)}
            onSearchChange={setSearchQuery}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <NoteEditor
              title={title}
              content={content}
              saveStatus={saveStatus}
              previewMode={previewMode}
              historyOpen={historyOpen}
              onTitleChange={onTitleChange}
              onContentChange={onContentChange}
              onTogglePreview={() => setPreviewMode(!previewMode)}
              onToggleHistory={() => setHistoryOpen(!historyOpen)}
              onSaveVersion={saveVersion}
              onDownload={handleDownload}
            />
          </div>

          {historyOpen && (
            <NoteHistoryPanel
              versions={versions}
              loading={versionsLoading}
              onRestore={restoreVersion}
              onClose={() => setHistoryOpen(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
