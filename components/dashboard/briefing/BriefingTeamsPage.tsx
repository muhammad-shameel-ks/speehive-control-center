import { useEffect, useState, useRef } from "react";
import { BriefingDigestStrip } from "@/components/dashboard/briefing/BriefingDigestStrip";
import { InitialAvatar } from "@/components/dashboard/panels/InitialAvatar";
import { EmptyState } from "@/components/dashboard/panels/EmptyState";
import { SparklesIcon } from "@/components/icons";
import type { ParsedChat } from "@/lib/types/briefing";
import { formatChatTime } from "@/lib/parser";
import type { DigestRef } from "@/lib/integrations/api-client";

export function BriefingTeamsPage({
  parsedChats,
  initialChat,
  initialChatMessageIndex,
  summary,
  loading,
  error,
  onRetry,
  onReplyChat,
  chatRefs,
  globalRefs,
}: {
  parsedChats: ParsedChat[];
  initialChat: ParsedChat | null;
  initialChatMessageIndex?: number | null;
  summary: string | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onReplyChat: (chat: ParsedChat) => void;
  chatRefs?: DigestRef[];
  globalRefs?: (DigestRef | null)[];
}) {
  const [selected, setSelected] = useState<ParsedChat | null>(initialChat ?? parsedChats[0] ?? null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(initialChatMessageIndex ?? null);
  const [highlightActive, setHighlightActive] = useState(!!initialChatMessageIndex);
  const [highlightKey, setHighlightKey] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialChat) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(initialChat);
      if (initialChatMessageIndex !== undefined && initialChatMessageIndex !== null) {
        const max = (initialChat.messages?.length ?? 1) - 1;
        setHighlightedIndex(Math.min(Math.max(0, initialChatMessageIndex), max));
        setHighlightActive(true);
        setHighlightKey((prev) => prev + 1);
      } else {
        setHighlightedIndex(null);
        setHighlightActive(false);
      }
    }
  }, [initialChat, initialChatMessageIndex]);

  useEffect(() => {
    if (!highlightActive) return;
    const t = setTimeout(() => setHighlightActive(false), 3000);
    return () => clearTimeout(t);
  }, [highlightKey, highlightActive]);

  useEffect(() => {
    if (highlightedIndex !== null && selected) {
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          const element = scrollContainerRef.current?.querySelector(
            `[data-message-index="${highlightedIndex}"]`
          );
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightedIndex, selected, highlightKey]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <BriefingDigestStrip
        summary={summary}
        loading={loading}
        error={error}
        onRetry={onRetry}
        color="#3CBFAC"
        source="TEAMS"
        parsedChats={parsedChats}
        chatRefs={chatRefs}
        globalRefs={globalRefs}
        onOpenChat={(chat, msgIndex) => {
          setSelected(chat);
          if (msgIndex !== undefined) {
            setHighlightedIndex(msgIndex);
            setHighlightActive(true);
            setHighlightKey((prev) => prev + 1);
          } else {
            setHighlightedIndex(null);
            setHighlightActive(false);
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[320px] shrink-0 border-r border-border overflow-y-auto">
          {parsedChats.length === 0 ? (
            <EmptyState message="No chats loaded." />
          ) : (
            <div className="divide-y divide-border">
              {parsedChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelected(chat);
                    setHighlightedIndex(null);
                    setHighlightActive(false);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                    selected?.id === chat.id ? "bg-muted/60" : ""
                  }`}
                >
                  <InitialAvatar name={chat.title} rounded="md" className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <span className="text-[12px] font-semibold text-foreground truncate">{chat.title}</span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">
                        {chat.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {chat.sender && <span className="font-medium">{chat.sender}: </span>}
                      {chat.lastMessage}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono text-muted-foreground">{selected.date}</span>
                </div>
                <h3 className="text-[16px] font-bold text-foreground">{selected.title}</h3>
              </div>

              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
              >
                {selected.messages && selected.messages.length > 0 ? (
                  selected.messages.map((msg, i) => (
                    <div
                      key={`${msg.id}-${highlightedIndex === i && highlightActive ? highlightKey : "normal"}`}
                      data-message-id={msg.id}
                      data-message-index={i}
                      className={`flex items-end gap-2 p-1.5 rounded-xl transition-all ${
                        msg.isSent ? "flex-row-reverse" : "flex-row"
                      } ${
                        highlightedIndex === i && highlightActive
                          ? "animate-highlight-flash"
                          : ""
                      }`}
                    >
                      {!msg.isSent && (
                        <InitialAvatar name={msg.sender} rounded="md" className="shrink-0 mb-0.5" />
                      )}
                      <div
                        className={`max-w-[72%] ${
                          msg.isSent ? "items-end" : "items-start"
                        } flex flex-col gap-0.5`}
                      >
                        {!msg.isSent && (
                          <span className="text-[10px] font-semibold text-muted-foreground px-1">
                            {msg.sender}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                            msg.isSent
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                        {msg.time && (
                          <span className="text-[10px] text-muted-foreground px-1">{formatChatTime(msg.time)}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                    <InitialAvatar name={selected.sender || selected.title} rounded="md" className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[12px] font-bold text-foreground mb-1.5">
                        {selected.sender || "User"}
                      </p>
                      <p className="text-[13px] text-foreground/80 leading-relaxed">{selected.lastMessage}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                  >
                    <img src="/images/microsoft-teams.svg" alt="Teams" className="h-3.5 w-3.5 object-contain" />
                    Open in Teams
                  </a>
                )}
                <button
                  onClick={() => onReplyChat(selected)}
                  className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-[12px] font-semibold transition-colors"
                >
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Reply with AI Assistant
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1">
                <img src="/images/microsoft-teams.svg" alt="Teams" className="h-[18px] w-[18px] object-contain" />
              </div>
              <p className="text-[13px] font-medium text-foreground">Select a conversation</p>
              <p className="text-[12px] text-muted-foreground">Click any thread to read it and draft a reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
