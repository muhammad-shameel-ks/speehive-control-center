"use client";

import { useCallback, useEffect, useState } from "react";
import { getMs365Config, syncOutlookMail, syncMs365Teams, extractTextContent } from "@/lib/integrations/api-client";
import type { Ms365ConnectionState } from "@/lib/types/integrations";
import { MAIL_PAGE_SIZE } from "@/lib/types/integrations";

const initialState: Ms365ConnectionState = { status: "loading", user: null };

export function useMs365Connection() {
  const [state, setState] = useState<Ms365ConnectionState>(initialState);
  const [mailText, setMailText] = useState<string | null>(null);
  const [mailSyncing, setMailSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMs365Config()
      .then((data) => {
        if (cancelled) return;
        setState({
          status: data.connected ? "connected" : "disconnected",
          user: (data.user as Ms365ConnectionState["user"]) ?? null,
        });
        if (data.connected) {
          syncOutlookMail(0).then((res) => {
            if (res.state === "connected") setMailText(extractTextContent(res.result));
          });
        }
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "disconnected", user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshMail = useCallback(async () => {
    setMailSyncing(true);
    try {
      const res = await syncOutlookMail(0);
      if (res.state === "connected") {
        setMailText(extractTextContent(res.result));
      }
    } catch {
      setMailText("Failed to fetch Outlook mail.");
    } finally {
      setMailSyncing(false);
    }
  }, []);

  return {
    state,
    mailText,
    mailSyncing,
    refreshMail,
    mailPageSize: MAIL_PAGE_SIZE,
  };
}

export function useChatsSync(enabled: boolean) {
  const [text, setText] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setSyncing(true);
    try {
      const res = await syncMs365Teams();
      if (res.state === "connected") setText(extractTextContent(res.result));
      else setText(null);
    } catch {
      setText("Failed to fetch Teams chats.");
    } finally {
      setSyncing(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refresh();
    }
  }, [enabled, refresh]);

  return { text, syncing, refresh };
}
