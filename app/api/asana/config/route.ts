import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const { data } = await getSession();
  const envConfigured = Boolean(
    process.env.ASANA_CLIENT_ID && process.env.ASANA_CLIENT_SECRET,
  );
  return NextResponse.json({
    configured: envConfigured,
    source: envConfigured ? ("env" as const) : null,
    connected: Boolean(data.accessToken),
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "In-app credential storage has been removed for security. Set ASANA_CLIENT_ID and ASANA_CLIENT_SECRET as environment variables." },
    { status: 400 },
  );
}
