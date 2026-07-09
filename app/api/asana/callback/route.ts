import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/asana-mcp";
import { getSession, updateSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const { data, sid } = await getSession();

  if (error) {
    return NextResponse.redirect(
      new URL(`/?asana_error=${encodeURIComponent(error)}`, url.origin),
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 },
    );
  }

  if (!data.state || data.state !== state) {
    return NextResponse.json({ error: "State mismatch" }, { status: 400 });
  }

  const clientId = process.env.ASANA_CLIENT_ID;
  const clientSecret = process.env.ASANA_CLIENT_SECRET;

  if (!clientId || !clientSecret || !data.codeVerifier) {
    return NextResponse.json(
      { error: "Missing credentials or PKCE verifier" },
      { status: 400 },
    );
  }

  const redirectUri = `${url.origin}/api/asana/callback`;

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      data.codeVerifier,
      redirectUri,
      { clientId, clientSecret },
    );
    await updateSession(sid, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      state: undefined,
      codeVerifier: undefined,
    });
    return NextResponse.redirect(new URL("/?asana=connected", url.origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/?asana_error=${encodeURIComponent(message)}`, url.origin),
    );
  }
}
