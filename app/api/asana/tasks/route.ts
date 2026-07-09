import { NextResponse } from "next/server";
import { callAsanaTool, refreshAccessToken } from "@/lib/asana-mcp";
import { getSession, updateSession } from "@/lib/session";

export async function GET() {
  const { data, sid } = await getSession();

  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ state: "unauthorized" as const });
  }

  const REFRESH_WINDOW_MS = 60_000;
  const needsRefresh =
    !data.expiresAt || data.expiresAt - Date.now() < REFRESH_WINDOW_MS;

  let accessToken = data.accessToken;

  if (needsRefresh) {
    try {
      const refreshed = await refreshAccessToken(data.refreshToken, {
        clientId: process.env.ASANA_CLIENT_ID ?? "",
        clientSecret: process.env.ASANA_CLIENT_SECRET ?? "",
      });
      accessToken = refreshed.accessToken;
      await updateSession(sid, {
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
  const { data, sid } = await getSession();

  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ state: "unauthorized" as const }, { status: 401 });
  }

  const { toolName, arguments: toolArgs } = await req.json();

  if (!toolName) {
    return NextResponse.json({ error: "Missing toolName" }, { status: 400 });
  }

  const REFRESH_WINDOW_MS = 60_000;
  const needsRefresh =
    !data.expiresAt || data.expiresAt - Date.now() < REFRESH_WINDOW_MS;

  let accessToken = data.accessToken;

  if (needsRefresh) {
    try {
      const refreshed = await refreshAccessToken(data.refreshToken, {
        clientId: process.env.ASANA_CLIENT_ID ?? "",
        clientSecret: process.env.ASANA_CLIENT_SECRET ?? "",
      });
      accessToken = refreshed.accessToken;
      await updateSession(sid, {
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
