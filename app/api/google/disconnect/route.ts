import { NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/session";

export async function POST() {
  const { sid } = await getSession();
  await updateSession(sid, {
    googleTokens: undefined,
    googleUser: undefined,
    googlePending: undefined,
  });
  return NextResponse.json({ ok: true });
}
