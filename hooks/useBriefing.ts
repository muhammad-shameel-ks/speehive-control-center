"use client";

import { useCallback, useState } from "react";
import type { BriefingTab, ParsedEmail, ParsedChat } from "@/lib/types/briefing";

export function useBriefing() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<BriefingTab>("mail");
  const [initialEmail, setInitialEmail] = useState<ParsedEmail | null>(null);
  const [initialChat, setInitialChat] = useState<ParsedChat | null>(null);

  const openBriefing = useCallback((next: BriefingTab) => {
    setTab(next);
    setOpen(true);
  }, []);

  const openForEmail = useCallback((email: ParsedEmail) => {
    setInitialChat(null);
    setInitialEmail(email);
    setTab("mail");
    setOpen(true);
  }, []);

  const openForChat = useCallback((chat: ParsedChat) => {
    setInitialEmail(null);
    setInitialChat(chat);
    setTab("teams");
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  return {
    open,
    tab,
    initialEmail,
    initialChat,
    openBriefing,
    openForEmail,
    openForChat,
    setTab,
    close,
  };
}
