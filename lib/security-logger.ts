type SecurityEvent =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.signup"
  | "auth.session.expired"
  | "oauth.callback.state_mismatch"
  | "oauth.token.refresh.failed"
  | "rate_limit.exceeded"
  | "api.unauthorized_access"
  | "api.invalid_input";

interface SecurityLogEntry {
  event: SecurityEvent;
  timestamp: string;
  userId?: string;
  ip?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

export function logSecurityEvent(
  event: SecurityEvent,
  data: Omit<SecurityLogEntry, "event" | "timestamp"> = {},
): void {
  const entry: SecurityLogEntry = {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  console.warn(`[SECURITY] ${event}`, JSON.stringify(entry));
}

export function logAuthFailure(
  reason: string,
  ip?: string,
  path?: string,
): void {
  logSecurityEvent("auth.login.failure", { ip, path, metadata: { reason } });
}

export function logRateLimitExceeded(
  key: string,
  ip?: string,
  path?: string,
): void {
  logSecurityEvent("rate_limit.exceeded", { ip, path, metadata: { key } });
}

export function logUnauthorizedAccess(
  path: string,
  ip?: string,
  userId?: string,
): void {
  logSecurityEvent("api.unauthorized_access", { path, ip, userId });
}
