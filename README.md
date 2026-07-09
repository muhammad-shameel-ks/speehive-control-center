# SpeeHive Control Centre

A unified workspace dashboard for IT management — your single-pane-of-glass cockpit for email, chats, tasks, and AI-powered briefings.

## Features

- **Executive Briefing** — AI-generated global summary combining email, Teams chats, and Asana tasks into source-tagged bullet points
- **Outlook Email** — View, triage, and reply to inbox messages with infinite scroll
- **Microsoft Teams** — Browse chat conversations with message bubbles and reply via AI
- **Asana Tasks** — View, create, and toggle task completion across Pending/Done/All tabs
- **AI Assistant** — Chat with an AI that can directly create and manage Asana tasks via MCP tool calling
- **Notepad** — Local scratchpad for quick notes (IP addresses, serial numbers, etc.)
- **Dark/Light Theme** — Toggle between modes with flash-prevention

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | shadcn/ui + Tailwind CSS 4 |
| AI | Vercel AI SDK + mimo-v2.5 (via OpenCode Go) |
| Integrations | Microsoft Graph API, Asana MCP |
| Auth | Custom PKCE OAuth 2.0 |

## Prerequisites

- Node.js 18+
- npm
- **OpenCode API key** for AI features
- **Azure Entra ID App Registration** for Microsoft 365 (optional)
- **Asana MCP App** for task management (optional)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```env
# Required for AI features
OPENCODE_API_KEY=your-opencode-api-key

# Required for Microsoft 365 integration
MS365_CLIENT_ID=your-azure-app-client-id
MS365_TENANT_ID=your-azure-tenant-id

# Required for Asana integration
ASANA_CLIENT_ID=your-asana-mcp-app-client-id
ASANA_CLIENT_SECRET=your-asana-mcp-app-client-secret
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Connecting Integrations

### Microsoft 365

1. Go to **Settings** in the sidebar
2. Click **Sign in with Microsoft 365**
3. Authorize the app in the Microsoft consent screen
4. Your inbox and Teams chats will appear in the dashboard

### Asana

1. Register an MCP app at [app.asana.com/0/my-apps](https://app.asana.com/0/my-apps) (type: MCP app)
2. Add `http://localhost:3000/api/asana/callback` as a redirect URL
3. Go to **Settings** in the sidebar
4. Paste your **Client ID** and **Client Secret**
5. Click **Connect Asana** and authorize
6. Your tasks will appear in the Tasks panel

> **Note:** Asana MCP tokens are only valid for the MCP server, not the Asana REST API.

## Using the AI Assistant

Click the **Ask Assistant** button in the sidebar or the chat icon to open the AI chat drawer.

The assistant can:
- Answer questions about your connected data
- Create Asana tasks on your behalf
- Draft replies to emails and chats
- Provide summaries and analysis

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint (see note below) |

> **Lint note:** The default `npm run lint` may fail with permission errors on `supabase-project/`. Use `npx eslint components app lib hooks` instead.

## Project Structure

```
├── app/                    # Next.js App Router (pages + API routes)
│   ├── api/                # API routes (AI, Asana, Microsoft 365)
│   ├── page.tsx            # Home page
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── dashboard/          # Dashboard panels, briefing, chat, tasks
│   ├── integration-settings/ # Asana & M365 settings forms
│   └── ui/                 # shadcn primitives
├── hooks/                  # Custom React hooks (one per concern)
├── lib/                    # Server helpers, types, OAuth, parsers
└── supabase-project/       # Local Supabase stack (optional, not part of app)
```

## Authentication

Sessions are managed via an `httpOnly` cookie (`sh_sid`) with an in-memory server-side store. This means:
- Sessions persist across page reloads
- Sessions are lost on server restart (intended for demo/development)
- Both OAuth flows use PKCE (no client secrets exposed to the browser)

## Known Issues

- **Turbopack + Supabase permissions:** If `supabase-project/volumes/db/data` has restrictive permissions, Turbopack crashes. Fix with `sudo chmod -R a+rX supabase-project/volumes/db/data` or stop the Docker container.
- **Session loss on restart:** The in-memory session store is cleared when the server stops. This is by design for demo purposes.
- **Asana tokens are MCP-only:** Tokens issued by the Asana MCP OAuth flow cannot be used with the Asana REST API directly.
