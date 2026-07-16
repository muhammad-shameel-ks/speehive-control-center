"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type SummarySource, type BriefingTab, type ParsedEmail, type ParsedChat } from "@/lib/types/briefing";
import type { AsanaTask } from "@/lib/types/integrations";

function findBestMatch(
  source: SummarySource,
  summaryText: string,
  parsedEmails: ParsedEmail[],
  parsedChats: ParsedChat[],
  asanaTasks: AsanaTask[] | null
) {
  const query = summaryText.toLowerCase();
  const cleanQuery = query.replace(/[^\w\s]/g, " ");
  const queryWords = new Set(cleanQuery.split(/\s+/).filter(w => w.length > 2));

  if (source === "MAIL") {
    let bestEmail: ParsedEmail | undefined;
    let maxScore = 0;
    for (const email of parsedEmails) {
      let score = 0;
      const cleanSender = email.sender.toLowerCase().replace(/[^\w\s]/g, " ");
      const cleanSubject = email.subject.toLowerCase().replace(/[^\w\s]/g, " ");
      
      const senderWords = cleanSender.split(/\s+/).filter(w => w.length > 2);
      const subjectWords = cleanSubject.split(/\s+/).filter(w => w.length > 2);

      for (const w of senderWords) {
        if (queryWords.has(w)) score += 5;
      }
      for (const w of subjectWords) {
        if (queryWords.has(w)) score += 10;
      }

      if (cleanQuery.includes(cleanSubject) || cleanSubject.includes(cleanQuery)) {
        score += 30;
      }

      if (score > maxScore) {
        maxScore = score;
        bestEmail = email;
      }
    }
    if (bestEmail && maxScore > 5) {
      return { type: "email" as const, item: bestEmail };
    }
  }

  if (source === "TEAMS") {
    let bestChat: ParsedChat | undefined;
    let maxScore = 0;
    for (const chat of parsedChats) {
      let score = 0;
      const cleanTitle = chat.title.toLowerCase().replace(/[^\w\s]/g, " ");
      const cleanLastMsg = chat.lastMessage.toLowerCase().replace(/[^\w\s]/g, " ");
      const cleanSender = chat.sender.toLowerCase().replace(/[^\w\s]/g, " ");

      const titleWords = cleanTitle.split(/\s+/).filter(w => w.length > 2);
      const lastMsgWords = cleanLastMsg.split(/\s+/).filter(w => w.length > 2);
      const senderWords = cleanSender.split(/\s+/).filter(w => w.length > 2);

      for (const w of titleWords) {
        if (queryWords.has(w)) score += 8;
      }
      for (const w of lastMsgWords) {
        if (queryWords.has(w)) score += 12;
      }
      for (const w of senderWords) {
        if (queryWords.has(w)) score += 5;
      }

      if (cleanQuery.includes(cleanTitle) || cleanTitle.includes(cleanQuery)) {
        score += 25;
      }

      if (score > maxScore) {
        maxScore = score;
        bestChat = chat;
      }
    }
    if (bestChat && maxScore > 5) {
      return { type: "chat" as const, item: bestChat };
    }
  }

  if (source === "ASANA" && asanaTasks) {
    let bestTask: AsanaTask | undefined;
    let maxScore = 0;
    for (const task of asanaTasks) {
      let score = 0;
      const cleanName = task.name.toLowerCase().replace(/[^\w\s]/g, " ");
      const nameWords = cleanName.split(/\s+/).filter(w => w.length > 2);

      for (const w of nameWords) {
        if (queryWords.has(w)) score += 10;
      }

      if (cleanQuery.includes(cleanName) || cleanName.includes(cleanQuery)) {
        score += 30;
      }

      if (score > maxScore) {
        maxScore = score;
        bestTask = task;
      }
    }
    if (bestTask && maxScore > 5) {
      return { type: "task" as const, item: bestTask };
    }
  }

  return null;
}

export function ClickableDigest({
  text,
  source,
  parsedEmails = [],
  parsedChats = [],
  asanaTasks = [],
  onOpenEmail,
  onOpenChat,
  onOpenTask,
  onOpenTab,
}: {
  text: string;
  source: SummarySource;
  parsedEmails?: ParsedEmail[];
  parsedChats?: ParsedChat[];
  asanaTasks?: AsanaTask[] | null;
  onOpenEmail?: (email: ParsedEmail) => void;
  onOpenChat?: (chat: ParsedChat) => void;
  onOpenTask?: (task: AsanaTask) => void;
  onOpenTab?: (tab: BriefingTab) => void;
}) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return (
    <span className="space-y-1 block">
      {lines.map((line, i) => {
        const stripped = line.replace(/^[-*•]\s*/, "");
        const matchResult = findBestMatch(source, stripped, parsedEmails, parsedChats, asanaTasks);

        const handleClick = () => {
          if (matchResult) {
            if (matchResult.type === "email" && onOpenEmail) {
              onOpenEmail(matchResult.item);
            } else if (matchResult.type === "chat" && onOpenChat) {
              onOpenChat(matchResult.item);
            } else if (matchResult.type === "task" && onOpenTask) {
              onOpenTask(matchResult.item);
            } else if (onOpenTab) {
              onOpenTab(source === "MAIL" ? "mail" : source === "TEAMS" ? "teams" : "asana");
            }
          } else if (onOpenTab) {
            onOpenTab(source === "MAIL" ? "mail" : source === "TEAMS" ? "teams" : "asana");
          }
        };

        return (
          <button
            key={i}
            onClick={handleClick}
            className="text-[12px] leading-relaxed text-left text-muted-foreground hover:text-foreground transition-colors cursor-pointer block w-full hover:underline decoration-primary/40 decoration-1"
            title={matchResult ? "Click to view details" : undefined}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <>{children}</>,
              }}
            >
              {line}
            </ReactMarkdown>
          </button>
        );
      })}
    </span>
  );
}
