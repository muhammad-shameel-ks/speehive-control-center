import { NextResponse } from "next/server";
import { getServerMs365Config } from "@/lib/ms365-oauth";
import { MS365_PANEL_IDS } from "@/lib/ms365-graph";
import { getSession } from "@/lib/session";

export async function GET() {
  const config = getServerMs365Config();
  const { data } = await getSession();
  const connected = Boolean(data.ms365AccessToken);
  const connections: Record<string, boolean> = {};
  for (const id of MS365_PANEL_IDS) {
    connections[id] = connected;
  }
  return NextResponse.json({
    source: config ? "env" : null,
    connected,
    connectedCount: connected ? MS365_PANEL_IDS.length : 0,
    totalCount: MS365_PANEL_IDS.length,
    user: data.ms365User ?? null,
    connections,
  });
}
