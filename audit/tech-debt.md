# Technical Debt Register — Guild MVP v1

> Audit date: 2026-02-28
> Priority: P0 (production blocker) → P3 (nice to have)

---

## P0 — Production Blockers (Must fix before any real-user deployment)

### TD-P0-01: Single Demo User Architecture
**Files**: `lib/agent-service.ts:19`, all `app/api/*/route.ts`
**Debt**: `DEMO_USER_ID = 1` hardcoded. No authentication. No user isolation.
**Impact**: All users share one account. Credits, agents, and runs are not user-separated.
**Effort**: High (2-3 weeks) — requires SIWE auth, session management, DB schema change
**Solution**: Add SIWE auth middleware + replace all `DEMO_USER_ID` references with `getCurrentUser(request).id`

### TD-P0-02: sql.js Cannot Scale Horizontally
**Files**: `lib/db.ts`
**Debt**: In-memory WASM SQLite. Cannot run multiple server instances.
**Impact**: All data lost on deploy if `data/Guild.sqlite` is not mounted. Cannot load-balance.
**Effort**: Medium (1 week) — `withRead`/`withWrite` abstraction makes DB swap clean
**Solution**: Migrate to Turso libSQL (drop-in) or Postgres (Neon/Supabase)

### TD-P0-03: Knowledge Files on Local Filesystem
**Files**: `lib/agent-service.ts:655-661`, `lib/db.ts:283-289`
**Debt**: `knowledge_local_path` stored as absolute server path. Files don't survive redeploy.
**Impact**: Agent knowledge files are lost on deployment restart.
**Effort**: Medium (1 week) — need to upload to decentralized storage at create time
**Solution**: Upload knowledge to Lighthouse/Arweave at creation; store CID only

### TD-P0-04: No Rate Limiting
**Files**: `app/api/agents/[id]/run/route.ts`, `app/api/credits/onchain/route.ts`
**Debt**: No rate limiting on any endpoint.
**Impact**: API abuse, credit drain, OpenRouter key exhaustion, storage wallet drain.
**Effort**: Low (2-3 days) — Upstash Ratelimit or Next.js middleware
**Solution**: Add sliding window rate limit per wallet + per IP on write operations

---

## P1 — High Priority (Must fix before public beta)

### TD-P1-01: Fake Storage Proofs in Demo Data
**Files**: `lib/db.ts:314-329`
**Debt**: Demo agents have `storage_hash = "demo-*-hash"`, non-verifiable
**Impact**: Storage verification endpoint fails for all demo agents. Misleads judges/investors.
**Effort**: Low (1 day) — either publish real manifests or flag as `is_demo = true`

### TD-P1-02: System Prompt Exposed in API Responses
**Files**: `app/api/agents/route.ts`, `app/api/agents/[id]/route.ts`
**Debt**: Full `AgentRecord` including `systemPrompt` returned to any caller
**Impact**: Creator IP stolen; competitive moat destroyed.
**Effort**: Low (2-3 hours) — add `toPublicAgent()` mapper that strips sensitive fields

### TD-P1-03: No Request Validation Beyond Zod Parse
**Files**: `lib/validation.ts`
**Debt**: Zod schemas exist but message length limits, model allow-list checks may be incomplete
**Impact**: Oversized inputs reach AI providers; invalid model strings cause confusing errors
**Effort**: Low (2 hours) — review and tighten all Zod schemas

### TD-P1-04: Card Images Stored as base64 in SQLite
**Files**: `lib/db.ts:184`, `lib/agent-service.ts:259`
**Debt**: `card_image_data_url TEXT` column stores base64-encoded PNG. This bloats the database significantly as agents scale.
**Impact**: Each card image adds ~200-500KB to the SQLite file. At 10K agents, the DB is 2-5GB just from card images.
**Effort**: Medium (3-5 days) — upload images to object storage (Cloudflare R2/S3) at create time; store URL only

### TD-P1-05: Synchronous Upload Blocks HTTP Response
**Files**: `app/api/agents/[id]/publish/route.ts`
**Debt**: Agent publish awaits all storage uploads synchronously before returning HTTP response. Can timeout on Vercel (30s limit).
**Impact**: Publish fails intermittently for large knowledge files or slow 0G network.
**Effort**: Medium (1 week) — implement async job queue; return `{ jobId }` immediately

