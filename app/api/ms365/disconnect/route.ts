import { NextResponse } from "next/server";
import { updateSession } from "@/lib/session";

export async function POST() {
  await updateSession({
    ms365AccessToken: undefined,
    ms365RefreshToken: undefined,
    ms365ExpiresAt: undefined,
    ms365User: undefined,
  });
  return NextResponse.json({ ok: true });
}
