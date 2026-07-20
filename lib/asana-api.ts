const ASANA_API_BASE = "https://app.asana.com/api/1.0";
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

export type AsanaTask = {
  gid: string;
  name: string;
  completed: boolean;
  due_on?: string | null;
  workspace?: { gid: string; name?: string };
};

export type AsanaWorkspace = {
  gid: string;
  name: string;
};

async function asanaFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${ASANA_API_BASE}${path}`;
  const start = Date.now();
  console.log(`[asana] → ${init?.method ?? "GET"} ${path}`);

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const elapsed = Date.now() - start;

  if (!res.ok) {
    const body = await res.text();
    console.error(`[asana] ✗ ${res.status} ${path} (${elapsed}ms): ${body.slice(0, 200)}`);
    throw new Error(`Asana API ${res.status}: ${body}`);
  }

  const json = (await res.json()) as { data: T; next_page?: { offset?: string } | null };
  console.log(`[asana] ✓ ${path} (${elapsed}ms) — ${(JSON.stringify(json.data).length / 1024).toFixed(1)}KB`);
  return json.data;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  config: OAuthConfig,
): Promise<AsanaTokens> {
  const start = Date.now();
  console.log("[asana] → exchanging OAuth code for tokens");

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
    console.error(`[asana] ✗ token exchange failed (${res.status}): ${text.slice(0, 200)}`);
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  console.log(`[asana] ✓ tokens received (${Date.now() - start}ms) — expires in ${json.expires_in}s`);
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
  const start = Date.now();
  console.log("[asana] → refreshing access token");

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
    console.error(`[asana] ✗ token refresh failed (${res.status}): ${text.slice(0, 200)}`);
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  console.log(`[asana] ✓ tokens refreshed (${Date.now() - start}ms) — expires in ${json.expires_in}s`);
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
}

export async function getMyTasks(
  accessToken: string,
  workspaceGid: string,
): Promise<AsanaTask[]> {
  const params = new URLSearchParams({
    assignee: "me",
    workspace: workspaceGid,
    completed_since: "now",
    limit: "100",
    opt_fields: "name,completed,due_on,workspace.name",
  });
  return asanaFetch<AsanaTask[]>(accessToken, `/tasks?${params}`);
}

export async function createTask(
  accessToken: string,
  data: {
    name: string;
    workspace: string;
    notes?: string;
    due_on?: string;
  },
): Promise<AsanaTask> {
  return asanaFetch<AsanaTask>(accessToken, "/tasks", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
}

export async function updateTask(
  accessToken: string,
  taskGid: string,
  data: { completed?: boolean; name?: string },
): Promise<AsanaTask> {
  return asanaFetch<AsanaTask>(accessToken, `/tasks/${taskGid}`, {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

export async function getWorkspaces(
  accessToken: string,
): Promise<AsanaWorkspace[]> {
  return asanaFetch<AsanaWorkspace[]>(accessToken, "/workspaces");
}
