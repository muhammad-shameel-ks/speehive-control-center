"use client";

import { useEffect, useState } from "react";

type ConnectionState = "unconfigured" | "unauthorized" | "connected";

type TasksResponse =
  | { state: "unconfigured" }
  | { state: "unauthorized"; error?: string }
  | { state: "connected"; result: unknown }
  | { state: "error"; error: string };

type Props = {
  searchParams: { asana?: string; asana_error?: string };
};

type AsanaTask = {
  gid: string;
  name: string;
  completed: boolean;
  due_on?: string | null;
};

function parseTasksFromResult(result: unknown): AsanaTask[] | null {
  // Result is MCP tool output: { content: [{ type: "text", text: "..." }] }
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

export function AsanaTasksButton({ searchParams }: Props) {
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TasksResponse | null>(null);

  useEffect(() => {
    fetch("/api/asana/config")
      .then((r) => r.json())
      .then((data: { hasCredentials: boolean; connected: boolean }) => {
        if (!data.hasCredentials) setConnection("unconfigured");
        else if (!data.connected) setConnection("unauthorized");
        else setConnection("connected");
      })
      .catch(() => setConnection("unconfigured"));
  }, []);

  async function onClick() {
    if (connection === "unconfigured" || connection === "unauthorized") {
      window.location.href = "/api/asana/login";
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/asana/tasks");
      const data = (await res.json()) as TasksResponse;
      setResponse(data);
      if (data.state === "unauthorized") {
        setConnection("unauthorized");
      }
    } catch (err) {
      setResponse({
        state: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = (() => {
    if (connection === null) return "Loading…";
    if (connection === "unconfigured") return "Show My Asana Tasks";
    if (connection === "unauthorized") return "Show My Asana Tasks";
    if (loading) return "Fetching…";
    return "Show My Asana Tasks";
  })();

  const buttonDisabled =
    connection === null || (connection === "connected" && loading);

  const helpText = (() => {
    if (connection === "unconfigured")
      return "Add your Asana MCP app credentials below first.";
    if (connection === "unauthorized")
      return "Click to connect your Asana account.";
    if (connection === "connected") return "Click to load your tasks.";
    return "";
  })();

  const justConnected = searchParams.asana === "connected";
  const justErrored = searchParams.asana_error;

  return (
    <div className="flex w-full flex-col gap-3">
      {justConnected && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          Connected to Asana.
        </div>
      )}
      {justErrored && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Asana error: {justErrored}
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={buttonDisabled}
        className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:hover:bg-zinc-300"
      >
        {buttonLabel}
      </button>
      {helpText && (
        <p className="text-center text-xs text-zinc-500">{helpText}</p>
      )}
      {response && "result" in response && (() => {
        const tasks = parseTasksFromResult(response.result);
        if (tasks) {
          return (
            <ul className="flex flex-col divide-y divide-zinc-200 rounded border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {tasks.length === 0 && (
                <li className="px-4 py-3 text-sm text-zinc-500">No tasks found.</li>
              )}
              {tasks.map((task) => (
                <li key={task.gid} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${task.completed ? "border-green-500 bg-green-500" : "border-zinc-400"}`} />
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className={`text-sm font-medium ${task.completed ? "line-through text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                      {task.name}
                    </span>
                    {task.due_on && (
                      <span className="text-xs text-zinc-500">Due {task.due_on}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <pre className="max-h-96 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-left text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {JSON.stringify(response.result, null, 2)}
          </pre>
        );
      })()}
      {response && "error" in response && response.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {response.error}
        </div>
      )}
    </div>
  );
}
