"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ClickableDigest } from "@/components/dashboard/panels/ClickableDigest";
import { type SummarySource, type ParsedEmail, type ParsedChat } from "@/lib/types/briefing";
import type { AsanaTask } from "@/lib/types/integrations";

export function BriefingDigestStrip({
  summary,
  loading,
  error,
  onRetry,
  color,
  source,
  parsedEmails,
  parsedChats,
  asanaTasks,
  onOpenEmail,
  onOpenChat,
  onOpenTask,
}: {
  summary: string | null;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  color: string;
  source?: SummarySource;
  parsedEmails?: ParsedEmail[];
  parsedChats?: ParsedChat[];
  asanaTasks?: AsanaTask[] | null;
  onOpenEmail?: (email: ParsedEmail) => void;
  onOpenChat?: (chat: ParsedChat) => void;
  onOpenTask?: (task: AsanaTask) => void;
}) {
  if (!summary && !loading && !error) return null;
  return (
    <div className="px-5 py-3 border-b border-border bg-muted/20 shrink-0">
      <div className="flex items-center gap-2 mb-1.5">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color }}
        >
          <path d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.904L9 9l.813 5.096L15 15l-5.187.904zM19.006 5.005l-.503 3.125-3.125.503 3.125.503.503 3.125.503-3.125 3.125-.503-3.125-.503-.503-3.125z" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
          AI Digest
        </span>
      </div>
      {loading ? (
        <div className="space-y-1.5 animate-pulse">
          <div className="h-3 bg-muted rounded w-4/5" />
          <div className="h-3 bg-muted rounded w-3/5" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Failed to generate digest.</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Retry
            </button>
          )}
        </div>
      ) : source && (parsedEmails || parsedChats || asanaTasks) ? (
        <div className="leading-relaxed">
          <ClickableDigest
            text={summary ?? ""}
            source={source}
            parsedEmails={parsedEmails}
            parsedChats={parsedChats}
            asanaTasks={asanaTasks}
            onOpenEmail={onOpenEmail}
            onOpenChat={onOpenChat}
            onOpenTask={onOpenTask}
          />
        </div>
      ) : (
        <div className="text-[12px] text-foreground font-medium leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary ?? ""}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
