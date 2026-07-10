import { NextResponse } from "next/server";
import { getAsanaServerConfig } from "@/lib/asana-server-config";
import { callAsanaTool, refreshAccessToken } from "@/lib/asana-mcp";
import { getSession, updateSession } from "@/lib/session";

const ALLOWED_ASANA_TOOLS = new Set<string>([
  "get_my_tasks",
  "get_task",
  "get_workspaces",
  "get_projects",
  "get_project_tasks",
  "create_task",
  "update_task",
  "complete_task",
  "add_project_for_task",
  "remove_project_for_task",
  "add_tag_for_task",
  "remove_tag_for_task",
]);

export async function GET() {
  const { data } = await getSession();

  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ state: "unauthorized" as const });
  }

  const REFRESH_WINDOW_MS = 60_000;
  const needsRefresh =
    !data.expiresAt || data.expiresAt - Date.now() < REFRESH_WINDOW_MS;

  let accessToken = data.accessToken;

  if (needsRefresh) {
    const config = await getAsanaServerConfig();
    if (!config) {
      return NextResponse.json({
        state: "unauthorized" as const,
        error: "Asana credentials not configured.",
      });
    }
    try {
      const refreshed = await refreshAccessToken(data.refreshToken, config);
      accessToken = refreshed.accessToken;
      await updateSession({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({
        state: "unauthorized" as const,
        error: `Token refresh failed: ${message}`,
      });
    }
  }

  try {
    const result = await callAsanaTool(accessToken, "get_my_tasks");
    return NextResponse.json({ state: "connected" as const, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ state: "error" as const, error: message });
  }
}

export async function POST(req: Request) {
  const { data } = await getSession();

  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ state: "unauthorized" as const }, { status: 401 });
  }

  const { toolName, arguments: toolArgs } = await req.json();

  if (!toolName) {
    return NextResponse.json({ error: "Missing toolName" }, { status: 400 });
  }

  if (!ALLOWED_ASANA_TOOLS.has(toolName)) {
    return NextResponse.json(
      { error: `Tool "${toolName}" is not in the allowlist.` },
      { status: 400 },
    );
  }

  const REFRESH_WINDOW_MS = 60_000;
  const needsRefresh =
    !data.expiresAt || data.expiresAt - Date.now() < REFRESH_WINDOW_MS;

  let accessToken = data.accessToken;

  if (needsRefresh) {
    const config = await getAsanaServerConfig();
    if (!config) {
      return NextResponse.json({
        state: "unauthorized" as const,
        error: "Asana credentials not configured.",
      }, { status: 401 });
    }
    try {
      const refreshed = await refreshAccessToken(data.refreshToken, config);
      accessToken = refreshed.accessToken;
      await updateSession({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({
        state: "unauthorized" as const,
        error: `Token refresh failed: ${message}`,
      }, { status: 401 });
    }
  }

  try {
    const result = await callAsanaTool(accessToken, toolName, toolArgs);
    return NextResponse.json({ state: "connected" as const, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ state: "error" as const, error: message }, { status: 500 });
  }
}
