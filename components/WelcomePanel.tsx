"use client";

export function WelcomePanel() {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          </svg>
        </div>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-zinc-900">
          SpeeHive
        </h1>
        <p className="text-sm text-zinc-500">Control Centre</p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2.5">
          <p className="text-xs font-medium text-zinc-700">Today</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
