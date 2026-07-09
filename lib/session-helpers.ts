import { refreshAccessToken } from "@/lib/asana-mcp";
import { getSession, updateSession } from "@/lib/session";

const REFRESH_WINDOW_MS = 60_000;

export type AsanaAuth =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "unconfigured" | "unauthorized"; message?: string };

export async function getValidAsanaToken(): Promise<AsanaAuth> {
  const { data, sid } = await getSession();

  if (!data.accessToken || !data.refreshToken) {
    return { ok: false, reason: "unauthorized" };
  }

  const clientId = process.env.ASANA_CLIENT_ID;
  const clientSecret = process.env.ASANA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false, reason: "unconfigured" };
  }

  const needsRefresh =
    !data.expiresAt || data.expiresAt - Date.now() < REFRESH_WINDOW_MS;

  if (needsRefresh) {
    try {
      const refreshed = await refreshAccessToken(data.refreshToken, {
        clientId,
        clientSecret,
      });
      await updateSession(sid, {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      });
      return { ok: true, accessToken: refreshed.accessToken };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, reason: "unauthorized", message: `Token refresh failed: ${message}` };
    }
  }

  return { ok: true, accessToken: data.accessToken };
}
