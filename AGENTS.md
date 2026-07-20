<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repo at a glance

- `app/` — Next.js 16 App Router. Server Components by default, mark client with `"use client"`.
- `lib/` — server-only helpers, types, OAuth, parser, integrations client.
- `hooks/` — client-side custom hooks (one per concern: `useMs365Connection`, `useSummaries`, etc.).
- `components/` — client components, organised by feature.
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

Two integrations: **Asana** (REST API) and **Microsoft 365** (Graph API). Google is fully removed.

- Asana: `lib/asana-api.ts` (REST client), `app/api/asana/*` (login/callback/config/tasks), `hooks/useAsanaConnection`, `components/integration-settings/AsanaSettings.tsx`.
- Microsoft 365: `lib/ms365-graph.ts` (Graph fetchers), `lib/ms365-oauth.ts` (PKCE), `app/api/ms365/*` (login/callback/config/[tool]/disconnect), `hooks/useMs365Connection`.

Shared OAuth helpers live in `lib/oauth/pkce.ts`. Typed API wrappers live in `lib/integrations/api-client.ts`. The "Refresh All" button calls `lib/integrations/refresh-all.ts`.

# Asana REST API integration details

- API base: `https://app.asana.com/api/1.0`. All calls go through `lib/asana-api.ts` (`asanaFetch` wrapper with `[asana]` dev logging).
- Auth: OAuth 2.0 with PKCE. Pre-register an **API app** at `app.asana.com/0/my-apps` (type: **API app**, not MCP app). MCP app tokens only work against the MCP server, not the REST API.
- Credentials: env vars (`ASANA_CLIENT_ID`, `ASANA_CLIENT_SECRET`) take priority, fallback to in-app settings stored in Supabase `user_integrations` table.
- Endpoints used: `GET /tasks?assignee=me&workspace=...` (list tasks), `POST /tasks` (create), `PUT /tasks/{gid}` (update), `GET /workspaces` (list workspaces).
- AI chat tools are hardcoded in `lib/asana-tools.ts` (not dynamically listed from MCP). Tools: `get_workspaces`, `get_my_tasks`, `create_task`, `update_task`.
- The `workspaceGid` is cached in the `user_integrations` table after first fetch.
- `cookies()` in Next.js 16 is **async** — `await cookies()` everywhere.

# Verification commands

- `npm run dev` — Next.js 16 + Turbopack on port 3000 (falls back to next free).
- `npm run lint` — runs `eslint` over the whole repo.
- `npx tsc --noEmit -p tsconfig.check.json` — type-checks the codebase.
- No tests configured.

# MCP servers (opencode.json)

- `searxng` — local proxy at `http://localhost:8080`.

# Conventions worth knowing

- `cookies()` is async. `headers()` too.
- `tsconfig.json` `paths`: `@/*` → `./*`. Use `@/lib/...`, `@/components/...`, `@/hooks/...`, etc.
- No `src/` dir. `app/` is at the project root.
- All stateful client logic lives in `hooks/`. All shared types in `lib/types/`. All API calls go through `lib/integrations/api-client.ts`.
- Don't add comments to code unless asked.
