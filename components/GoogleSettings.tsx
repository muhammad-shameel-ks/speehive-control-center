"use client";

import { useState } from "react";

type Status = "idle" | "disconnecting" | "disconnected" | "error";

export function GoogleSettings() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    setStatus("disconnecting");
    setError(null);
    try {
      const res = await fetch("/api/google/disconnect", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setStatus("disconnected");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <p className="mb-3 text-xs text-zinc-500">
          Microsoft 365 OAuth credentials are configured via environment variables (
          <span className="font-mono">MICROSOFT_OAUTH_CLIENT_ID</span>,{" "}
          <span className="font-mono">MICROSOFT_OAUTH_CLIENT_SECRET</span>, and
          optional{" "}
          <span className="font-mono">MICROSOFT_OAUTH_REDIRECT_URI</span>). The
          Microsoft Entra ID App Registration must have{" "}
          <span className="font-mono">graph.microsoft.com</span> permissions enabled.
          Each user must be enrolled in the{" "}
          <a
            href="https://developer.microsoft.com/en-us/microsoft-365"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Microsoft 365 Developer Program
          </a>{" "}
          and configured in the Entra OAuth consent screen.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSignOut}
            disabled={status === "disconnecting"}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {status === "disconnecting" ? "Signing out…" : "Sign out of Microsoft"}
          </button>
          {status === "disconnected" && (
            <span className="text-xs text-green-600 dark:text-green-400">
              Signed out
            </span>
          )}
          {status === "error" && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
