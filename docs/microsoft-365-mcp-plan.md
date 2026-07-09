# Microsoft 365 / Work IQ MCP — research & plan

Status: **Mail and Teams implemented** (pending Microsoft Entra admin access to register an MCP app and test).

This doc captures the full research we did for wiring Microsoft 365 (Outlook mail, Calendar, OneDrive, Teams) into the SpeeHive Control Centre Next.js app via the official **Work IQ** MCP servers, and the implementation status.

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Outlook Mail | ✅ Implemented | `mcp_MailTools` server, searchMessages tool |
| Teams Chat | ✅ Implemented | `mcp_TeamsServer` server, listChats tool |
| Calendar | ⏳ Planned | `mcp_CalendarTools` server |
| OneDrive | ⏳ Planned | `mcp_OneDriveRemoteServer` server |

## Files Created/Modified

### New Files
```
lib/ms365-oauth.ts                  # OAuth helpers: buildAuthUrl, exchangeCode, refresh, fetchMs365User
lib/ms365-mcp.ts                    # MCP client: callMs365Tool, panel definitions
app/api/ms365/login/route.ts        # GET → redirect to Microsoft authorize URL (PKCE)
app/api/ms365/callback/route.ts     # GET → exchange code, store tokens, fetch user info
app/api/ms365/config/route.ts       # GET → return connection status + user info
app/api/ms365/disconnect/route.ts   # POST → clear ms365 tokens from session
app/api/ms365/[tool]/route.ts       # GET → dynamic route to call MCP tools per panel
components/Ms365Settings.tsx         # Settings panel with connect/disconnect UI
components/Ms365MailButton.tsx       # "Show my recent inbox" button component
components/Ms365TeamsButton.tsx      # "Show my recent Teams chats" button component
```

### Modified Files
```
lib/session.ts                      # Extended SessionData with ms365* fields
app/page.tsx                        # Added ms365/ms365_error search params
components/DashboardShell.tsx        # Integrated M365 connection state, sync handlers, panel data
```

## 1. Why Work IQ (and not the alternatives)

| Option | Verdict |
| --- | --- |
| **Work IQ MCP servers** (official, `agent365.svc.cloud.microsoft`) | ✅ Chosen. Remote Streamable HTTP — same transport Asana uses, so we can reuse the existing `StreamableHTTPClientTransport` pattern in `lib/asana-mcp.ts`. |
| Softeria `ms-365-mcp-server` (npm) | Rejected for now. stdio by default (subprocess management in Next.js is much more code); HTTP mode exists but uses its own OAuth server. Better for a CLI/agent host, not a web app. |
| Microsoft MCP Server for Enterprise (`mcp.svc.cloud.microsoft/enterprise`) | **Not for mail** — only Entra ID/directory read (users, groups, licenses). |

## 2. Server IDs (all verified against learn.microsoft.com)

Each Work IQ product is its own MCP server with its own permission. One app registration in Entra can hold all the permissions; one user OAuth flow yields a token that works against any of the URLs.

| App | Server ID | Permission (app-level) | Extra OAuth scope |
| --- | --- | --- | --- |
| Mail | `mcp_MailTools` | `WorkIQ-MailServer` | — |
| Calendar | `mcp_CalendarTools` | `WorkIQ-CalendarServer` | — |
| OneDrive | **`mcp_OneDriveRemoteServer`** | `WorkIQ-OneDriveServer` (verify at impl time) | — |
| Teams | `mcp_TeamsServer` | `WorkIQ-TeamsServer` | `McpServers.Teams.All` |

URL pattern: `https://agent365.svc.cloud.microsoft/agents/tenants/{tenantId}/servers/{serverId}`

## 3. Tool-naming pattern — three different conventions

The earlier assumption that all servers use `mcp_<ServerId>_graph_<endpoint>` is **wrong**. Each server ships its own naming.

