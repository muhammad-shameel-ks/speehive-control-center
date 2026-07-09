import { NextResponse, type NextRequest } from "next/server";
import { callGoogleTool, GOOGLE_PANELS } from "@/lib/google-mcp";
import { getServerGoogleConfig, refreshAccessToken } from "@/lib/google-oauth";
import { getSession, updateSession } from "@/lib/session";

type Ctx = { params: Promise<{ server: string }> };

const REFRESH_WINDOW_MS = 60_000;

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { server } = await ctx.params;

  if (!(server in GOOGLE_PANELS)) {
    return NextResponse.json(
      { error: `Unknown panel: ${server}` },
      { status: 404 },
    );
  }

  const config = getServerGoogleConfig();
  if (!config) {
    return NextResponse.json({ state: "unconfigured" });
  }

  const panel = GOOGLE_PANELS[server as keyof typeof GOOGLE_PANELS];
  const { data, sid } = await getSession();

  const serverTokens = data.googleTokens?.["workspace"];
  if (!serverTokens) {
    return NextResponse.json({ state: "unauthorized" });
  }

  let accessToken = serverTokens.accessToken;
  const needsRefresh =
    !serverTokens.expiresAt ||
    serverTokens.expiresAt - Date.now() < REFRESH_WINDOW_MS;

  if (needsRefresh) {
    if (!serverTokens.refreshToken) {
      return NextResponse.json({
        state: "unauthorized",
        error: "Token expired and no refresh token. Please reconnect.",
      });
    }
    try {
      const refreshed = await refreshAccessToken(serverTokens.refreshToken, config);
      accessToken = refreshed.accessToken;
      await updateSession(sid, {
        googleTokens: {
          ...(data.googleTokens ?? {}),
          workspace: {
            accessToken: refreshed.accessToken,
            refreshToken: serverTokens.refreshToken,
            expiresAt: refreshed.expiresAt,
            scope: refreshed.scope,
          },
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({
        state: "unauthorized",
        error: `Token refresh failed: ${message}`,
      });
    }
  }

  try {
    const result = await callGoogleTool(
      panel.tool,
      panel.buildArgs(),
      accessToken,
    );
    return NextResponse.json({ state: "connected", result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ state: "error", error: message });
  }
}
