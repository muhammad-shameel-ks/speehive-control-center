import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const ASANA_MCP_URL = "https://mcp.asana.com/v2/mcp";
const ASANA_TOKEN_URL = "https://app.asana.com/-/oauth_token";

export type AsanaTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type OAuthConfig = {
  clientId: string;
  clientSecret: string;
};

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  config: OAuthConfig,
): Promise<AsanaTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch(ASANA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  config: OAuthConfig,
): Promise<AsanaTokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(ASANA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function callAsanaTool(
  accessToken: string,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const transport = new StreamableHTTPClientTransport(new URL(ASANA_MCP_URL), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
    },
  });

  const client = new Client(
    { name: "speehive-control-centre", version: "0.1.0" },
    { capabilities: {} },
  );

  try {
    await client.connect(transport);
    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  } finally {
    try {
      await transport.close();
    } catch {
      // ignore close errors
    }
  }
}
