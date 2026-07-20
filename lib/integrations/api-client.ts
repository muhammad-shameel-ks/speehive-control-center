import type { ApiState, ConfigResponse, Ms365User } from "@/lib/types/integrations";
export { extractTextContent } from "@/lib/parser";

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { cache: "no-store", ...init });
  return (await res.json()) as T;
}

export async function getMs365Config(): Promise<ConfigResponse> {
  return fetchJson<ConfigResponse>("/api/ms365/config");
}

export async function getAsanaConfig(): Promise<{ configured: boolean; connected: boolean }> {
  return fetchJson<{ configured: boolean; connected: boolean }>("/api/asana/config");
}

export async function syncOutlookMail(skip = 0): Promise<ApiState> {
  return fetchJson<ApiState>(`/api/ms365/outlook-mail?skip=${skip}`);
}

export async function syncMs365Teams(): Promise<ApiState> {
  return fetchJson<ApiState>("/api/ms365/teams-chat");
}

export async function syncAsana(): Promise<ApiState> {
  return fetchJson<ApiState>("/api/asana/tasks");
}

export type AsanaPostArgs = {
  toolName: string;
  arguments: Record<string, unknown>;
};

export async function postAsanaTool(args: AsanaPostArgs): Promise<ApiState> {
  return fetchJson<ApiState>("/api/asana/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export type SummaryType = "global" | "email" | "chat" | "tasks";

export async function generateSummary(type: SummaryType, content: string): Promise<{ summary?: string; error?: string }> {
  return fetchJson<{ summary?: string; error?: string }>("/api/ai/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, content }),
  });
}

export type DigestRef = {
  chatId: string;
  messageIndex?: number;
};

export type EmailDigestRef = {
  emailId: string;
};

export type TaskDigestRef = {
  taskGid: string;
};

export type UnifiedSummaryResponse = {
  emailSummary: string;
  chatSummary: string;
  tasksSummary: string;
  globalDigest: string;
  chatRefs?: DigestRef[];
  globalRefs?: (DigestRef | null)[];
  emailRefs?: EmailDigestRef[];
  taskRefs?: TaskDigestRef[];
  error?: string;
};

export async function generateUnifiedSummary(args: {
  emailContent: string;
  chatContent: string;
  tasksContent: string;
}): Promise<UnifiedSummaryResponse> {
  return fetchJson<UnifiedSummaryResponse>("/api/ai/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export type DisconnectResponse = { error?: string };

export async function disconnectMs365(): Promise<DisconnectResponse> {
  return fetchJson<DisconnectResponse>("/api/ms365/disconnect", { method: "POST" });
}

export type { Ms365User };
