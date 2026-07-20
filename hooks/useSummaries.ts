"use client";

import { useCallback, useEffect, useState } from "react";
import { generateUnifiedSummary } from "@/lib/integrations/api-client";
import type { DigestRef, EmailDigestRef, TaskDigestRef } from "@/lib/integrations/api-client";
import type { ConnectionStatus } from "@/lib/types/integrations";

type SummaryState = {
  text: string | null;
  loading: boolean;
  error: boolean;
  collapsed: boolean;
};

type DigestTask = { name: string; completed: boolean; gid: string };

function initialState(collapsed: boolean): SummaryState {
  return { text: null, loading: false, error: false, collapsed };
}

const MIN_CONTENT_LENGTH = 50;
const FINGERPRINT_PREFIX_LEN = 1500;

function cleanEmailText(text: string | null): string {
  if (!text) return "";
  return text.replace(/\*\*HTML:\*\*\s*\S+/g, "").trim();
}

function getFingerprint(
  emailText: string | null,
  chatText: string | null,
  tasks: DigestTask[] | null
) {
  const cleanEmail = emailText && emailText.length > MIN_CONTENT_LENGTH ? cleanEmailText(emailText).slice(0, FINGERPRINT_PREFIX_LEN) : "";
  const cleanChat = chatText && chatText.length > MIN_CONTENT_LENGTH ? chatText.slice(0, FINGERPRINT_PREFIX_LEN) : "";
  const cleanTasks = tasks && tasks.length > 0
    ? tasks.map((t) => `- ${t.name} (id:${t.gid}, ${t.completed ? "Completed" : "Pending"})`).join("\n")
    : "";
  return `${cleanEmail}|${cleanChat}|${cleanTasks}`;
}

