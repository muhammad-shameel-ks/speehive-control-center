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
