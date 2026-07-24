"use client";

import { useEffect, useState } from "react";
import { BriefingDigestStrip } from "@/components/dashboard/briefing/BriefingDigestStrip";
import { InitialAvatar } from "@/components/dashboard/panels/InitialAvatar";
import { EmptyState } from "@/components/dashboard/panels/EmptyState";
import { PlusIcon, SparklesIcon } from "@/components/icons";
import type { ParsedEmail } from "@/lib/types/briefing";
import type { EmailDigestRef } from "@/lib/integrations/api-client";

function sanitizeEmailHtml(rawHtml: string): string {
  if (!rawHtml) return "";
  return rawHtml
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1='#'");
}

function prepareEmailHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  let content = sanitizeEmailHtml(rawHtml);

  if (/&lt;[a-z!]/i.test(content) && !/<[a-z!]/i.test(content)) {
    content = content
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }

  const baseAndStyle = `
    <base target="_blank">
    <style>
      :root { color-scheme: light dark; }
      html, body {
        background-color: Canvas;
        color: CanvasText;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
        margin: 0;
        padding: 24px;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
      }
      table {
        max-width: 100%;
      }
      blockquote {
        margin: 1em 0;
        padding-left: 1em;
        border-left: 3px solid color-mix(in srgb, CanvasText 20%, transparent);
      }
      a { color: -webkit-link; }
    </style>
  `;

  const hasHead = /<head[^>]*>/i.test(content);
  if (hasHead) {
    return content.replace(/<head[^>]*>/i, (match) => `${match}${baseAndStyle}`);
  }

  const hasHtml = /<html[^>]*>/i.test(content);
  if (hasHtml) {
    return content.replace(/<html[^>]*>/i, (match) => `${match}<head>${baseAndStyle}</head>`);
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${baseAndStyle}</head><body>${content}</body></html>`;
}

export function BriefingMailPage({
  parsedEmails,
  initialEmail,
  summary,
  loading,
  error,
  onRetry,
  emailRefs,
  onReplyEmail,
  onCreateTaskFromEmail,
}: {
  parsedEmails: ParsedEmail[];
  initialEmail: ParsedEmail | null;
  summary: string | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  emailRefs?: EmailDigestRef[];
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
      <BriefingDigestStrip
        summary={summary}
        loading={loading}
        error={error}
        onRetry={onRetry}
        color="#5B9FD4"
        source="MAIL"
        parsedEmails={parsedEmails}
        emailRefs={emailRefs}
        onOpenEmail={setSelected}
      />

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
                {(() => {
                  const htmlToRender = selected.html || (/<[a-z][\s\S]*>/i.test(selected.raw) ? selected.raw : null);
                  return htmlToRender ? (
                    <iframe
                      srcDoc={prepareEmailHtml(htmlToRender)}
                      sandbox="allow-popups allow-popups-to-escape-sandbox"
                      className="w-full h-full border-0 bg-background"
                      title="Email content"
                    />
                  ) : (
                    <div className="h-full overflow-y-auto px-6 py-5">
                      <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {selected.raw}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                  >
                    <img src="/images/microsoft-outlook.svg" alt="Outlook" className="h-3.5 w-3.5 object-contain" />
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
                <img src="/images/microsoft-outlook.svg" alt="Mail" className="h-[18px] w-[18px] object-contain" />
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
