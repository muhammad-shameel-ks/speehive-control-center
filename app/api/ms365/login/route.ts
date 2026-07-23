import { NextResponse, type NextRequest } from "next/server";
import {
  buildAuthUrl,
  getServerMs365Config,
  makePkcePair,
  randomState,
} from "@/lib/ms365-oauth";
import { getSession, updateSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const config = getServerMs365Config();
  if (!config) {
    return NextResponse.json(
      { error: "MS365_CLIENT_ID and MS365_TENANT_ID are not configured." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const { data } = await getSession();

  if (data.ms365AccessToken) {
    return NextResponse.redirect(new URL("/?ms365=connected", url.origin));
  }

  const { verifier, challenge } = makePkcePair();
  const state = randomState();

  await updateSession({
    ms365State: state,
    ms365CodeVerifier: verifier,
  });

  const origin = process.env.NEXT_PUBLIC_BASE_URL || url.origin;
  const redirectUri = `${origin}/api/ms365/callback`;
  const authorizeUrl = buildAuthUrl({
    clientId: config.clientId,
    tenantId: config.tenantId,
    redirectUri,
    state,
    codeChallenge: challenge,
  });

  return NextResponse.redirect(authorizeUrl);
}
