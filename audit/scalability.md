# Scalability Audit — Ajently MVP v1

> Target scale: 10M+ users globally, with initial focus on African user base
> Audit date: 2026-02-28

---

## 1. Current Bottleneck Map

```
User Request
    │
    ▼
Next.js Server (single instance)
    │
    ├──► SQLite (sql.js, in-memory) ◄── BOTTLENECK #1: No horizontal scale
    │         write serialized via promise queue
    │
    ├──► 0G Storage Indexer ──────────── BOTTLENECK #2: Single RPC endpoint, no failover
    │         synchronous upload (can take 10-30s)
    │
    ├──► 0G Compute Broker ───────────── BOTTLENECK #3: Single provider, no load balancing
    │         or OpenRouter (centralized)
    │
    └──► Local filesystem ────────────── BOTTLENECK #4: Knowledge files on server disk
              (knowledge files stored at knowledgeLocalPath)
```

---

## 2. Bottleneck Analysis

### BOTTLENECK #1 — SQLite In-Process Database

**Severity**: Critical (production blocker)

**Current behavior**:
- `sql.js` loads entire SQLite file into WASM memory on startup
- Every write operation serializes via a JavaScript promise queue (`writeQueue`)
- After each write, the full database is exported and written to disk (`persistDatabase()`)
- Single Next.js process owns the database lock

**At 100 concurrent users**: Write queue creates head-of-line blocking. A slow write (e.g., complex credit reconciliation) stalls all subsequent writes. Response times degrade to seconds.

**At 10,000 users**: The in-memory database would exceed 500MB. Node.js heap pressure triggers GC pauses. Disk write amplification (exporting full DB per write) exhausts I/O budget.

**At 10M users**: Impossible. This architecture cannot scale horizontally.

**Solution path**:
```
Phase 1 (MVP+):  Turso (libSQL) — drop-in replacement, edge-compatible, sync replicas
Phase 2 (Scale): PlanetScale / Neon Postgres — full RDBMS, connection pooling
Phase 3 (Global): CockroachDB / Vitess — distributed SQL with geo-partitioning
```

**Migration cost**: Low. The `withRead`/`withWrite` abstraction in `lib/db.ts` can be reimplemented for any SQL client with minimal query changes.

---

### BOTTLENECK #2 — 0G Storage Single Endpoint

**Severity**: High

**Current behavior**:
```typescript
// lib/zero-g/storage.ts
const indexer = new Indexer(process.env.ZERO_G_STORAGE_INDEXER_RPC!);
// Single indexer instance, no failover
```

**At 1,000 agent publishes/day**: 0G testnet indexer RPC is a community resource. No SLA. Downtime causes all publish operations to fail.

**African infra concern**: `https://indexer-storage-testnet-turbo.0g.ai` has no documented edge presence in Sub-Saharan Africa. Latency from Lagos/Nairobi to the nearest 0G node (likely US/EU) adds 200-400ms per operation — acceptable for web but painful for upload flows that chain multiple round-trips.

**Solution**:
```typescript
// lib/storage/adapter.ts — multi-endpoint with retry
const INDEXER_ENDPOINTS = [
  process.env.ZERO_G_STORAGE_INDEXER_RPC!,
  process.env.ZERO_G_STORAGE_INDEXER_RPC_FALLBACK_1,
  process.env.ZERO_G_STORAGE_INDEXER_RPC_FALLBACK_2,
].filter(Boolean);

async function uploadWithRetry(data: Uint8Array): Promise<UploadResult> {
  for (const endpoint of INDEXER_ENDPOINTS) {
    try {
      return await uploadToEndpoint(endpoint, data);
    } catch {
      continue;
    }
  }
  throw new Error("All storage endpoints failed");
}
```

---

### BOTTLENECK #3 — Synchronous AI Inference in Request/Response

**Severity**: High

**Current behavior**: `POST /api/agents/:id/run` is a synchronous HTTP call. The client waits until AI inference completes (can be 5-60 seconds). This:
- Blocks a Next.js request handler thread for the full inference duration
- Causes gateway timeouts on edge deployments (Vercel: 30s max by default)
- Provides no progress visibility to the user

**Solution**:
```
Phase 1: Server-Sent Events (SSE) for streaming responses (already partially enabled
         via @ai-sdk/react which supports streaming — the chat client likely already does this)
Phase 2: Background job queue (BullMQ / Inngest) for async inference:
         POST /run → returns { jobId }
         GET  /run/:jobId → streams status + output
```

