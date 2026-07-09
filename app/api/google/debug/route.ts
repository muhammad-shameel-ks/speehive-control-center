import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const { data } = await getSession();
  const tokens = data.googleTokens?.["workspace"];
  if (!tokens?.accessToken) {
    return NextResponse.json({ error: "No workspace token" });
  }
  const info = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${tokens.accessToken}`
  ).then(r => r.json());
  return NextResponse.json({ tokenInfo: info, expiresAt: tokens.expiresAt });
}
