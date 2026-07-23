import { createClient } from "@/lib/supabase/server";

export type Ms365User = {
  id?: string;
  name: string;
  email: string;
  photo?: string;
};

export type SessionData = {
  // Asana
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  workspaceGid?: string;
  state?: string;
  codeVerifier?: string;
  // Microsoft 365
  ms365AccessToken?: string;
  ms365RefreshToken?: string;
  ms365ExpiresAt?: number;
  ms365State?: string;
  ms365CodeVerifier?: string;
  ms365User?: Ms365User;
};

type DbRow = Record<string, unknown>;

function rowToSession(row: DbRow): SessionData {
  return {
    accessToken: (row.asana_access_token as string) ?? undefined,
    refreshToken: (row.asana_refresh_token as string) ?? undefined,
    expiresAt: (row.asana_expires_at as number) ?? undefined,
    state: (row.asana_state as string) ?? undefined,
    workspaceGid: (row.asana_workspace_gid as string) ?? undefined,
    codeVerifier: (row.asana_code_verifier as string) ?? undefined,
    ms365AccessToken: (row.ms365_access_token as string) ?? undefined,
    ms365RefreshToken: (row.ms365_refresh_token as string) ?? undefined,
    ms365ExpiresAt: (row.ms365_expires_at as number) ?? undefined,
    ms365State: (row.ms365_state as string) ?? undefined,
    ms365CodeVerifier: (row.ms365_code_verifier as string) ?? undefined,
    ms365User: (row.ms365_user as Ms365User) ?? undefined,
  };
}

function patchToRow(patch: Partial<SessionData>): DbRow {
  const row: DbRow = {};
  if ("accessToken" in patch) row.asana_access_token = patch.accessToken ?? null;
  if ("refreshToken" in patch) row.asana_refresh_token = patch.refreshToken ?? null;
  if ("expiresAt" in patch) row.asana_expires_at = patch.expiresAt ?? null;
  if ("workspaceGid" in patch) row.asana_workspace_gid = patch.workspaceGid ?? null;
  if ("state" in patch) row.asana_state = patch.state ?? null;
  if ("codeVerifier" in patch) row.asana_code_verifier = patch.codeVerifier ?? null;
  if ("ms365AccessToken" in patch) row.ms365_access_token = patch.ms365AccessToken ?? null;
  if ("ms365RefreshToken" in patch) row.ms365_refresh_token = patch.ms365RefreshToken ?? null;
  if ("ms365ExpiresAt" in patch) row.ms365_expires_at = patch.ms365ExpiresAt ?? null;
  if ("ms365State" in patch) row.ms365_state = patch.ms365State ?? null;
  if ("ms365CodeVerifier" in patch) row.ms365_code_verifier = patch.ms365CodeVerifier ?? null;
  if ("ms365User" in patch) row.ms365_user = patch.ms365User ?? null;
  return row;
}

export async function getSession(): Promise<{ data: SessionData }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: {} };

  const { data: row } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return { data: row ? rowToSession(row) : {} };
}

export async function updateSession(
  patch: Partial<SessionData>,
): Promise<SessionData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row = { ...patchToRow(patch), updated_at: new Date().toISOString() };

  const { data } = await supabase
    .from("user_integrations")
    .upsert({ user_id: user.id, ...row }, { onConflict: "user_id" })
    .select()
    .single();

  if (!data) throw new Error("Failed to update session");
  return rowToSession(data);
}

export async function clearSession(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("user_integrations")
    .update({
      ms365_access_token: null,
      ms365_refresh_token: null,
      ms365_expires_at: null,
      ms365_user: null,
      asana_access_token: null,
      asana_refresh_token: null,
      asana_expires_at: null,
      asana_workspace_gid: null,
    })
    .eq("user_id", user.id);
}

export type UserIdentity = {
  email?: string;
  name?: string;
};

export async function getUserIdentity(): Promise<UserIdentity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await getSession();

  const email = user?.email ?? session.ms365User?.email;
  let name =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    session.ms365User?.name;

  if (!name && email) {
    const prefix = email.split("@")[0];
    name = prefix
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return { email, name };
}
