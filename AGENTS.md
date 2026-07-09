<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo at a glance

- `app/` — Next.js 16 App Router. Server Components by default, mark client with `"use client"`.
- `lib/` — server-only helpers (session, MCP clients).
- `components/` — client components.
- `supabase-project/` — self-contained local Supabase stack via Docker Compose. **Not** part of the Next.js app — see gotchas below.
- `.agents/skills/` — repo-local agent skills. Locked versions in `skills-lock.json`.

# Asana MCP integration

Lives in `lib/asana-mcp.ts`, `lib/session.ts`, `app/api/asana/*`, `components/AsanaSettings.tsx`, `components/AsanaTasksButton.tsx`, and `app/page.tsx`.

- Official server: `https://mcp.asana.com/v2/mcp` (V1 SSE is deprecated, shuts down 2026-05-11).
- Auth: OAuth 2.0 with PKCE. Pre-register an MCP app at `app.asana.com/0/my-apps` (type: **MCP app**); tokens are valid only for the MCP server, not the REST API. Add `http://localhost:3000/api/asana/callback` as a redirect URL.
- Credentials are pasted into the in-app settings panel, not env vars. Stored in an in-memory `Map` keyed by an httpOnly session cookie (`sh_sid` in `lib/session.ts`) — lost on server restart, fine for demo.
- The button calls `get_my_tasks` via the official SDK (`@modelcontextprotocol/sdk`) using `StreamableHTTPClientTransport`. The bearer token is passed via `requestInit.headers.Authorization`; no `OAuthClientProvider` is used because we manage the OAuth flow ourselves.
- `cookies()` in Next.js 16 is **async** — `await cookies()` everywhere.

# Turbopack blocker: unreadable Supabase data dir

`next dev` (Turbopack) walks the project root and crashes with a generic "An unexpected Turbopack error occurred" overlay when it hits a permission-denied path. The current offender is:

```
supabase-project/volumes/db/data    # owned by syslog:root, mode 0700
```

Symptom in the page payload: `TurbopackInternalError: Failed to write app endpoint /page ... Unable to watch ... Permission denied (os error 13)`.

Fix one of:
- `sudo chmod -R a+rX supabase-project/volumes/db/data` (or `chown -R $USER supabase-project/volumes/db/data`).
- Or, if you don't need the local Supabase DB running, stop the container that mounted it.
- Workaround: run `next dev` with a different `cwd` (e.g. a parent that excludes `supabase-project`) until you fix the perms.

Don't waste time on Turbopack config — there's no documented option to exclude a sibling directory from the watcher.

# Verification commands

- `npm run dev` — Next.js 16 + Turbopack on port 3000 (falls back to next free).
- `npm run lint` — runs `eslint` over the whole repo. Will fail with `EACCES` on the same `supabase-project/volumes/db/data` path; scope it to `app lib components` to lint only your code:
  - `npx eslint app lib components`
- `npx tsc --noEmit` — will fail on `supabase-project/volumes/functions/*.ts` (Deno edge functions, no Deno types in scope). Scope it:
  - `npx tsc --noEmit app/page.tsx app/api/asana/config/route.ts app/api/asana/login/route.ts app/api/asana/callback/route.ts app/api/asana/tasks/route.ts components/AsanaSettings.tsx components/AsanaTasksButton.tsx lib/session.ts lib/asana-mcp.ts` (or extend the tsconfig and exclude `supabase-project`).
- No tests configured.

# MCP servers (opencode.json)

- `searxng` — local proxy at `http://localhost:8080`.
- `supabase` — local Supabase MCP at `http://localhost:8000/mcp`. Requires the Supabase stack in `supabase-project/` to be running.

# Conventions worth knowing

- `cookies()` is async. `headers()` too.
- The MCP SDK (`@modelcontextprotocol/sdk`) is ESM-only; importing it from a Route Handler works because Next.js handles ESM natively.
- `tsconfig.json` `paths`: `@/*` → `./*`. Use `@/lib/...`, `@/components/...`, etc.
- No `src/` dir. `app/` is at the project root.
- Don't add comments to code unless asked.
