import { NextResponse } from "next/server";
import { getServerGoogleConfig } from "@/lib/google-oauth";
import { GOOGLE_PANEL_IDS } from "@/lib/google-mcp";
import { getSession } from "@/lib/session";

export async function GET() {
  const config = getServerGoogleConfig();
  const { data } = await getSession();
  const connected = Boolean(data.googleTokens?.["workspace"]?.accessToken);
  const connections: Record<string, boolean> = {};
  for (const id of GOOGLE_PANEL_IDS) {
    connections[id] = connected;
  }
  return NextResponse.json({
    source: config ? "env" : null,
    connected,
    connectedCount: connected ? GOOGLE_PANEL_IDS.length : 0,
    totalCount: GOOGLE_PANEL_IDS.length,
    user: data.googleUser ?? null,
    connections,
  });
}
