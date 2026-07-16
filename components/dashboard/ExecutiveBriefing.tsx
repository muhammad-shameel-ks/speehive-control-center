"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SparklesIcon } from "@/components/icons";
import { SOURCE_STYLES, SOURCE_TO_TAB, type SummarySource, type BriefingTab, type ParsedEmail, type ParsedChat } from "@/lib/types/briefing";
import type { AsanaTask } from "@/lib/types/integrations";

function findBestMatch(
  source: SummarySource,
  summaryText: string,
  parsedEmails: ParsedEmail[],
  parsedChats: ParsedChat[],
  asanaTasks: AsanaTask[] | null
) {
  const query = summaryText.toLowerCase();

  if (source === "MAIL") {
    let bestEmail: ParsedEmail | undefined;
    let maxScore = 0;
    for (const email of parsedEmails) {
      let score = 0;
      const sender = email.sender.toLowerCase();
      const subject = email.subject.toLowerCase();

      if (sender && query.includes(sender)) score += 15;
      const senderWords = sender.split(/\s+/).filter(w => w.length > 2);
      for (const w of senderWords) {
        if (query.includes(w)) score += 3;
      }

      if (subject && query.includes(subject)) score += 20;
      const subjectWords = subject.split(/\s+/).filter(w => w.length > 3);
      for (const w of subjectWords) {
        if (query.includes(w)) score += 4;
      }

      if (email.raw && email.raw.toLowerCase().split(/\s+/).filter(w => w.length > 4).some(w => query.includes(w))) {
        score += 1;
      }

      if (score > maxScore) {
        maxScore = score;
        bestEmail = email;
      }
    }
    if (bestEmail && maxScore > 2) {
      return { type: "email" as const, item: bestEmail };
    }
  }

  if (source === "TEAMS") {
    let bestChat: ParsedChat | undefined;
    let maxScore = 0;
    for (const chat of parsedChats) {
      let score = 0;
      const title = chat.title.toLowerCase();
      const lastMsg = chat.lastMessage.toLowerCase();
      const sender = chat.sender.toLowerCase();

      if (title && query.includes(title)) score += 15;
      const titleWords = title.split(/\s+/).filter(w => w.length > 2);
      for (const w of titleWords) {
        if (query.includes(w)) score += 3;
      }

      if (sender && query.includes(sender)) score += 8;

      if (lastMsg && query.includes(lastMsg)) score += 20;
      const msgWords = lastMsg.split(/\s+/).filter(w => w.length > 3);
      for (const w of msgWords) {
        if (query.includes(w)) score += 4;
      }

      if (score > maxScore) {
        maxScore = score;
        bestChat = chat;
      }
    }
    if (bestChat && maxScore > 2) {
      return { type: "chat" as const, item: bestChat };
    }
  }

  if (source === "ASANA" && asanaTasks) {
    let bestTask: AsanaTask | undefined;
    let maxScore = 0;
    for (const task of asanaTasks) {
      let score = 0;
      const name = task.name.toLowerCase();

      if (name && query.includes(name)) score += 15;
      const nameWords = name.split(/\s+/).filter(w => w.length > 3);
      for (const w of nameWords) {
        if (query.includes(w)) score += 3;
      }

      if (score > maxScore) {
        maxScore = score;
        bestTask = task;
      }
    }
    if (bestTask && maxScore > 2) {
      return { type: "task" as const, item: bestTask };
    }
  }

  return null;
}

function SummaryWithBadges({
  text,
  onBadgeClick,
  onOpenEmail,
  onOpenChat,
  onOpenTask,
  parsedEmails = [],
  parsedChats = [],
  asanaTasks = [],
}: {
  text: string;
  onBadgeClick?: (tab: BriefingTab) => void;
  onOpenEmail?: (email: ParsedEmail) => void;
  onOpenChat?: (chat: ParsedChat) => void;
  onOpenTask?: (task: AsanaTask) => void;
  parsedEmails?: ParsedEmail[];
  parsedChats?: ParsedChat[];
  asanaTasks?: AsanaTask[] | null;
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

          const handleTextClick = () => {
            const matchResult = findBestMatch(source, content, parsedEmails, parsedChats, asanaTasks);
            if (matchResult) {
              if (matchResult.type === "email" && onOpenEmail) {
                onOpenEmail(matchResult.item);
              } else if (matchResult.type === "chat" && onOpenChat) {
                onOpenChat(matchResult.item);
              } else if (matchResult.type === "task" && onOpenTask) {
                onOpenTask(matchResult.item);
              } else {
                onBadgeClick?.(tab);
              }
            } else {
              onBadgeClick?.(tab);
            }
          };

          return (
            <li key={i} className="flex items-start gap-2.5">
              <button
                onClick={handleTextClick}
                className="mt-[2px] shrink-0 transition-opacity hover:opacity-75 cursor-pointer flex items-center justify-center"
                title={`Open matched ${style.label} item`}
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
                title={`Click to open this specific ${style.label} item`}
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
  onOpenEmail,
  onOpenChat,
  onOpenTask,
  parsedEmails = [],
  parsedChats = [],
  asanaTasks = [],
}: {
  globalText: string | null;
  globalLoading: boolean;
  globalCollapsed: boolean;
  onRefresh: () => void;
  onToggleCollapsed: () => void;
  onOpenBriefing: (tab: BriefingTab) => void;
  onOpenEmail?: (email: ParsedEmail) => void;
  onOpenChat?: (chat: ParsedChat) => void;
  onOpenTask?: (task: AsanaTask) => void;
  parsedEmails?: ParsedEmail[];
  parsedChats?: ParsedChat[];
  asanaTasks?: AsanaTask[] | null;
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
              onOpenEmail={onOpenEmail}
              onOpenChat={onOpenChat}
              onOpenTask={onOpenTask}
              parsedEmails={parsedEmails}
              parsedChats={parsedChats}
              asanaTasks={asanaTasks}
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
