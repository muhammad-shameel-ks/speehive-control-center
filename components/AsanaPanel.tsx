"use client";

import { useEffect, useState } from "react";

type AsanaTask = {
  gid: string;
  name: string;
  completed: boolean;
  due_on?: string | null;
};

type TasksResponse =
  | { state: "unauthorized"; error?: string }
  | { state: "connected"; result: unknown }
  | { state: "error"; error: string };

function parseTasksFromResult(result: unknown): AsanaTask[] | null {
  if (!result || typeof result !== "object") return null;
  const r = result as { content?: unknown };
  if (!Array.isArray(r.content)) return null;
  const text = r.content
    .filter(
      (item): item is { type: "text"; text: string } =>
        typeof item === "object" &&
        item !== null &&
        (item as { type?: unknown }).type === "text" &&
        typeof (item as { text?: unknown }).text === "string",
    )
    .map((item) => item.text)
    .join("");
  try {
    const parsed = JSON.parse(text) as { data?: AsanaTask[] };
    return Array.isArray(parsed.data) ? parsed.data : null;
  } catch {
    return null;
  }
}

type Props = {
  searchParams: { asana?: string; asana_error?: string };
};

export function AsanaPanel({ searchParams }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<AsanaTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/asana/config")
      .then((r) => r.json())
      .then((data: { configured: boolean; connected: boolean }) => {
        setConfigured(data.configured);
        if (data.connected) {
          setConnected(true);
          fetchTasks();
        } else {
          setConnected(false);
        }
      })
      .catch(() => setConnected(false));
  }, []);

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/asana/tasks");
      const data = (await res.json()) as TasksResponse;
      if (data.state === "connected") {
        setTasks(parseTasksFromResult(data.result));
        setConnected(true);
      } else if (data.state === "unauthorized") {
        setConnected(false);
      } else if (data.state === "error") {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    await fetch("/api/asana/tasks", { method: "DELETE" });
    setConnected(false);
    setTasks(null);
  }

  const justConnected = searchParams.asana === "connected";
  const justErrored = searchParams.asana_error;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100">
            <AsanaIcon />
          </div>
          <h2 className="text-sm font-semibold text-zinc-800">Asana</h2>
        </div>
        {connected && (
          <button
            onClick={disconnect}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            Disconnect
          </button>
        )}
      </div>

      {justConnected && !error && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 border border-green-100">
          Connected to Asana successfully.
        </div>
      )}
      {justErrored && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-100">
          {justErrored}
        </div>
      )}

      {connected === null && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
        </div>
      )}

      {connected === false && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-center text-xs text-zinc-500">
            {!configured
              ? "Asana app not configured. Set ASANA_CLIENT_ID and ASANA_CLIENT_SECRET."
              : "Connect your Asana account to see your tasks."}
          </p>
          {configured && (
            <a
              href="/api/asana/login"
              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 transition-colors"
            >
              <AsanaIcon white />
              Login with Asana
            </a>
          )}
        </div>
      )}

      {connected === true && loading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
        </div>
      )}

      {connected === true && !loading && tasks !== null && (
        <div className="flex flex-1 flex-col overflow-auto">
          {tasks.length === 0 ? (
            <p className="text-center text-xs text-zinc-400 py-8">No tasks found.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100">
              {tasks.map((task) => (
                <li key={task.gid} className="flex items-start gap-3 py-2.5">
                  <span
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                      task.completed
                        ? "border-rose-500 bg-rose-500"
                        : "border-zinc-300"
                    }`}
                  />
                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <span
                      className={`text-sm truncate ${
                        task.completed
                          ? "line-through text-zinc-400"
                          : "text-zinc-800"
                      }`}
                    >
                      {task.name}
                    </span>
                    {task.due_on && (
                      <span className="text-xs text-zinc-400">Due {task.due_on}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {connected === true && !loading && tasks !== null && (
        <button
          onClick={fetchTasks}
          className="mt-auto text-xs text-zinc-400 hover:text-zinc-600 text-center"
        >
          Refresh
        </button>
      )}
    </div>
  );
}

function AsanaIcon({ white = false }: { white?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="9" r="6" fill={white ? "white" : "#F06A6A"} />
      <circle cx="6" cy="23" r="6" fill={white ? "white" : "#F06A6A"} />
      <circle cx="26" cy="23" r="6" fill={white ? "white" : "#F06A6A"} />
    </svg>
  );
}
