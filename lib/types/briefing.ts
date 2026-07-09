import type { ParsedEmail, ParsedChat, ParsedEvent, ChatMessage } from "@/lib/parser";

export type BriefingTab = "mail" | "teams" | "asana";

export type SummaryType = "global" | "email" | "chat" | "tasks";

export type SummarySource = "MAIL" | "TEAMS" | "ASANA";

export const SOURCE_STYLES: Record<SummarySource, { label: string; bg: string; text: string }> = {
  MAIL:  { label: "Mail",  bg: "rgba(91,159,212,0.15)",  text: "#5B9FD4" },
  TEAMS: { label: "Teams", bg: "rgba(60,191,172,0.15)",  text: "#3CBFAC" },
  ASANA: { label: "Asana", bg: "rgba(96,200,58,0.15)",   text: "#60C83A" },
};

export const SOURCE_TO_TAB: Record<SummarySource, BriefingTab> = {
  MAIL: "mail",
  TEAMS: "teams",
  ASANA: "asana",
};

export type BriefingMessage = ChatMessage;
export { type ParsedEmail, type ParsedChat, type ParsedEvent };
