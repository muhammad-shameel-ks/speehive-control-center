# SpeeHive Control Center — Production Deployment Guide

**Version:** 1.0  
**Last Updated:** 2026-07-22  
**Platform:** Vercel (Next.js 16)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Incident Response](#incident-response)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Security Considerations](#security-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
│  ┌──────────────┐    ┌──────────────────────────────┐   │
│  │  Next.js 16  │───▶│  Serverless Functions (API)  │   │
│  │  (Edge/SSR)  │    └──────────────┬───────────────┘   │
│  └──────────────┘                   │                   │
│                                     ▼                   │
│              ┌──────────────────────────────────┐       │
│              │        External Services         │       │
│              ├──────────┬───────────┬───────────┤       │
│              │ Supabase │ Asana MCP │ Microsoft │       │
│              │ (Auth/DB)│ (Tasks)   │ 365 Graph │       │
│              └──────────┴───────────┴───────────┘       │
└─────────────────────────────────────────────────────────┘
```

**Key Components:**
- **Frontend:** Next.js 16 App Router with React 19
- **Auth:** Supabase (sessions via httpOnly cookies)
- **AI:** Vercel AI SDK + OpenCode API
- **Integrations:** Asana MCP (OAuth 2.0 + PKCE), Microsoft Graph (OAuth 2.0 + PKCE)

---

## Prerequisites

- [ ] Vercel account with project linked
- [ ] Supabase project provisioned
- [ ] Asana MCP app registered
- [ ] Azure AD App Registration (for M365)
- [ ] OpenCode API key
- [ ] Domain configured in Vercel (if custom domain)

---

## Environment Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENCODE_API_KEY` | API key for AI features | `oc_...` |
| `MS365_CLIENT_ID` | Azure AD app client ID | `xxxxxxxx-xxxx-...` |
| `MS365_TENANT_ID` | Azure AD tenant ID | `xxxxxxxx-xxxx-...` |
| `ASANA_CLIENT_ID` | Asana MCP app client ID | `120...` |
| `ASANA_CLIENT_SECRET` | Asana MCP app client secret | `asec...` |

### Supabase (Auto-configured via Vercel Integration)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `VERCEL_ENV` | Vercel environment | `production` |

### Adding Environment Variables via CLI

```bash
# Add to production
vercel env add OPENCODE_API_KEY production
vercel env add MS365_CLIENT_ID production
vercel env add MS365_TENANT_ID production
vercel env add ASANA_CLIENT_ID production
vercel env add ASANA_CLIENT_SECRET production

# Or import from .env.local (use with caution)
cat .env.local | vercel env push --environment production
```

### Environment Scoping

| Scope | Variables |
|-------|-----------|
| **Production** | All required variables |
| **Preview** | Same as production (for PR previews) |
| **Development** | Use `.env.local` locally |

---

## Deployment Steps

### Method 1: Git-Triggered (Recommended)

Vercel auto-deploys on push to `main`:

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Create a deployment-ready branch
git checkout -b deploy/$(date +%Y-%m-%d)

# 3. Make your changes, then commit
git add .
git commit -m "feat: [description]"

# 4. Push and create PR to main
git push -u origin deploy/$(date +%Y-%m-%d)
gh pr create --title "Deploy: [description]" --body "## Changes\n- ..."

# 5. After review and merge, Vercel auto-deploys
```

### Method 2: Manual Deployment

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### Method 3: Vercel CLI with Confirmation

```bash
# Deploy with explicit confirmation
vercel --prod --yes

# Deploy specific directory
vercel --prod --cwd ./Projects/speehive-control-center
```

### Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase integration connected
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (auto via Vercel)
- [ ] `npm run build` passes locally
- [ ] `npm run lint` passes locally
- [ ] Type checking passes (`npx tsc --noEmit -p tsconfig.check.json`)
- [ ] No secrets in code (check `.gitignore` includes `.env*`)

---

## Post-Deployment Verification

### Automated Health Checks

```bash
# Test API endpoints
curl -s https://your-domain.vercel.app/api/health | jq .

# Test main page loads
curl -s -o /dev/null -w "%{http_code}" https://your-domain.vercel.app

# Test auth endpoint
curl -s https://your-domain.vercel.app/auth/callback -w "%{http_code}" -o /dev/null
```

### Manual Verification Checklist

| Check | Expected | How to Verify |
|-------|----------|---------------|
| Homepage loads | 200 OK | Open in browser |
| Login page works | 200 OK | Navigate to `/login` |
| AI chat responds | 200 OK | Send test message |
| Asana integration | Tasks visible | Connect via Settings |
| M365 integration | Emails visible | Connect via Settings |
| Dark/Light theme | Toggle works | Click theme toggle |
| CSP headers | Present | Check browser DevTools |
| Rate limiting | 429 after limit | Send rapid requests |

### Vercel Dashboard Checks

1. Go to Vercel Dashboard → Your Project → Deployments
2. Verify deployment status is "Ready"
3. Check function logs for errors
4. Review Web Vitals metrics

---

## Rollback Procedures

### Scenario 1: Immediate Rollback via Vercel

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

Or via Vercel Dashboard:
1. Go to **Deployments** tab
2. Find the last working deployment
3. Click **⋮** → **Promote to Production**

### Scenario 2: Git Revert

```bash
# Identify the problematic commit
git log --oneline -10

# Revert the commit
git revert <commit-hash>

# Push to trigger new deployment
git push origin main
```

### Scenario 3: Emergency Rollback (Production Down)

```bash
# 1. Immediately promote last known good deployment
vercel rollback <last-good-deployment-url>

# 2. Notify team
# Post in incident channel: "Rolling back to <commit> due to [issue]"

# 3. Create hotfix branch
git checkout -b hotfix/fix-issue main

# 4. Fix the issue
# ... make changes ...

# 5. Deploy hotfix
git push origin hotfix/fix-issue
gh pr create --title "Hotfix: [issue]" --body "## Fix\n- ..."
```

### Rollback Verification

After rollback, verify:
- [ ] Homepage loads correctly
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] Integrations function
- [ ] No new errors in logs

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P0 - Critical** | Complete outage | 15 minutes | App down, auth broken |
| **P1 - High** | Major feature broken | 1 hour | AI chat fails, integrations down |
| **P2 - Medium** | Minor feature issue | 4 hours | Theme toggle broken, slow responses |
| **P3 - Low** | Cosmetic/UX issue | 24 hours | UI glitch, typo |

### Incident Response Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Detection  │────▶│  Triage &    │────▶│  Mitigation  │
│  (Alert/UX) │     │  Assessment  │     │  (Rollback)  │
└─────────────┘     └──────────────┘     └──────────────┘
                                               │
                       ┌──────────────┐     ┌───▼──────────┐
                       │  Prevention  │◀────│   Resolution │
                       │  (Post-mor)  │     │   & Review   │
                       └──────────────┘     └──────────────┘
```

### Step-by-Step Response

#### P0 - Critical (Complete Outage)

**Time: 0-15 minutes**

1. **Acknowledge** — Post in incident channel:
   ```
   🔴 INCIDENT DECLARED — P0
   Issue: [Brief description]
   Impact: [What's affected]
   IC: [Your name]
   ```

2. **Assess** — Check Vercel status:
   ```bash
   # Check Vercel platform status
   curl -s https://www.vercel-status.com/api/v2/status.json | jq .status

   # Check deployment status
   vercel ls

   # Check function logs
   vercel logs --since 30m
   ```

3. **Mitigate** — Rollback if code-related:
   ```bash
   # Find last good deployment
   vercel ls | head -5

   # Rollback
   vercel rollback <deployment-url>
   ```

4. **Communicate** — Update status:
   ```
   🔄 MITIGATING — P0
   Action: Rolling back to [version]
   ETA: [Estimated time]
   ```

5. **Verify** — Confirm fix:
   ```bash
   # Test critical paths
   curl -s -o /dev/null -w "%{http_code}" https://your-domain.vercel.app
   curl -s https://your-domain.vercel.app/api/health
   ```

**Time: 15-60 minutes**

6. **Investigate** — Root cause analysis:
   - Check Vercel function logs
   - Review recent deployments
   - Check external service status (Supabase, Asana, Microsoft)

7. **Resolve** — If rollback fixed it, proceed to post-mortem. If not:
   - Check environment variables
   - Verify Supabase connectivity
   - Check external API status

**Time: 60+ minutes**

8. **Post-mortem** — Document in incident channel:
   ```
   ✅ RESOLVED — P0
   Duration: [X minutes]
   Root cause: [Description]
   Resolution: [What fixed it]
   Action items: [List]
   ```

#### P1 - High (Major Feature Broken)

1. **Assess** — Determine scope:
   ```bash
   # Check specific feature
   curl -s https://your-domain.vercel.app/api/[broken-feature]
   ```

2. **Mitigate** — Options:
   - Feature flag (if available)
   - Targeted rollback
   - Hotfix

3. **Communicate**:
   ```
   🟡 INVESTIGATING — P1
   Issue: [Feature] not working
   Impact: [Users affected]
   ```

#### P2/P3 - Medium/Low

1. Create issue in project tracker
2. Assign to appropriate team member
3. Schedule fix for next sprint

### External Service Outages

| Service | Status Page | Common Issues |
|---------|-------------|---------------|
| Vercel | [vercel-status.com](https://vercel-status.com) | Platform-wide outages |
| Supabase | [status.supabase.com](https://status.supabase.com) | Auth/DB connectivity |
| Asana | [status.asana.com](https://status.asana.com) | MCP server issues |
| Microsoft 365 | [status.office.com](https://status.office.com) | Graph API downtime |

### Communication Templates

#### Initial Acknowledgment
```
🔴 INCIDENT — P0
Issue: [Description]
Impact: [What's broken]
Investigating now. Updates every 15 minutes.
```

#### Investigation Update
```
🔄 INVESTIGATING — P0
Finding: [What we've found so far]
Next step: [What we're trying]
ETA: [Updated estimate]
```

#### Resolution
```
✅ RESOLVED — P0
Duration: [X minutes]
Root cause: [Brief description]
Fix: [What we did]
Post-mortem: [Link to document]
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 1% | Investigate immediately |
| Response time | > 2s | Check function cold starts |
| Function duration | > 10s | Optimize or increase limits |
| Memory usage | > 80% | Scale up or optimize |

### Vercel Monitoring Setup

1. **Enable Vercel Analytics** (Settings → Analytics)
2. **Enable Speed Insights** (Settings → Speed Insights)
3. **Set up Log Drains** (Settings → Log Drains)

### Recommended Alerts

```yaml
# Example: Vercel Alerts Configuration
alerts:
  - name: High Error Rate
    metric: error_rate
    threshold: 0.01
    window: 5m
    
  - name: Slow Response Time
    metric: response_time_p95
    threshold: 2000
    window: 5m
    
  - name: Function Failures
    metric: function_errors
    threshold: 10
    window: 5m
```

### Uptime Monitoring

Consider external monitoring services:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **Better Uptime**

Configure to check:
- `https://your-domain.vercel.app` (200 OK)
- `https://your-domain.vercel.app/api/health` (200 OK)

---

## Security Considerations

### Pre-Deployment Security Checklist

- [ ] No secrets in code (`.env*` in `.gitignore`)
- [ ] All environment variables encrypted in Vercel
- [ ] CSP headers configured (`next.config.ts`)
- [ ] Rate limiting enabled (`lib/rate-limit.ts`)
- [ ] OAuth flows use PKCE
- [ ] Tool allowlisting active (`app/api/asana/tasks/route.ts`)
- [ ] Error messages sanitized (no internal details exposed)

### Production Security Headers

Verified in `next.config.ts`:
```
Content-Security-Policy: [configured]
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Secret Rotation Schedule

| Secret | Rotation Frequency | Last Rotated |
|--------|-------------------|--------------|
| `OPENCODE_API_KEY` | Every 90 days | [Date] |
| `MS365_CLIENT_SECRET` | Every 90 days | [Date] |
| `ASANA_CLIENT_SECRET` | Every 90 days | [Date] |
| `SUPABASE_SERVICE_ROLE_KEY` | Every 180 days | [Date] |

### Emergency Secret Rotation

If a secret is compromised:

```bash
# 1. Generate new secret in provider dashboard
# 2. Update in Vercel
vercel env rm [SECRET_NAME] production
vercel env add [SECRET_NAME] production

# 3. Redeploy to apply changes
vercel --prod
```

---

## Appendix

### Useful Commands

```bash
# Vercel CLI
vercel --prod                    # Deploy to production
vercel ls                        # List deployments
vercel logs                      # View function logs
vercel rollback [url]            # Rollback deployment
vercel env ls                    # List environment variables
vercel env rm [name] [scope]     # Remove env variable
vercel env add [name] [scope]    # Add env variable

# Git operations
git log --oneline -10            # View recent commits
git revert <commit-hash>         # Revert a commit
git diff main..feature-branch    # Compare branches

# Local verification
npm run build                    # Production build
npm run lint                     # Run linter
npx tsc --noEmit -p tsconfig.check.json  # Type check
```

### Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Next.js 16 Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Asana MCP Documentation](https://developers.asana.com/docs/mcp)

---

*Document generated by SpeeHive AI on 2026-07-22*
