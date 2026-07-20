const KNOWN_PATTERNS = [
  /token exchange failed/i,
  /token refresh failed/i,
  /Asana API \d+/,
  /Failed to fetch/i,
  /ECONNREFUSED/,
  /ETIMEDOUT/,
];

export function sanitizeError(err: unknown): string {
  const raw = err instanceof Error ? err.message : "Unknown error";

  for (const pattern of KNOWN_PATTERNS) {
    if (pattern.test(raw)) {
      return "An external service error occurred. Please try again later.";
    }
  }

  if (raw.includes("Not authenticated")) {
    return "Authentication required.";
  }

  if (raw.includes("Failed to produce")) {
    return "Failed to generate summary. Please try again.";
  }

  return "An internal error occurred. Please try again.";
}
