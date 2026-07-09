"use client";

import { useEffect, useState } from "react";
import { BriefingDigestStrip } from "@/components/dashboard/briefing/BriefingDigestStrip";
import { InitialAvatar } from "@/components/dashboard/panels/InitialAvatar";
import { EmptyState } from "@/components/dashboard/panels/EmptyState";
import { PlusIcon, SparklesIcon } from "@/components/icons";
import type { ParsedEmail } from "@/lib/types/briefing";

export function BriefingMailPage({
  parsedEmails,
  initialEmail,
  summary,
  loading,
  error,
  onRetry,
  onReplyEmail,
  onCreateTaskFromEmail,
}: {
  parsedEmails: ParsedEmail[];
  initialEmail: ParsedEmail | null;
  summary: string | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onReplyEmail: (email: ParsedEmail) => void;
  onCreateTaskFromEmail: (email: ParsedEmail) => void;
}) {
  const [selected, setSelected] = useState<ParsedEmail | null>(initialEmail ?? parsedEmails[0] ?? null);

  useEffect(() => {
    if (initialEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(initialEmail);
    }
  }, [initialEmail]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <BriefingDigestStrip summary={summary} loading={loading} error={error} onRetry={onRetry} color="#5B9FD4" />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[320px] shrink-0 border-r border-border overflow-y-auto">
          {parsedEmails.length === 0 ? (
            <EmptyState message="No emails loaded." />
          ) : (
            <div className="divide-y divide-border">
              {parsedEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelected(email)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                    selected?.id === email.id ? "bg-muted/60" : ""
                  } ${email.isUnread ? "border-l-[3px] border-l-[#5B9FD4]" : "border-l-[3px] border-l-transparent"}`}
                >
                  <InitialAvatar name={email.sender} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <span
                        className={`text-[12px] truncate ${
                          email.isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                        }`}
                      >
                        {email.sender}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">
                        {email.date}
                      </span>
                    </div>
                    <p className="text-[11px] truncate">
                      <span className={email.isUnread ? "font-medium text-foreground" : "text-muted-foreground"}>
                        {email.subject}
                      </span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  {selected.isUnread && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5"
                      style={{ background: "rgba(91,159,212,0.15)", color: "#5B9FD4" }}
                    >
                      Unread
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-muted-foreground">{selected.date}</span>
                </div>
                <h3 className="text-[16px] font-bold text-foreground leading-snug mb-2">{selected.subject}</h3>
                <div className="flex items-center gap-2">
                  <InitialAvatar name={selected.sender} />
                  <span className="text-[13px] font-semibold text-foreground">{selected.sender}</span>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {selected.html ? (
                  <iframe
                    srcDoc={selected.html}
                    sandbox="allow-same-origin"
                    className="w-full h-full border-0"
                    title="Email content"
                  />
                ) : (
                  <div className="h-full overflow-y-auto px-6 py-5">
                    <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {selected.raw}
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Open in Outlook
                  </a>
                )}
                <button
                  onClick={() => onCreateTaskFromEmail(selected)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                >
                  <PlusIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  Create Task
                </button>
                <button
                  onClick={() => onReplyEmail(selected)}
                  className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-[12px] font-semibold transition-colors"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Draft Reply with AI
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <p className="text-[13px] font-medium text-foreground">Select an email</p>
              <p className="text-[12px] text-muted-foreground">Click any message to read it and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