---

### BOTTLENECK #4 — Knowledge Files on Server Filesystem

**Severity**: Medium

**Current behavior**:
```typescript
// lib/agent-service.ts
knowledgeLocalPath: string | null; // absolute path on server disk
```

Knowledge files are stored at paths like `data/uploads/knowledge-file.txt` on the Next.js server's local filesystem. This breaks horizontal scaling entirely — a second server instance has no access to files uploaded to the first.

**Solution**: Upload knowledge files directly to the target decentralized storage layer at create time (not just at publish time). Store the content-addressed URI, not the local path.

---

### BOTTLENECK #5 — No Caching Layer

**Severity**: Medium

Every `GET /api/agents` request hits SQLite directly. There is no caching of:
- Agent listings (changes rarely)
- Agent detail pages (changes only on publish)
- User credit balances (changes only on run/topup)

**Solution**: Add stale-while-revalidate caching:
```typescript
// In route handlers:
return NextResponse.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
  },
});

// For user-specific data (credits, runs):
// Cache at CDN layer with Vary: Authorization
```

---

## 3. Scalability Dimension Assessment

| Dimension | Current | 10K Users | 1M Users | 10M Users |
|-----------|---------|-----------|----------|-----------|
| Database | sql.js WASM | ❌ Fails | ❌ Fails | ❌ Fails |
| Storage RPC | Single endpoint | ⚠ Risky | ❌ Fails | ❌ Fails |
| Compute | Single provider | ⚠ Risky | ❌ Fails | ❌ Fails |
| Auth | None (demo user) | ❌ Fails | ❌ Fails | ❌ Fails |
| Knowledge files | Local FS | ❌ Fails | ❌ Fails | ❌ Fails |
| Caching | None | ⚠ Slow | ❌ Fails | ❌ Fails |
| CDN/Edge | None configured | ⚠ Slow | ❌ Fails | ❌ Fails |

---

## 4. Scalability Roadmap

### Phase 1 — MVP+ (0→1K users, ~4 weeks)
- [ ] Replace sql.js → Turso libSQL (same SQL API, edge-compatible)
- [ ] Add SIWE auth + user isolation
- [ ] Move knowledge files to decentralized storage at upload time
- [ ] Add SSE streaming for inference responses
- [ ] Cache public agent listings (30s TTL)

### Phase 2 — Growth (1K→100K users, ~3 months)
- [ ] Multi-region deployment (Cloudflare Workers / Vercel Edge)
- [ ] Multi-endpoint storage with automatic failover
- [ ] Background job queue for heavy operations (publish, sync)
- [ ] African RPC infrastructure (Ankr Africa nodes, self-hosted fallback)
- [ ] CDN for static agent card images and manifests

### Phase 3 — Scale (100K→10M+ users, ~6 months)
- [ ] Postgres (Neon/PlanetScale) with read replicas
- [ ] Dedicated inference infrastructure (multiple providers, load balancing)
- [ ] On-chain credit registry (move credits from SQLite to smart contract)
- [ ] Multi-region object storage (Cloudflare R2 + decentralized layer)
- [ ] Observability stack (OpenTelemetry + Grafana)

---

## 5. African Infrastructure Specific Analysis

### Current Connectivity Gaps
- 0G testnet RPC endpoints (`evmrpc-testnet.0g.ai`, `indexer-storage-testnet-turbo.0g.ai`) have no documented PoP in Africa
- Round-trip from Lagos to EU: ~150-200ms. From Nairobi: ~180-250ms
- OpenRouter endpoints (US-based) add similar latency

### Low-Bandwidth Optimizations Required
- Agent manifests are JSON (<10KB) — acceptable, but should be compressed
- Knowledge files can be large (PDFs, text docs) — need streaming downloads
- Chat UI should implement optimistic UI with local state, not wait for full server round-trip
- Mobile data costs: compress all API responses with Brotli
- Offline-capable manifest cache: Service Worker with IndexedDB for agent catalog

### Recommended African Infrastructure Partners
| Provider | Coverage | Use Case |
|----------|----------|----------|
| Cloudflare | 100+ African cities | CDN, Edge Functions, R2 storage |
| Hetzner Ashburn + Frankfurt | Decent African latency | Next.js hosting |
| Ankr | Multi-chain RPCs, some African PoP | EVM RPC fallback |
| Fuse Network | Africa-focused DeFi L2 | Payment rails consideration |
| MTN / Airtel APIs | Direct mobile money | Africa fiat onramp |
