"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SparklesIcon } from "@/components/icons";
import { SOURCE_STYLES, SOURCE_TO_TAB, type SummarySource, type BriefingTab } from "@/lib/types/briefing";

function SummaryWithBadges({
  text,
  onBadgeClick,
}: {
  text: string;
  onBadgeClick?: (tab: BriefingTab) => void;
}) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const stripped = line.replace(/^[-*•]\s*/, "");
        const match = stripped.match(/^\[(MAIL|TEAMS|ASANA)\]\s*(.*)/s);

        if (match) {
          const source = match[1] as SummarySource;
          const content = match[2].trim();
          const style = SOURCE_STYLES[source];
          const tab = SOURCE_TO_TAB[source];
          return (
            <li key={i} className="flex items-start gap-2.5">
              <button
                onClick={() => onBadgeClick?.(tab)}
                className="mt-[1px] shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-opacity hover:opacity-75 cursor-pointer"
                style={{ background: style.bg, color: style.text }}
                title={`Open ${style.label} briefing`}
              >
                {style.label} ↗
              </button>
              <span className="text-[13px] leading-snug text-foreground font-semibold">{content}</span>
            </li>
          );
        }

        return (
          <li key={i} className="text-[13px] leading-snug text-foreground font-semibold pl-0.5">
            {stripped}
          </li>
        );
      })}
    </ul>
  );
}

export function ExecutiveBriefing({
  globalText,
  globalLoading,
  globalCollapsed,
  onRefresh,
  onToggleCollapsed,
  onOpenBriefing,
}: {
  globalText: string | null;
  globalLoading: boolean;
  globalCollapsed: boolean;
  onRefresh: () => void;
  onToggleCollapsed: () => void;
  onOpenBriefing: (tab: BriefingTab) => void;
}) {
  if (!globalText && !globalLoading) return null;

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 h-11 border-b border-primary/20">
        <div className="flex items-center gap-2.5">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <span className="text-[12px] font-bold text-foreground uppercase tracking-widest">AI Briefing</span>
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={globalLoading}
            title="Refresh briefing"
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={globalLoading ? "animate-spin" : ""}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => onOpenBriefing("mail")}
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-bold hover:bg-primary/90 transition-colors"
          >
            Open Briefing
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </button>
          <button
            onClick={onToggleCollapsed}
            className="text-[11px] text-muted-foreground hover:text-foreground font-semibold transition-colors"
          >
            {globalCollapsed ? "Show" : "Hide"}
          </button>
        </div>
      </div>
      {!globalCollapsed && (
        <div className="px-4 py-4">
          {globalLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-primary/10 rounded-md w-5/6" />
              <div className="h-4 bg-primary/10 rounded-md w-4/6" />
              <div className="h-4 bg-primary/10 rounded-md w-3/6" />
            </div>
          ) : (
            <SummaryWithBadges text={globalText ?? ""} onBadgeClick={onOpenBriefing} />
          )}
        </div>
      )}
      {!globalText && globalLoading && (
        <div className="px-4 py-4 text-[12px] text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{"_Generating briefing…_"}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
