import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  isProd ? "connect-src 'self' https://mcp.asana.com https://graph.microsoft.com https://login.microsoftonline.com https://app.asana.com https://opencode.ai https://zyoswiuptsyafnnvbgox.supabase.co wss://zyoswiuptsyafnnvbgox.supabase.co wss:" : "connect-src 'self' https://mcp.asana.com https://graph.microsoft.com https://login.microsoftonline.com https://app.asana.com https://opencode.ai https://zyoswiuptsyafnnvbgox.supabase.co ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
