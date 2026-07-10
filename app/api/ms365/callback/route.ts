import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  fetchMs365User,
  getServerMs365Config,
} from "@/lib/ms365-oauth";
import { getSession, updateSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const { data } = await getSession();

  if (error) {
    return NextResponse.redirect(
      new URL(`/?ms365_error=${encodeURIComponent(error)}`, url.origin),
    );
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  if (!data.ms365State || data.ms365State !== state) {
    return NextResponse.json({ error: "State mismatch" }, { status: 400 });
  }

  const config = getServerMs365Config();
  if (!config || !data.ms365CodeVerifier) {
    return NextResponse.json(
      { error: "Missing credentials or PKCE verifier" },
      { status: 400 },
    );
  }

  const redirectUri = `${url.origin}/api/ms365/callback`;

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      data.ms365CodeVerifier,
      redirectUri,
      config,
    );

    let ms365User = data.ms365User;
    if (!ms365User) {
      try {
        ms365User = await fetchMs365User(tokens.accessToken);
      } catch {
        ms365User = undefined;
      }
    }

    await updateSession({
      ms365AccessToken: tokens.accessToken,
      ms365RefreshToken: tokens.refreshToken,
      ms365ExpiresAt: tokens.expiresAt,
      ms365State: undefined,
      ms365CodeVerifier: undefined,
      ms365User,
    });

    return NextResponse.redirect(new URL("/?ms365=connected", url.origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/?ms365_error=${encodeURIComponent(message)}`, url.origin),
    );
  }
}
