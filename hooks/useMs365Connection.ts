"use client";

import { useCallback, useEffect, useState } from "react";
import { getMs365Config, syncOutlookMail, syncMs365Teams, extractMcpTextContent } from "@/lib/integrations/api-client";
import type { Ms365ConnectionState } from "@/lib/types/integrations";
import { MAIL_PAGE_SIZE } from "@/lib/types/integrations";

const initialState: Ms365ConnectionState = { status: "loading", user: null };

export function useMs365Connection() {
  const [state, setState] = useState<Ms365ConnectionState>(initialState);
  const [mailText, setMailText] = useState<string | null>(null);
  const [teamsText, setTeamsText] = useState<string | null>(null);
  const [mailSyncing, setMailSyncing] = useState(false);
  const [teamsSyncing, setTeamsSyncing] = useState(false);

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
            if (res.state === "connected") setMailText(extractMcpTextContent(res.result));
          });
          syncMs365Teams().then((res) => {
            if (res.state === "connected") setTeamsText(extractMcpTextContent(res.result));
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
        setMailText(extractMcpTextContent(res.result));
      }
    } catch {
      setMailText("Failed to fetch Outlook mail.");
    } finally {
      setMailSyncing(false);
    }
  }, []);

  const refreshTeams = useCallback(async () => {
    setTeamsSyncing(true);
    try {
      const res = await syncMs365Teams();
      if (res.state === "connected") setTeamsText(extractMcpTextContent(res.result));
    } catch {
      setTeamsText("Failed to fetch Teams chats.");
    } finally {
      setTeamsSyncing(false);
    }
  }, []);

  return {
    state,
    mailText,
    teamsText,
    mailSyncing,
    teamsSyncing,
    refreshMail,
    refreshTeams,
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
      if (res.state === "connected") setText(extractMcpTextContent(res.result));
      else setText(null);
    } catch {
      setText("Failed to fetch Teams chats.");
    } finally {
      setSyncing(false);
    }
  }, [enabled]);

  return { text, syncing, refresh };
}
