import { cookies } from "next/headers";

const SID_COOKIE = "sh_sid";

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
  // Microsoft 365
  ms365ClientId?: string;
  ms365TenantId?: string;
  ms365AccessToken?: string;
  ms365RefreshToken?: string;
  ms365ExpiresAt?: number;
  ms365State?: string;
  ms365CodeVerifier?: string;
  ms365User?: Ms365User;
};

const store = new Map<string, SessionData>();

export async function getSession(): Promise<{ sid: string; data: SessionData }> {
  const cookieStore = await cookies();
  const sid = cookieStore.get(SID_COOKIE)?.value ?? "";
  const data = sid ? (store.get(sid) ?? {}) : {};
  return { sid, data };
}

export async function updateSession(
  sid: string,
  patch: Partial<SessionData>,
): Promise<SessionData> {
  const current = sid ? (store.get(sid) ?? {}) : {};
  const next: SessionData = { ...current, ...patch };
  for (const key of Object.keys(patch) as (keyof SessionData)[]) {
    if (next[key] === undefined) delete next[key];
  }
  if (sid) store.set(sid, next);
  return next;
}

export async function clearSession(sid: string): Promise<void> {
  if (sid) store.delete(sid);
}
