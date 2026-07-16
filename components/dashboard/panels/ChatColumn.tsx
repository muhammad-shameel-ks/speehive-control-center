"use client";

import { Notepad } from "@/components/dashboard/Notepad";
import { EmptyConnect } from "@/components/dashboard/panels/EmptyConnect";
import { EmptyState } from "@/components/dashboard/panels/EmptyState";
import { LoadingSpinner } from "@/components/dashboard/panels/LoadingSpinner";
import { InitialAvatar } from "@/components/dashboard/panels/InitialAvatar";
import { parseChats } from "@/lib/parser";
import type { ParsedChat } from "@/lib/types/briefing";
import { ClickableDigest } from "@/components/dashboard/panels/ClickableDigest";

type ChatSummary = {
  text: string | null;
  loading: boolean;
  error: boolean;
  collapsed: boolean;
};

export function ChatColumn({
  ms365Connected,
  chatSummary,
  onToggleSummaryCollapsed,
  onOpenChat,
  text,
  syncing,
  refresh,
}: {
  ms365Connected: boolean;
  chatSummary: ChatSummary;
  onToggleSummaryCollapsed: () => void;
  onOpenChat: (chat: ParsedChat) => void;
  text: string | null;
  syncing: boolean;
  refresh: () => Promise<unknown>;
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
            <span className="text-[12px] font-semibold text-foreground">Teams Chats</span>
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
              <button
                key={chat.id}
                onClick={() => onOpenChat(chat)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <InitialAvatar name={chat.title} rounded="md" className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
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
              </button>
            ))
          ) : (
            <EmptyState message="No chats. Click Sync to fetch." />
          )}
        </div>
      </div>

      <Notepad />
    </div>
  );
}
