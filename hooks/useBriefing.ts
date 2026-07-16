"use client";

import { useCallback, useState } from "react";
import type { BriefingTab, ParsedEmail, ParsedChat } from "@/lib/types/briefing";
import type { AsanaTask } from "@/lib/types/integrations";

export function useBriefing() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<BriefingTab>("mail");
  const [initialEmail, setInitialEmail] = useState<ParsedEmail | null>(null);
  const [initialChat, setInitialChat] = useState<ParsedChat | null>(null);
  const [initialTask, setInitialTask] = useState<AsanaTask | null>(null);

  const openBriefing = useCallback((next: BriefingTab) => {
    setInitialEmail(null);
    setInitialChat(null);
    setInitialTask(null);
    setTab(next);
    setOpen(true);
  }, []);

  const openForEmail = useCallback((email: ParsedEmail) => {
    setInitialChat(null);
    setInitialTask(null);
    setInitialEmail(email);
    setTab("mail");
    setOpen(true);
  }, []);

  const openForChat = useCallback((chat: ParsedChat) => {
    setInitialEmail(null);
    setInitialTask(null);
    setInitialChat(chat);
    setTab("teams");
    setOpen(true);
  }, []);

  const openForTask = useCallback((task: AsanaTask) => {
    setInitialEmail(null);
    setInitialChat(null);
    setInitialEmail(null);
    setInitialTask(task);
    setTab("asana");
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
    initialTask,
    openBriefing,
    openForEmail,
    openForChat,
    openForTask,
    setTab,
    close,
  };
}
