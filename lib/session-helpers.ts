import { getAsanaServerConfig } from "@/lib/asana-server-config";
import { refreshAccessToken } from "@/lib/asana-api";
import { getSession, updateSession } from "@/lib/session";
import { log } from "@/lib/logger";

const REFRESH_WINDOW_MS = 60_000;

export type AsanaAuth =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "unconfigured" | "unauthorized"; message?: string };

export async function getValidAsanaToken(): Promise<AsanaAuth> {
  const { data } = await getSession();

  if (!data.accessToken || !data.refreshToken) {
    log.auth.info("no tokens — unauthorized");
    return { ok: false, reason: "unauthorized" };
  }

  const config = await getAsanaServerConfig();
  if (!config) {
    log.auth.info("no client config — unconfigured");
    return { ok: false, reason: "unconfigured" };
  }

  const needsRefresh =
    !data.expiresAt || data.expiresAt - Date.now() < REFRESH_WINDOW_MS;

  if (needsRefresh) {
    log.auth.info("token expiring — refreshing");
    try {
      const refreshed = await refreshAccessToken(data.refreshToken, config);
      await updateSession({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      });
      log.auth.info("token refreshed successfully");
      return { ok: true, accessToken: refreshed.accessToken };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      log.auth.error("token refresh failed:", message);
      return { ok: false, reason: "unauthorized", message: `Token refresh failed: ${message}` };
    }
  }

  return { ok: true, accessToken: data.accessToken };
}