export function useSummaries(opts: {
  emailText: string | null;
  chatText: string | null;
  tasks: DigestTask[] | null;
  ms365Status: ConnectionStatus;
  asanaStatus: ConnectionStatus;
}) {
  const { emailText, chatText, tasks, ms365Status, asanaStatus } = opts;

  const [email, setEmail] = useState<SummaryState>(initialState(true));
  const [chat, setChat] = useState<SummaryState>(initialState(true));
  const [tasksSummary, setTasksSummary] = useState<SummaryState>(initialState(true));
  const [globalText, setGlobalText] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalCollapsed, setGlobalCollapsed] = useState(false);
  const [chatRefs, setChatRefs] = useState<DigestRef[]>([]);
  const [globalRefs, setGlobalRefs] = useState<(DigestRef | null)[]>([]);
  const [emailRefs, setEmailRefs] = useState<EmailDigestRef[]>([]);
  const [taskRefs, setTaskRefs] = useState<TaskDigestRef[]>([]);

  const fetchUnifiedSummary = useCallback(async (
    emailVal: string | null,
    chatVal: string | null,
    tasksVal: DigestTask[] | null
  ) => {
    setEmail((s) => ({ ...s, loading: true, error: false }));
    setChat((s) => ({ ...s, loading: true, error: false }));
    setTasksSummary((s) => ({ ...s, loading: true, error: false }));
    setGlobalLoading(true);

    try {
      const formattedTasks = tasksVal
        ? tasksVal.map((t) => `- ${t.name} (id:${t.gid}, ${t.completed ? "Completed" : "Pending"})`).join("\n")
        : "";

      const res = await generateUnifiedSummary({
        emailContent: cleanEmailText(emailVal),
        chatContent: chatVal || "",
        tasksContent: formattedTasks,
      });

      const emailResult = res.emailSummary || "";
      const chatResult = res.chatSummary || "";
      const tasksResult = res.tasksSummary || "";
      const globalResult = res.globalDigest || "";

      setEmail((s) => ({ ...s, text: emailResult || null, loading: false }));
      setChat((s) => ({ ...s, text: chatResult || null, loading: false }));
      setTasksSummary((s) => ({ ...s, text: tasksResult || null, loading: false }));
      setGlobalText(globalResult || null);
      setChatRefs(res.chatRefs ?? []);
      setGlobalRefs(res.globalRefs ?? []);
      setEmailRefs(res.emailRefs ?? []);
      setTaskRefs(res.taskRefs ?? []);

      // Save to localStorage
      const fp = getFingerprint(emailVal, chatVal, tasksVal);
      try {
        localStorage.setItem(
          "speehive_summary_cache",
          JSON.stringify({
            fingerprint: fp,
            data: {
              emailSummary: emailResult,
              chatSummary: chatResult,
              tasksSummary: tasksResult,
              globalDigest: globalResult,
            },
          })
        );
      } catch {
        // ignore storage quota errors
      }
    } catch (err) {
      console.error("Failed to generate unified summary:", err);
      setEmail((s) => ({ ...s, loading: false, error: true }));
      setChat((s) => ({ ...s, loading: false, error: true }));
      setTasksSummary((s) => ({ ...s, loading: false, error: true }));
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for all connected services to finish loading their data
    const isWaitingForMs365 = ms365Status === "connected" && (emailText === null || chatText === null);
    const isWaitingForAsana = asanaStatus === "connected" && tasks === null;
    const isWaitingForFeeds = ms365Status === "loading" || asanaStatus === "loading" || isWaitingForMs365 || isWaitingForAsana;

    if (isWaitingForFeeds) {
      return;
    }

    const hasEmail = emailText && emailText.length > MIN_CONTENT_LENGTH;
    const hasChat = chatText && chatText.length > MIN_CONTENT_LENGTH;
    const hasTasks = tasks && tasks.length > 0;
    if (!hasEmail && !hasChat && !hasTasks) {
      return;
    }

    const fp = getFingerprint(emailText, chatText, tasks);

    // Try restoring from cache
    try {
      const cached = localStorage.getItem("speehive_summary_cache");
      if (cached) {
        const { fingerprint: cachedFp, data } = JSON.parse(cached);
        if (cachedFp === fp) {
          setTimeout(() => {
            setEmail((s) => ({ ...s, text: data.emailSummary || null, loading: false, error: false }));
            setChat((s) => ({ ...s, text: data.chatSummary || null, loading: false, error: false }));
            setTasksSummary((s) => ({ ...s, text: data.tasksSummary || null, loading: false, error: false }));
            setGlobalText(data.globalDigest || null);
            setGlobalLoading(false);
          }, 0);
          return;
        }
      }
    } catch {
      console.warn("Failed to parse summary cache from localStorage");
    }

    // Debounce API calls by 1 second
    const timer = setTimeout(() => {
      fetchUnifiedSummary(emailText, chatText, tasks);
    }, 1000);

    return () => clearTimeout(timer);
  }, [emailText, chatText, tasks, ms365Status, asanaStatus, fetchUnifiedSummary]);

  const refreshAll = useCallback(() => {
    try {
      localStorage.removeItem("speehive_summary_cache");
    } catch {}

    setEmail((s) => ({ ...s, text: null, loading: true, error: false }));
    setChat((s) => ({ ...s, text: null, loading: true, error: false }));
    setTasksSummary((s) => ({ ...s, text: null, loading: true, error: false }));
    setGlobalText(null);
    setGlobalLoading(true);

    fetchUnifiedSummary(emailText, chatText, tasks);
  }, [emailText, chatText, tasks, fetchUnifiedSummary]);

  return {
    email,
    chat,
    tasksSummary,
    global: { text: globalText, loading: globalLoading, collapsed: globalCollapsed },
    chatRefs,
    globalRefs,
    emailRefs,
    taskRefs,
    setEmailCollapsed: (v: boolean) => setEmail((s) => ({ ...s, collapsed: v })),
    setChatCollapsed: (v: boolean) => setChat((s) => ({ ...s, collapsed: v })),
    setTasksCollapsed: (v: boolean) => setTasksSummary((s) => ({ ...s, collapsed: v })),
    setGlobalCollapsed: (v: boolean) => setGlobalCollapsed(v),
    retryEmail: refreshAll,
    retryChat: refreshAll,
    retryTasks: refreshAll,
    refreshGlobal: refreshAll,
    refreshAll,
  };
}