| Server | Prefix | Example |
| --- | --- | --- |
| Mail | `mcp_MailTools_graph_mail_` | `mcp_MailTools_graph_mail_searchMessages` |
| Calendar | `mcp_CalendarTools_graph_` | `mcp_CalendarTools_graph_listCalendarView` |
| OneDrive | **none — bare endpoint names** | `getFolderChildrenInMyOnedrive`, `findFileOrFolderInMyOnedrive` |
| Teams | **`mcp_graph_<category>_`** | `mcp_graph_chat_listChats`, `mcp_graph_teams_listTeams` |

## 4. Exact "single button" tool calls

Verified from each tool-reference page on `learn.microsoft.com/en-us/microsoft-copilot-studio/`:

| Button | Tool | Args |
| --- | --- | --- |
| Recent inbox | `mcp_MailTools_graph_mail_searchMessages` | `{requests:[{entityTypes:["message"], query:{queryString:"received>=now-7d"}, from:0, size:25}]}` |
| Upcoming events | `mcp_CalendarTools_graph_listCalendarView` | `{startDateTime, endDateTime, top:25, orderby:"start/dateTime"}` |
| Recent files | `getFolderChildrenInMyOnedrive` | `{}` (root; 20-item cap) |
| Recent chats | `mcp_graph_chat_listChats` | `{$top:25}` |

## 5. Auth flow (public client + PKCE — mirrors Asana)

- **Authorize URL**: `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize`
  - `client_id`, `response_type=code`, `redirect_uri=http://localhost:3000/api/ms365/callback`, `response_mode=query`
  - `scope=openid profile email offline_access`
  - `code_challenge`, `code_challenge_method=S256`, `state`
- **Token URL**: `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token` (form body, `grant_type=authorization_code` + `code_verifier`)
- **Refresh**: same URL, `grant_type=refresh_token`
- Access tokens expire ~1 hour; `offline_access` is **required** for refresh grants.
- Per-app `WorkIQ-*` permissions are granted at the **app-registration** level, not in the OAuth scope (with the Teams exception of `McpServers.Teams.All`).

### Caveats to surface in the UI

- **Refresh tokens for public clients** can be blocked by tenant default policy. If refresh fails, the user must reconnect — we'll surface a clear "Reconnect" button.
- **Work IQ service principal** must be provisioned by a Global Admin before any `WorkIQ-*` permission shows up in the API permissions search.

## 6. One-time Entra admin setup (documented in the M365 settings panel)

1. Sign in to https://entra.microsoft.com → **App registrations** → New registration
2. Note the **Application (client) ID** and **Directory (tenant) ID** → set as `MS365_CLIENT_ID` and `MS365_TENANT_ID` env vars
3. **API permissions** → Add for each server you want (see §2 table) → **Grant admin consent**
4. **Authentication** → Add platform → Mobile and desktop applications → redirect URI `http://localhost:3000/api/ms365/callback`
5. Each signed-in user needs a **Microsoft 365 Copilot license** — without it, every call returns `403 Forbidden`

## 7. Environment Variables

```
MS365_CLIENT_ID=<your-client-id>
MS365_TENANT_ID=<your-tenant-id>
```

## 8. Verification

- `npx eslint app lib components` (scoped to avoid the supabase-project permission error)
- `npx tsc --noEmit` scoped to the new files
- Manual: register the Entra app, grant the permissions, set env vars, click each button, verify each returns the expected list.

## 9. Open verification at implementation time

- Confirm `WorkIQ-OneDriveServer` is the exact permission name (I inferred from the pattern; the official OneDrive tool-reference doesn't list it explicitly in what I fetched)
- Confirm the remaining per-server permission names by searching the Entra permissions catalog for "WorkIQ" once we're in the admin portal

## 10. Sources

- https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-mail-work-iq
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-calendar-work-iq
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-onedrive-work-iq
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-teams-work-iq
- https://learn.microsoft.com/en-us/microsoft-agent-365/tooling-servers-overview
- https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/work-iq
- https://github.com/microsoft/mcp (catalog)
