import { NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/session";

export async function POST() {
  const { sid } = await getSession();
  await updateSession(sid, {
    ms365AccessToken: undefined,
    ms365RefreshToken: undefined,
    ms365ExpiresAt: undefined,
    ms365User: undefined,
  });
  return NextResponse.json({ ok: true });
}
