"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { syncOutlookMail, extractMcpTextContent } from "@/lib/integrations/api-client";
import type { ApiState } from "@/lib/types/integrations";
import { MAIL_PAGE_SIZE } from "@/lib/types/integrations";

export function useInboxSync(enabled: boolean) {
  const [text, setText] = useState<string | null>(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setSyncing(true);
    setLoadingMore(false);
    setHasMore(false);
    setSkip(0);
    try {
      const res: ApiState = await syncOutlookMail(0);
      if (res.state === "connected") {
        setText(extractMcpTextContent(res.result));
        setSkip(MAIL_PAGE_SIZE);
        setHasMore(Boolean(res.hasMore));
      } else {
        setText("Failed to fetch Outlook mail.");
        setHasMore(false);
      }
    } catch {
      setText("Failed to fetch Outlook mail.");
      setHasMore(false);
    } finally {
      setSyncing(false);
    }
  }, [enabled]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || syncing) return;
    setLoadingMore(true);
    try {
      const res: ApiState = await syncOutlookMail(skip);
      if (res.state === "connected") {
        if ((res.messageCount ?? 0) > 0) {
          const newText = extractMcpTextContent(res.result);
          setText((prev) => {
            if (!prev || prev === "Failed to fetch Outlook mail.") return newText;
            return `${prev}\n\n---\n\n${newText}`;
          });
          setSkip((s) => s + MAIL_PAGE_SIZE);
        }
        setHasMore(Boolean(res.hasMore));
      }
    } catch {
      // swallow — keep existing emails on transient errors
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, syncing, skip]);

  useEffect(() => {
    if (enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refresh();
    }
  }, [enabled, refresh]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return {
    text,
    syncing,
    loadingMore,
    hasMore,
    refresh,
    scrollRef,
    sentinelRef,
  };
}
