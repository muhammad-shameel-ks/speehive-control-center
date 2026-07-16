"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sidebar, type DashboardTab } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { EmailPanel } from "@/components/dashboard/panels/EmailPanel";
import { ChatColumn } from "@/components/dashboard/panels/ChatColumn";
import { TasksPanel } from "@/components/dashboard/panels/TasksPanel";
import { ExecutiveBriefing } from "@/components/dashboard/ExecutiveBriefing";
import { ChatDrawer } from "@/components/dashboard/chat/ChatDrawer";
import { CreateTaskDialog } from "@/components/dashboard/tasks/CreateTaskDialog";
import { BriefingModal } from "@/components/dashboard/briefing/BriefingModal";
import { AsanaSettings } from "@/components/integration-settings/AsanaSettings";
import { Ms365Settings } from "@/components/integration-settings/Ms365Settings";
import { SparklesIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useMs365Connection, useChatsSync } from "@/hooks/useMs365Connection";
import { useInboxSync } from "@/hooks/useInboxSync";
import { useAsanaConnection } from "@/hooks/useAsanaConnection";
import { useSummaries } from "@/hooks/useSummaries";
import { useBriefing } from "@/hooks/useBriefing";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { parseEmails, parseChats } from "@/lib/parser";
import { refreshAllIntegrations } from "@/lib/integrations/refresh-all";
import { TodosModal } from "@/components/notes/TodosModal";

