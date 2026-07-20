# Security Audit Report - SpeeHive Control Center

**Date:** 2026-07-20  
**Audited Version:** Latest (main branch)  
**Auditor:** SpeeHive AI  

---

## Executive Summary

The SpeeHive Control Center is a Next.js 16 application that integrates with Asana (MCP) and Microsoft 365 (Graph API). The codebase demonstrates strong security practices in several areas, particularly in OAuth implementation and CSP configuration. However, several medium-priority issues were identified that should be addressed to enhance the overall security posture.

**Overall Risk Level:** Medium

---

## Security Strengths

### 1. Content Security Policy (CSP)
**Location:** `next.config.ts:5-15`

Excellent CSP implementation with:
- `frame-ancestors 'none'` - Prevents clickjacking
- `base-uri 'self'` - Prevents base tag injection
- `form-action 'self'` - Prevents form hijacking
- `X-Frame-Options: DENY` - Additional clickjacking protection
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Strict-Transport-Security` - Enforces HTTPS

### 2. OAuth 2.0 with PKCE
**Location:** `lib/oauth/pkce.ts`, `lib/ms365-oauth.ts`, `lib/asana-mcp.ts`

Proper implementation of:
- PKCE (Proof Key for Code Exchange) for OAuth flows
- State parameter validation to prevent CSRF
- Code verifier/challenge generation with cryptographically secure random bytes
- SHA-256 hashing for code challenge

### 3. Rate Limiting
**Location:** `lib/rate-limit.ts`, `app/api/chat/route.ts`, `app/api/ai/summary/route.ts`

- In-memory rate limiting per session/IP
- Chat endpoint: 20 requests per minute
- Summary endpoint: 10 requests per minute
- Proper `Retry-After` header implementation

### 4. Tool Allowlisting
**Location:** `app/api/asana/tasks/route.ts:6-19`

Strict allowlist for Asana MCP tools:
- Only 12 approved operations
- Prevents unauthorized tool execution

### 5. Environment Variable Security
**Location:** `.gitignore:34`

Properly ignoring `.env*` files to prevent secret exposure in version control.

### 6. Authentication Middleware
**Location:** `proxy.ts`

Supabase-based authentication with:
- Session validation on protected routes
- Public route allowlisting
- Automatic redirect to login for unauthenticated users

---

## Security Issues

### Issue #1: In-Memory Rate Limiting Not Persistent Across Serverless Instances

**Severity:** Medium  
**Location:** `lib/rate-limit.ts:1`  
**Description:** The rate limiter uses an in-memory `Map` which:
- Resets on serverless function cold starts
- Does not persist across multiple server instances
- Can be bypassed by attackers targeting different instances

**Impact:** Rate limiting can be circumvented in production Vercel deployments where multiple serverless instances may be running.

**Recommendation:**
```typescript
// Use Redis or Supabase for persistent rate limiting
// Example with Supabase:
import { createClient } from '@/lib/supabase/server';

export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const supabase = await createClient();
  // Implement sliding window with database
}
```

---

### Issue #2: Missing Input Validation on Chat Messages

**Severity:** Medium  
**Location:** `app/api/chat/route.ts:38`  
**Description:** The chat endpoint accepts `messages` array without validating:
- Message structure/content
- Maximum message length
- Number of messages in the array

**Impact:** Potential for:
- DoS attacks via oversized payloads
- Injection of malicious content into AI context
- Excessive memory consumption

**Recommendation:**
```typescript
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(10000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).max(50),
});

