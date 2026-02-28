# Infrastructure Plan — Ajently

> Document date: 2026-02-28
> Phases: MVP+ → Growth → Global Scale

---

## 1. Infrastructure Provider Strategy

### Primary Stack

| Layer | Provider | Why |
|-------|----------|-----|
| App hosting | Vercel (Edge Functions) | Zero-config Next.js; global edge; Africa PoPs via Cloudflare |
| CDN + Edge | Cloudflare (Pro/Business) | 100+ Africa PoPs; R2 object storage; Workers for edge logic |
| Database | Turso (libSQL) | Edge replicas; SQLite-compatible; horizontal reads globally |
| Object storage | Cloudflare R2 | S3-compatible; no egress fees; global CDN |
| Decentralized storage | Arweave + Filecoin/Lighthouse | Permanent + verifiable |
| Monitoring | Axiom + Sentry | Structured logs + error tracking |
| RPC | Ankr / Alchemy / Infura | Multi-provider with failover |
| Secrets | Doppler / Infisical | Environment secrets management |

### Cost Estimate (per month at various scales)

| Scale | Vercel | Turso | Cloudflare | Storage | RPC | Total |
|-------|--------|-------|------------|---------|-----|-------|
| 0-1K users | Free / $20 | Free | Free | ~$5 | Free | ~$25 |
| 1K-10K | $20 | $29 | $20 | ~$20 | $50 | ~$120 |
| 10K-100K | $150 | $99 | $200 | ~$100 | $200 | ~$750 |
| 100K-1M | $500 | $499 | $500 | ~$500 | $500 | ~$2,500 |
| 1M+ | Custom | Custom | Custom | ~$2K | $2K | ~$10K+ |

---

## 2. Deployment Architecture (Phase 1: MVP+)

```
                    Cloudflare DNS + WAF
                           │
                    ┌──────▼──────────────────────────────┐
                    │        Vercel Edge Network           │
                    │   Frankfurt · Singapore · US-East    │
                    │   + Cloudflare Africa PoPs          │
                    │   (Lagos, Nairobi, Johannesburg)    │
                    └──────┬──────────────────────────────┘
                           │
              ┌────────────┴──────────────┐
              │                           │
     ┌────────▼────────┐        ┌─────────▼──────────┐
     │  Next.js SSR     │        │  Cloudflare R2      │
     │  (Vercel Fn)     │        │  Card images        │
     │  API routes      │        │  Static assets      │
     │  Edge middleware  │        │  Manifest cache     │
     └────────┬─────────┘        └────────────────────┘
              │
     ┌────────▼─────────────────────────────────────┐
     │              Turso Database                   │
     │  Primary: eu-central (Frankfurt)              │
     │  Replicas: us-east-1, ap-southeast-1         │
     │  Edge reads: <10ms globally                  │
     └────────┬─────────────────────────────────────┘
              │
     ┌────────┴──────────────────────────────────────┐
     │                                               │
  ┌──▼──────────────┐   ┌──────────────────────────┐ │
  │  Arweave Network │   │  Filecoin / Lighthouse   │ │
  │  Permanent       │   │  Knowledge files         │ │
  │  manifests       │   │  IPFS retrieval          │ │
  └─────────────────┘   └──────────────────────────┘ │
                                                      │
  ┌───────────────────────────────────────────────┐   │
  │  OpenRouter API (Compute)                     │   │
  │  Multi-model routing (18+ models)             │   │
  └───────────────────────────────────────────────┘   │
```

---

## 3. Environment Configuration (Production)

