import { NextResponse } from "next/server";
import { updateSession } from "@/lib/session";

export async function POST() {
  await updateSession({
    accessToken: undefined,
    refreshToken: undefined,
    expiresAt: undefined,
  });
  return NextResponse.json({ ok: true });
}
