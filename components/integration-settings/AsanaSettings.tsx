"use client";

import { useEffect, useState } from "react";

type ConfigResponse = {
  configured: boolean;
  source: "env" | null;
  connected: boolean;
};

export function AsanaSettings({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [configured, setConfigured] = useState(false);
  const [connected, setConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/asana/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ConfigResponse) => {
        setConfigured(data.configured);
        setConnected(data.connected);
      })
      .catch(() => {});
  }, []);

  async function onDisconnect() {
    setDisconnecting(true);
    setError(null);
    try {
      const res = await fetch("/api/asana/disconnect", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-200"
      >
        <span>Asana credentials</span>
        <span className="text-xs text-zinc-500">
          {configured ? "Using env" : open ? "Hide" : "Edit"}
        </span>
      </button>
      {open && (
        <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800 space-y-4">
          {connected ? (
            <div className="space-y-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Connected to Asana
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Asana integration is connected. The tasks panel will show live tasks from your workspaces.
              </p>
              <button
                type="button"
                onClick={onDisconnect}
                disabled={disconnecting}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {disconnecting ? "Disconnecting..." : "Disconnect Asana"}
              </button>
            </div>
          ) : configured ? (
            <div className="space-y-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-750" />
                <span className="text-xs font-medium text-zinc-500">
                  Disconnected
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Asana credentials are configured via environment variables. Sign in to link your personal Asana account.
              </p>
              <button
                type="button"
                onClick={() => { window.location.href = "/api/asana/login"; }}
                className="inline-flex rounded bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:hover:bg-zinc-200"
              >
                Sign in with Asana
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-750" />
                <span className="text-xs font-medium text-zinc-500">
                  Not configured
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Set <span className="font-mono">ASANA_CLIENT_ID</span> and{" "}
                <span className="font-mono">ASANA_CLIENT_SECRET</span> as environment variables to enable Asana integration.
              </p>
              <p className="text-xs text-zinc-500">
                Create an API app at{" "}
                <a
                  href="https://app.asana.com/0/my-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  app.asana.com/0/my-apps
                </a>{" "}
                (type: <span className="font-mono">API app</span>, not MCP app) and add your callback URL.
              </p>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
