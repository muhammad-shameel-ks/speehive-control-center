"use client";

import { EmptyConnect } from "@/components/dashboard/panels/EmptyConnect";
import { EmptyState } from "@/components/dashboard/panels/EmptyState";
import { LoadingSpinner } from "@/components/dashboard/panels/LoadingSpinner";
import { InitialAvatar } from "@/components/dashboard/panels/InitialAvatar";
import { useInboxSync } from "@/hooks/useInboxSync";
import { parseEmails } from "@/lib/parser";
import type { ParsedEmail } from "@/lib/types/briefing";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type EmailSummary = {
  text: string | null;
  loading: boolean;
  error: boolean;
  collapsed: boolean;
};

export function EmailPanel({
  ms365Connected,
  emailSummary,
  onToggleSummaryCollapsed,
  onOpenEmail,
}: {
  ms365Connected: boolean;
  emailSummary: EmailSummary;
  onToggleSummaryCollapsed: () => void;
  onOpenEmail: (email: ParsedEmail) => void;
}) {
  const inbox = useInboxSync(ms365Connected);
  const { text, syncing, loadingMore, hasMore, refresh, scrollRef, sentinelRef } = inbox;
  const parsedEmails = parseEmails(text);

  return (
    <div
      className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm"
      style={{ height: "calc(100vh - 200px)", minHeight: 500 }}
    >
      <div
        className="h-[3px] shrink-0"
        style={{ background: "linear-gradient(90deg, var(--panel-email) 0%, #7BBFE8 100%)" }}
      />

      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-foreground">Inbox</span>
        </div>
        <div className="flex items-center gap-2.5">
          {(emailSummary.text || emailSummary.loading) && (
            <button
              onClick={onToggleSummaryCollapsed}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              AI
            </button>
          )}
          <button
            onClick={refresh}
            disabled={syncing || !ms365Connected}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            {syncing ? "Syncing…" : "Sync"}
          </button>
        </div>
      </div>

      {!emailSummary.collapsed && (emailSummary.text || emailSummary.loading) && (
        <div className="px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email Digest</span>
            <button
              onClick={onToggleSummaryCollapsed}
              className="text-muted-foreground hover:text-foreground text-[12px] leading-none"
            >
              ×
            </button>
          </div>
          {emailSummary.loading ? (
            <div className="space-y-1 animate-pulse">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{emailSummary.text ?? ""}</ReactMarkdown>
            </p>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {!ms365Connected ? (
          <EmptyConnect
            message="Connect Microsoft 365 to see your inbox."
            ctaLabel="Sign in with Microsoft 365"
            onCta={() => {
              window.location.href = "/api/ms365/login";
            }}
          />
        ) : parsedEmails.length > 0 ? (
          <>
            {syncing && (
              <div className="px-4 py-2 text-center text-[11px] text-muted-foreground bg-muted/30 border-b border-border">
                Refreshing…
              </div>
            )}
            <div className="divide-y divide-border">
              {parsedEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => onOpenEmail(email)}
                  className={`w-full group flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 relative ${
                    email.isUnread
                      ? "border-l-[3px] border-l-[var(--panel-email)]"
                      : "border-l-[3px] border-l-transparent"
                  }`}
                >
                  <InitialAvatar name={email.sender} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span
                        className={`text-[13px] truncate ${
                          email.isUnread
                            ? "font-semibold text-foreground"
                            : "font-medium text-muted-foreground"
                        }`}
                      >
                        {email.sender}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0 tabular-nums">
                        {email.date}
                      </span>
                    </div>
                    <p className="text-[12px] truncate">
                      <span
                        className={email.isUnread ? "text-foreground font-medium" : "text-muted-foreground"}
                      >
                        {email.subject}
                      </span>
                      {email.preview && <span className="text-muted-foreground"> — {email.preview}</span>}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div ref={sentinelRef} className="h-px" />
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-3 text-[11px] text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-primary" />
                Loading more…
              </div>
            )}
            {!loadingMore && !hasMore && (
              <div className="px-4 py-3 text-center text-[11px] text-muted-foreground">
                — End of inbox —
              </div>
            )}
          </>
        ) : syncing ? (
          <LoadingSpinner />
        ) : (
          <EmptyState message="No emails. Click Sync to fetch." />
        )}
      </div>
    </div>
  );
}
