"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GoogleSettings } from "@/components/GoogleSettings";
import { Ms365Settings } from "@/components/Ms365Settings";
import { ChatPanel } from "@/components/ChatPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { parseEmails, parseChats, parseEvents, type ParsedEmail, type ParsedChat } from "@/lib/parser";

type AsanaTask = {
  gid: string;
  name: string;
  completed: boolean;
  due_on?: string | null;
  workspace?: { gid: string };
};

type GoogleConnectionState = {
  connected: boolean;
  user: { name?: string; email: string; picture?: string } | null;
  loading: boolean;
};

type Ms365ConnectionState = {
  connected: boolean;
  user: { name: string; email: string } | null;
  loading: boolean;
};

function extractGoogleText(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const r = result as { content?: unknown };
  if (!Array.isArray(r.content)) return "";
  return r.content
    .filter((item): item is { type: "text"; text: string } =>
      typeof item === "object" && item !== null && (item as { type?: unknown }).type === "text"
    )
    .map((item) => item.text)
    .join("\n");
}

function parseAsanaTasks(result: unknown): AsanaTask[] | null {
  if (!result || typeof result !== "object") return null;
  const r = result as { content?: unknown };
  if (!Array.isArray(r.content)) return null;
  const text = r.content
    .filter((item): item is { type: "text"; text: string } =>
      typeof item === "object" && item !== null && (item as { type?: unknown }).type === "text"
    )
    .map((item) => item.text)
    .join("");
  try {
    const parsed = JSON.parse(text) as { data?: AsanaTask[] };
    return Array.isArray(parsed.data) ? parsed.data : null;
  } catch {
    return null;
  }
}

