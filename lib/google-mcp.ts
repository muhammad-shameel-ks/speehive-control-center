import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const WORKSPACE_MCP_URL = "https://workspacemcp.googleapis.com/mcp/v1";

// Single OAuth server — the unified Workspace MCP
export const GOOGLE_SERVER_IDS = ["workspace"] as const;
export type GoogleServerId = (typeof GOOGLE_SERVER_IDS)[number];

// Display panels shown as buttons in the UI
export const GOOGLE_PANEL_IDS = ["gmail", "drive", "calendar", "chat"] as const;
export type GooglePanelId = (typeof GOOGLE_PANEL_IDS)[number];

export type GooglePanel = {
  label: string;
  tool: string;
  buildArgs: () => Record<string, unknown>;
};

export const GOOGLE_PANELS: Record<GooglePanelId, GooglePanel> = {
  gmail: {
    label: "Show my recent inbox",
    tool: "search_corpus",
    buildArgs: () => ({ query: "in:inbox newer_than:7d" }),
  },
  drive: {
    label: "Show my recent files",
    tool: "search_corpus",
    buildArgs: () => ({ query: "recent files modified this week" }),
  },
  calendar: {
    label: "Show my upcoming events",
    tool: "search_corpus",
    buildArgs: () => ({ query: "upcoming calendar events" }),
  },
  chat: {
    label: "Show my recent chats",
    tool: "search_corpus",
    buildArgs: () => ({ query: "recent chat messages" }),
  },
};

export async function callGoogleTool(
  toolName: string,
  args: Record<string, unknown>,
  accessToken: string,
): Promise<unknown> {
  const transport = new StreamableHTTPClientTransport(new URL(WORKSPACE_MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
    },
  });

  const client = new Client(
    { name: "speehive-control-centre", version: "0.1.0" },
    { capabilities: {} },
  );

  try {
    await client.connect(transport);
    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  } finally {
    try {
      await transport.close();
    } catch {
      // ignore close errors
    }
  }
}
