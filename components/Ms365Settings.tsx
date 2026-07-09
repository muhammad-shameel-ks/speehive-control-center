"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "connected" | "disconnected" | "disconnecting" | "error";

type ConfigResponse = {
  source: "env" | null;
  connected: boolean;
  user: { name: string; email: string } | null;
};

export function Ms365Settings() {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ms365/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ConfigResponse) => {
        setStatus(data.connected ? "connected" : "disconnected");
        setUser(data.user);
      })
      .catch(() => setStatus("disconnected"));
  }, []);

  async function onDisconnect() {
    setStatus("disconnecting");
    setError(null);
    try {
      const res = await fetch("/api/ms365/disconnect", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setStatus("disconnected");
      setUser(null);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
        {status === "loading" && (
          <p className="text-xs text-zinc-500">Checking Microsoft 365 connection...</p>
        )}

        {(status === "connected" || status === "disconnecting") && user && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Connected as {user.name} ({user.email})
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Microsoft 365 Work IQ MCP servers are connected. Mail and Teams panels
              will show live data from your account.
            </p>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={status === "disconnecting"}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {status === "disconnecting" ? "Disconnecting..." : "Disconnect Microsoft 365"}
            </button>
          </div>
        )}

        {status === "disconnected" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              Microsoft 365 credentials are configured via environment variables (
              <span className="font-mono">MS365_CLIENT_ID</span>,{" "}
              <span className="font-mono">MS365_TENANT_ID</span>). The Microsoft Entra ID
              App Registration must have Work IQ permissions enabled (
              <span className="font-mono">WorkIQ-MailServer</span>,{" "}
              <span className="font-mono">WorkIQ-TeamsServer</span>).
            </p>
            <button
              type="button"
              onClick={() => { window.location.href = "/api/ms365/login"; }}
              className="inline-flex rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Sign in with Microsoft 365
            </button>
          </div>
        )}

        {status === "error" && error && (
          <div className="space-y-2">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => setStatus("disconnected")}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