export function DashboardShell({}: { searchParams?: { asana?: string; asana_error?: string; google?: string; google_error?: string } }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const resolvedTheme = mounted ? (theme as "dark" | "light") ?? "dark" : "dark";

  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingTab, setBriefingTab] = useState<"mail" | "teams" | "asana">("mail");

  const openBriefing = (tab: "mail" | "teams" | "asana") => {
    setBriefingTab(tab);
    setBriefingOpen(true);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [chatSyncing, setChatSyncing] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [asanaSyncing, setAsanaSyncing] = useState(false);

  const [notepadText, setNotepadText] = useState("");

  const [googleState, setGoogleState] = useState<GoogleConnectionState>({ connected: false, user: null, loading: true });
  const [gmailResult, setGmailResult] = useState<string | null>(null);
  const [chatResult, setChatResult] = useState<string | null>(null);
  const [calendarResult, setCalendarResult] = useState<string | null>(null);

  const [ms365State, setMs365State] = useState<Ms365ConnectionState>({ connected: false, user: null, loading: true });
  const [ms365MailResult, setMs365MailResult] = useState<string | null>(null);
  const [ms365TeamsResult, setMs365TeamsResult] = useState<string | null>(null);
  const [ms365MailSyncing, setMs365MailSyncing] = useState(false);
  const [ms365TeamsSyncing, setMs365TeamsSyncing] = useState(false);

  const MAIL_PAGE_SIZE = 25;
  const [emailSkip, setEmailSkip] = useState(0);
  const [emailHasMore, setEmailHasMore] = useState(false);
  const [emailLoadingMore, setEmailLoadingMore] = useState(false);
  const inboxScrollRef = useRef<HTMLDivElement>(null);
  const inboxSentinelRef = useRef<HTMLDivElement>(null);

  const [asanaConnected, setAsanaConnected] = useState<boolean | null>(null);
  const [asanaTasks, setAsanaTasks] = useState<AsanaTask[] | null>(null);

  const [globalSummary, setGlobalSummary] = useState<string | null>(null);
  const [globalSummaryLoading, setGlobalSummaryLoading] = useState(false);
  const [globalSummaryCollapsed, setGlobalSummaryCollapsed] = useState(false);

  const [emailSummary, setEmailSummary] = useState<string | null>(null);
  const [emailSummaryLoading, setEmailSummaryLoading] = useState(false);
  const [emailSummaryError, setEmailSummaryError] = useState(false);
  const [emailSummaryCollapsed, setEmailSummaryCollapsed] = useState(true);

  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [chatSummaryLoading, setChatSummaryLoading] = useState(false);
  const [chatSummaryError, setChatSummaryError] = useState(false);
  const [chatSummaryCollapsed, setChatSummaryCollapsed] = useState(true);

  const [tasksSummary, setTasksSummary] = useState<string | null>(null);
  const [tasksSummaryLoading, setTasksSummaryLoading] = useState(false);
  const [tasksSummaryError, setTasksSummaryError] = useState(false);
  const [tasksSummaryCollapsed, setTasksSummaryCollapsed] = useState(true);

  const [briefingInitialEmail, setBriefingInitialEmail] = useState<ParsedEmail | null>(null);
  const [briefingInitialChat, setBriefingInitialChat] = useState<ParsedChat | null>(null);

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskName, setCreateTaskName] = useState("");
  const [createTaskDesc, setCreateTaskDesc] = useState("");
  const [createTaskDueDate, setCreateTaskDueDate] = useState("");
  const [createTaskPriority, setCreateTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [inlineTaskInput, setInlineTaskInput] = useState("");

  const [chatInitialInput, setChatInitialInput] = useState("");

  const parsedEmails = parseEmails(ms365MailResult ?? gmailResult);
  const parsedChats = parseChats(ms365TeamsResult ?? chatResult);
  const parsedEvents = parseEvents(calendarResult);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedNotes = localStorage.getItem("speehive_notepad");
    if (savedNotes) {
      setNotepadText(savedNotes);
    } else {
      const defaultNotes = "- Server IP: 10.0.4.88\n- AWS Billing Review: July 12\n- Alice Laptop Serial: C02F54G1Q05D\n- Okta SSO setup details pending";
      setNotepadText(defaultNotes);
      localStorage.setItem("speehive_notepad", defaultNotes);
    }
  }, []);

  const handleNotepadChange = (text: string) => {
    setNotepadText(text);
    localStorage.setItem("speehive_notepad", text);
  };

  async function syncGmail() {
    setGmailSyncing(true);
    try {
      const res = await fetch("/api/google/gmail", { cache: "no-store" });
      const data = await res.json();
      if (data.state === "connected") setGmailResult(extractGoogleText(data.result));
    } catch {
      setGmailResult("Failed to fetch Gmail feed.");
    } finally {
      setGmailSyncing(false);
    }
  }

  async function syncChat() {
    setChatSyncing(true);
    try {
      const res = await fetch("/api/google/chat", { cache: "no-store" });
      const data = await res.json();
      if (data.state === "connected") setChatResult(extractGoogleText(data.result));
    } catch {
      setChatResult("Failed to fetch Google Chat feed.");
    } finally {
      setChatSyncing(false);
    }
  }

  async function syncCalendar() {
    setCalendarSyncing(true);
    try {
      const res = await fetch("/api/google/calendar", { cache: "no-store" });
      const data = await res.json();
      if (data.state === "connected") setCalendarResult(extractGoogleText(data.result));
    } catch {
      setCalendarResult("Failed to fetch Calendar events.");
    } finally {
      setCalendarSyncing(false);
    }
  }

  async function syncAsana() {
    setAsanaSyncing(true);
    try {
      const res = await fetch("/api/asana/tasks", { cache: "no-store" });
      const data = await res.json();
      if (data.state === "connected") {
        setAsanaTasks(parseAsanaTasks(data.result));
        setAsanaConnected(true);
      }
    } catch {
      setAsanaTasks(null);
    } finally {
      setAsanaSyncing(false);
    }
  }

  async function syncMs365Mail() {
    setMs365MailSyncing(true);
    setEmailLoadingMore(false);
    setEmailHasMore(false);
    setEmailSkip(0);
    try {
      const res = await fetch("/api/ms365/outlook-mail?skip=0", { cache: "no-store" });
      const data = await res.json();
      if (data.state === "connected") {
        setMs365MailResult(extractGoogleText(data.result));
        setEmailSkip(MAIL_PAGE_SIZE);
        setEmailHasMore(Boolean(data.hasMore));
      }
    } catch {
      setMs365MailResult("Failed to fetch Outlook mail.");
      setEmailHasMore(false);
    } finally {
      setMs365MailSyncing(false);
    }
  }

  const loadMoreEmails = useCallback(async () => {
    if (emailLoadingMore || !emailHasMore || ms365MailSyncing) return;
    setEmailLoadingMore(true);
    try {
      const res = await fetch(`/api/ms365/outlook-mail?skip=${emailSkip}`, { cache: "no-store" });
      const data = await res.json();
      if (data.state === "connected") {
        if ((data.messageCount ?? 0) > 0) {
          const newText = extractGoogleText(data.result);
          setMs365MailResult((prev) => {
            if (!prev || prev === "Failed to fetch Outlook mail.") return newText;
            return `${prev}\n\n---\n\n${newText}`;
          });
          setEmailSkip((s) => s + MAIL_PAGE_SIZE);
        }
        setEmailHasMore(Boolean(data.hasMore));
      }
    } catch {
      // swallow — keep existing emails on transient errors
    } finally {
      setEmailLoadingMore(false);
    }
  }, [emailLoadingMore, emailHasMore, emailSkip, ms365MailSyncing]);

  useEffect(() => {
    const sentinel = inboxSentinelRef.current;
    const root = inboxScrollRef.current;
    if (!sentinel || !root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreEmails();
      },
      { root, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreEmails, emailHasMore]);

  async function syncMs365Teams() {
    setMs365TeamsSyncing(true);
    try {
      const res = await fetch("/api/ms365/teams-chat", { cache: "no-store" });
      const data = await res.json();
      if (data.state === "connected") setMs365TeamsResult(extractGoogleText(data.result));
    } catch {
      setMs365TeamsResult("Failed to fetch Teams chats.");
    } finally {
      setMs365TeamsSyncing(false);
    }
  }

  useEffect(() => {
    fetch("/api/google/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setGoogleState({ connected: data.connected, user: data.user, loading: false });
        if (data.connected) { syncGmail(); syncChat(); syncCalendar(); }
      })
      .catch(() => setGoogleState({ connected: false, user: null, loading: false }));
  }, []);

  useEffect(() => {
    fetch("/api/asana/config")
      .then((r) => r.json())
      .then((data: { connected: boolean }) => {
        if (data.connected) { setAsanaConnected(true); syncAsana(); }
        else setAsanaConnected(false);
      })
      .catch(() => setAsanaConnected(false));
  }, []);

  useEffect(() => {
    fetch("/api/ms365/config", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { connected: boolean; user?: { name: string; email: string } | null }) => {
        console.log("[ms365] config check — connected:", data.connected, "user:", data.user?.email ?? "none");
        setMs365State({ connected: data.connected, user: data.user ?? null, loading: false });
        if (data.connected) { syncMs365Mail(); syncMs365Teams(); }
        else { console.log("[ms365] NOT connected — skipping auto-sync"); }
      })
      .catch((err) => { console.error("[ms365] config fetch error:", err); setMs365State({ connected: false, user: null, loading: false }); });
  }, []);

  const toggleLocalTask = async (gid: string, currentlyCompleted: boolean) => {
    if (!asanaTasks) return;
    setAsanaTasks(asanaTasks.map((t) => t.gid === gid ? { ...t, completed: !t.completed } : t));
    try {
      await fetch("/api/asana/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName: "update_task", arguments: { task_gid: gid, completed: !currentlyCompleted } }),
      });
    } catch (err) {
      console.error("Failed to update task status in Asana:", err);
    }
  };

  async function generateSummary(type: "global" | "email" | "chat" | "tasks", content: string) {
    console.log(`[briefing] generateSummary type=${type} contentLen=${content.length}`);
    if (type === "global") setGlobalSummaryLoading(true);
    if (type === "email") { setEmailSummaryLoading(true); setEmailSummaryError(false); }
    if (type === "chat") { setChatSummaryLoading(true); setChatSummaryError(false); }
    if (type === "tasks") { setTasksSummaryLoading(true); setTasksSummaryError(false); }
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
      });
      const data = await res.json();
      console.log(`[briefing] response type=${type} status=${res.status}`, data);
      if (data.summary) {
        if (type === "global") setGlobalSummary(data.summary);
        if (type === "email") setEmailSummary(data.summary);
        if (type === "chat") setChatSummary(data.summary);
        if (type === "tasks") setTasksSummary(data.summary);
      } else {
        console.warn(`[briefing] no summary in response for type=${type}`, data);
        if (type === "email") setEmailSummaryError(true);
        if (type === "chat") setChatSummaryError(true);
        if (type === "tasks") setTasksSummaryError(true);
      }
    } catch (err) {
      console.error(`[briefing] fetch error type=${type}:`, err);
      if (type === "email") setEmailSummaryError(true);
      if (type === "chat") setChatSummaryError(true);
      if (type === "tasks") setTasksSummaryError(true);
    } finally {
      if (type === "global") setGlobalSummaryLoading(false);
      if (type === "email") setEmailSummaryLoading(false);
      if (type === "chat") setChatSummaryLoading(false);
      if (type === "tasks") setTasksSummaryLoading(false);
    }
  }

  const emailSummaryFingerprintRef = useRef<string>("");
  useEffect(() => {
    const mailText = ms365MailResult ?? gmailResult;
    console.log(`[briefing] email effect — ms365=${ms365MailResult?.length ?? "null"} gmail=${gmailResult?.length ?? "null"}`);
    if (!mailText || mailText.length <= 50) { console.log("[briefing] email effect SKIP — no/short content"); return; }
    const fingerprint = mailText.slice(0, 1500);
    if (fingerprint === emailSummaryFingerprintRef.current) { console.log("[briefing] email effect SKIP — same fingerprint"); return; }
    emailSummaryFingerprintRef.current = fingerprint;
    generateSummary("email", mailText);
  }, [ms365MailResult, gmailResult]);

  const chatSummaryFingerprintRef = useRef<string>("");
  useEffect(() => {
    const chatText = ms365TeamsResult ?? chatResult;
    console.log(`[briefing] chat effect — ms365=${ms365TeamsResult?.length ?? "null"} chat=${chatResult?.length ?? "null"}`);
    if (!chatText || chatText.length <= 50) { console.log("[briefing] chat effect SKIP — no/short content"); return; }
    const fingerprint = chatText.slice(0, 1500);
    if (fingerprint === chatSummaryFingerprintRef.current) { console.log("[briefing] chat effect SKIP — same fingerprint"); return; }
    chatSummaryFingerprintRef.current = fingerprint;
    generateSummary("chat", chatText);
  }, [ms365TeamsResult, chatResult]);

  const tasksSummaryFingerprintRef = useRef<string>("");
  useEffect(() => {
    console.log(`[briefing] tasks effect — asanaTasks=${asanaTasks?.length ?? "null"}`);
    if (asanaTasks && asanaTasks.length > 0) {
      const tasksText = asanaTasks.map(t => `- ${t.name} (${t.completed ? "Completed" : "Pending"})`).join("\n");
      if (tasksText === tasksSummaryFingerprintRef.current) { console.log("[briefing] tasks effect SKIP — same fingerprint"); return; }
      tasksSummaryFingerprintRef.current = tasksText;
      generateSummary("tasks", tasksText);
    }
  }, [asanaTasks]);

  const retryEmailSummary = () => {
    const mailText = ms365MailResult ?? gmailResult;
    if (mailText && mailText.length > 50) {
      emailSummaryFingerprintRef.current = "";
      generateSummary("email", mailText);
    }
  };

  const retryChatSummary = () => {
    const chatText = ms365TeamsResult ?? chatResult;
    if (chatText && chatText.length > 50) {
      chatSummaryFingerprintRef.current = "";
      generateSummary("chat", chatText);
    }
  };

  const retryTasksSummary = () => {
    if (asanaTasks && asanaTasks.length > 0) {
      const tasksText = asanaTasks.map(t => `- ${t.name} (${t.completed ? "Completed" : "Pending"})`).join("\n");
      tasksSummaryFingerprintRef.current = "";
      generateSummary("tasks", tasksText);
    }
  };

  const triggerGlobalSummary = useCallback(() => {
    const parts: string[] = [];
    if (emailSummary) parts.push(`[MAIL] ${emailSummary}`);
    if (chatSummary) parts.push(`[TEAMS] ${chatSummary}`);
    if (tasksSummary) parts.push(`[ASANA] ${tasksSummary}`);
    if (parts.length === 0) return;
    const combined = parts.join("\n\n");
    generateSummary("global", combined);
  }, [emailSummary, chatSummary, tasksSummary]);

  const globalSummaryFingerprintRef = useRef<string>("");
  useEffect(() => {
    if (!emailSummary && !chatSummary && !tasksSummary) return;
    const fingerprint = `${emailSummary ?? ""}|${chatSummary ?? ""}|${tasksSummary ?? ""}`;
    if (fingerprint === globalSummaryFingerprintRef.current) return;
    globalSummaryFingerprintRef.current = fingerprint;
    const timer = setTimeout(triggerGlobalSummary, 500);
    return () => clearTimeout(timer);
  }, [emailSummary, chatSummary, tasksSummary, triggerGlobalSummary]);

  const triggerCreateTaskFromEmail = (email: ParsedEmail) => {
    setCreateTaskName(`Action: ${email.subject}`);
    setCreateTaskDesc(`From: ${email.sender}\nDate: ${email.date}\n\nEmail Content:\n${email.preview}`);
    setCreateTaskDueDate("");
    setCreateTaskPriority("medium");
    setIsCreateTaskOpen(true);
  };

  const handleCreateAsanaTask = async () => {
    setIsCreatingTask(true);
    try {
      let workspaceGid = "";
      if (asanaTasks && asanaTasks.length > 0) {
        const firstWithWorkspace = asanaTasks.find(t => t.workspace?.gid);
        if (firstWithWorkspace?.workspace) workspaceGid = firstWithWorkspace.workspace.gid;
      }
      if (!workspaceGid) {
        const wsRes = await fetch("/api/asana/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolName: "get_workspaces", arguments: {} }),
        });
        const wsData = await wsRes.json();
        if (wsData.result && Array.isArray(wsData.result.data)) workspaceGid = wsData.result.data[0]?.gid;
      }
      if (!workspaceGid) workspaceGid = "1205315486828551";

      const res = await fetch("/api/asana/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: "create_task",
          arguments: {
            name: createTaskName,
            workspace: workspaceGid,
            notes: `[Priority: ${createTaskPriority.toUpperCase()}]\n\n${createTaskDesc}`,
            due_on: createTaskDueDate || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.state === "connected" || data.result) {
        setIsCreateTaskOpen(false);
        syncAsana();
      } else {
        alert("Failed to create task: " + (data.error || "unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error creating task.");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleInlineAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskName = inlineTaskInput.trim();
    if (!taskName) return;
    setInlineTaskInput("");
    try {
      let workspaceGid = "";
      if (asanaTasks && asanaTasks.length > 0) {
        const firstWithWorkspace = asanaTasks.find(t => t.workspace?.gid);
        if (firstWithWorkspace?.workspace) workspaceGid = firstWithWorkspace.workspace.gid;
      }
      if (!workspaceGid) workspaceGid = "1205315486828551";
      await fetch("/api/asana/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: "create_task",
          arguments: { name: taskName, workspace: workspaceGid, notes: "[Priority: MEDIUM]\nCreated inline from SpeeHive Control Centre" },
        }),
      });
      syncAsana();
    } catch (err) {
      console.error("Failed to add task inline:", err);
    }
  };

  const handleReplyWithAssistant = (email: ParsedEmail) => {
    setBriefingInitialEmail(null);
    setChatInitialInput(`Please draft a professional reply to this email from ${email.sender} with subject "${email.subject}":\n\n"${email.preview}"`);
    setIsChatOpen(true);
  };

  const handleChatReplyFromChatItem = (chat: ParsedChat) => {
    setBriefingInitialChat(null);
    setChatInitialInput(`Please help me draft a response to ${chat.sender} from our conversation thread:\n\n"${chat.lastMessage}"`);
    setIsChatOpen(true);
  };

  const isSyncing = ms365MailSyncing || gmailSyncing || calendarSyncing;
  const isChatSyncing = ms365TeamsSyncing || chatSyncing;
  const isConnected = googleState.connected || ms365State.connected;

  const isRefreshingAll =
    gmailSyncing || chatSyncing || calendarSyncing ||
    ms365MailSyncing || ms365TeamsSyncing ||
    asanaSyncing;
  const canRefreshAll = isConnected || asanaConnected;

  async function refreshAll() {
    if (isRefreshingAll || !canRefreshAll) return;
    const tasks: Promise<unknown>[] = [];
    if (googleState.connected) {
      tasks.push(syncGmail(), syncChat(), syncCalendar());
    }
    if (ms365State.connected) {
      tasks.push(syncMs365Mail(), syncMs365Teams());
    }
    if (asanaConnected) {
      tasks.push(syncAsana());
    }
    await Promise.all(tasks);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans antialiased select-none">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside
        className={`flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-[52px]" : "w-[220px]"
        }`}
      >
        {/* Brand */}
        <div className={`flex h-[52px] shrink-0 items-center border-b border-sidebar-border ${isSidebarCollapsed ? "justify-center px-0" : "gap-2.5 px-4"}`}>
          <SpeeHiveMark className="h-7 w-7 shrink-0" />
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-sidebar-foreground leading-tight">SpeeHive</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.08em]">Control Centre</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <SidebarNavItem
            active={activeTab === "dashboard"}
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab("dashboard")}
            icon={<GridIcon className="h-4 w-4" />}
            label="Workspace"
          />
          <SidebarNavItem
            active={activeTab === "settings"}
            collapsed={isSidebarCollapsed}
            onClick={() => setActiveTab("settings")}
            icon={<SettingsIcon className="h-4 w-4" />}
            label="Settings"
          />
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 space-y-1.5">
          <button
            onClick={() => setIsChatOpen(true)}
            className={`flex items-center gap-2 rounded-lg bg-primary/12 text-primary hover:bg-primary/20 transition-colors font-semibold text-[12px] py-2 w-full ${
              isSidebarCollapsed ? "justify-center" : "px-3"
            }`}
          >
            <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
            {!isSidebarCollapsed && "Ask Assistant"}
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="flex w-full items-center justify-center rounded-md py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            {isSidebarCollapsed ? "›" : "‹ Collapse"}
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ───────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background">

        {/* Header */}
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-5">
          <div className="flex items-center gap-3">
            <h1 className="text-[14px] font-semibold text-foreground tracking-tight">
              {activeTab === "dashboard" ? "Workspace" : "Integrations"}
            </h1>
            {activeTab === "dashboard" && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 rounded-full px-2 py-0.5 hidden lg:inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={refreshAll}
              disabled={isRefreshingAll || !canRefreshAll}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary/20"
              aria-label="Refresh all integrations"
              title="Refresh Gmail, Chat, Calendar, Teams, Outlook and Asana"
            >
              <RefreshIcon className={`h-3.5 w-3.5 ${isRefreshingAll ? "animate-spin" : ""}`} />
              {isRefreshingAll ? "Refreshing…" : "Refresh All"}
            </button>

            {currentTime && (
              <div className="text-right font-mono hidden sm:block leading-tight">
                <div className="text-[13px] font-medium text-foreground tabular-nums">
                  {currentTime.toLocaleTimeString("en-US", { hour12: false })}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
              </div>
            )}

            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>

            <div className="h-5 w-px bg-border" />

            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 text-[12px] font-bold text-primary flex items-center justify-center shrink-0">
                S
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-[13px] font-semibold text-foreground">Shameel</div>
                <div className="text-[10px] text-muted-foreground">IT Lead Manager</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {activeTab === "dashboard" && (
            <>
              {/* AI Executive Summary */}
              {(globalSummary || globalSummaryLoading || emailSummary || chatSummary || tasksSummary) && (
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 h-11 border-b border-primary/20">
                    <div className="flex items-center gap-2.5">
                      <SparklesIcon className="h-4 w-4 text-primary" />
                      <span className="text-[12px] font-bold text-foreground uppercase tracking-widest">AI Briefing</span>
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { globalSummaryFingerprintRef.current = ""; triggerGlobalSummary(); }}
                        disabled={globalSummaryLoading}
                        title="Refresh briefing"
                        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-40"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={globalSummaryLoading ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Refresh
                      </button>
                      <button
                        onClick={() => openBriefing("mail")}
                        className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-bold hover:bg-primary/90 transition-colors"
                      >
                        Open Briefing
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                      </button>
                      <button
                        onClick={() => setGlobalSummaryCollapsed(!globalSummaryCollapsed)}
                        className="text-[11px] text-muted-foreground hover:text-foreground font-semibold transition-colors"
                      >
                        {globalSummaryCollapsed ? "Show" : "Hide"}
                      </button>
                    </div>
                  </div>
                  {!globalSummaryCollapsed && (
                    <div className="px-4 py-4">
                      {globalSummaryLoading ? (
                        <div className="space-y-3 animate-pulse">
                          <div className="h-4 bg-primary/10 rounded-md w-5/6" />
                          <div className="h-4 bg-primary/10 rounded-md w-4/6" />
                          <div className="h-4 bg-primary/10 rounded-md w-3/6" />
                        </div>
                      ) : (
                        <SummaryWithBadges text={globalSummary ?? ""} onBadgeClick={openBriefing} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3-column grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

                {/* ── COLUMN 1: EMAILS & CALENDAR ─────────────────────────── */}
                <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
                  {/* Panel accent stripe — logo blue */}
                  <div className="h-[3px] shrink-0" style={{ background: "linear-gradient(90deg, var(--panel-email) 0%, #7BBFE8 100%)" }} />

                  <Tabs defaultValue="emails" className="flex flex-col h-full overflow-hidden">
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
                      <TabsList className="bg-muted/40 border border-border rounded-md p-0.5 h-7">
                        <TabsTrigger value="emails" className="text-[11px] font-semibold h-6 px-2.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground cursor-pointer rounded">
                          Inbox
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="text-[11px] font-semibold h-6 px-2.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground cursor-pointer rounded">
                          Calendar
                        </TabsTrigger>
                      </TabsList>

                      <div className="flex items-center gap-2.5">
                        {(emailSummary || emailSummaryLoading) && (
                          <button onClick={() => setEmailSummaryCollapsed(!emailSummaryCollapsed)} className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors">
                            AI
                          </button>
                        )}
                        <button
                          onClick={() => { if (ms365State.connected) syncMs365Mail(); else syncGmail(); syncCalendar(); }}
                          disabled={isSyncing || !isConnected}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          {isSyncing ? "Syncing…" : "Sync"}
                        </button>
                      </div>
                    </div>

                    {/* AI Summary strip */}
                    {!emailSummaryCollapsed && (emailSummary || emailSummaryLoading) && (
                      <div className="px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email Digest</span>
                          <button onClick={() => setEmailSummaryCollapsed(true)} className="text-muted-foreground hover:text-foreground text-[12px] leading-none">×</button>
                        </div>
                        {emailSummaryLoading ? (
                          <div className="space-y-1 animate-pulse">
                            <div className="h-3 bg-muted rounded w-full" />
                            <div className="h-3 bg-muted rounded w-5/6" />
                          </div>
                        ) : (
                          <p className="text-[12px] text-muted-foreground leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{emailSummary}</ReactMarkdown>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                      {/* EMAILS TAB */}
                      <TabsContent value="emails" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                        <div ref={inboxScrollRef} className="flex-1 overflow-y-auto">
                          {!isConnected ? (
                            <EmptyConnect
                              message="Connect Microsoft 365 or Google to see your inbox."
                              ctaLabel="Sign in with Microsoft 365"
                              onCta={() => { window.location.href = "/api/ms365/login"; }}
                            />
                          ) : parsedEmails.length > 0 ? (
                            <>
                              {ms365MailSyncing && (
                                <div className="px-4 py-2 text-center text-[11px] text-muted-foreground bg-muted/30 border-b border-border">
                                  Refreshing…
                                </div>
                              )}
                              <div className="divide-y divide-border">
                                {parsedEmails.map((email) => (
                                  <button
                                    key={email.id}
                                    onClick={() => { setBriefingInitialEmail(email); setBriefingInitialChat(null); setBriefingOpen(true); setBriefingTab("mail"); }}
                                    className={`w-full group flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 relative ${
                                      email.isUnread
                                        ? "border-l-[3px] border-l-[var(--panel-email)]"
                                        : "border-l-[3px] border-l-transparent"
                                    }`}
                                  >
                                    <InitialAvatar name={email.sender} className="mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                        <span className={`text-[13px] truncate ${email.isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                                          {email.sender}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground font-mono shrink-0 tabular-nums">{email.date}</span>
                                      </div>
                                      <p className="text-[12px] truncate">
                                        <span className={email.isUnread ? "text-foreground font-medium" : "text-muted-foreground"}>{email.subject}</span>
                                        {email.preview && (
                                          <span className="text-muted-foreground"> — {email.preview}</span>
                                        )}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                              <div ref={inboxSentinelRef} className="h-px" />
                              {emailLoadingMore && (
                                <div className="flex items-center justify-center gap-2 py-3 text-[11px] text-muted-foreground">
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-primary" />
                                  Loading more…
                                </div>
                              )}
                              {!emailLoadingMore && !emailHasMore && (
                                <div className="px-4 py-3 text-center text-[11px] text-muted-foreground">
                                  — End of inbox —
                                </div>
                              )}
                            </>
                          ) : isSyncing ? (
                            <LoadingSpinner />
                          ) : (
                            <EmptyState message="No emails. Click Sync to fetch." />
                          )}
                        </div>
                      </TabsContent>

                      {/* CALENDAR TAB */}
                      <TabsContent value="calendar" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto divide-y divide-border">
                          {calendarSyncing ? (
                            <LoadingSpinner />
                          ) : parsedEvents.length > 0 ? (
                            parsedEvents.map((evt) => (
                              <div key={evt.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                                <div className="text-[12px] font-mono font-semibold tabular-nums shrink-0 w-10 text-right" style={{ color: "var(--panel-calendar)" }}>
                                  {(evt.time || "—").slice(0, 5)}
                                </div>
                                <div className="h-3.5 w-px bg-border shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium text-foreground truncate">{evt.title}</p>
                                  {evt.date && <p className="text-[11px] text-muted-foreground">{evt.date}</p>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <EmptyState message="No events. Click Sync to fetch." />
                          )}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>

                {/* ── COLUMN 2: TEAMS/CHAT + NOTEPAD ──────────────────────── */}
                <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
                  {/* Chat panel */}
                  <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm flex-1">
                    <div className="h-[3px] shrink-0" style={{ background: "linear-gradient(90deg, var(--panel-chat) 0%, #5DD4C0 100%)" }} />

                    <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
                      <div className="flex items-center gap-2">
                        <ChatBubbleIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--panel-chat)" }} />
                        <span className="text-[12px] font-semibold text-foreground">Teams & Chat</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {(chatSummary || chatSummaryLoading) && (
                          <button onClick={() => setChatSummaryCollapsed(!chatSummaryCollapsed)} className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors">
                            AI
                          </button>
                        )}
                        <button
                          onClick={ms365State.connected ? syncMs365Teams : syncChat}
                          disabled={isChatSyncing || !isConnected}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                        >
                          {isChatSyncing ? "Syncing…" : "Sync"}
                        </button>
                      </div>
                    </div>

                    {!chatSummaryCollapsed && (chatSummary || chatSummaryLoading) && (
                      <div className="px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chat Digest</span>
                          <button onClick={() => setChatSummaryCollapsed(true)} className="text-muted-foreground hover:text-foreground text-[12px] leading-none">×</button>
                        </div>
                        {chatSummaryLoading ? (
                          <div className="space-y-1 animate-pulse">
                            <div className="h-3 bg-muted rounded w-full" />
                            <div className="h-3 bg-muted rounded w-5/6" />
                          </div>
                        ) : (
                          <p className="text-[12px] text-muted-foreground leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{chatSummary}</ReactMarkdown>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto divide-y divide-border">
                      {!isConnected ? (
                        <EmptyConnect
                          message="Connect Microsoft 365 or Google to see chats."
                          ctaLabel="Sign in with Microsoft 365"
                          onCta={() => { window.location.href = "/api/ms365/login"; }}
                        />
                      ) : isChatSyncing ? (
                        <LoadingSpinner />
                      ) : parsedChats.length > 0 ? (
                        parsedChats.map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => { setBriefingInitialChat(chat); setBriefingInitialEmail(null); setBriefingOpen(true); setBriefingTab("teams"); }}
                            className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                          >
                            <InitialAvatar name={chat.title} rounded="md" className="mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                <span className="text-[13px] font-semibold text-foreground truncate">{chat.title}</span>
                                <span className="text-[11px] text-muted-foreground font-mono shrink-0 tabular-nums">{chat.date}</span>
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

                  {/* Notepad */}
                  <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: 220, minHeight: 180 }}>
                    <div className="flex items-center gap-2 px-4 h-10 border-b border-border shrink-0">
                      <PencilIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[12px] font-semibold text-foreground">Scratchpad</span>
                    </div>
                    <textarea
                      value={notepadText}
                      onChange={(e) => handleNotepadChange(e.target.value)}
                      placeholder="IP addresses, serial numbers, quick notes…"
                      className="flex-1 w-full resize-none p-3.5 text-[12px] font-mono text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* ── COLUMN 3: TASKS ─────────────────────────────────────── */}
                <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
                  <div className="h-[3px] shrink-0" style={{ background: "linear-gradient(90deg, var(--panel-tasks) 0%, #8DE85A 100%)" }} />

                  <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                      <AsanaIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--panel-tasks)" }} />
                      <span className="text-[12px] font-semibold text-foreground">Asana Tasks</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {(tasksSummary || tasksSummaryLoading) && (
                        <button onClick={() => setTasksSummaryCollapsed(!tasksSummaryCollapsed)} className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors">
                          AI
                        </button>
                      )}
                      <button
                        onClick={syncAsana}
                        disabled={asanaSyncing || !asanaConnected}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        {asanaSyncing ? "Syncing…" : "Sync"}
                      </button>
                    </div>
                  </div>

                  {!tasksSummaryCollapsed && (tasksSummary || tasksSummaryLoading) && (
                    <div className="px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Task Digest</span>
                        <button onClick={() => setTasksSummaryCollapsed(true)} className="text-muted-foreground hover:text-foreground text-[12px] leading-none">×</button>
                      </div>
                      {tasksSummaryLoading ? (
                        <div className="space-y-1 animate-pulse">
                          <div className="h-3 bg-muted rounded w-full" />
                          <div className="h-3 bg-muted rounded w-5/6" />
                        </div>
                      ) : (
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{tasksSummary}</ReactMarkdown>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto flex flex-col">
                    {!asanaConnected ? (
                      <EmptyConnect
                        message="Connect your Asana account to see tasks."
                        ctaLabel="Sign in with Asana"
                        onCta={() => { window.location.href = "/api/asana/login"; }}
                      />
                    ) : asanaSyncing ? (
                      <LoadingSpinner />
                    ) : asanaTasks ? (
                      <div className="flex-1 overflow-y-auto">
                        <Tabs defaultValue="pending" className="flex flex-col h-full">
                          <div className="px-4 pt-3 pb-0 shrink-0">
                            <TabsList className="bg-muted/40 border border-border rounded-md p-0.5 h-7 w-full grid grid-cols-3">
                              <TabsTrigger value="pending" className="text-[11px] font-semibold h-6 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground cursor-pointer rounded">
                                Pending <span className="ml-1 text-[10px] text-muted-foreground">({asanaTasks.filter(t => !t.completed).length})</span>
                              </TabsTrigger>
                              <TabsTrigger value="completed" className="text-[11px] font-semibold h-6 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground cursor-pointer rounded">
                                Done
                              </TabsTrigger>
                              <TabsTrigger value="all" className="text-[11px] font-semibold h-6 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground cursor-pointer rounded">
                                All
                              </TabsTrigger>
                            </TabsList>
                          </div>

                          <TabsContent value="pending" className="flex-1 overflow-y-auto mt-2 px-2 space-y-0.5">
                            {asanaTasks.filter(t => !t.completed).length > 0 ? (
                              asanaTasks.filter(t => !t.completed).map((task) => (
                                <TaskRow key={task.gid} task={task} onToggle={() => toggleLocalTask(task.gid, false)} />
                              ))
                            ) : (
                              <EmptyState message="No pending tasks." />
                            )}
                          </TabsContent>

                          <TabsContent value="completed" className="flex-1 overflow-y-auto mt-2 px-2 space-y-0.5">
                            {asanaTasks.filter(t => t.completed).length > 0 ? (
                              asanaTasks.filter(t => t.completed).map((task) => (
                                <TaskRow key={task.gid} task={task} onToggle={() => toggleLocalTask(task.gid, true)} />
                              ))
                            ) : (
                              <EmptyState message="No completed tasks." />
                            )}
                          </TabsContent>

                          <TabsContent value="all" className="flex-1 overflow-y-auto mt-2 px-2 space-y-0.5">
                            {asanaTasks.map((task) => (
                              <TaskRow key={task.gid} task={task} onToggle={() => toggleLocalTask(task.gid, task.completed)} />
                            ))}
                          </TabsContent>
                        </Tabs>
                      </div>
                    ) : (
                      <EmptyState message="No tasks retrieved." />
                    )}

                    {asanaConnected && (
                      <div className="shrink-0 border-t border-border p-3">
                        <form onSubmit={handleInlineAddTask}>
                          <input
                            type="text"
                            value={inlineTaskInput}
                            onChange={(e) => setInlineTaskInput(e.target.value)}
                            placeholder="Add a task and press Enter…"
                            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </form>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-4xl">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Google Workspace</h3>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    Configure credentials to enable Gmail, Google Chat, and Calendar integration.
                  </p>
                </div>
                <GoogleSettings />
              </div>
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Microsoft 365</h3>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    Requires Entra ID app registration with Mail and Teams permissions.
                  </p>
                </div>
                <Ms365Settings />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── FLOATING ASSISTANT BUTTON ───────────────────────────────────────── */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-transform"
        >
          <SparklesIcon className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background" />
        </button>
      )}

      {/* ── CHAT DRAWER ─────────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[380px] transform flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out ${
          isChatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={() => setIsChatOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel theme={resolvedTheme} initialInput={chatInitialInput} onInputSetUsed={() => setChatInitialInput("")} />
        </div>
      </div>

      {isChatOpen && (
        <div onClick={() => setIsChatOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300" />
      )}

      {/* ── CREATE ASANA TASK DIALOG ─────────────────────────────────────────── */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-[440px] bg-card border border-border text-foreground rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-foreground">Create Asana Task</DialogTitle>
            <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
              Add this item to your Asana workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label htmlFor="taskName" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Task name</label>
              <input
                id="taskName"
                type="text"
                value={createTaskName}
                onChange={(e) => setCreateTaskName(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="taskDesc" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
              <textarea
                id="taskDesc"
                rows={4}
                value={createTaskDesc}
                onChange={(e) => setCreateTaskDesc(e.target.value)}
                className="w-full resize-none rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="taskDate" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Due date</label>
                <input
                  id="taskDate"
                  type="date"
                  value={createTaskDueDate}
                  onChange={(e) => setCreateTaskDueDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="taskPriority" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Priority</label>
                <select
                  id="taskPriority"
                  value={createTaskPriority}
                  onChange={(e) => setCreateTaskPriority(e.target.value as "high" | "medium" | "low")}
                  className="w-full rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setIsCreateTaskOpen(false)}
              className="rounded-lg border border-border bg-transparent hover:bg-muted/40 px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAsanaTask}
              disabled={isCreatingTask || !createTaskName.trim()}
              className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 px-4 py-2 text-[12px] font-semibold transition-colors flex items-center gap-1.5"
            >
              {isCreatingTask ? "Creating…" : "Create Task"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── BRIEFING MODAL ───────────────────────────────────────────────────── */}
      <BriefingModal
        open={briefingOpen}
        onClose={() => setBriefingOpen(false)}
        activeTab={briefingTab}
        onTabChange={(t) => setBriefingTab(t)}
        emailSummary={emailSummary}
        emailSummaryLoading={emailSummaryLoading}
        emailSummaryError={emailSummaryError}
        onRetryEmailSummary={retryEmailSummary}
        chatSummary={chatSummary}
        chatSummaryLoading={chatSummaryLoading}
        chatSummaryError={chatSummaryError}
        onRetryChatSummary={retryChatSummary}
        tasksSummary={tasksSummary}
        tasksSummaryLoading={tasksSummaryLoading}
        tasksSummaryError={tasksSummaryError}
        onRetryTasksSummary={retryTasksSummary}
        parsedEmails={parsedEmails}
        parsedChats={parsedChats}
        asanaTasks={asanaTasks}
        asanaSyncing={asanaSyncing}
        onReplyEmail={(email) => { setBriefingOpen(false); handleReplyWithAssistant(email); }}
        onCreateTaskFromEmail={(email) => { setBriefingOpen(false); triggerCreateTaskFromEmail(email); }}
        onReplyChat={(chat) => { setBriefingOpen(false); handleChatReplyFromChatItem(chat); }}
        onToggleTask={toggleLocalTask}
        onInlineAddTask={handleInlineAddTask}
        inlineTaskInput={inlineTaskInput}
        setInlineTaskInput={setInlineTaskInput}
        initialEmail={briefingInitialEmail}
        initialChat={briefingInitialChat}
      />

    </div>
  );
}

/* ── SUB-COMPONENTS ─────────────────────────────────────────────────────────── */

type SummarySource = "MAIL" | "TEAMS" | "ASANA";

const SOURCE_STYLES: Record<SummarySource, { label: string; bg: string; text: string }> = {
  MAIL:  { label: "Mail",  bg: "rgba(91,159,212,0.15)",  text: "#5B9FD4" },
  TEAMS: { label: "Teams", bg: "rgba(60,191,172,0.15)",  text: "#3CBFAC" },
  ASANA: { label: "Asana", bg: "rgba(96,200,58,0.15)",   text: "#60C83A" },
};

const SOURCE_TO_TAB: Record<SummarySource, "mail" | "teams" | "asana"> = {
  MAIL: "mail",
  TEAMS: "teams",
  ASANA: "asana",
};

function SummaryWithBadges({
  text,
  onBadgeClick,
}: {
  text: string;
  onBadgeClick?: (tab: "mail" | "teams" | "asana") => void;
}) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const stripped = line.replace(/^[-*•]\s*/, "");
        const match = stripped.match(/^\[(MAIL|TEAMS|ASANA)\]\s*(.*)/s);

        if (match) {
          const source = match[1] as SummarySource;
          const content = match[2].trim();
          const style = SOURCE_STYLES[source];
          const tab = SOURCE_TO_TAB[source];
          return (
            <li key={i} className="flex items-start gap-2.5">
              <button
                onClick={() => onBadgeClick?.(tab)}
                className="mt-[1px] shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-opacity hover:opacity-75 cursor-pointer"
                style={{ background: style.bg, color: style.text }}
                title={`Open ${style.label} briefing`}
              >
                {style.label} ↗
              </button>
              <span className="text-[13px] leading-snug text-foreground font-semibold">{content}</span>
            </li>
          );
        }

        return (
          <li key={i} className="text-[13px] leading-snug text-foreground font-semibold pl-0.5">
            {stripped}
          </li>
        );
      })}
    </ul>
  );
}

function SidebarNavItem({
  active, collapsed, onClick, icon, label,
}: {
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      }`}
    >
      <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

function InitialAvatar({ name, rounded = "full", className = "" }: { name: string; rounded?: "full" | "md"; className?: string }) {
  return (
    <div
      className={`h-7 w-7 flex items-center justify-center bg-muted text-[11px] font-semibold text-muted-foreground ${rounded === "full" ? "rounded-full" : "rounded-md"} ${className}`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: AsanaTask; onToggle: () => void }) {
  return (
    <div className={`group flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/40 transition-colors ${task.completed ? "opacity-55" : ""}`}>
      <button
        onClick={onToggle}
        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
          task.completed
            ? "border-[var(--panel-tasks)] bg-[var(--panel-tasks)]/15"
            : "border-border group-hover:border-primary/60"
        }`}
      >
        {task.completed && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" style={{ color: "var(--panel-tasks)" }}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-[13px] leading-snug ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {task.name}
      </span>
      {task.due_on && (
        <span className="text-[11px] font-mono text-muted-foreground shrink-0 tabular-nums">{task.due_on}</span>
      )}
    </div>
  );
}

function EmptyConnect({ message, ctaLabel, onCta }: { message: string; ctaLabel: string; onCta: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <p className="text-[12px] text-muted-foreground max-w-[200px]">{message}</p>
      <button
        onClick={onCta}
        className="rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors"
      >
        {ctaLabel}
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center py-12">
      <p className="text-[12px] text-muted-foreground">{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center py-16">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

/* ── BRIEFING MODAL ─────────────────────────────────────────────────────────── */

type BriefingModalProps = {
  open: boolean;
  onClose: () => void;
  activeTab: "mail" | "teams" | "asana";
  onTabChange: (t: "mail" | "teams" | "asana") => void;
  emailSummary: string | null;
  emailSummaryLoading: boolean;
  emailSummaryError: boolean;
  onRetryEmailSummary: () => void;
  chatSummary: string | null;
  chatSummaryLoading: boolean;
  chatSummaryError: boolean;
  onRetryChatSummary: () => void;
  tasksSummary: string | null;
  tasksSummaryLoading: boolean;
  tasksSummaryError: boolean;
  onRetryTasksSummary: () => void;
  parsedEmails: ParsedEmail[];
  parsedChats: ParsedChat[];
  asanaTasks: AsanaTask[] | null;
  asanaSyncing: boolean;
  onReplyEmail: (email: ParsedEmail) => void;
  onCreateTaskFromEmail: (email: ParsedEmail) => void;
  onReplyChat: (chat: ParsedChat) => void;
  onToggleTask: (gid: string, completed: boolean) => void;
  onInlineAddTask: (e: React.FormEvent) => void;
  inlineTaskInput: string;
  setInlineTaskInput: (v: string) => void;
  initialEmail?: ParsedEmail | null;
  initialChat?: ParsedChat | null;
};

function BriefingModal({
  open, onClose, activeTab, onTabChange,
  emailSummary, emailSummaryLoading, emailSummaryError, onRetryEmailSummary,
  chatSummary, chatSummaryLoading, chatSummaryError, onRetryChatSummary,
  tasksSummary, tasksSummaryLoading, tasksSummaryError, onRetryTasksSummary,
  parsedEmails, parsedChats, asanaTasks, asanaSyncing,
  onReplyEmail, onCreateTaskFromEmail, onReplyChat,
  onToggleTask, onInlineAddTask, inlineTaskInput, setInlineTaskInput,
  initialEmail, initialChat,
}: BriefingModalProps) {
  const [selectedEmail, setSelectedEmail] = useState<ParsedEmail | null>(initialEmail ?? null);
  const [selectedChat, setSelectedChat] = useState<ParsedChat | null>(initialChat ?? null);

  useEffect(() => { if (initialEmail) setSelectedEmail(initialEmail); }, [initialEmail]);
  useEffect(() => { if (initialChat) setSelectedChat(initialChat); }, [initialChat]);
  const [selectedTask, setSelectedTask] = useState<AsanaTask | null>(null);
  const [taskTab, setTaskTab] = useState<"pending" | "done" | "all">("pending");

  const pendingTasks = asanaTasks?.filter(t => !t.completed) ?? [];
  const doneTasks = asanaTasks?.filter(t => t.completed) ?? [];
  const taskList = taskTab === "pending" ? pendingTasks : taskTab === "done" ? doneTasks : (asanaTasks ?? []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[960px] w-full p-0 gap-0 overflow-hidden flex flex-col bg-card border-border" style={{ height: "85vh" }} showCloseButton={false}>

        {/* Modal header */}
        <div className="flex items-center justify-between gap-4 px-6 h-14 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <SparklesIcon className="h-4 w-4 text-primary" />
            <span className="text-[14px] font-bold text-foreground">Command Briefing</span>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as "mail" | "teams" | "asana")}>
              <TabsList className="bg-muted/40 border border-border rounded-lg p-0.5 h-8">
                <TabsTrigger value="mail" className="text-[12px] font-semibold h-7 px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-md cursor-pointer">
                  <span className="mr-1.5" style={{ color: "#5B9FD4" }}>●</span>Mail
                </TabsTrigger>
                <TabsTrigger value="teams" className="text-[12px] font-semibold h-7 px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-md cursor-pointer">
                  <span className="mr-1.5" style={{ color: "#3CBFAC" }}>●</span>Teams
                </TabsTrigger>
                <TabsTrigger value="asana" className="text-[12px] font-semibold h-7 px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-md cursor-pointer">
                  <span className="mr-1.5" style={{ color: "#60C83A" }}>●</span>Asana
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <DialogClose className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
              <CloseIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        {/* ── MAIL PAGE ───────────────────────────────────────────────────────── */}
        {activeTab === "mail" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* AI digest strip */}
            <BriefingDigestStrip summary={emailSummary} loading={emailSummaryLoading} error={emailSummaryError} onRetry={onRetryEmailSummary} color="#5B9FD4" />

            <div className="flex flex-1 overflow-hidden">
              {/* List */}
              <div className="w-[320px] shrink-0 border-r border-border overflow-y-auto">
                {parsedEmails.length === 0 ? (
                  <EmptyState message="No emails loaded." />
                ) : (
                  <div className="divide-y divide-border">
                    {parsedEmails.map((email) => (
                      <button
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                          selectedEmail?.id === email.id ? "bg-muted/60" : ""
                        } ${email.isUnread ? "border-l-[3px] border-l-[#5B9FD4]" : "border-l-[3px] border-l-transparent"}`}
                      >
                        <InitialAvatar name={email.sender} className="mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1 mb-0.5">
                            <span className={`text-[12px] truncate ${email.isUnread ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>{email.sender}</span>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">{email.date}</span>
                          </div>
                          <p className="text-[11px] truncate">
                            <span className={email.isUnread ? "font-medium text-foreground" : "text-muted-foreground"}>{email.subject}</span>
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedEmail ? (
                  <>
                    <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        {selectedEmail.isUnread && (
                          <span className="text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5" style={{ background: "rgba(91,159,212,0.15)", color: "#5B9FD4" }}>Unread</span>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground">{selectedEmail.date}</span>
                      </div>
                      <h3 className="text-[16px] font-bold text-foreground leading-snug mb-2">{selectedEmail.subject}</h3>
                      <div className="flex items-center gap-2">
                        <InitialAvatar name={selectedEmail.sender} />
                        <span className="text-[13px] font-semibold text-foreground">{selectedEmail.sender}</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      {selectedEmail.html ? (
                        <iframe
                          srcDoc={selectedEmail.html}
                          sandbox="allow-same-origin"
                          className="w-full h-full border-0"
                          title="Email content"
                        />
                      ) : (
                        <div className="h-full overflow-y-auto px-6 py-5">
                          <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{selectedEmail.raw}</p>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
                      {selectedEmail.url && (
                        <a
                          href={selectedEmail.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          Open in Outlook
                        </a>
                      )}
                      <button
                        onClick={() => onCreateTaskFromEmail(selectedEmail)}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                      >
                        <PlusIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        Create Task
                      </button>
                      <button
                        onClick={() => onReplyEmail(selectedEmail)}
                        className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-[12px] font-semibold transition-colors"
                      >
                        <SparklesIcon className="h-3.5 w-3.5" />
                        Draft Reply with AI
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <p className="text-[13px] font-medium text-foreground">Select an email</p>
                    <p className="text-[12px] text-muted-foreground">Click any message to read it and take action</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TEAMS PAGE ──────────────────────────────────────────────────────── */}
        {activeTab === "teams" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <BriefingDigestStrip summary={chatSummary} loading={chatSummaryLoading} error={chatSummaryError} onRetry={onRetryChatSummary} color="#3CBFAC" />

            <div className="flex flex-1 overflow-hidden">
              {/* List */}
              <div className="w-[320px] shrink-0 border-r border-border overflow-y-auto">
                {parsedChats.length === 0 ? (
                  <EmptyState message="No chats loaded." />
                ) : (
                  <div className="divide-y divide-border">
                    {parsedChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${selectedChat?.id === chat.id ? "bg-muted/60" : ""}`}
                      >
                        <InitialAvatar name={chat.title} rounded="md" className="mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-1 mb-0.5">
                            <span className="text-[12px] font-semibold text-foreground truncate">{chat.title}</span>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">{chat.date}</span>
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

              {/* Detail */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedChat ? (
                  <>
                    <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono text-muted-foreground">{selectedChat.date}</span>
                      </div>
                      <h3 className="text-[16px] font-bold text-foreground">{selectedChat.title}</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                      {(selectedChat.messages && selectedChat.messages.length > 0)
                        ? selectedChat.messages.map((msg, i) => (
                          <div key={i} className={`flex items-end gap-2 ${msg.isSent ? "flex-row-reverse" : "flex-row"}`}>
                            {!msg.isSent && (
                              <InitialAvatar name={msg.sender} rounded="md" className="shrink-0 mb-0.5" />
                            )}
                            <div className={`max-w-[72%] ${msg.isSent ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                              {!msg.isSent && (
                                <span className="text-[10px] font-semibold text-muted-foreground px-1">{msg.sender}</span>
                              )}
                              <div className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                                msg.isSent
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              }`}>
                                {msg.text}
                              </div>
                              {msg.time && (
                                <span className="text-[10px] text-muted-foreground px-1">{msg.time}</span>
                              )}
                            </div>
                          </div>
                        ))
                        : (
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                            <InitialAvatar name={selectedChat.sender || selectedChat.title} rounded="md" className="mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[12px] font-bold text-foreground mb-1.5">{selectedChat.sender || "User"}</p>
                              <p className="text-[13px] text-foreground/80 leading-relaxed">{selectedChat.lastMessage}</p>
                            </div>
                          </div>
                        )
                      }
                    </div>

                    <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
                      {selectedChat.url && (
                        <a
                          href={selectedChat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          Open in Teams
                        </a>
                      )}
                      <button
                        onClick={() => onReplyChat(selectedChat)}
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
                      <ChatBubbleIcon className="h-[18px] w-[18px] text-muted-foreground" />
                    </div>
                    <p className="text-[13px] font-medium text-foreground">Select a conversation</p>
                    <p className="text-[12px] text-muted-foreground">Click any thread to read it and draft a reply</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ASANA PAGE ──────────────────────────────────────────────────────── */}
        {activeTab === "asana" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <BriefingDigestStrip summary={tasksSummary} loading={tasksSummaryLoading} error={tasksSummaryError} onRetry={onRetryTasksSummary} color="#60C83A" />

            <div className="flex flex-1 overflow-hidden">
              {/* List */}
              <div className="w-[320px] shrink-0 border-r border-border flex flex-col overflow-hidden">
                {/* Sub-tabs */}
                <div className="px-3 pt-3 pb-2 shrink-0 border-b border-border">
                  <div className="flex gap-1">
                    {(["pending", "done", "all"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTaskTab(t); setSelectedTask(null); }}
                        className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold capitalize transition-colors ${taskTab === t ? "bg-card border border-border text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
                      >
                        {t === "pending" ? `Pending (${pendingTasks.length})` : t === "done" ? `Done (${doneTasks.length})` : `All (${asanaTasks?.length ?? 0})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {asanaSyncing ? (
                    <LoadingSpinner />
                  ) : taskList.length === 0 ? (
                    <EmptyState message={taskTab === "pending" ? "No pending tasks." : taskTab === "done" ? "No completed tasks." : "No tasks."} />
                  ) : (
                    <div className="divide-y divide-border px-1 py-1">
                      {taskList.map((task) => (
                        <button
                          key={task.gid}
                          onClick={() => setSelectedTask(task)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-muted/40 ${selectedTask?.gid === task.gid ? "bg-muted/60" : ""} ${task.completed ? "opacity-55" : ""}`}
                        >
                          <div
                            className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${task.completed ? "border-[#60C83A] bg-[#60C83A]/15" : "border-border"}`}
                            onClick={(e) => { e.stopPropagation(); onToggleTask(task.gid, task.completed); }}
                          >
                            {task.completed && (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#60C83A" strokeWidth="3.5"><path d="M20 6L9 17l-5-5"/></svg>
                            )}
                          </div>
                          <span className={`flex-1 text-[12px] leading-snug ${task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                            {task.name}
                          </span>
                          {task.due_on && (
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">{task.due_on}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline add */}
                <div className="shrink-0 border-t border-border p-3">
                  <form onSubmit={onInlineAddTask}>
                    <input
                      type="text"
                      value={inlineTaskInput}
                      onChange={(e) => setInlineTaskInput(e.target.value)}
                      placeholder="Add a task and press Enter…"
                      className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </form>
                </div>
              </div>

              {/* Detail */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedTask ? (
                  <>
                    <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 ${selectedTask.completed ? "bg-[#60C83A]/15 text-[#60C83A]" : "bg-muted text-muted-foreground"}`}
                        >
                          {selectedTask.completed ? "Completed" : "Pending"}
                        </span>
                        {selectedTask.due_on && (
                          <span className="text-[11px] font-mono text-muted-foreground">Due {selectedTask.due_on}</span>
                        )}
                      </div>
                      <h3 className="text-[16px] font-bold text-foreground leading-snug">{selectedTask.name}</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                      <div className="rounded-xl bg-muted/30 border border-border p-5">
                        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Task Details</p>
                        <dl className="space-y-2.5">
                          <div className="flex items-center gap-3">
                            <dt className="text-[12px] text-muted-foreground w-16 shrink-0">Status</dt>
                            <dd className="text-[12px] font-semibold text-foreground">{selectedTask.completed ? "Done" : "In progress"}</dd>
                          </div>
                          {selectedTask.due_on && (
                            <div className="flex items-center gap-3">
                              <dt className="text-[12px] text-muted-foreground w-16 shrink-0">Due</dt>
                              <dd className="text-[12px] font-semibold text-foreground font-mono">{selectedTask.due_on}</dd>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <dt className="text-[12px] text-muted-foreground w-16 shrink-0">ID</dt>
                            <dd className="text-[11px] text-muted-foreground font-mono">{selectedTask.gid}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
                      <button
                        onClick={() => { onToggleTask(selectedTask.gid, selectedTask.completed); setSelectedTask({ ...selectedTask, completed: !selectedTask.completed }); }}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 px-4 py-2 text-[12px] font-semibold text-foreground transition-colors"
                      >
                        {selectedTask.completed ? "Mark Pending" : "Mark Complete"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-8">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-1">
                      <AsanaIcon className="h-[18px] w-[18px] text-muted-foreground" />
                    </div>
                    <p className="text-[13px] font-medium text-foreground">Select a task</p>
                    <p className="text-[12px] text-muted-foreground">Click any task to see details and take action</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

function BriefingDigestStrip({
  summary, loading, error, onRetry, color,
}: {
  summary: string | null;
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  color: string;
}) {
  if (!summary && !loading && !error) return null;
  return (
    <div className="px-5 py-3 border-b border-border bg-muted/20 shrink-0">
      <div className="flex items-center gap-2 mb-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color }}><path d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.904L9 9l.813 5.096L15 15l-5.187.904zM19.006 5.005l-.503 3.125-3.125.503 3.125.503.503 3.125.503-3.125 3.125-.503-3.125-.503-.503-3.125z"/></svg>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>AI Digest</span>
      </div>
      {loading ? (
        <div className="space-y-1.5 animate-pulse">
          <div className="h-3 bg-muted rounded w-4/5" />
          <div className="h-3 bg-muted rounded w-3/5" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Failed to generate digest.</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Retry
            </button>
          )}
        </div>
      ) : (
        <div className="text-[12px] text-foreground font-medium leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/* ── ICONS ──────────────────────────────────────────────────────────────────── */

function SpeeHiveMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <polygon points="20,2 31,8.5 31,21.5 20,28 9,21.5 9,8.5" fill="var(--color-primary)" opacity="0.95" />
      <polygon points="31,8.5 40,14 40,25 31,30.5 22,25 22,14" fill="#5B9FD4" opacity="0.85" />
      <polygon points="9,8.5 18,14 18,25 9,30.5 0,25 0,14" fill="#3CBFAC" opacity="0.80" />
      <polygon points="20,28 31,34.5 31,40 20,40 9,40 9,34.5" fill="#60C83A" opacity="0.75" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.904L9 9l.813 5.096L15 15l-5.187.904zM19.006 5.005l-.503 3.125-3.125.503 3.125.503.503 3.125.503-3.125 3.125-.503-3.125-.503-.503-3.125z" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function ChatBubbleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function AsanaIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="7" r="3.5" />
      <circle cx="6.5" cy="16.5" r="3.5" />
      <circle cx="17.5" cy="16.5" r="3.5" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 0 0-15-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
      <path d="M21 21v-5h-5" />
    </svg>
  );
}
