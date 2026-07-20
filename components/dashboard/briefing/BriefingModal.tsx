"use client";

import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SparklesIcon, CloseIcon } from "@/components/icons";
import { BriefingMailPage } from "@/components/dashboard/briefing/BriefingMailPage";
import { BriefingTeamsPage } from "@/components/dashboard/briefing/BriefingTeamsPage";
import { BriefingAsanaPage } from "@/components/dashboard/briefing/BriefingAsanaPage";
import type { BriefingTab } from "@/lib/types/briefing";
import type { ParsedEmail, ParsedChat } from "@/lib/types/briefing";
import type { AsanaTask } from "@/lib/types/integrations";
import type { DigestRef, EmailDigestRef, TaskDigestRef } from "@/lib/integrations/api-client";

type BriefingModalProps = {
  open: boolean;
  onClose: () => void;
  activeTab: BriefingTab;
  onTabChange: (tab: BriefingTab) => void;
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
  chatRefs?: DigestRef[];
  globalRefs?: (DigestRef | null)[];
  emailRefs?: EmailDigestRef[];
  taskRefs?: TaskDigestRef[];
  onReplyEmail: (email: ParsedEmail) => void;
  onCreateTaskFromEmail: (email: ParsedEmail) => void;
  onReplyChat: (chat: ParsedChat) => void;
  onToggleTask: (gid: string, completed: boolean) => void;
  onInlineAddTask: (e: React.FormEvent) => void;
  inlineTaskInput: string;
  setInlineTaskInput: (v: string) => void;
  initialEmail?: ParsedEmail | null;
  initialChat?: ParsedChat | null;
  initialChatMessageIndex?: number | null;
  initialTask?: AsanaTask | null;
};



export function BriefingModal({
  open,
  onClose,
  activeTab,
  onTabChange,
  emailSummary,
  emailSummaryLoading,
  emailSummaryError,
  onRetryEmailSummary,
  chatSummary,
  chatSummaryLoading,
  chatSummaryError,
  onRetryChatSummary,
  tasksSummary,
  tasksSummaryLoading,
  tasksSummaryError,
  onRetryTasksSummary,
  parsedEmails,
  parsedChats,
  asanaTasks,
  asanaSyncing,
  chatRefs,
  globalRefs,
  emailRefs,
  taskRefs,
  onReplyEmail,
  onCreateTaskFromEmail,
  onReplyChat,
  onToggleTask,
  onInlineAddTask,
  inlineTaskInput,
  setInlineTaskInput,
  initialEmail,
  initialChat,
  initialChatMessageIndex,
  initialTask,
}: BriefingModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-[960px] w-full p-0 gap-0 overflow-hidden flex flex-col bg-card border-border"
        style={{ height: "85vh" }}
        showCloseButton={false}
      >
        <div className="flex items-center justify-between gap-4 px-6 h-14 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <SparklesIcon className="h-4 w-4 text-primary" />
            <span className="text-[14px] font-bold text-foreground">Command Briefing</span>
          </div>
          <div className="flex items-center gap-3">
            <Tabs
              value={activeTab}
              onValueChange={(v) => onTabChange(v as BriefingTab)}
            >
              <TabsList className="bg-muted/40 border border-border rounded-lg p-0.5 h-8">
                <TabsTrigger
                  value="mail"
                  className="text-[12px] font-semibold h-7 px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-md cursor-pointer flex items-center"
                >
                  <img src="/images/microsoft-outlook.svg" alt="Mail" className="h-3.5 w-3.5 mr-1.5 object-contain" />Mail
                </TabsTrigger>
                <TabsTrigger
                  value="teams"
                  className="text-[12px] font-semibold h-7 px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-md cursor-pointer flex items-center"
                >
                  <img src="/images/microsoft-teams.svg" alt="Teams" className="h-3.5 w-3.5 mr-1.5 object-contain" />Teams
                </TabsTrigger>
                <TabsTrigger
                  value="asana"
                  className="text-[12px] font-semibold h-7 px-4 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground rounded-md cursor-pointer flex items-center"
                >
                  <img src="/images/asana.svg" alt="Asana" className="h-3.5 w-3.5 mr-1.5 object-contain" />Asana
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <DialogClose className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
              <CloseIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        {activeTab === "mail" && (
          <BriefingMailPage
            parsedEmails={parsedEmails}
            initialEmail={initialEmail ?? null}
            summary={emailSummary}
            loading={emailSummaryLoading}
            error={emailSummaryError}
            onRetry={onRetryEmailSummary}
            emailRefs={emailRefs}
            onReplyEmail={(email) => onReplyEmail(email)}
            onCreateTaskFromEmail={(email) => onCreateTaskFromEmail(email)}
          />
        )}

        {activeTab === "teams" && (
          <BriefingTeamsPage
            parsedChats={parsedChats}
            initialChat={initialChat ?? null}
            initialChatMessageIndex={initialChatMessageIndex ?? null}
            summary={chatSummary}
            loading={chatSummaryLoading}
            error={chatSummaryError}
            onRetry={onRetryChatSummary}
            onReplyChat={(chat) => onReplyChat(chat)}
            chatRefs={chatRefs}
            globalRefs={globalRefs}
          />
        )}

        {activeTab === "asana" && (
          <BriefingAsanaPage
            asanaTasks={asanaTasks}
            initialTask={initialTask}
            syncing={asanaSyncing}
            summary={tasksSummary}
            loading={tasksSummaryLoading}
            error={tasksSummaryError}
            onRetry={onRetryTasksSummary}
            onToggleTask={onToggleTask}
            onInlineAddTask={onInlineAddTask}
            inlineTaskInput={inlineTaskInput}
            setInlineTaskInput={setInlineTaskInput}
            taskRefs={taskRefs}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
