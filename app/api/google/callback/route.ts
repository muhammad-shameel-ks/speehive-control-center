import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getServerGoogleConfig,
  getServerRedirectUri,
} from "@/lib/google-oauth";
import { fetchGoogleUserInfo } from "@/lib/google-userinfo";
import { getSession, updateSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const { data, sid } = await getSession();

  if (error) {
    return NextResponse.redirect(
      new URL(`/?google_error=${encodeURIComponent(error)}`, url.origin),
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 },
    );
  }

  const pending = data.googlePending;
  if (!pending || pending.state !== state) {
    return NextResponse.json({ error: "State mismatch" }, { status: 400 });
  }

  const config = getServerGoogleConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Server Google credentials not configured" },
      { status: 503 },
    );
  }

  const redirectUri = getServerRedirectUri(request.url);

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      pending.codeVerifier,
      redirectUri,
      config,
    );

    let googleUser = data.googleUser;
    if (!googleUser) {
      try {
        googleUser = await fetchGoogleUserInfo(tokens.accessToken);
      } catch {
        googleUser = undefined;
      }
    }

    await updateSession(sid, {
      googleTokens: {
        ...(data.googleTokens ?? {}),
        workspace: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          scope: tokens.scope,
        },
      },
      googleUser,
      googlePending: undefined,
    });

    return NextResponse.redirect(new URL("/?google=connected", url.origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/?google_error=${encodeURIComponent(message)}`, url.origin),
    );
  }
}
