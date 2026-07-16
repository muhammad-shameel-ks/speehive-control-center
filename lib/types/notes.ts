export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NoteVersion = {
  id: string;
  note_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  trigger_source: "auto" | "manual" | "restore" | "pre_delete";
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type NotesState = {
  notes: Note[];
  loading: boolean;
  error: string | null;
  activeNoteId: string | null;
  showTrash: boolean;
  searchQuery: string;
};

export type EditorState = {
  title: string;
  content: string;
  isDirty: boolean;
  saveStatus: SaveStatus;
  versions: NoteVersion[];
  versionsLoading: boolean;
  historyOpen: boolean;
  previewMode: boolean;
};
