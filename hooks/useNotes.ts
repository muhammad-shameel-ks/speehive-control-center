"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Note } from "@/lib/types/notes";

const ACTIVE_NOTE_KEY = "speehive_active_note_id";
const LOCAL_NOTES_KEY = "speehive_notes";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_NOTE_KEY);
  });
  const [showTrash, setShowTrash] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    initUser();
  }, []);

  const fetchNotes = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const local = loadLocalNotes();
      setNotes(local);
      if (!activeNoteId && local.length > 0) {
        setActiveNoteId(local[0].id);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from("notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (dbError) throw dbError;
      setNotes(data ?? []);
      if (!activeNoteId && data && data.length > 0) {
        setActiveNoteId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [activeNoteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes();
  }, [fetchNotes]);

  const fetchNotesRef = useRef(fetchNotes);
  useEffect(() => {
    fetchNotesRef.current = fetchNotes;
  }, [fetchNotes]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`notes-realtime-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${userId}` },
        () => {
          fetchNotesRef.current();
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    supabase.rpc("purge_old_trash");
  }, [userId]);

  const createNote = useCallback(async (title = "Untitled", content = "") => {
    console.log("createNote called with:", { title, content });
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("createNote auth user:", user?.id);

      if (!user) {
        const newNote: Note = {
          id: crypto.randomUUID(),
          user_id: "",
          title,
          content,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
        console.log("createNote: no user, creating local note:", newNote);
        setNotes((prev) => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
        localStorage.setItem(ACTIVE_NOTE_KEY, newNote.id);
        saveLocalNotes([newNote, ...notes]);
        return newNote;
      }

      const newNote = {
        user_id: user.id,
        title,
        content,
        is_pinned: false,
      };

      console.log("createNote: inserting note to Supabase:", newNote);
      const { data, error: dbError } = await supabase
        .from("notes")
        .insert(newNote)
        .select()
        .single();

      if (dbError) {
        console.error("createNote: DB error inserting note:", dbError);
        setError(dbError.message);
        return null;
      }

      console.log("createNote: note inserted successfully:", data);
      setNotes((prev) => [data, ...prev]);
      setActiveNoteId(data.id);
      localStorage.setItem(ACTIVE_NOTE_KEY, data.id);
      return data;
    } catch (err) {
      console.error("createNote caught error:", err);
      setError(err instanceof Error ? err.message : "Failed to create note");
      return null;
    }
  }, [notes]);

  const updateNote = useCallback(
    async (id: string, patch: Partial<Pick<Note, "title" | "content" | "is_pinned">>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n,
        ),
      );

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const updated = notes.map((n) =>
          n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n,
        );
        setNotes(updated);
        saveLocalNotes(updated);
        return;
      }

      const { error: dbError } = await supabase
        .from("notes")
        .update(patch)
        .eq("id", id);

      if (dbError) {
        setError(dbError.message);
        fetchNotes();
      }
    },
    [notes, fetchNotes],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const now = new Date().toISOString();

      if (!user) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        const filtered = notes.filter((n) => n.id !== id);
        saveLocalNotes(filtered);
        if (activeNoteId === id) {
          setActiveNoteId(filtered[0]?.id ?? null);
        }
        return;
      }

      // Pre-delete version snapshot
      const note = notes.find((n) => n.id === id);
      if (note) {
        await supabase.from("note_versions").insert({
          note_id: id,
          user_id: user.id,
          title: note.title,
          content: note.content,
          trigger_source: "pre_delete",
        });
      }

      const { error: dbError } = await supabase
        .from("notes")
        .update({ deleted_at: now })
        .eq("id", id);

      if (dbError) {
        setError(dbError.message);
        return;
      }

      setNotes((prev) => {
        const filtered = prev.filter((n) => n.id !== id);
        if (activeNoteId === id) {
          setActiveNoteId(filtered[0]?.id ?? null);
        }
        return filtered;
      });
    },
    [notes, activeNoteId],
  );

  const restoreNote = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error: dbError } = await supabase
        .from("notes")
        .update({ deleted_at: null })
        .eq("id", id);

      if (dbError) {
        setError(dbError.message);
        return;
      }

      await fetchNotes();
      setActiveNoteId(id);
    },
    [fetchNotes],
  );

  const permanentlyDeleteNote = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error: dbError } = await supabase.from("notes").delete().eq("id", id);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      if (activeNoteId === id) {
        setActiveNoteId(filtered[0]?.id ?? null);
      }
      return filtered;
    });
  }, [activeNoteId]);

  const togglePin = useCallback(
    async (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      await updateNote(id, { is_pinned: !note.is_pinned });
    },
    [notes, updateNote],
  );

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      !searchQuery ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrash = showTrash ? n.deleted_at !== null : n.deleted_at === null;
    return matchesSearch && matchesTrash;
  });

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  return {
    notes: filteredNotes,
    activeNote,
    activeNoteId,
    setActiveNoteId: (id: string) => {
      setActiveNoteId(id);
      localStorage.setItem(ACTIVE_NOTE_KEY, id);
    },
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
  };
}

function loadLocalNotes(): Note[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalNotes(notes: Note[]) {
  localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
}
