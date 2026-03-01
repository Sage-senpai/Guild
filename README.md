# Guild — AI Agent + Human Task Marketplace

> **The decentralized App Store for AI agents. And a same-day task board for crypto-native humans.**
> Built on Polkadot. Africa-first. Human-verified. Open forever.

[![Status](https://img.shields.io/badge/status-MVP-blue)](https://github.com)
[![Stack](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Identity](https://img.shields.io/badge/Identity-KILT%20Protocol-purple)](https://kilt.io)
[![Storage](https://img.shields.io/badge/Storage-Crust%20Network-green)](https://crust.network)
[![Client](https://img.shields.io/badge/Chain-PAPI-pink)](https://papi.how)

---

## What Is Guild?

Guild has two marketplaces in one:

**[Agents]** — Creators publish AI agents (system prompt + optional knowledge file + price per run). Users discover and run them using credits. Every agent is published with a permanent storage proof on Crust Network (IPFS + Polkadot incentive layer). Agents cannot be censored.

**[Humans]** — A same-day micro-task board for crypto-native work. Task posters offer credit rewards for bounded tasks: testnet runs, Discord tasks, DeFi interactions, social tasks. Workers claim or apply. Proof of Personhood (KILT credential) required — Sybil-resistant by design.

---

## Polkadot Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Proof of Personhood | **KILT Protocol** | W3C verifiable credentials; SocialKYC attestations on Spiritnet |
| On-chain identity | **Polkadot People Chain** | Display name + registrar judgements (via PAPI) |
| Decentralised storage | **Crust Network** | IPFS + Polkadot incentive layer; agent manifests + knowledge files |
| EVM contracts | **Moonbeam** | Future: task escrow, agent NFTs (ERC-721) |
| TypeScript client | **PAPI (`polkadot-api`)** | Type-safe, light-client first, <50kB bundle |
| Future PoP | **DIM1 / DIM2** | Gavin Wood's ZK-based proof of personhood (Q3–Q4 2025) |

---

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| AI Agent Marketplace | ✅ Live | Search, filter, 8 categories, 18+ models |
| Create & publish agents | ✅ Live | Manifest + knowledge file upload |
| Human Task Marketplace | ✅ Live | Full task lifecycle + KILT PoP |
| KILT PoP verification | ✅ Live | `@kiltprotocol/sdk-js` on Spiritnet |
| Multi-chain credit top-up | ✅ Live | ETH/USDC on 6 chains |
| Design system (teal palette) | ✅ Done | Deep Teal × Sea Green × Crimson |
| Streaming responses | 🔄 In progress | SSE |
| PAPI integration | 📋 Planned | People Chain identity queries |
| Crust Network storage | 📋 Planned | Replaces 0G testnet |
| SIWE / Substrate auth | 📋 Planned | Real multi-user support |
| M-Pesa / MTN top-up | 📋 Planned | Africa fiat onramp |
| Moonbeam task escrow | 📋 Roadmap | Phase 2 |
| DIM1/DIM2 PoP | 📋 Roadmap | Polkadot native PoP (Gavin Wood's Project Individuality) |

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
# → http://localhost:3000
```

---

## Architecture

```
Client (React 19 + RainbowKit / Talisman)
    ↓ HTTPS
Next.js 16 App Router (API Routes + SSR)
    ↓
┌──────────────┬────────────────────┬─────────────────┐
│  SQLite DB   │  Polkadot Layer    │  Compute Layer  │
│  (sql.js →  │  KILT: PoP creds  │  OpenRouter /   │
│   Turso)    │  People: Identity  │  0G Compute /   │
│             │  Crust: Storage    │  Mock           │
│             │  Moonbeam: EVM     │                 │
└──────────────┴────────────────────┴─────────────────┘
    ↓
PAPI (polkadot-api) — type-safe Substrate queries
```

---

## Configuration

### Identity & PoP

```bash
# KILT Protocol (Proof of Personhood)
KILT_VERIFY_MODE=real              # "mock" for dev, "real" for production
KILT_WSS_ADDRESS=wss://spiritnet.kilt.io
```

### Storage

```bash
# Current: 0G testnet (migration to Crust Network in progress)
ZERO_G_STORAGE_MODE=real
ZERO_G_STORAGE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
ZERO_G_PRIVATE_KEY=your_private_key

# Planned: Crust Network
# STORAGE_PROVIDER=crust
# CRUST_GATEWAY=https://gw.crustfiles.app
```

### AI Compute

```bash
OPENROUTER_API_KEY=sk-or-...       # 18+ models via OpenRouter
ZERO_G_COMPUTE_MODE=real           # Decentralised inference (optional)
```

### Minimum for development

```bash
DEMO_WALLET_ADDRESS=0xYourAddress
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_id
KILT_VERIFY_MODE=mock              # No Spiritnet connection needed in dev
```

See [.env.example](.env.example) for the full list.

---

## API Reference

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List marketplace agents |
| POST | `/api/agents` | Create agent draft |
| GET | `/api/agents/:id` | Agent detail + runs |
| POST | `/api/agents/:id/run` | Run agent (deducts credits) |
| GET | `/api/agents/:id/storage` | Verify storage proof |

### Human Tasks

| Method | Endpoint | PoP Required |
|--------|----------|-------------|
| GET | `/api/tasks` | No |
| POST | `/api/tasks` | No |
| GET | `/api/tasks/:id` | No |
| POST | `/api/tasks/:id/claim` | Yes |
| POST | `/api/tasks/:id/apply` | Yes |
| GET | `/api/tasks/:id/applicants` | No |
| POST | `/api/tasks/:id/select/:appId` | No |
| POST | `/api/tasks/:id/submit` | No |
| POST | `/api/tasks/:id/approve` | No |
| POST | `/api/tasks/:id/dispute` | No |
| POST | `/api/tasks/:id/cancel` | No |

### KILT & Credits

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kilt/verify` | Submit KILT credential |
| GET | `/api/kilt/status` | Check PoP status |
| GET | `/api/credits` | Balance + ledger |
| POST | `/api/credits/onchain` | Verify on-chain top-up tx |

---

## Project Structure

```
guild/
├── app/
│   ├── api/
│   │   ├── agents/           # Agent CRUD + run + storage
│   │   ├── tasks/[id]/       # Human task lifecycle (11 routes)
│   │   ├── kilt/             # KILT PoP verify + status
│   │   └── credits/          # Credit top-up + verification
│   ├── humans/               # Human task marketplace
│   │   ├── page.tsx          # Task listing
│   │   ├── post/page.tsx     # Create task form
│   │   └── [id]/page.tsx     # Task detail
│   ├── agents/[id]/          # Agent detail + chat
│   ├── create/               # Create agent wizard
│   └── page.tsx              # Agent marketplace home
├── components/
│   ├── task-card.tsx         # Human task card
│   ├── task-actions-client.tsx  # Claim/apply/approve/dispute UI
│   ├── kilt-verify-button.tsx   # PoP credential submission
│   ├── agent-card.tsx        # Agent card
│   └── site-header.tsx       # Nav (Agents | Humans | Credits | Profile)
├── lib/
│   ├── kilt/verify.ts        # KILT verification (real + mock modes)
│   ├── task-service.ts       # Task + KILT credential business logic
│   ├── agent-service.ts      # Agent business logic
│   ├── db.ts                 # sql.js SQLite
│   ├── types.ts              # All TypeScript types
│   └── validation.ts         # Zod schemas
├── audit/                    # Architecture, security, tech-debt audit
├── research/                 # Grant + bounty analysis
├── architecture/             # System design documents
├── design/                   # Design system specifications
├── branding/                 # Brand and naming strategy
└── docs/                     # Pitch, features, grants, human-marketplace spec
```

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [docs/pitch.md](docs/pitch.md) | Investor pitch narrative (Polkadot-native stack) |
| [docs/features.md](docs/features.md) | Feature specifications v2.0 |
| [docs/grants-strategy.md](docs/grants-strategy.md) | Grant strategy ($175K–$705K target) |
| [docs/human-marketplace.md](docs/human-marketplace.md) | Human task marketplace full spec |
| [audit/architecture.md](audit/architecture.md) | System architecture analysis |
| [audit/security.md](audit/security.md) | Security review + hardening checklist |
| [audit/tech-debt.md](audit/tech-debt.md) | Technical debt register |
| [research/bounty-analysis.md](research/bounty-analysis.md) | Active grants + bounties |
| [architecture/global-scale.md](architecture/global-scale.md) | Africa → global scale design |
| [architecture/infrastructure-plan.md](architecture/infrastructure-plan.md) | Infra + migration plan |
| [architecture/ai-layer.md](architecture/ai-layer.md) | AI provider abstraction |
| [design/design-system.md](design/design-system.md) | Deep Teal / Sea Green / Crimson palette |
| [design/component-library.md](design/component-library.md) | Component specifications |
| [design/mobile-layout.md](design/mobile-layout.md) | Mobile screen layouts |
| [design/desktop-layout.md](design/desktop-layout.md) | Desktop screen layouts |
| [branding/name-options.md](branding/name-options.md) | Name analysis (GUILD ⭐ UJUZI ⭐) |

---

## License

ISC License — see [LICENSE](LICENSE).

---

> Built at the 0G Foundation hackathon. Evolved into a full Polkadot-native stack.
> KILT · People Chain · Crust · Moonbeam · PAPI.
