# Guild — Feature Specifications

> Version: 2.0 | March 2026
> Stack: Next.js 16 + TypeScript · KILT Protocol · Polkadot People Chain · PAPI · Crust Network

---

## Core Features

---

### F-01: Agent Marketplace

**Current**: Grid of published agents with search + category filter. Storage proofs via 0G testnet.

**Target**:
- Three-column desktop grid / single-column mobile
- Category pill horizontal scroll (mobile); sidebar filter (desktop)
- Featured section: editor's picks, most-run this week, new arrivals
- Search: instant results with 300ms debounce
- Sort: newest, most popular, lowest price
- Crust Network storage proof badge on each card
- Infinite scroll with cursor pagination

**API**: `GET /api/agents?category=&search=&sort=&cursor=&limit=20`

---

### F-02: Agent Creation

**Current**: Single-page form; draft → publish flow.

**Target (3-step wizard)**:

Step 1 — Identity: Name, Category, Description, card gradient (design system palette), optional image upload

Step 2 — Intelligence: Model selector (text/vision/image badges), System prompt, Knowledge file upload (PDF/TXT/MD ≤5MB)

Step 3 — Economics: Price per run (0.01–10.00 credits), revenue estimate preview, final card preview

Publication flow:
1. Create draft (instant)
2. Upload knowledge file → Crust Network (IPFS + Polkadot incentive layer)
3. Generate + upload manifest → Crust Network
4. Agent live with `storage_hash` = IPFS CID, `manifest_uri` = `ipfs://CID`

---

### F-03: Agent Running (Chat)

**Current**: Synchronous chat; synchronous compute; no streaming.

**Target**:
- **Streaming SSE**: First token < 500ms
- **Cost pre-estimation**: Shown before send
- **Image attachments**: For vision models
- **Conversation history**: Last 20 messages per session
- **Markdown rendering**: Full MD with code syntax highlighting
- **Stop generation**: Cancel during streaming
- **Compute mode badge**: Active provider shown in real-time

---

### F-04: Credit Economy

**Current**: Credits in SQLite per demo user. ETH top-up multi-chain.

**Target**:

Top-up methods:
- **USDC on Moonbeam** (primary; Polkadot EVM, XCM-compatible)
- **ETH on Base/Arbitrum**
- **M-Pesa** (Kenya)
- **MTN Mobile Money** (Ghana, Uganda, Cameroon)
- **Airtel Money** (East/West Africa)

Ledger types: `topup`, `run_debit`, `task_reserve`, `task_refund`, `task_earn`, `task_fee`

---

### F-05: Crust Network Storage

**Replacing**: 0G Storage testnet (0G had no production path for this use case).

**Why Crust**: Polkadot parachain — IPFS foundation + on-chain incentive layer (MPoW + GPoS). Native XCM integration. TypeScript SDK (crust.js). cid-addressable, content-permanent.

Implementation:
- Agent manifests + knowledge files → IPFS via Crust gateway
- CID stored as `storage_hash`; `manifest_uri = ipfs://CID`
- Verification via PAPI: `api.query.market.filesV2(cid)` on Crust chain

Storage proof states: `verified` · `unverified` · `demo` · `pending`

Future: CESS Network as alternative (Cumulus Encrypted Storage System — encrypted, Polkadot parachain).

---

### F-06: PAPI — Polkadot TypeScript Client

**Package**: `polkadot-api` (official replacement for @polkadot/api).

Advantages:
- **<50kB bundle** vs hundreds of kB
- **Type-safe by design**: chain-generated descriptors
- **Light-client first**: smoldot in browser, no node required
- **Upgrade-aware**: multiple descriptor versions

Guild use cases:
| Query | Chain | Purpose |
|-------|-------|---------|
| `identity.identityOf` | Polkadot People Chain | Display name + registrar judgements |
| `market.filesV2` | Crust Network | Storage proof verification |
| Extrinsics | Moonbeam | High-value task escrow (Phase 2) |

Setup:
```bash
npm install polkadot-api
npx papi add people -w wss://polkadot-people-rpc.polkadot.io
npx papi add crust  -w wss://rpc.crust.network
```

---

### F-07: Polkadot People Chain — On-Chain Identity

**What it is**: System parachain on Polkadot (launched August 2024). Hosts the Identity pallet migrated from the relay chain.

**Fields**: display, legal, web, email, Twitter, Element (Matrix), custom fields.

