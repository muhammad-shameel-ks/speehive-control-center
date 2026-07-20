"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SparklesIcon } from "@/components/icons";
import { SOURCE_STYLES, SOURCE_TO_TAB, type SummarySource, type BriefingTab, type ParsedChat } from "@/lib/types/briefing";
import type { DigestRef } from "@/lib/integrations/api-client";
import { findChatById } from "@/lib/parser";

function SummaryWithBadges({
  text,
  onBadgeClick,
  onOpenChat,
  parsedChats = [],
  globalRefs,
}: {
  text: string;
  onBadgeClick?: (tab: BriefingTab) => void;
  onOpenChat?: (chat: ParsedChat, messageIndex?: number) => void;
  parsedChats?: ParsedChat[];
  globalRefs?: (DigestRef | null)[];
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
          const imgPath =
            source === "MAIL"
              ? "/images/microsoft-outlook.svg"
              : source === "TEAMS"
              ? "/images/microsoft-teams.svg"
              : "/images/asana.svg";
          const ref = globalRefs?.[i] ?? null;

          const handleTextClick = () => {
            if (source === "TEAMS" && onOpenChat) {
              const chat = findChatById(parsedChats, ref?.chatId);
              if (chat) {
                onOpenChat(chat, ref?.messageIndex);
                return;
              }
            }
            onBadgeClick?.(tab);
          };

          return (
            <li key={i} className="flex items-start gap-2.5">
              <button
                onClick={handleTextClick}
                className="mt-[2px] shrink-0 transition-opacity hover:opacity-75 cursor-pointer flex items-center justify-center"
                title={`Open ${style.label} feed`}
              >
                <img
                  src={imgPath}
                  alt={style.label}
                  className="h-[18px] w-[18px] object-contain"
                />
              </button>
              <button
                onClick={handleTextClick}
                className="text-[13px] leading-snug text-foreground font-medium text-left hover:text-primary transition-colors cursor-pointer flex-1 w-full"
                title={`Click to open this ${style.label} item`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <>{children}</>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </button>
            </li>
          );
        }

        return (
          <li key={i} className="text-[13px] leading-snug text-foreground font-medium pl-0.5">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <>{children}</>,
              }}
            >
              {stripped}
            </ReactMarkdown>
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
  onOpenChat,
  parsedChats = [],
  globalRefs,
}: {
  globalText: string | null;
  globalLoading: boolean;
  globalCollapsed: boolean;
  onRefresh: () => void;
  onToggleCollapsed: () => void;
  onOpenBriefing: (tab: BriefingTab) => void;
  onOpenChat?: (chat: ParsedChat, messageIndex?: number) => void;
  parsedChats?: ParsedChat[];
  globalRefs?: (DigestRef | null)[];
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
            <SummaryWithBadges
              text={globalText ?? ""}
              onBadgeClick={onOpenBriefing}
              onOpenChat={onOpenChat}
              parsedChats={parsedChats}
              globalRefs={globalRefs}
            />
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
