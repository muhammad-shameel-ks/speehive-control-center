"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";
type Source = "env" | "session" | null;

type ConfigResponse = {
  configured: boolean;
  source: Source;
  connected: boolean;
};

export function AsanaSettings({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [origin, setOrigin] = useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<Source>(null);
  const [envLocked, setEnvLocked] = useState(false);

  useEffect(() => {
    fetch("/api/asana/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ConfigResponse) => {
        setSource(data.source);
        setEnvLocked(data.source === "env");
      })
      .catch(() => {});
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/asana/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setStatus("saved");
      setClientSecret("");
      setSource("session");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-200"
      >
        <span>Asana MCP credentials</span>
        <span className="text-xs text-zinc-500">
          {source === "env" ? "Using env" : source === "session" ? "Custom" : open ? "Hide" : "Edit"}
        </span>
      </button>
      {open && (
        <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
          {envLocked ? (
            <p className="text-xs text-zinc-500">
              <span className="font-mono">ASANA_CLIENT_ID</span> and{" "}
              <span className="font-mono">ASANA_CLIENT_SECRET</span> are set as
              environment variables, so the values below are ignored. Remove the
              env vars to use custom credentials here.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-zinc-500">
                Create an MCP app at{" "}
                <a
                  href="https://app.asana.com/0/my-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  app.asana.com/0/my-apps
                </a>{" "}
                (type: <span className="font-mono">MCP app</span>) and add{" "}
                <span className="font-mono">
                  {origin}/api/asana/callback
                </span>{" "}
                as a redirect URL. Saved values are stored in an encrypted
                cookie on this browser only.
              </p>
              <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Client ID
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    autoComplete="off"
                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Client secret
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    required
                    autoComplete="off"
                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-900 dark:text-zinc-100"
                  />
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={status === "saving"}
                    className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    {status === "saving" ? "Saving…" : "Save"}
                  </button>
                  {status === "saved" && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Saved
                    </span>
                  )}
                  {status === "error" && (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      {error}
                    </span>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
