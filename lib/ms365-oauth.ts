import { createHash, randomBytes } from "node:crypto";

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function makePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64UrlEncode(randomBytes(32));
  const challenge = base64UrlEncode(
    createHash("sha256").update(verifier).digest(),
  );
  return { verifier, challenge };
}

export function randomState(): string {
  return base64UrlEncode(randomBytes(16));
}

export type Ms365OAuthConfig = {
  clientId: string;
  tenantId: string;
};

export function getServerMs365Config(): Ms365OAuthConfig | null {
  const clientId = process.env.MS365_CLIENT_ID?.trim();
  const tenantId = process.env.MS365_TENANT_ID?.trim();
  if (!clientId || !tenantId) return null;
  return { clientId, tenantId };
}

export function getMicrosoftLoginUrl(tenantId: string): string {
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0`;
}

export function buildAuthUrl(opts: {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const baseUrl = getMicrosoftLoginUrl(opts.tenantId);
  const url = new URL(`${baseUrl}/authorize`);
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "query");
  url.searchParams.set(
    "scope",
    "openid profile email offline_access",
  );
  url.searchParams.set("state", opts.state);
  url.searchParams.set("code_challenge", opts.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export type Ms365Tokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  config: Ms365OAuthConfig,
): Promise<Ms365Tokens> {
  const tokenUrl = `${getMicrosoftLoginUrl(config.tenantId)}/token`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    scope: "openid profile email offline_access",
  });

  const res = await fetch(tokenUrl, {
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
    refresh_token?: string;
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
  config: Ms365OAuthConfig,
): Promise<Ms365Tokens> {
  const tokenUrl = `${getMicrosoftLoginUrl(config.tenantId)}/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    refresh_token: refreshToken,
    scope: "openid profile email offline_access",
  });

  const res = await fetch(tokenUrl, {
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
    refresh_token?: string;
    expires_in: number;
  };

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function fetchMs365User(
  accessToken: string,
): Promise<{ id?: string; name: string; email: string; photo?: string }> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user info (${res.status})`);
  }

  const me = (await res.json()) as {
    id?: string;
    displayName?: string;
    mail?: string;
    userPrincipalName?: string;
  };

  return {
    id: me.id,
    name: me.displayName ?? "Unknown",
    email: me.mail ?? me.userPrincipalName ?? "",
  };
}
