"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Note, NoteVersion, EditorState } from "@/lib/types/notes";
import { shouldSnapshot } from "@/lib/notes/autosave";

export function useNoteEditor(
  note: Note | null,
  updateNote: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => Promise<void>,
) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [saveStatus, setSaveStatus] = useState<EditorState["saveStatus"]>("idle");
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const lastSnapshotRef = useRef(0);
  const contentLenRef = useRef(0);
  const noteIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (note?.id !== noteIdRef.current) {
      noteIdRef.current = note?.id ?? null;
      setTitle(note?.title ?? "");
      setContent(note?.content ?? "");
      lastSnapshotRef.current = Date.now();
      contentLenRef.current = (note?.content ?? "").length;
      setSaveStatus("idle");
      setHistoryOpen(false);
    }
  }, [note?.id, note?.title, note?.content]);

  const persist = useCallback(
    async (titleVal: string, contentVal: string) => {
      if (!note) return;
      setSaveStatus("saving");
      try {
        await updateNote(note.id, { title: titleVal, content: contentVal });
        setSaveStatus("saved");
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    },
    [note, updateNote],
  );

  const persistRef = useRef(persist);
  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  const saveTimerPersist = useCallback((titleVal: string, contentVal: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistRef.current(titleVal, contentVal);
    }, 800);
  }, []);

  const createVersionSnapshot = useCallback(
    async (noteId: string, titleVal: string, contentVal: string, source: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("note_versions").insert({
        note_id: noteId,
        user_id: user.id,
        title: titleVal,
        content: contentVal,
        trigger_source: source,
      });

      if (error) console.error("Failed to create version:", error);
    },
    [],
  );

  const fetchVersions = useCallback(async (noteId: string) => {
    setVersionsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("note_versions")
      .select("*")
      .eq("note_id", noteId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVersions(data);
    }
    setVersionsLoading(false);
  }, []);

  const onTitleChange = useCallback(
    (next: string) => {
      setTitle(next);
      setSaveStatus("idle");
      saveTimerPersist(next, content);
    },
    [content, saveTimerPersist],
  );

  const onContentChange = useCallback(
    (next: string) => {
      const charDelta = next.length - contentLenRef.current;
      contentLenRef.current = next.length;
      setContent(next);
      setSaveStatus("idle");
      saveTimerPersist(title, next);

      if (note && shouldSnapshot(lastSnapshotRef.current, charDelta)) {
        createVersionSnapshot(note.id, title, next, "auto");
        lastSnapshotRef.current = Date.now();
      }
    },
    [title, note, saveTimerPersist, createVersionSnapshot],
  );

  const saveVersion = useCallback(async () => {
    if (!note) return;
    setSaveStatus("saving");
    await persist(title, content);
    await createVersionSnapshot(note.id, title, content, "manual");
    setSaveStatus("saved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
    if (historyOpen) {
      await fetchVersions(note.id);
    }
  }, [note, title, content, persist, createVersionSnapshot, historyOpen, fetchVersions]);

  useEffect(() => {
    if (historyOpen && note) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchVersions(note.id);
    }
  }, [historyOpen, note, fetchVersions]);

  const restoreVersion = useCallback(
    async (version: NoteVersion) => {
      if (!note) return;
      setSaveStatus("saving");

      await createVersionSnapshot(note.id, title, content, "restore");

      setTitle(version.title);
      setContent(version.content);
      contentLenRef.current = version.content.length;
      await updateNote(note.id, { title: version.title, content: version.content });
      setSaveStatus("saved");
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 2000);
      await fetchVersions(note.id);
    },
    [note, title, content, updateNote, createVersionSnapshot, fetchVersions],
  );

  const handleBeforeUnload = useCallback(() => {
    if (note && (title !== note.title || content !== note.content)) {
      navigator.sendBeacon(
        "/api/notes/sync",
        JSON.stringify({ noteId: note.id, title, content }),
      );
    }
  }, [note, title, content]);

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [handleBeforeUnload]);

  return {
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
  };
}
