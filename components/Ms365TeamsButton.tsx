"use client";

import { useEffect, useState } from "react";

type ConnectionState = "loading" | "unconfigured" | "unauthorized" | "connected";

type Response =
  | { state: "unconfigured" }
  | { state: "unauthorized"; error?: string }
  | { state: "connected"; result: unknown }
  | { state: "error"; error: string };

type ConfigResponse = {
  source: "env" | null;
  connected: boolean;
  connections: Record<string, boolean>;
};

type Props = {
  searchParams?: { ms365?: string; ms365_error?: string };
};

function extractTextContent(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const r = result as { content?: unknown };
  if (!Array.isArray(r.content)) return "";
  return r.content
    .filter(
      (item): item is { type: "text"; text: string } =>
        typeof item === "object" &&
        item !== null &&
        (item as { type?: unknown }).type === "text" &&
        typeof (item as { text?: unknown }).text === "string",
    )
    .map((item) => item.text)
    .join("\n");
}

export function Ms365TeamsButton({ searchParams }: Props) {
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<Response | null>(null);

  useEffect(() => {
    fetch("/api/ms365/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ConfigResponse) => {
        if (!data.source) setConnection("unconfigured");
        else if (!data.connections["teams-chat"]) setConnection("unauthorized");
        else setConnection("connected");
      })
      .catch(() => setConnection("unconfigured"));
  }, []);

  function onSignIn() {
    window.location.href = "/api/ms365/login";
  }

  async function onClick() {
    if (connection !== "connected") {
      onSignIn();
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/ms365/teams-chat", { cache: "no-store" });
      const data = (await res.json()) as Response;
      setResponse(data);
      if (data.state === "unauthorized") {
        setConnection("unauthorized");
      } else if (data.state === "unconfigured") {
        setConnection("unconfigured");
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

  const helpText = (() => {
    if (connection === "loading") return "";
    if (connection === "unconfigured")
      return "Microsoft 365 credentials are not configured on this server.";
    if (connection === "unauthorized")
      return "Click to sign in to Microsoft 365.";
    return "";
  })();

  const buttonLabel = (() => {
    if (connection === "loading") return "Loading...";
    if (loading) return "Fetching...";
    if (connection === "unauthorized") return "Sign in & try";
    return "Show my recent Teams chats";
  })();

  const buttonDisabled =
    connection === "loading" || (connection === "connected" && loading);

  return (
    <div className="flex w-full flex-col gap-2">
      {searchParams?.ms365_error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Microsoft 365 error: {searchParams.ms365_error}
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={buttonDisabled}
        className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
      >
        {buttonLabel}
      </button>
      {helpText && <p className="text-center text-xs text-zinc-500">{helpText}</p>}
      {response && "result" in response && (
        <pre className="max-h-96 overflow-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-left text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {extractTextContent(response.result) ||
            JSON.stringify(response.result, null, 2)}
        </pre>
      )}
      {response && "error" in response && response.error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {response.error}
        </div>
      )}
    </div>
  );
}
