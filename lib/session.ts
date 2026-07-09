import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

const COOKIE_NAME = "sh_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type GoogleUser = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

export type GoogleServerTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
};

export type GooglePendingAuth = {
  serverId: string;
  state: string;
  codeVerifier: string;
  nextServerId?: string;
};

export type Ms365User = {
  id?: string;
  name: string;
  email: string;
  photo?: string;
};

export type SessionData = {
  // Asana
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  state?: string;
  codeVerifier?: string;
  // Google — per-MCP-server tokens (keyed by serverId: gmail/drive/calendar/chat/people)
  googleTokens?: Record<string, GoogleServerTokens>;
  googleUser?: GoogleUser;
  googlePending?: GooglePendingAuth;
  // Microsoft 365 — Work IQ MCP
  ms365ClientId?: string;
  ms365TenantId?: string;
  ms365AccessToken?: string;
  ms365RefreshToken?: string;
  ms365ExpiresAt?: number;
  ms365State?: string;
  ms365CodeVerifier?: string;
  ms365User?: Ms365User;
};

const globalForSession = globalThis as unknown as {
  sessionStore?: Map<string, SessionData>;
};

const store = globalForSession.sessionStore ?? new Map<string, SessionData>();
if (process.env.NODE_ENV !== "production") {
  globalForSession.sessionStore = store;
}

function generateSid(): string {
  return randomBytes(32).toString("hex");
}

export async function getSession(): Promise<{ sid: string; data: SessionData }> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME);
  if (existing) {
    const data = store.get(existing.value) ?? {};
    return { sid: existing.value, data };
  }
  const sid = generateSid();
  store.set(sid, {});
  cookieStore.set(COOKIE_NAME, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return { sid, data: {} };
}

export async function updateSession(
  sid: string,
  patch: Partial<SessionData>,
): Promise<SessionData> {
  const current = store.get(sid) ?? {};
  const next = { ...current, ...patch };
  store.set(sid, next);
  return next;
}

export async function clearSession(sid: string): Promise<void> {
  store.delete(sid);
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
