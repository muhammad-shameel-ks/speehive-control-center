import { log } from "@/lib/logger";

const buckets = new Map<string, number[]>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = buckets.get(key) ?? [];
  const recent = existing.filter((t) => t > cutoff);
  if (recent.length >= limit) {
    const oldest = recent[0];
    log.rateLimit.warn(`key=${key} limit=${limit}`);
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldest + windowMs,
    };
  }
  recent.push(now);
  buckets.set(key, recent);
  return {
    allowed: true,
    remaining: limit - recent.length,
    resetAt: now + windowMs,
  };
}

export function rateLimitFromCookie(
  cookieValue: string | undefined,
  ip: string | null,
  config: RateLimitConfig,
): RateLimitResult {
  const key = cookieValue || ip || "anon";
  return rateLimit(key, config);
}
