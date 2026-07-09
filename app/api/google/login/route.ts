import { NextResponse, type NextRequest } from "next/server";
import {
  buildAuthUrl,
  getServerGoogleConfig,
  getServerRedirectUri,
  GOOGLE_SCOPES,
  makePkcePair,
  randomState,
} from "@/lib/google-oauth";
import { getSession, updateSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const config = getServerGoogleConfig();
  if (!config) {
    return NextResponse.json(
      {
        error:
          "Server Google credentials not configured. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.",
      },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const { data, sid } = await getSession();
  const tokens = data.googleTokens ?? {};

  if (tokens["workspace"]?.accessToken) {
    return NextResponse.redirect(new URL("/?google=connected", url.origin));
  }

  const { verifier, challenge } = makePkcePair();
  const state = randomState();
  await updateSession(sid, {
    googlePending: { serverId: "workspace", state, codeVerifier: verifier },
  });

  const redirectUri = getServerRedirectUri(request.url);

  const authorizeUrl = buildAuthUrl({
    clientId: config.clientId,
    redirectUri,
    scopes: [...GOOGLE_SCOPES],
    state,
    codeChallenge: challenge,
    prompt: "consent",
  });

  return NextResponse.redirect(authorizeUrl);
}
