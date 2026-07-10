import { NextResponse } from "next/server";
import { getAsanaServerConfig } from "@/lib/asana-server-config";
import { makePkcePair, randomState } from "@/lib/oauth/pkce";
import { getSession, updateSession } from "@/lib/session";

const ASANA_AUTH_URL = "https://app.asana.com/-/oauth_authorize";
const ASANA_MCP_RESOURCE = "https://mcp.asana.com/v2";

export async function GET(request: Request) {
  const config = await getAsanaServerConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Asana credentials not configured (set ASANA_CLIENT_ID/SECRET or save them in Settings)." },
      { status: 500 },
    );
  }

  const { verifier, challenge } = makePkcePair();
  const state = randomState();
  await updateSession({ codeVerifier: verifier, state });

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/asana/callback`;

  const authorizeUrl = new URL(ASANA_AUTH_URL);
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("resource", ASANA_MCP_RESOURCE);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(authorizeUrl);
}
