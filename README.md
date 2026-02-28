# Guild — AI Agent Marketplace

> **The decentralized App Store for AI agents.**
> Create, publish, and monetize AI agents. Run any agent with credits. Built Africa-first, designed for the world.

[![MVP Status](https://img.shields.io/badge/status-MVP-blue)](https://github.com)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%2B%20TypeScript-black)](https://nextjs.org)
[![Storage](https://img.shields.io/badge/storage-Arweave%20%2B%20Filecoin-green)](https://arweave.org)
[![License](https://img.shields.io/badge/license-ISC-gray)](./LICENSE)

---

## What Is Guild?

Guild is a decentralized marketplace for AI agents. Creators publish agents — AI assistants with a purpose, a system prompt, an optional knowledge base, and a price per run. Users discover and run agents by spending credits.

Every agent is published with a **permanent storage proof** on Arweave or Filecoin. Agents cannot be censored or deleted. Creators own what they build.

---

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| Agent marketplace | ✅ Live | Search, filter, category browsing |
| Create & publish agents | ✅ Live | Manifest + knowledge file upload |
| Storage proofs | ✅ Live | 0G testnet; Arweave migration in progress |
| AI inference | ✅ Live | OpenRouter (18+ models) + 0G Compute |
| Credit economy | ✅ Live | ETH/USDC top-up, multi-chain verification |
| Mobile-first UI | 🔄 Redesign | New design system (this repo) |
| SIWE authentication | 📋 Planned | Real multi-user support |
| M-Pesa top-up | 📋 Planned | Africa fiat onramp |
| Arweave storage | 📋 Planned | Permanent manifest storage |
| Filecoin knowledge | 📋 Planned | Knowledge file deals |
| Base L2 contracts | 📋 Planned | Credit registry, agent NFTs |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Run development server

```bash
npm run dev
```

### 4. Open in browser

```
http://localhost:3000
```

---

## Architecture

```
Client (React 19 + RainbowKit)
    ↓ HTTPS
Next.js 16 App Router (API Routes + SSR)
    ↓
┌──────────────┬──────────────────┬─────────────────┐
│  SQLite DB   │  Storage Layer   │  Compute Layer  │
│  (sql.js)    │  0G / Arweave /  │  0G Compute /   │
│              │  Filecoin        │  OpenRouter /   │
│              │                  │  Mock           │
└──────────────┴──────────────────┴─────────────────┘
    ↓
Multi-chain EVM (Base, ETH, Polygon, Arbitrum, 0G)
```

See [architecture/global-scale.md](architecture/global-scale.md) for the full production-scale design.

---

## Configuration

### Storage Modes

| Mode | Config | Behavior |
|------|--------|----------|
| Real 0G | `ZERO_G_STORAGE_MODE=real` + private key | On-chain storage proofs |
| Arweave (planned) | `STORAGE_PROVIDER=arweave` + JWK | Permanent, pay-once |
| Filecoin (planned) | `STORAGE_PROVIDER=filecoin` + API key | Deal-based, verifiable |
| Mock (dev) | `ZERO_G_STORAGE_MODE=mock` | Local filesystem, no fees |

### Compute Modes

| Mode | Config | Behavior |
|------|--------|----------|
| 0G Compute | `ZERO_G_COMPUTE_MODE=real` | Decentralized inference |
| OpenRouter | `OPENROUTER_API_KEY=<key>` | 18+ models, reliable |
| Mock | Neither set | Pre-defined mock responses |

### Required Environment Variables

```bash
# Minimum for development:
DEMO_WALLET_ADDRESS=0xYourAddress
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id

# For real storage:
ZERO_G_STORAGE_MODE=real
ZERO_G_PRIVATE_KEY=your_private_key
ZERO_G_EVM_RPC=https://evmrpc-testnet.0g.ai
ZERO_G_STORAGE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai

# For AI inference:
OPENROUTER_API_KEY=sk-or-...

# For credit top-ups:
NEXT_PUBLIC_TOPUP_TREASURY_ADDRESS=0xYourTreasuryAddress
```

See [.env.example](.env.example) for the full list.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List marketplace agents |
| POST | `/api/agents` | Create agent draft |
| GET | `/api/agents/:id` | Get agent detail |
| POST | `/api/agents/:id/publish` | Publish to storage layer |
| POST | `/api/agents/:id/run` | Run agent (deducts credits) |
| GET | `/api/agents/:id/storage` | Verify storage proof |
| POST | `/api/agents/sync-storage` | Bulk-publish drafts |
| GET | `/api/credits` | Get credit balance + ledger |
| POST | `/api/credits` | Create top-up order |
| POST | `/api/credits/onchain` | Verify on-chain top-up tx |
| POST | `/api/credits/:id/simulate` | Simulate webhook for demo |
| POST | `/api/webhooks/payments` | Payment provider webhook |
| GET | `/api/profile` | Get user profile |
| GET | `/api/runs` | List recent runs |

---

## Project Structure

```
ajently/
├── app/                    # Next.js App Router
│   ├── api/               # API route handlers
│   ├── agents/[id]/       # Agent detail + chat pages
│   ├── create/            # Create agent page
│   ├── credits/           # Credits management page
│   ├── profile/           # User profile page
│   └── page.tsx           # Marketplace home
├── components/
│   ├── ai-elements/       # Chat UI components
│   ├── ui/                # Base component library (Radix)
│   └── *.tsx              # Feature components
├── lib/
│   ├── zero-g/            # 0G Storage + Compute adapters
│   ├── db.ts              # SQLite (sql.js) database
│   ├── agent-service.ts   # Business logic
│   ├── publish-agent.ts   # Publication orchestration
│   ├── types.ts           # TypeScript types
│   └── validation.ts      # Zod schemas
├── audit/                 # Codebase audit documents
├── research/              # Web3 stack research
├── architecture/          # System architecture docs
├── design/                # UI/UX design specifications
├── branding/              # Brand and naming strategy
└── docs/                  # Pitch, features, grants
```

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [audit/architecture.md](audit/architecture.md) | System architecture analysis |
| [audit/security.md](audit/security.md) | Security review + hardening checklist |
| [audit/scalability.md](audit/scalability.md) | Scalability bottlenecks + roadmap |
| [audit/storage-analysis.md](audit/storage-analysis.md) | Storage layer evaluation |
| [audit/tech-debt.md](audit/tech-debt.md) | Technical debt register |
| [research/web3-alternatives.md](research/web3-alternatives.md) | Protocol comparison matrix |
| [research/bounty-analysis.md](research/bounty-analysis.md) | Active grants + bounties |
| [research/recommended-stack.md](research/recommended-stack.md) | 3 recommended stack options |
| [architecture/global-scale.md](architecture/global-scale.md) | Africa → global architecture |
| [architecture/infrastructure-plan.md](architecture/infrastructure-plan.md) | Infra providers + migration |
| [architecture/ai-layer.md](architecture/ai-layer.md) | AI provider abstraction + security |
| [design/design-system.md](design/design-system.md) | Colors, typography, tokens |
| [design/component-library.md](design/component-library.md) | Component specifications |
| [design/mobile-layout.md](design/mobile-layout.md) | Mobile screen layouts |
| [design/desktop-layout.md](design/desktop-layout.md) | Desktop screen layouts |
| [branding/name-options.md](branding/name-options.md) | 15 name candidates + analysis |
| [docs/pitch.md](docs/pitch.md) | Investor pitch narrative |
| [docs/features.md](docs/features.md) | Feature specifications |
| [docs/grants-strategy.md](docs/grants-strategy.md) | Grant capture strategy |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) (coming soon).

Built with the [0G Foundation hackathon](https://0g.ai) stack. Evolving toward Arweave + Filecoin + Base.

---

## License

ISC License — see [LICENSE](LICENSE).
