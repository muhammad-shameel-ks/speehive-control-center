"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Todo } from "@/lib/types/todos";

const LOCAL_TODOS_KEY = "speehive_todos";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchTodos = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const local = loadLocalTodos();
      setTodos(local);
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from("notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;

      const mapped: Todo[] = (data ?? []).map(
        (row: { id: string; user_id: string; content: string; is_pinned: boolean; created_at: string; updated_at: string }) => ({
          id: row.id,
          user_id: row.user_id,
          content: row.content,
          is_done: row.is_pinned,
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
      );

      setTodos(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodos();
  }, [fetchTodos]);

  const fetchTodosRef = useRef(fetchTodos);
  useEffect(() => {
    fetchTodosRef.current = fetchTodos;
  }, [fetchTodos]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`todos-realtime-${channelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes", filter: `user_id=eq.${userId}` },
        () => {
          fetchTodosRef.current();
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const add = useCallback(async (text: string) => {
    if (!text.trim()) return null;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        user_id: "",
        content: text.trim(),
        is_done: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTodos((prev) => [newTodo, ...prev]);
      saveLocalTodos([newTodo, ...todos]);
      return newTodo;
    }

    const { data, error: dbError } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        content: text.trim(),
        title: "",
        is_pinned: false,
      })
      .select()
      .single();

    if (dbError) {
      setError(dbError.message);
      return null;
    }

    const newTodo: Todo = {
      id: data.id,
      user_id: data.user_id,
      content: data.content,
      is_done: data.is_pinned,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    setTodos((prev) => [newTodo, ...prev]);
    return newTodo;
  }, [todos]);

  const toggleDone = useCallback(async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    const nextDone = !todo.is_done;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_done: nextDone, updated_at: new Date().toISOString() } : t,
      ),
    );

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("notes")
      .update({ is_pinned: nextDone })
      .eq("id", id);

    if (dbError) {
      setError(dbError.message);
      fetchTodos();
    }
  }, [todos, fetchTodos]);

  const updateText = useCallback(async (id: string, text: string) => {
    if (!text.trim()) return;

    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, content: text.trim(), updated_at: new Date().toISOString() } : t,
      ),
    );

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("notes")
      .update({ content: text.trim() })
      .eq("id", id);

    if (dbError) {
      setError(dbError.message);
      fetchTodos();
    }
  }, [fetchTodos]);

  const remove = useCallback(async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

    if (dbError) {
      setError(dbError.message);
      fetchTodos();
    }
  }, [fetchTodos]);

  const clearCompleted = useCallback(async () => {
    const doneIds = todos.filter((t) => t.is_done).map((t) => t.id);
    if (doneIds.length === 0) return;

    setTodos((prev) => prev.filter((t) => !t.is_done));

    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("notes")
      .delete()
      .in("id", doneIds);

    if (dbError) {
      setError(dbError.message);
      fetchTodos();
    }
  }, [todos, fetchTodos]);

  const filteredTodos = todos.filter((t) => {
    if (!searchQuery) return true;
    return t.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return {
    todos: filteredTodos,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    add,
    toggleDone,
    updateText,
    remove,
    clearCompleted,
  };
}

function loadLocalTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(LOCAL_TODOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTodos(todos: Todo[]) {
  localStorage.setItem(LOCAL_TODOS_KEY, JSON.stringify(todos));
}