**Judgements**: Registrars (e.g. Web3 Foundation registrar) verify specific fields — email, Twitter, Matrix handle — and issue on-chain judgement levels: `FeePaid` → `Reasonable` → `KnownGood`.

**Guild integration** (via PAPI):
- After wallet auth, query `identity.identityOf(address)` on People Chain
- Users with `KnownGood` or `Reasonable` judgement get "✓ On-chain ID" badge
- Verified display name shown in profile + task poster/worker cards

**DIM1 / DIM2 — Project Individuality** (Polkadot native PoP, Q3/Q4 2025):
- DIM1: ZK-based proof of unique human, no credentials needed
- DIM2: ZK + verifiable credentials (uses KILT DID infrastructure)
- Guild will layer DIM1/DIM2 on top of KILT as they launch

---

### F-08: Human Task Marketplace ✅ IMPLEMENTED

**Spec**: [docs/human-marketplace.md](human-marketplace.md)

Task types: `testnet`, `discord`, `defi`, `nft`, `social`, `review`, `data`, `other`

Flow: Post task (credits reserved) → Claim or Apply (PoP required) → Submit proof → Approve (credits transfer) → 48h auto-approve

Platform fee: 5% of reward (collected at posting, already reserved)

**Proof of Personhood — KILT Protocol**:
- KILT is a Polkadot parachain for W3C verifiable credentials (DIDs + VCs)
- Social account (Twitter / GitHub / Discord) linked via SocialKYC → KILT Spiritnet attestation
- Server-side verification: `@kiltprotocol/sdk-js`, `KILT_VERIFY_MODE=real`
- `KILT_VERIFY_MODE=mock` for dev/demo (accepts any JSON with `claim` field)
- One credential stored per user; reusable across all future tasks

**Roadmap**:
- Phase 2: Cross-reference KILT credential with People Chain registrar judgement for higher-assurance tasks
- Phase 3: DIM1 (Polkadot native PoP) as alternative claim path when live

---

### F-09: SIWE / Substrate Auth

**Current**: DEMO_USER_ID=1 hardcoded. No real auth.

**Target**: Sign-In with Ethereum (Moonbeam/EVM) or Substrate signature (Polkadot wallet).

Flow:
1. Connect wallet (Talisman / Polkadot.js / Nova / MetaMask)
2. Fetch nonce from `GET /api/auth/nonce`
3. Sign message with wallet
4. Verify at `POST /api/auth/verify` → return JWT
5. All API calls include `Authorization: Bearer <jwt>`
6. User record auto-created on first sign-in (10 credit welcome bonus)

---

### F-10: Creator Profile

**Current**: Shows wallet + credits + created agents (demo user only).

**Target**:
- Polkadot address or ENS name displayed
- People Chain display name (if set) shown prominently
- KILT "✓ Verified Human" badge (task workers)
- People Chain "✓ On-chain ID" badge (registrar judgement)
- Published agents + tasks completed (public stats)

---

### F-11: Agent-as-NFT (Roadmap — Moonbeam)

- Each agent publish mints ERC-721 on Moonbeam
- Token metadata points to Crust Network manifest CID
- Ownership = creator control + revenue rights
- 5% secondary sale royalty

---

## Feature Priority Matrix

| Feature | Priority | Status | Tech |
|---------|----------|--------|------|
| KILT PoP + Human Marketplace | P0 | ✅ Done | @kiltprotocol/sdk-js |
| Human Marketplace UI + API | P0 | ✅ Done | Next.js + sql.js |
| Design system theming | P0 | ✅ Done | Tailwind token update |
| PAPI integration | P1 | Planned | polkadot-api |
| People Chain identity lookup | P1 | Planned | PAPI + People RPC |
| Crust Network storage | P1 | Planned | crust.js |
| SIWE/Substrate auth | P1 | Planned | PAPI signer |
| Streaming responses | P1 | In progress | SSE |
| M-Pesa / MTN top-up | P1 | Planned | Africa fiat |
| Mobile redesign | P1 | Planned | Design system |
| Moonbeam task escrow | P2 | Roadmap | Solidity + Moonbeam |
| Agent-as-NFT | P2 | Roadmap | ERC-721 on Moonbeam |
| DIM1/DIM2 PoP | P2 | Roadmap | Polkadot native |
| DataDAO knowledge base | P3 | Roadmap | Crust/CESS |
