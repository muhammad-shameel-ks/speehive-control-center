<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo at a glance

- `app/` — Next.js 16 App Router. Server Components by default, mark client with `"use client"`.
- `lib/` — server-only helpers, types, OAuth, parser, integrations client.
- `hooks/` — client-side custom hooks (one per concern: `useMs365Connection`, `useSummaries`, etc.).
- `components/` — client components, organised by feature.
- `supabase-project/` — self-contained local Supabase stack via Docker Compose. **Not** part of the Next.js app — see gotchas below.
- `.agents/skills/` — repo-local agent skills. Locked versions in `skills-lock.json`.

# Dashboard feature layout

The dashboard is split into focused modules — start at `components/DashboardShell.tsx` (~250 lines) for the orchestrator, then dive in by feature:

- `components/dashboard/Sidebar.tsx`, `Header.tsx`, `Notepad.tsx`, `ExecutiveBriefing.tsx` — top-level shell pieces.
- `components/dashboard/panels/EmailPanel.tsx` — M365 inbox with infinite scroll.
- `components/dashboard/panels/ChatColumn.tsx` — Teams chats + Notepad.
- `components/dashboard/panels/TasksPanel.tsx` — Asana tasks with Pending/Done/All tabs.
- `components/dashboard/briefing/BriefingModal.tsx` + `Briefing{Mail,Teams,Asana}Page.tsx` + `BriefingDigestStrip.tsx` — the master/detail briefing modal.
- `components/dashboard/chat/ChatDrawer.tsx` — the slide-in AI chat.
- `components/dashboard/tasks/CreateTaskDialog.tsx` — the "Create Asana task" form.
- `components/chat/ChatPanel.tsx` — the actual AI chat (useChat from `@ai-sdk/react`).
- `components/integration-settings/AsanaSettings.tsx`, `Ms365Settings.tsx` — settings tab cards.
- `components/icons.tsx` — every inline SVG icon in one place.
- `components/ui/*` — shadcn primitives.

# Hooks

- `useMs365Connection` — connection state + mail/teams text.
- `useAsanaConnection` — connection state + tasks + create/toggle/refresh.
- `useInboxSync` — Outlook mail paginated fetch + IntersectionObserver.
- `useChatsSync` (exported from `useMs365Connection.ts`) — Teams chats fetch.
- `useSummaries` — AI digest state machine (email/chat/tasks/global) with fingerprint dedup + retry.
- `useBriefing` — modal open/close, tab, initial selection.
- `useTaskMutations` — CreateTask form state + Asana create/toggle wiring.
- `useClock`, `useNotepad` — small local-state helpers.

# Integrations

Two integrations: **Asana** (MCP) and **Microsoft 365** (Work IQ MCP). Google is fully removed.

- Asana: `lib/asana-mcp.ts` (MCP client), `app/api/asana/*` (login/callback/config/tasks), `hooks/useAsanaConnection`, `components/integration-settings/AsanaSettings.tsx`.
- Microsoft 365: `lib/ms365-graph.ts` (Graph fetchers), `lib/ms365-oauth.ts` (PKCE), `app/api/ms365/*` (login/callback/config/[tool]/disconnect), `hooks/useMs365Connection`.

Shared OAuth helpers live in `lib/oauth/pkce.ts`. Typed API wrappers live in `lib/integrations/api-client.ts`. The "Refresh All" button calls `lib/integrations/refresh-all.ts`.

# Asana MCP integration details

- Official server: `https://mcp.asana.com/v2/mcp` (V1 SSE is deprecated, shuts down 2026-05-11).
- Auth: OAuth 2.0 with PKCE. Pre-register an MCP app at `app.asana.com/0/my-apps` (type: **MCP app**); tokens are valid only for the MCP server, not the REST API. Add `http://localhost:3000/api/asana/callback` as a redirect URL.
- Credentials are pasted into the in-app settings panel, not env vars. Stored in an in-memory `Map` keyed by an httpOnly session cookie (`sh_sid` in `lib/session.ts`) — lost on server restart, fine for demo.
- The UI calls `get_my_tasks` via the official SDK (`@modelcontextprotocol/sdk`) using `StreamableHTTPClientTransport`. The bearer token is passed via `requestInit.headers.Authorization`; no `OAuthClientProvider` is used because we manage the OAuth flow ourselves.
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
- `npm run lint` — runs `eslint` over the whole repo. Will fail with `EACCES` on the same `supabase-project/volumes/db/data` path; scope it:
  - `npx eslint components app lib hooks`
- `npx tsc --noEmit -p tsconfig.check.json` — scoped to exclude `supabase-project` and `.next`.
- No tests configured.

# MCP servers (opencode.json)

- `searxng` — local proxy at `http://localhost:8080`.
- `supabase` — local Supabase MCP at `http://localhost:8000/mcp`. Requires the Supabase stack in `supabase-project/` to be running.

# Conventions worth knowing

- `cookies()` is async. `headers()` too.
- The MCP SDK (`@modelcontextprotocol/sdk`) is ESM-only; importing it from a Route Handler works because Next.js handles ESM natively.
- `tsconfig.json` `paths`: `@/*` → `./*`. Use `@/lib/...`, `@/components/...`, `@/hooks/...`, etc.
- No `src/` dir. `app/` is at the project root.
- All stateful client logic lives in `hooks/`. All shared types in `lib/types/`. All API calls go through `lib/integrations/api-client.ts`.
- Don't add comments to code unless asked.
