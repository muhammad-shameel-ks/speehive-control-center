"use client";

import { Notepad } from "@/components/dashboard/Notepad";
import { EmptyConnect } from "@/components/dashboard/panels/EmptyConnect";
import { EmptyState } from "@/components/dashboard/panels/EmptyState";
import { LoadingSpinner } from "@/components/dashboard/panels/LoadingSpinner";
import { InitialAvatar } from "@/components/dashboard/panels/InitialAvatar";
import { parseChats } from "@/lib/parser";
import type { ParsedChat } from "@/lib/types/briefing";
import type { DigestRef } from "@/lib/integrations/api-client";
import { ClickableDigest } from "@/components/dashboard/panels/ClickableDigest";
import { SparklesIcon } from "@/components/icons";

type ChatSummary = {
  text: string | null;
  loading: boolean;
  error: boolean;
  collapsed: boolean;
};

export function ChatColumn({
  ms365Connected,
  chatSummary,
  chatRefs,
  onToggleSummaryCollapsed,
  onOpenChat,
  onReplyForChat,
  text,
  syncing,
  refresh,
  onOpenNotes,
}: {
  ms365Connected: boolean;
  chatSummary: ChatSummary;
  chatRefs?: DigestRef[];
  onToggleSummaryCollapsed: () => void;
  onOpenChat: (chat: ParsedChat) => void;
  onReplyForChat?: (chat: ParsedChat) => void;
  text: string | null;
  syncing: boolean;
  refresh: () => Promise<unknown>;
  onOpenNotes: () => void;
}) {
  const parsedChats = parseChats(text);

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
      <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm flex-1">
        <div
          className="h-[3px] shrink-0"
          style={{ background: "linear-gradient(90deg, var(--panel-chat) 0%, #5DD4C0 100%)" }}
        />

        <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <img src="/images/microsoft-teams.svg" alt="Teams" className="h-3.5 w-3.5 shrink-0 object-contain" />
            <a
              href="https://teams.microsoft.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Teams in new tab"
              className="text-[12px] font-semibold text-foreground hover:underline underline-offset-2"
            >
              Teams Chats
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            {(chatSummary.text || chatSummary.loading) && (
              <button
                onClick={onToggleSummaryCollapsed}
                className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                AI
              </button>
            )}
            <button
              onClick={() => refresh()}
              disabled={syncing || !ms365Connected}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              {syncing ? "Syncing…" : "Sync"}
            </button>
          </div>
        </div>

        {!chatSummary.collapsed && (chatSummary.text || chatSummary.loading) && (
          <div className="px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chat Digest</span>
              <button
                onClick={onToggleSummaryCollapsed}
                className="text-muted-foreground hover:text-foreground text-[12px] leading-none"
              >
                ×
              </button>
            </div>
            {chatSummary.loading ? (
              <div className="space-y-1 animate-pulse">
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            ) : (
              <div className="leading-relaxed">
                <ClickableDigest
                  text={chatSummary.text ?? ""}
                  source="TEAMS"
                  parsedChats={parsedChats}
                  chatRefs={chatRefs}
                  onOpenChat={onOpenChat}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {!ms365Connected ? (
            <EmptyConnect
              message="Connect Microsoft 365 to see Teams chats."
              ctaLabel="Sign in with Microsoft 365"
              onCta={() => {
                window.location.href = "/api/ms365/login";
              }}
            />
          ) : syncing ? (
            <LoadingSpinner />
          ) : parsedChats.length > 0 ? (
            parsedChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onOpenChat(chat)}
                className="w-full group flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 relative cursor-pointer"
              >
                <InitialAvatar name={chat.title} rounded="md" className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0 pr-12">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-foreground truncate">{chat.title}</span>
                    <span className="text-[11px] text-muted-foreground font-mono shrink-0 tabular-nums">
                      {chat.date}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {chat.sender && <span className="font-medium text-foreground/70">{chat.sender}: </span>}
                    {chat.lastMessage}
                  </p>
                </div>

                {onReplyForChat && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReplyForChat(chat);
                    }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity absolute right-3 top-3 flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-medium shadow-sm hover:bg-primary/90"
                    title="Draft reply with AI Assistant"
                  >
                    <SparklesIcon className="h-3 w-3" />
                    <span>Reply AI</span>
                  </button>
                )}
              </div>
            ))
          ) : (
            <EmptyState message="No chats. Click Sync to fetch." />
          )}
        </div>
      </div>

      <Notepad onExpand={onOpenNotes} />
    </div>
  );
}
