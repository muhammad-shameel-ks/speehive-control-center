"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type SummarySource, type BriefingTab, type ParsedEmail, type ParsedChat } from "@/lib/types/briefing";
import type { AsanaTask } from "@/lib/types/integrations";
import type { DigestRef, EmailDigestRef, TaskDigestRef } from "@/lib/integrations/api-client";
import { findChatById, findEmailById, findTaskByGid } from "@/lib/parser";

export function ClickableDigest({
  text,
  source,
  parsedEmails = [],
  parsedChats = [],
  asanaTasks = [],
  chatRefs,
  globalRefs,
  emailRefs,
  taskRefs,
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
  chatRefs?: DigestRef[];
  globalRefs?: (DigestRef | null)[];
  emailRefs?: EmailDigestRef[];
  taskRefs?: TaskDigestRef[];
  onOpenEmail?: (email: ParsedEmail) => void;
  onOpenChat?: (chat: ParsedChat, messageIndex?: number) => void;
  onOpenTask?: (task: AsanaTask) => void;
  onOpenTab?: (tab: BriefingTab) => void;
}) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const refs = source === "TEAMS" ? chatRefs : source === "MAIL" ? emailRefs : source === "ASANA" ? taskRefs : undefined;
  const globalRefsForSource = source === "TEAMS" ? globalRefs : undefined;

  return (
    <span className="space-y-1 block">
      {lines.map((line, i) => {
        const ref = refs?.[i] ?? null;
        const globalRef = globalRefsForSource?.[i] ?? null;
        const activeRef = ref ?? globalRef;

        const handleClick = () => {
          if (source === "TEAMS" && onOpenChat) {
            const chatRef = activeRef as DigestRef | null;
            const chat = findChatById(parsedChats, chatRef?.chatId);
            if (chat) {
              onOpenChat(chat, chatRef?.messageIndex);
              return;
            }
          }

          if (source === "MAIL" && onOpenEmail) {
            const emailRef = ref as EmailDigestRef | null;
            const email = findEmailById(parsedEmails, emailRef?.emailId);
            if (email) {
              onOpenEmail(email);
              return;
            }
          }

          if (source === "ASANA" && onOpenTask) {
            const taskRef = ref as TaskDigestRef | null;
            const task = findTaskByGid(asanaTasks, taskRef?.taskGid);
            if (task) {
              onOpenTask(task);
              return;
            }
          }

          if (onOpenTab) {
            onOpenTab(source === "MAIL" ? "mail" : source === "TEAMS" ? "teams" : "asana");
          }
        };

        return (
          <button
            key={i}
            onClick={handleClick}
            className="text-[12px] leading-relaxed text-left text-muted-foreground hover:text-foreground transition-colors cursor-pointer block w-full hover:underline decoration-primary/40 decoration-1"
            title={activeRef ? "Click to view details" : undefined}
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
