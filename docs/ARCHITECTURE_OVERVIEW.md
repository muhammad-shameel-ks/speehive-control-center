# SpeeHive Control Centre: Architecture & Infrastructure Overview

A high-level overview of the technology stack, system architecture, self-hosted infrastructure, deployment strategy, and getting-started guide for **SpeeHive Control Centre**.

---

## 1. System Architecture & Tech Stack

SpeeHive Control Centre is a unified IT management dashboard that brings together email, team chat, task management, and AI-driven summaries into a single interface.

```mermaid
flowchart TD
    subgraph External Client Access
        User([User Browser])
    end

    subgraph Tailscale Mesh Network
        Funnel[Tailscale Funnel / Public HTTPS]
        Node[Bare Metal Server]
    end

    subgraph Docker Container Environment
        NextApp[SpeeHive Next.js App Container]
    end

    subgraph Self-Hosted Supabase Infrastructure
        Kong[Supabase API Gateway / Kong]
        Auth[Supabase Auth Engine]
        DB[(PostgreSQL Database)]
    end

    subgraph Third-Party APIs & Services
        M365[Microsoft Graph API\n(Outlook & Teams)]
        Asana[Asana REST API]
        AI[AI SDK Provider / LLM]
    end

    User -->|HTTPS| Funnel
    Funnel -->|Public TLS Endpoint| Node
    Node -->|Port 3010| NextApp
    NextApp -->|OAuth & Sync| M365
    NextApp -->|OAuth & Sync| Asana
    NextApp -->|LLM Requests| AI
    NextApp -->|DB Queries / Auth| Kong
    Kong --> Auth
    Kong --> DB
```

### Core Technologies

* **Frontend & Server Framework**: Next.js 16 (App Router) built with TypeScript.
* **UI & Styling**: Tailwind CSS 4, shadcn/ui components, and custom CSS design tokens.
* **Database & Persistence**: Self-hosted Supabase stack backed by PostgreSQL (storing users, integration state, and app data).
* **Integrations**:
  * **Microsoft 365**: Graph API via PKCE OAuth 2.0 (Outlook Mail & Teams Chat).
  * **Asana**: REST API via OAuth 2.0 (Tasks & Workspaces).
  * **AI Assistant**: Vercel AI SDK for chat, function/tool calling, and summary generation.

---

## 2. Infrastructure & Self-Hosting Model

The system is designed to run completely on self-hosted infrastructure, avoiding vendor lock-in and minimizing third-party cloud hosting overhead.

### 🏢 Bare Metal Host
The system is deployed on a dedicated bare-metal Linux server running Docker Engine and Docker Compose.

### 🐳 Docker Containerization
* **Standalone Build**: Next.js is configured for multi-stage Docker builds outputting a lightweight node server via `.next/standalone`.
* **Container Port**: Exposed on port `3010` inside the host docker network.

### ⚡ Self-Hosted Supabase
Instead of relying on Supabase Cloud, the backend database and Auth engines run self-hosted via Docker:
* PostgreSQL container for persistent storage.
* Supabase GoTrue / Auth service for credential management.
* Kong API Gateway routing `/rest/v1`, `/auth/v1`, and realtime services.

### 🔒 Public Access via Tailscale Funnel
Rather than exposing open port forwards, public IP addresses, or setting up complex Nginx reverse proxies with certbot SSL:
* **Tailscale** runs on the bare metal host.
* **Tailscale Funnel** routes secure, public HTTPS traffic straight from a custom URL (e.g. `https://speehive.your-domain.ts.net`) down to the local Docker container running on port `3010`.
* Provides automatic SSL/TLS encryption without needing complex certificate management.

---

## 3. Getting Started Guide

### Prerequisites
* **Docker Engine** & **Docker Compose** installed on your host.
* **Tailscale CLI** installed and logged into your Tailnet.
* **Node.js 18+** (for local development).

---

### Step 1: Clone & Configure Environment

Clone the repository and copy the environment template:

```bash
git clone https://github.com/speehive/speehive-control-centre.git
cd speehive-control-centre
cp .env.example .env.local
```

Configure required variables in `.env.local`:

```env
# Database & Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Integration Credentials
MS365_CLIENT_ID=your-azure-app-client-id
MS365_TENANT_ID=your-azure-tenant-id

ASANA_CLIENT_ID=your-asana-client-id
ASANA_CLIENT_SECRET=your-asana-client-secret

# AI Features
OPENCODE_API_KEY=your-ai-api-key
```

---

### Step 2: Database Setup (Self-Hosted Supabase)

If setting up the database manually on your self-hosted Supabase instance:

1. Execute `schema.sql` to initialize tables, user integration records, and indexes.
2. Execute `roles.sql` and `data.sql` to populate initial seed configurations.

---

### Step 3: Run via Docker Compose

Build and launch the application container:

```bash
docker compose up -d --build
```

Verify that the container is running and healthy:

```bash
docker ps
```

The application is now active locally on `http://localhost:3010`.

---

### Step 4: Expose Securely via Tailscale Funnel

To make the dashboard accessible securely from anywhere without opening firewall ports:

1. Turn on Tailscale Funnel on your bare metal host:
   ```bash
   tailscale funnel 3010
   ```
2. Tailscale will output your public HTTPS domain (e.g., `https://speehive-control-centre.tailscale.net`).
3. Update your Microsoft 365 Azure App Registration and Asana Developer App OAuth redirect URLs to use your new Tailscale domain callback endpoints:
   * `https://speehive-control-centre.tailscale.net/api/ms365/callback`
   * `https://speehive-control-centre.tailscale.net/api/asana/callback`

---

## 4. Operational Summary

| Aspect | Implementation |
| :--- | :--- |
| **Hosting** | Self-hosted bare metal Linux server |
| **Orchestration** | Docker & Docker Compose |
| **App Server** | Next.js 16 (App Router, standalone Node container) |
| **Database** | Self-hosted Supabase (PostgreSQL + Auth + Kong) |
| **Networking & Ingress** | Tailscale Funnel (encrypted HTTPS mesh entry point) |
| **Authentication** | PKCE OAuth 2.0 (M365 & Asana integrations) |