// In handler:
const body = RequestSchema.parse(await req.json());
```

---

### Issue #3: Excessive Error Detail Exposure

**Severity:** Low-Medium  
**Location:** Multiple API routes  
**Description:** Error messages from external services are returned directly to clients:
- `lib/asana-mcp.ts:40-41` - Token exchange errors
- `lib/ms365-oauth.ts:73-74` - Token exchange errors
- `app/api/asana/tasks/route.ts:51-55` - Token refresh errors

**Impact:** May leak:
- Internal service details
- API endpoint structures
- Potential debugging information

**Recommendation:**
```typescript
// Log full error server-side, return generic message to client
console.error('Token exchange failed:', error);
return NextResponse.json(
  { error: 'Authentication failed. Please try again.' },
  { status: 500 }
);
```

---

### Issue #4: Missing CSRF Protection on State-Changing Endpoints

**Severity:** Medium  
**Location:** `app/api/asana/config/route.ts:17`  
**Description:** The POST endpoint for updating Asana config lacks CSRF token validation. While Supabase auth provides some protection, explicit CSRF tokens would add defense-in-depth.

**Impact:** Potential CSRF attacks on configuration endpoints.

**Recommendation:**
```typescript
// Add CSRF token validation middleware
// Or use SameSite cookie attribute (already recommended)
// Ensure all state-changing operations require valid session
```

---

### Issue #5: Hardcoded Supabase Project Reference in MCP Config

**Severity:** Low  
**Location:** `.mcp.json:5`  
**Description:** The Supabase project reference is hardcoded in the MCP configuration file.

**Impact:** Exposes project identifier, though this is typically not sensitive.

**Recommendation:**
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "${SUPABASE_MCP_URL}"
    }
  }
}
```

---

### Issue #6: Missing Security Headers for API Routes

**Severity:** Low  
**Location:** `next.config.ts:18-33`  
**Description:** CSP headers are applied globally but some API-specific headers are missing:
- `X-Request-ID` for request tracing
- `Cache-Control: no-store` for sensitive endpoints

**Impact:** Reduced audit trail capability and potential caching of sensitive data.

**Recommendation:**
```typescript
// Add to API route handlers
headers: {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
}
```

---

### Issue #7: No Request Size Limits

**Severity:** Medium  
**Location:** All API routes  
**Description:** No explicit body size limits are configured for POST requests.

**Impact:** Potential DoS attacks via large payloads.

**Recommendation:**
```typescript
// In next.config.ts or middleware
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```

---

### Issue #8: Missing Dependency Audit in CI/CD

**Severity:** Medium  
**Description:** No automated dependency vulnerability scanning configured.

**Impact:** Known vulnerabilities (like the PostCSS XSS issue detected) may go unnoticed.

**Recommendation:**
```yaml
# Add to CI pipeline
- name: Security Audit
  run: |
    npm audit --audit-level=moderate
    npm audit --production
```

---

## Dependency Vulnerabilities Detected

| Package | Severity | Issue | Status |
|---------|----------|-------|--------|
| postcss <8.5.10 | Moderate | XSS via Unescaped `</style>` in CSS Stringify Output | Fix available |

**Recommendation:** Run `npm audit fix --force` or upgrade Next.js to a patched version.

---

## Recommendations Summary

### Immediate Actions (High Priority)
1. **Implement persistent rate limiting** using Redis or Supabase
2. **Add input validation** using Zod for all API endpoints
3. **Run `npm audit fix`** to address dependency vulnerabilities

### Short-Term Actions (Medium Priority)
4. **Add CSRF protection** for state-changing endpoints
5. **Implement request size limits** in Next.js configuration
6. **Sanitize error messages** returned to clients
7. **Add security headers** for API routes

### Long-Term Actions (Low Priority)
8. **Implement CSP reporting** endpoint for violation monitoring
9. **Add request logging** with correlation IDs
10. **Set up automated security scanning** in CI/CD pipeline
11. **Implement Content-Security-Policy-Report-Only** mode for testing

---

## Positive Observations

1. **No hardcoded secrets** - All sensitive values are in environment variables
2. **Proper session management** - Using Supabase for secure session handling
3. **Token refresh mechanism** - Automatic token refresh before expiration
4. **Tool allowlisting** - Strict control over MCP tool execution
5. **Authentication middleware** - Proper route protection

---

## Conclusion

The SpeeHive Control Center demonstrates a solid security foundation with proper OAuth flows, CSP implementation, and authentication mechanisms. The identified issues are addressable and do not represent critical vulnerabilities. Implementing the recommended improvements will significantly enhance the application's security posture.

**Next Steps:**
1. Address high-priority items immediately
2. Schedule medium-priority items for next sprint
3. Plan low-priority items for future releases
4. Establish regular security audit cadence (quarterly)

---

*This audit was conducted on 2026-07-20 by SpeeHive AI. For questions or clarifications, please contact the security team.*