export function DashboardShell({}: { searchParams?: { asana?: string; asana_error?: string; ms365?: string; ms365_error?: string } }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const resolvedTheme: "dark" | "light" = mounted ? (theme as "dark" | "light") ?? "dark" : "dark";

  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chatInitialInput, setChatInitialInput] = useState("");
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    createClient().auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      setUserEmail(data.user?.email ?? undefined);
    });
  }, []);

  const ms365 = useMs365Connection();
  const asana = useAsanaConnection();
  const briefing = useBriefing();

  const isConnected = ms365.state.status === "connected";
  const inbox = useInboxSync(isConnected);
  const chats = useChatsSync(isConnected);

  const summaries = useSummaries({
    emailText: ms365.mailText,
    chatText: ms365.teamsText,
    tasks: asana.tasks,
  });

  const mutations = useTaskMutations({
    asanaCreateTask: asana.createTask,
    toggleTask: async (gid, completed) => {
      await asana.toggleTask(gid, completed);
    },
  });

  const parsedEmails = parseEmails(inbox.text);
  const parsedChats = parseChats(chats.text);

  const isRefreshingAll = isRefreshing || inbox.syncing || chats.syncing || asana.syncing;
  const canRefreshAll = isConnected || asana.state.status === "connected";

  const handleRefresh = async () => {
    if (isRefreshing || !canRefreshAll) return;
    setIsRefreshing(true);
    try {
      await refreshAllIntegrations({
        refreshOutlookMail: inbox.refresh,
        refreshTeams: chats.refresh,
        refreshAsana: asana.refresh,
      });
      summaries.refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const openReplyForEmail = (email: typeof parsedEmails[number]) => {
    setChatInitialInput(mutations.draftReplyForEmail(email));
    setIsChatOpen(true);
  };

  const openReplyForChat = (chat: typeof parsedChats[number]) => {
    setChatInitialInput(mutations.draftReplyForChat(chat));
    setIsChatOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans antialiased select-none">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((v) => !v)}
        onOpenChat={() => setIsChatOpen(true)}
      />

      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <Header
          activeTab={activeTab}
          isRefreshing={isRefreshingAll}
          canRefresh={canRefreshAll}
          onRefresh={handleRefresh}
          resolvedTheme={resolvedTheme}
          onToggleTheme={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          userEmail={userEmail}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "dashboard" && (
            <>
              <ExecutiveBriefing
                globalText={summaries.global.text}
                globalLoading={summaries.global.loading}
                globalCollapsed={summaries.global.collapsed}
                onRefresh={summaries.refreshGlobal}
                onToggleCollapsed={() => summaries.setGlobalCollapsed(!summaries.global.collapsed)}
                onOpenBriefing={(tab) => {
                  briefing.openBriefing(tab);
                }}
                onOpenEmail={briefing.openForEmail}
                onOpenChat={briefing.openForChat}
                onOpenTask={briefing.openForTask}
                parsedEmails={parsedEmails}
                parsedChats={parsedChats}
                asanaTasks={asana.tasks}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <EmailPanel
                  ms365Connected={isConnected}
                  emailSummary={summaries.email}
                  onToggleSummaryCollapsed={() => summaries.setEmailCollapsed(!summaries.email.collapsed)}
                  onOpenEmail={briefing.openForEmail}
                  text={inbox.text}
                  syncing={inbox.syncing}
                  loadingMore={inbox.loadingMore}
                  hasMore={inbox.hasMore}
                  refresh={inbox.refresh}
                  scrollRef={inbox.scrollRef}
                  sentinelRef={inbox.sentinelRef}
                />
                <ChatColumn
                  ms365Connected={isConnected}
                  chatSummary={summaries.chat}
                  onToggleSummaryCollapsed={() => summaries.setChatCollapsed(!summaries.chat.collapsed)}
                  onOpenChat={briefing.openForChat}
                  text={chats.text}
                  syncing={chats.syncing}
                  refresh={chats.refresh}
                  onOpenNotes={() => setIsNotesOpen(true)}
                />
                <TasksPanel
                  asanaStatus={asana.state.status}
                  tasks={asana.tasks}
                  syncing={asana.syncing}
                  tasksSummary={summaries.tasksSummary}
                  onToggleSummaryCollapsed={() => summaries.setTasksCollapsed(!summaries.tasksSummary.collapsed)}
                  onToggleTask={asana.toggleTask}
                  onSyncAsana={asana.refresh}
                  inlineInput={mutations.inlineInput}
                  onInlineInputChange={mutations.setInlineInput}
                  onInlineAddTask={async (e) => {
                    e.preventDefault();
                    await mutations.addInline(mutations.inlineInput);
                  }}
                  onOpenTask={briefing.openForTask}
                />
              </div>
            </>
          )}

          {activeTab === "settings" && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-4xl">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">Asana</h3>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    Configure your Asana MCP credentials and manage the connection.
                  </p>
                </div>
                <AsanaSettings />
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

      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-transform"
        >
          <SparklesIcon className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background" />
        </button>
      )}

      <ChatDrawer
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        resolvedTheme={resolvedTheme}
        initialInput={chatInitialInput}
        onInputSetUsed={() => setChatInitialInput("")}
      />

      <CreateTaskDialog
        open={mutations.createOpen}
        onOpenChange={(open) => (open ? null : mutations.closeCreate())}
        form={mutations.createForm}
        isCreating={mutations.isCreating}
        onFormChange={mutations.setCreateForm}
        onSubmit={async () => {
          const ok = await mutations.submitCreate();
          if (!ok) console.error("Failed to create task");
        }}
      />

      <BriefingModal
        open={briefing.open}
        onClose={briefing.close}
        activeTab={briefing.tab}
        onTabChange={briefing.setTab}
        emailSummary={summaries.email.text}
        emailSummaryLoading={summaries.email.loading}
        emailSummaryError={summaries.email.error}
        onRetryEmailSummary={summaries.retryEmail}
        chatSummary={summaries.chat.text}
        chatSummaryLoading={summaries.chat.loading}
        chatSummaryError={summaries.chat.error}
        onRetryChatSummary={summaries.retryChat}
        tasksSummary={summaries.tasksSummary.text}
        tasksSummaryLoading={summaries.tasksSummary.loading}
        tasksSummaryError={summaries.tasksSummary.error}
        onRetryTasksSummary={summaries.retryTasks}
        parsedEmails={parsedEmails}
        parsedChats={parsedChats}
        asanaTasks={asana.tasks}
        asanaSyncing={asana.syncing}
        onReplyEmail={(email) => {
          briefing.close();
          openReplyForEmail(email);
        }}
        onCreateTaskFromEmail={(email) => {
          briefing.close();
          mutations.openFromEmail(email);
        }}
        onReplyChat={(chat) => {
          briefing.close();
          openReplyForChat(chat);
        }}
        onToggleTask={asana.toggleTask}
        onInlineAddTask={async (e) => {
          e.preventDefault();
          await mutations.addInline(mutations.inlineInput);
        }}
        inlineTaskInput={mutations.inlineInput}
        setInlineTaskInput={mutations.setInlineInput}
        initialEmail={briefing.initialEmail}
        initialChat={briefing.initialChat}
        initialTask={briefing.initialTask}
      />

      <TodosModal
        open={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
      />
    </div>
  );
}
