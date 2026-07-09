import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { dynamicTool } from "ai";
import { z } from "zod";
import type { ToolSet } from "ai";
import { callAsanaTool } from "@/lib/asana-mcp";

const ASANA_MCP_URL = "https://mcp.asana.com/v2/mcp";

type McpToolSummary = {
  name: string;
  description?: string;
};

async function listMcpToolSummaries(accessToken: string): Promise<McpToolSummary[]> {
  const transport = new StreamableHTTPClientTransport(new URL(ASANA_MCP_URL), {
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
    const { tools } = await client.listTools();
    return tools.map((t) => ({ name: t.name, description: t.description }));
  } finally {
    try {
      await transport.close();
    } catch {
      // ignore close errors
    }
  }
}

export async function buildAsanaToolSet(accessToken: string): Promise<ToolSet> {
  let summaries: McpToolSummary[];
  try {
    summaries = await listMcpToolSummaries(accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      asana_error: dynamicTool({
        description: `Reports that the Asana tool list could not be loaded. Reason: ${message}`,
        inputSchema: z.object({}),
        execute: async () => ({ error: `Failed to load Asana tool list: ${message}` }),
      }),
    };
  }

  const tools: ToolSet = {};
  for (const { name, description } of summaries) {
    const safeName = name.replace(/[^A-Za-z0-9_]/g, "_");
    tools[safeName] = dynamicTool({
      description:
        description ??
        `Asana MCP tool: ${name}. Pass arguments as a JSON object matching the tool's input schema.`,
      inputSchema: z.record(z.string(), z.unknown()),
      execute: async (args) => {
        try {
          return await callAsanaTool(accessToken, name, args as Record<string, unknown>);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return { error: `Asana tool ${name} failed: ${message}` };
        }
      },
    });
  }
  return tools;
}
