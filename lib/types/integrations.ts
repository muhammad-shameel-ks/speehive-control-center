export type ConnectionStatus = "loading" | "connected" | "disconnected" | "unconfigured" | "unauthorized";

export type Ms365User = {
  id?: string;
  name: string;
  email: string;
  photo?: string;
};

export type Ms365ConnectionState = {
  status: ConnectionStatus;
  user: Ms365User | null;
};

export type AsanaConnectionState = {
  status: ConnectionStatus;
  workspaceGid: string | null;
};

export type AsanaTask = {
  gid: string;
  name: string;
  completed: boolean;
  due_on?: string | null;
  workspace?: { gid: string };
};

export type ApiState =
  | { state: "unconfigured" }
  | { state: "unauthorized"; error?: string }
  | { state: "connected"; result: unknown; hasMore?: boolean; messageCount?: number }
  | { state: "error"; error: string };

export type McpTextResult = {
  content: Array<{ type: "text"; text: string }>;
};

export type ConfigResponse = {
  source: "env" | null;
  connected: boolean;
  connectedCount?: number;
  totalCount?: number;
  user: Ms365User | null;
  connections?: Record<string, boolean>;
};

export const DEFAULT_ASANA_WORKSPACE_GID = "1205315486828551";
export const MAIL_PAGE_SIZE = 25;
