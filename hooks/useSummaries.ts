"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateSummary as generateSummaryRequest, type SummaryType } from "@/lib/integrations/api-client";

type SummaryState = {
  text: string | null;
  loading: boolean;
  error: boolean;
  collapsed: boolean;
};

function initialState(collapsed: boolean): SummaryState {
  return { text: null, loading: false, error: false, collapsed };
}

const MIN_CONTENT_LENGTH = 50;
const FINGERPRINT_PREFIX_LEN = 1500;
const GLOBAL_DEBOUNCE_MS = 500;

export function useSummaries(opts: {
  emailText: string | null;
  chatText: string | null;
  tasks: { name: string; completed: boolean }[] | null;
}) {
  const { emailText, chatText, tasks } = opts;
  const hasGlobalInputs = true;
  const [email, setEmail] = useState<SummaryState>(initialState(true));
  const [chat, setChat] = useState<SummaryState>(initialState(true));
  const [tasksSummary, setTasksSummary] = useState<SummaryState>(initialState(true));
  const [globalText, setGlobalText] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalCollapsed, setGlobalCollapsed] = useState(false);

  const emailFingerprintRef = useRef<string>("");
  const chatFingerprintRef = useRef<string>("");
  const tasksFingerprintRef = useRef<string>("");
  const globalFingerprintRef = useRef<string>("");

  const run = useCallback(
    async (type: SummaryType, content: string) => {
      const setState = (mut: (s: SummaryState) => SummaryState) => {
        if (type === "email") setEmail((s) => mut(s));
        else if (type === "chat") setChat((s) => mut(s));
        else if (type === "tasks") setTasksSummary((s) => mut(s));
      };

      if (type !== "global") {
        setState((s) => ({ ...s, loading: true, error: false }));
      }
      try {
        const res = await generateSummaryRequest(type, content);
        if (res.summary) {
          if (type === "global") {
            setGlobalText(res.summary);
          } else {
            setState((s) => ({ ...s, text: res.summary!, loading: false }));
          }
        } else {
          if (type !== "global") {
            setState((s) => ({ ...s, loading: false, error: true }));
          }
        }
      } catch {
        if (type !== "global") {
          setState((s) => ({ ...s, loading: false, error: true }));
        }
      } finally {
        if (type === "global") setGlobalLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!emailText || emailText.length <= MIN_CONTENT_LENGTH) return;
    const fingerprint = emailText.slice(0, FINGERPRINT_PREFIX_LEN);
    if (fingerprint === emailFingerprintRef.current) return;
    emailFingerprintRef.current = fingerprint;
    setEmail((s) => ({ ...s, loading: true, error: false }));
    run("email", emailText);
  }, [emailText, email.text, run]);

  useEffect(() => {
    if (!chatText || chatText.length <= MIN_CONTENT_LENGTH) return;
    const fingerprint = chatText.slice(0, FINGERPRINT_PREFIX_LEN);
    if (fingerprint === chatFingerprintRef.current) return;
    chatFingerprintRef.current = fingerprint;
    setChat((s) => ({ ...s, loading: true, error: false }));
    run("chat", chatText);
  }, [chatText, chat.text, run]);

  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const tasksText = tasks.map((t) => `- ${t.name} (${t.completed ? "Completed" : "Pending"})`).join("\n");
    if (tasksText === tasksFingerprintRef.current) return;
    tasksFingerprintRef.current = tasksText;
    setTasksSummary((s) => ({ ...s, loading: true, error: false }));
    run("tasks", tasksText);
  }, [tasks, tasksSummary.text, run]);

  useEffect(() => {
    if (!hasGlobalInputs) return;

    // Wait for active feeds to finish their individual summaries before generating the global briefing
    const emailLoading = emailText && emailText.length > MIN_CONTENT_LENGTH && !email.text && !email.error;
    const chatLoading = chatText && chatText.length > MIN_CONTENT_LENGTH && !chat.text && !chat.error;
    const tasksLoading = tasks && tasks.length > 0 && !tasksSummary.text && !tasksSummary.error;
    if (emailLoading || chatLoading || tasksLoading) {
      return;
    }

    const fingerprint = `${email.text ?? ""}|${chat.text ?? ""}|${tasksSummary.text ?? ""}`;
    if (fingerprint === globalFingerprintRef.current) return;
    globalFingerprintRef.current = fingerprint;

    const parts: string[] = [];
    if (email.text) parts.push(`[MAIL] ${email.text}`);
    if (chat.text) parts.push(`[TEAMS] ${chat.text}`);
    if (tasksSummary.text) parts.push(`[ASANA] ${tasksSummary.text}`);
    
    if (parts.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGlobalLoading(false);
      return;
    }

    setGlobalLoading(true);
    const timer = setTimeout(() => run("global", parts.join("\n\n")), GLOBAL_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [
    email.text,
    chat.text,
    tasksSummary.text,
    email.error,
    chat.error,
    tasksSummary.error,
    hasGlobalInputs,
    emailText,
    chatText,
    tasks,
    run
  ]);

  const retryEmail = useCallback(() => {
    if (emailText && emailText.length > MIN_CONTENT_LENGTH) {
      emailFingerprintRef.current = "";
      setEmail((s) => ({ ...s, loading: true, error: false }));
      run("email", emailText);
    }
  }, [emailText, run]);

  const retryChat = useCallback(() => {
    if (chatText && chatText.length > MIN_CONTENT_LENGTH) {
      chatFingerprintRef.current = "";
      setChat((s) => ({ ...s, loading: true, error: false }));
      run("chat", chatText);
    }
  }, [chatText, run]);

  const retryTasks = useCallback(() => {
    if (tasks && tasks.length > 0) {
      const tasksText = tasks.map((t) => `- ${t.name} (${t.completed ? "Completed" : "Pending"})`).join("\n");
      tasksFingerprintRef.current = "";
      setTasksSummary((s) => ({ ...s, loading: true, error: false }));
      run("tasks", tasksText);
    }
  }, [tasks, run]);

  const refreshGlobal = useCallback(() => {
    globalFingerprintRef.current = "";
    const parts: string[] = [];
    if (email.text) parts.push(`[MAIL] ${email.text}`);
    if (chat.text) parts.push(`[TEAMS] ${chat.text}`);
    if (tasksSummary.text) parts.push(`[ASANA] ${tasksSummary.text}`);
    if (parts.length === 0) return;
    setGlobalLoading(true);
    run("global", parts.join("\n\n"));
  }, [email.text, chat.text, tasksSummary.text, run]);

  const refreshAll = useCallback(() => {
    emailFingerprintRef.current = "";
    chatFingerprintRef.current = "";
    tasksFingerprintRef.current = "";
    globalFingerprintRef.current = "";

    setGlobalText(null);
    setGlobalLoading(true);

    setEmail({ text: null, loading: true, error: false, collapsed: email.collapsed });
    setChat({ text: null, loading: true, error: false, collapsed: chat.collapsed });
    setTasksSummary({ text: null, loading: true, error: false, collapsed: tasksSummary.collapsed });
  }, [email.collapsed, chat.collapsed, tasksSummary.collapsed]);

  return {
    email,
    chat,
    tasksSummary,
    global: { text: globalText, loading: globalLoading, collapsed: globalCollapsed },
    setEmailCollapsed: (v: boolean) => setEmail((s) => ({ ...s, collapsed: v })),
    setChatCollapsed: (v: boolean) => setChat((s) => ({ ...s, collapsed: v })),
    setTasksCollapsed: (v: boolean) => setTasksSummary((s) => ({ ...s, collapsed: v })),
    setGlobalCollapsed: (v: boolean) => setGlobalCollapsed(v),
    retryEmail,
    retryChat,
    retryTasks,
    refreshGlobal,
    refreshAll,
  };
}