### TD-P1-06: No Logging or Observability
**Files**: All
**Debt**: No structured logging, no tracing, no error monitoring
**Impact**: Cannot diagnose production failures. No visibility into latency or error rates.
**Effort**: Low (1-2 days) — add Pino logger + Sentry for error capture

---

## P2 — Medium Priority (Polish before launch)

### TD-P2-01: WalletConnect Fallback Project ID
**Files**: `components/web3-provider.tsx:39`
**Debt**: Falls back to `"00000000..."` when env missing. WalletConnect SDK may reject fake IDs silently.
**Effort**: Trivial — fail-closed with clear error message

### TD-P2-02: No Environment Variable Validation on Startup
**Files**: `.env.example`
**Debt**: App boots successfully even with missing critical env vars; failures surface at runtime
**Effort**: Low (2 hours) — add startup validation using Zod or `envalid`
```typescript
// lib/env.ts
import { z } from "zod";
const env = z.object({
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().min(1),
  ZERO_G_EVM_RPC: z.string().url(),
  // ...
}).parse(process.env);
```

### TD-P2-03: Model List Is a Hardcoded Const Array
**Files**: `lib/types.ts:14-33`
**Debt**: Adding/removing supported models requires a code change + redeploy
**Effort**: Low (3 hours) — move to `data/models.json` or database-backed config

### TD-P2-04: No Pagination on Listings
**Files**: `lib/agent-service.ts:163-202`, `app/api/agents/route.ts`
**Debt**: `listAgents()` returns all agents with no cursor/offset pagination. `LIMIT 25` on runs, `LIMIT 40` on recent runs — inconsistent.
**Effort**: Low (1 day) — add `limit`/`cursor` params to list functions and API routes

### TD-P2-05: write-queue Error Swallowing
**Files**: `lib/db.ts:407`
```typescript
writeQueue = operation.catch(() => undefined); // silently swallows errors
```
**Debt**: Write errors are eaten to prevent the queue from stalling. But this means failed writes leave the system in an inconsistent state without surfacing errors.
**Effort**: Low (2 hours) — separate queue-health management from error propagation

### TD-P2-06: No Content Security Policy
**Files**: `next.config.ts`
**Debt**: No CSP, X-Frame-Options, or HSTS headers configured
**Effort**: Low (2 hours) — add Next.js `headers()` config

### TD-P2-07: `ensureColumn` Runs on Every Startup
**Files**: `lib/db.ts:196-200`
**Debt**: Schema migration via `ensureColumn()` + `MODEL_MIGRATIONS` runs on every cold start. Harmless but unnecessary overhead.
**Effort**: Low (2 hours) — introduce a schema version table; run migrations only when version changes

---

## P3 — Low Priority / Nice to Have

| ID | Debt | Effort | Notes |
|----|------|--------|-------|
| TD-P3-01 | `queryOne` uses `queryAll` and discards all but first row | Trivial | Minor inefficiency; use `LIMIT 1` in SQL |
| TD-P3-02 | Demo agents have hardcoded `creator_id = 1` | Low | Needs user model first |
| TD-P3-03 | `resolveOpenRouterModel()` uses string matching for image-only models | Low | Should be driven by `AGENT_MODEL_BADGES` type |
| TD-P3-04 | `getAgentById` does `SELECT *` — over-fetches | Low | Define specific column list |
| TD-P3-05 | `ZERO_G_AUTO_SYNC_STORAGE_ON_HOME` env feature — runs publish on home page load | Low | Dangerous in production; should be a CLI command |
| TD-P3-06 | No dark mode support despite `next-themes` installed | Medium | UI work required |
| TD-P3-07 | TypeScript `as never` cast in storage upload | Trivial | `lib/zero-g/storage.ts:135` — SDK typing workaround |

---

## Debt Summary

| Priority | Count | Estimated Total Effort |
|----------|-------|----------------------|
| P0 | 4 | 6-8 weeks (2 engineers) |
| P1 | 6 | 3-4 weeks (2 engineers) |
| P2 | 7 | 1-2 weeks (1 engineer) |
| P3 | 7 | 3-5 days (1 engineer) |

**To reach production-ready (P0+P1 resolved)**: ~9-12 engineer-weeks
**For full polish (all priorities)**: ~12-16 engineer-weeks

> Note: P0 and P1 items should be resolved in parallel, not sequentially. Auth (P0-01) and DB migration (P0-02) are prerequisites for most P1 items.
