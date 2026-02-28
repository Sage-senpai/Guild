# Architecture Audit — Ajently MVP v1

> Audit date: 2026-02-28
> Auditor role: Principal Web3 Systems Architect
> Codebase: Next.js 16 App Router · TypeScript · SQLite · 0G Storage · 0G Compute · RainbowKit/Wagmi

---

## 1. System Overview

Ajently is an **AI Agent Marketplace** — a platform where creators publish AI agents (with system prompts, optional knowledge files, and pricing) and users run them through a credit-based economy. The MVP is a hackathon submission demonstrating 0G Storage + Compute integration.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  RainbowKit + Wagmi (wallet)  ·  React 19  ·  TailwindCSS      │
│  Routes: / · /create · /agents/[id] · /profile · /credits      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP (Next.js API routes)
┌──────────────────────────────▼──────────────────────────────────┐
│                     SERVER (Next.js 16)                         │
│  App Router API Routes (13 endpoints)                           │
│  lib/agent-service.ts  ←→  lib/db.ts (sql.js / SQLite)         │
│  lib/publish-agent.ts  →   lib/zero-g/storage.ts               │
│  lib/zero-g/compute.ts                                          │
└────────┬───────────────────────────────────────┬────────────────┘
         │                                       │
┌────────▼────────┐                   ┌──────────▼──────────────┐
│  0G Storage     │                   │  AI Compute Layer        │
│  Indexer RPC    │                   │  • 0G Serving Broker     │
│  EVM RPC (0G)   │                   │  • OpenRouter fallback   │
│  Merkle proofs  │                   │  • Mock (dev)            │
└─────────────────┘                   └─────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────────┐
│  On-chain credit verification                                   │
│  Multi-chain: ETH / Polygon / OP / Base / Arbitrum / 0G        │
│  Via viem public client + treasury address check                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Map

| Module | File(s) | Responsibility |
|--------|---------|----------------|
| Database | `lib/db.ts` | sql.js init, schema, read/write primitives, write-queue serialization |
| Agent Service | `lib/agent-service.ts` | CRUD for agents, users, runs, credit ledger, topup orders |
| Storage Layer | `lib/zero-g/storage.ts` | Upload/download to 0G Storage; mock fallback via local FS |
| Compute Layer | `lib/zero-g/compute.ts` | Inference via 0G Compute Broker → OpenRouter → Mock |
| Publish Flow | `lib/publish-agent.ts` | Orchestrates manifest + knowledge upload; calls applyPublishResult |
| Types | `lib/types.ts` | All shared TypeScript types and model/category constants |
| Validation | `lib/validation.ts` | Zod schemas for all API inputs |
| Web3 Provider | `components/web3-provider.tsx` | Wagmi config, RainbowKit, TanStack Query |
| API Routes | `app/api/**` | REST endpoints (13 total) |
| UI Components | `components/ui/` | Radix-based component library |
| AI Elements | `components/ai-elements/` | Chat-specific rich UI (code blocks, reasoning, etc.) |

---

## 3. Data Flow — Agent Publish

```
POST /api/agents/:id/publish
  → publishAgent(agentId)
    → getAgentById()              [read SQLite]
    → getUserById()               [read SQLite]
    → fs.readFile(knowledgePath)  [local filesystem]
    → uploadKnowledge(bytes)      [0G Storage Indexer]
      → Merkle tree computation
      → indexer.upload(payload, evmRpc, signer)
      → returns { rootHash, txHash, uri }
    → buildManifest(agent)        [JSON object]
    → uploadManifest(manifest)    [0G Storage Indexer]
    → applyPublishResult()        [write SQLite]
  ← returns { agent, manifest, storageMode, uploadProof }
```

## 4. Data Flow — Agent Run

```
POST /api/agents/:id/run { message }
  → getAgentById()               [read SQLite]
  → downloadText(knowledgeUri)   [0G Storage or mock FS]
  → runInference({ systemPrompt, knowledge, userInput, model })
    → 0G Compute Broker or OpenRouter or Mock
  → runAgentForUser()            [write SQLite: run + credit_ledger]
  ← returns { output, run, remainingCredits, compute }
```

---

## 5. Chain Architecture Assessment