```bash
# ── Authentication ──────────────────────────────────────────
JWT_SECRET=<256-bit random>
JWT_EXPIRES_IN=24h
SIWE_DOMAIN=guild.io  # or chosen domain

# ── Database ─────────────────────────────────────────────────
TURSO_DATABASE_URL=libsql://ajently-org.turso.io
TURSO_AUTH_TOKEN=<turso-auth-token>

# ── Storage ──────────────────────────────────────────────────
STORAGE_PROVIDER=arweave+filecoin  # or "0g" for backward compat
ARWEAVE_JWK=<arweave-wallet-jwk-json>
LIGHTHOUSE_API_KEY=<lighthouse-api-key>

# ── CDN ──────────────────────────────────────────────────────
CLOUDFLARE_R2_ACCOUNT_ID=<account-id>
CLOUDFLARE_R2_ACCESS_KEY=<access-key>
CLOUDFLARE_R2_SECRET_KEY=<secret-key>
CLOUDFLARE_R2_BUCKET=ajently-assets

# ── Compute ──────────────────────────────────────────────────
OPENROUTER_API_KEY=<openrouter-key>
COMPUTE_PROVIDER=openrouter  # or "0g", "eigenLayer"

# ── Blockchain ───────────────────────────────────────────────
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<wc-project-id>
NEXT_PUBLIC_CHAIN_ID=8453  # Base mainnet
TOPUP_TREASURY_ADDRESS=<treasury-address>

# ── Fiat Onramp ──────────────────────────────────────────────
NEXT_PUBLIC_TRANSAK_API_KEY=<transak-key>

# ── RPC Providers ────────────────────────────────────────────
RPC_ETHEREUM=https://eth.llamarpc.com
RPC_BASE=https://mainnet.base.org
RPC_POLYGON=https://polygon-rpc.com
RPC_ARBITRUM=https://arb1.arbitrum.io/rpc

# ── Monitoring ───────────────────────────────────────────────
AXIOM_TOKEN=<axiom-token>
AXIOM_DATASET=ajently-prod
SENTRY_DSN=<sentry-dsn>

# ── Security ─────────────────────────────────────────────────
PAYMENTS_WEBHOOK_SECRET=<webhook-secret>
RATE_LIMIT_UPSTASH_URL=<upstash-redis-url>
RATE_LIMIT_UPSTASH_TOKEN=<upstash-token>
```

---

## 4. Database Migration Plan (sql.js → Turso)

### Step 1: Schema Parity (Day 1-2)
```sql
-- Turso DDL (identical to sql.js schema; libSQL is SQLite-compatible)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  credits REAL NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  -- ... (identical columns)
  storage_provider TEXT NOT NULL DEFAULT '0g',  -- NEW: track which storage
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- New for auth:
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  wallet_address TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Client Swap (Day 3-4)
```typescript
// lib/db.ts — before (sql.js)
import initSqlJs from "sql.js";

// lib/db.ts — after (Turso)
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// withRead / withWrite now use db.execute() / db.batch()
export async function withRead<T>(fn: (db: LibSQLClient) => Promise<T>): Promise<T> {
  return fn(db);
}
```

### Step 3: Data Migration (Day 5)
```bash
# Export existing SQLite data
sqlite3 data/Ajently.sqlite .dump > migration.sql

# Apply to Turso
turso db shell ajently < migration.sql
```

---

## 5. Monitoring & Observability Stack

```
User Request
    │
    ├── Cloudflare WAF metrics → Cloudflare Analytics
    │
    ├── Next.js Edge → Vercel Analytics (Core Web Vitals)
    │
    ├── API Routes → Axiom (structured logs)
    │   {
    │     timestamp, route, method, status, duration_ms,
    │     userId, walletAddress, agentId, computeMode,
    │     storageMode, creditsUsed
    │   }
    │
    ├── Errors → Sentry (stack traces, replay)
    │
    ├── Blockchain events → The Graph (subgraph for Base contracts)
    │
    └── Alerts → PagerDuty / Telegram bot
        Rules:
        - Error rate > 5% for 5 minutes
        - P95 latency > 5s
        - Credit balance < 10 ETH
        - Storage wallet balance < 0.5 ETH
        - Database connection failures
```

---

## 6. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run type-check
      - run: bun run test  # when tests exist

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
```

---

## 7. Disaster Recovery

### Backup Strategy
- **Database**: Turso automated daily backups + point-in-time recovery (paid plan)
- **Arweave**: Permanent by design — no backup needed
- **Filecoin**: Deals last 18+ months; re-pin at deal expiry
- **Cloudflare R2**: Cross-region replication enabled

### Recovery Time Objectives
| Component | RTO | RPO | Strategy |
|-----------|-----|-----|----------|
| Database | <15 min | <1 hour | Turso point-in-time restore |
| App hosting | <5 min | 0 | Vercel rollback |
| Storage layer | 0 (permanent) | 0 | Arweave is immutable |
| CDN assets | <30 min | <24h | R2 cross-region |

### Runbook — Database Failure
```bash
# 1. Verify failure
turso db shell ajently "SELECT 1;"

# 2. Check Turso status page
# status.turso.tech

# 3. Rollback to last known good
turso db restore ajently --timestamp "2026-02-28T10:00:00Z"

# 4. Verify data integrity
turso db shell ajently "SELECT COUNT(*) FROM agents WHERE published = 1;"

# 5. Re-enable traffic (remove maintenance mode flag)
```
