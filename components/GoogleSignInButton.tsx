"use client";

import { useEffect, useState } from "react";

type GoogleUser = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

type Status =
  | { kind: "loading" }
  | { kind: "unconfigured" }
  | { kind: "signedOut" }
  | { kind: "signedIn"; user: GoogleUser; connectedCount: number; totalCount: number };

type ConfigResponse = {
  source: "env" | null;
  connected: boolean;
  connectedCount: number;
  totalCount: number;
  user: GoogleUser | null;
};

type Props = {
  searchParams: { google?: string; google_error?: string };
};

function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.972 32.165 29.418 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.803 0 5.357 1.05 7.31 2.77l5.657-5.657C33.046 6.053 28.735 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c2.803 0 5.357 1.05 7.31 2.77l5.657-5.657C33.046 6.053 28.735 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c4.65 0 8.868-1.776 12.04-4.673l-5.557-4.701C28.493 36.198 26.357 37 24 37c-5.397 0-9.937-2.815-11.282-6.747l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a11.303C33.972 32.165 29.418 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.803 0 5.357 9h11.303a11.04 11.04 0 0 1-3.82 5.626l.003-.002 5.557 4.701C36.972 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ searchParams }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/google/config", { cache: "no-store" })
      .then((r) => r.json() as Promise<ConfigResponse>)
      .then((data) => {
        if (cancelled) return;
        if (!data.source) {
          setStatus({ kind: "unconfigured" });
        } else if (data.user) {
          setStatus({
            kind: "signedIn",
            user: data.user,
            connectedCount: data.connectedCount,
            totalCount: data.totalCount,
          });
        } else {
          setStatus({ kind: "signedOut" });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setStatus({ kind: "unconfigured" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSignIn() {
    window.location.href = "/api/google/login";
  }

  async function onSignOut() {
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
    } catch {
      // ignore
    }
    window.location.reload();
  }

  if (status.kind === "loading") {
    return (
      <div className="flex h-12 w-full items-center justify-center rounded-full border border-zinc-200 bg-white text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
        Loading Google sign-in…
      </div>
    );
  }

  if (status.kind === "unconfigured") {
    return (
      <div className="flex w-full flex-col gap-1">
        <button
          type="button"
          disabled
          className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <GoogleGIcon className="h-5 w-5 opacity-40" />
          Sign in with Google
        </button>
        <p className="text-center text-xs text-zinc-500">
          Server not configured. Set{" "}
          <span className="font-mono">GOOGLE_OAUTH_CLIENT_ID</span> and{" "}
          <span className="font-mono">GOOGLE_OAUTH_CLIENT_SECRET</span>.
        </p>
      </div>
    );
  }

  if (status.kind === "signedOut") {
    return (
      <div className="flex w-full flex-col gap-2">
        {searchParams.google_error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            Google error: {searchParams.google_error}
          </div>
        )}
        <button
          type="button"
          onClick={onSignIn}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          <GoogleGIcon className="h-5 w-5" />
          Sign in with Google
        </button>
      </div>
    );
  }

  const { user, connectedCount, totalCount } = status;
  return (
    <div className="flex w-full flex-col gap-2">
      {searchParams.google_error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Google error: {searchParams.google_error}
        </div>
      )}
      <div className="flex w-full items-center justify-between gap-3 rounded-full border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          {user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt=""
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {(user.name ?? user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col text-left">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {user.name ?? "Signed in"}
            </span>
            <span className="text-xs text-zinc-500">{user.email}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Sign out
        </button>
      </div>
      {connectedCount < totalCount && (
        <p className="text-center text-xs text-zinc-500">
          {connectedCount} of {totalCount} Google services connected. Some tools
          may need a one-time additional sign-in.
        </p>
      )}
    </div>
  );
}