| Dimension | Current State | Assessment |
|-----------|--------------|------------|
| Storage layer | 0G Storage (Merkle-DAG) | Modular — isolated in `lib/zero-g/storage.ts` |
| Compute layer | 0G Compute Broker | Modular — isolated in `lib/zero-g/compute.ts` |
| Wallet auth | EVM-compatible (RainbowKit) | Extensible — supports 7 chains already |
| Database | sql.js in-process SQLite | **Not stateless** — server state on disk |
| Encryption | None client-side | **Gap** — system prompts + knowledge in plaintext |
| Chain agnosticism | Partial — 0G URIs hardcoded in DB | Needs abstraction for non-0G URIs |
| Backend stateless? | **No** — SQLite tightly coupled to process | **Critical blocker for horizontal scaling** |

---

## 6. Architectural Observations

### 6.1 Storage Is Modular (Good)
`lib/zero-g/storage.ts` is a clean adapter. Functions `uploadManifest`, `uploadKnowledge`, `downloadText` accept/return generic types. Replacing 0G with Arweave or Filecoin requires only reimplementing these three exported functions.

### 6.2 Compute Is Modular (Good)
`lib/zero-g/compute.ts` exposes a single `runInference()` function with a fallback chain (0G → OpenRouter → Mock). Multi-model routing is already partially implemented via model selection in `types.ts`.

### 6.3 Single-User Hardcode (Critical Gap)
Every API route uses `DEMO_USER_ID = 1`. There is **no authentication layer** — any wallet triggers operations for user 1. Multi-user support requires:
- Session/JWT tied to wallet signature (SIWE — Sign-In with Ethereum)
- User resolution from session token, not hardcoded constant

### 6.4 SQLite In-Process (Scalability Ceiling)
`sql.js` loads the entire database as a `Uint8Array` in memory, exports it back to disk on every write. This pattern:
- **Cannot scale horizontally** (multiple Next.js instances would have divergent state)
- **Write throughput ceiling**: ~100 writes/sec on single instance before file I/O becomes bottleneck
- **No connection pooling**, no WAL mode benefit (sql.js doesn't use WAL)

### 6.5 Server-Side Private Key (Security Concern)
`ZERO_G_PRIVATE_KEY` signs all storage uploads from a single server wallet. This means:
- If the key is compromised, all future uploads can be spoofed
- Creator attribution uses the server's wallet address, not the user's wallet
- Storage costs are paid by the platform, not users

---

## 7. Improvement Proposals

### 7.1 Replace sql.js with Turso (libSQL edge)
```typescript
// Current: sql.js (in-memory, file-based persistence)
import initSqlJs from "sql.js";

// Proposed: Turso client (persistent, horizontally scalable, same SQL API)
import { createClient } from "@libsql/client";
const db = createClient({ url: process.env.TURSO_URL!, authToken: process.env.TURSO_TOKEN });
```
**Benefits**: Edge-compatible, sync replicas, WAL, connection pool, zero migration cost (same SQL dialect).

### 7.2 Add SIWE Authentication
```typescript
// New middleware: app/api/auth/siwe/route.ts
// 1. GET /api/auth/nonce → returns random nonce
// 2. POST /api/auth/verify { message, signature } → verifies SIWE, issues JWT
// 3. All subsequent requests: Authorization: Bearer <jwt>
// 4. Middleware resolves userId from JWT → no more DEMO_USER_ID
```

### 7.3 Abstract Storage Adapter Interface
```typescript
// lib/storage/types.ts
interface StorageAdapter {
  upload(data: Uint8Array, meta?: Record<string, string>): Promise<UploadResult>;
  download(uri: string): Promise<Uint8Array>;
  verify(uri: string, expectedHash: string): Promise<boolean>;
}
// lib/storage/0g.ts   implements StorageAdapter
// lib/storage/arweave.ts implements StorageAdapter
// lib/storage/ipfs.ts  implements StorageAdapter
```

### 7.4 Remove System Prompt Plaintext Exposure
System prompts are stored in SQLite in plaintext and returned in agent detail API responses. For production:
- Encrypt system prompts at rest using AES-256-GCM with a KMS-managed key
- Only decrypt server-side at inference time
- Never return `systemPrompt` in public API responses

---

## 8. Verdict

| Category | Score | Notes |
|----------|-------|-------|
| Storage modularity | 7/10 | Clean adapter, URI-coupled storage references |
| Backend statelessness | 2/10 | sql.js in-process; horizontal scaling impossible |
| Client-side encryption | 1/10 | None present |
| Wallet auth extensibility | 7/10 | Multi-chain, but no SIWE session |
| Chain agnosticism | 5/10 | Multi-chain payment verification; 0G URIs in DB |
| AI layer modularity | 8/10 | Well-structured fallback chain |
| **Overall** | **5/10** | Strong for hackathon; needs auth + DB replacement for production |
