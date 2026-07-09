import { NextResponse } from "next/server";
import { makePkcePair, randomState } from "@/lib/oauth/pkce";
import { getSession, updateSession } from "@/lib/session";

const ASANA_AUTH_URL = "https://app.asana.com/-/oauth_authorize";
const ASANA_MCP_RESOURCE = "https://mcp.asana.com/v2";

export async function GET(request: Request) {
  const { sid } = await getSession();

  const clientId = process.env.ASANA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "ASANA_CLIENT_ID env var not set" },
      { status: 500 },
    );
  }

  const { verifier, challenge } = makePkcePair();
  const state = randomState();
  await updateSession(sid, { codeVerifier: verifier, state });

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/asana/callback`;

  const authorizeUrl = new URL(ASANA_AUTH_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("resource", ASANA_MCP_RESOURCE);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(authorizeUrl);
}
