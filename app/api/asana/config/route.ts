import { NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/session";

export async function GET() {
  const { data } = await getSession();
  const envConfigured = Boolean(
    process.env.ASANA_CLIENT_ID && process.env.ASANA_CLIENT_SECRET,
  );
  const sessionConfigured = Boolean(data.clientId && data.clientSecret);
  return NextResponse.json({
    configured: envConfigured || sessionConfigured,
    source: envConfigured ? ("env" as const) : sessionConfigured ? ("session" as const) : null,
    connected: Boolean(data.accessToken),
  });
}

export async function POST(req: Request) {
  if (process.env.ASANA_CLIENT_ID && process.env.ASANA_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "ASANA credentials are configured via environment variables; in-app overrides are ignored." },
      { status: 409 },
    );
  }
  const { clientId, clientSecret } = (await req.json()) as {
    clientId?: string;
    clientSecret?: string;
  };
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Both clientId and clientSecret are required." },
      { status: 400 },
    );
  }
  const { data } = await getSession();
  await updateSession({
    clientId,
    clientSecret,
    accessToken: undefined,
    refreshToken: undefined,
    expiresAt: undefined,
  });
  return NextResponse.json({ ok: true, source: "session" as const, connected: Boolean(data.accessToken) });
}
