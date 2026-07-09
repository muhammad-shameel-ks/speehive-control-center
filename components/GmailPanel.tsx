"use client";

export function GmailPanel() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
          <GmailIcon />
        </div>
        <h2 className="text-sm font-semibold text-zinc-800">Gmail</h2>
        <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
          Soon
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="rounded-full bg-zinc-50 p-5 border border-zinc-100">
          <GmailIcon size={28} />
        </div>
        <p className="text-center text-xs text-zinc-400 leading-relaxed">
          Google Mail integration coming soon.
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-zinc-100 pt-4">
        <p className="text-xs font-medium text-zinc-500">Integrations</p>
        {[
          { label: "Google Drive", soon: true },
          { label: "Google Calendar", soon: true },
          { label: "Slack", soon: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-zinc-50">
            <span className="text-xs text-zinc-600">{item.label}</span>
            <span className="text-xs text-zinc-400">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GmailIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335" opacity="0.12" />
      <path d="M2 6l10 7L22 6" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
