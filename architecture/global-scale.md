# Global Scale Architecture — Africa → World

> Document date: 2026-02-28
> Target: 10M+ users, Africa-first, mobile-first, low-bandwidth

---

## 1. Design Principles

1. **Mobile-first by default** — not a desktop app shrunk to mobile; fundamentally designed for sub-5MB data sessions
2. **Stateless API** — no server-side state except in the database layer; every API node is interchangeable
3. **Modular storage** — swap storage providers via adapter interface without touching business logic
4. **Wallet abstraction** — users should not need to understand gas, chains, or private keys
5. **Progressive decentralization** — start with a hybrid model; move more on-chain as the ecosystem matures
6. **Graceful degradation** — if 0G/Arweave/Filecoin is unavailable, show cached content; never a blank screen

---

## 2. Global Architecture Overview

```
                        GLOBAL CDN EDGE (Cloudflare)
                    ┌─────────────────────────────────┐
                    │  Static assets · Image cache    │
                    │  Edge middleware (auth check)   │
                    │  Brotli compression             │
                    │  Africa PoP: Lagos, Nairobi,    │
                    │  Johannesburg, Cairo, Accra     │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │    NEXT.JS APP (Edge Runtime)   │
                    │  Vercel / Cloudflare Pages      │
                    │  Serverless functions           │
                    │  SSR with streaming             │
                    └──────────────┬──────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
  ┌────────▼────────┐   ┌──────────▼──────────┐  ┌────────▼────────┐
  │  DATABASE LAYER  │   │   STORAGE LAYER     │  │  COMPUTE LAYER  │
  │  Turso (libSQL)  │   │  Arweave (manifests)│  │  OpenRouter     │
  │  Global replicas │   │  Filecoin (files)   │  │  0G Compute     │
  │  Frankfurt/US/SG │   │  IPFS CDN gateway   │  │  io.net         │
  │  Edge reads <5ms │   │  Cloudflare R2      │  │  EigenLayer AVS │
  └─────────────────┘   └─────────────────────┘  └─────────────────┘
           │
  ┌────────▼────────┐
  │  BLOCKCHAIN      │
  │  Base (L2)       │
  │  Credit registry │
  │  Agent NFTs      │
  │  Multi-chain     │
  │  payment verify  │
  └─────────────────┘
```

---

## 3. Microservice Map

```
┌──────────────────────────────────────────────────────────────────┐
│                     API SERVICE MAP                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/auth/*          AuthService                                │
│    POST /nonce          → generate nonce for SIWE               │
│    POST /verify         → verify SIWE signature → issue JWT      │
│    DELETE /session      → invalidate JWT                         │
│                                                                  │
│  /api/agents/*        AgentService                               │
│    GET    /              → list marketplace agents (cached)      │
│    POST   /              → create agent draft                    │
│    GET    /:id           → get agent detail                      │
│    POST   /:id/publish   → publish to storage layer              │
│    POST   /:id/run       → run agent (via ComputeService)        │
│    GET    /:id/storage   → verify storage proof                  │
│                                                                  │
│  /api/storage/*       StorageService                             │
│    POST   /upload        → upload file → storage adapter         │
│    GET    /verify/:hash  → verify storage proof                  │
│                                                                  │
│  /api/compute/*       ComputeService                             │
│    POST   /infer         → route to optimal compute provider     │
│    GET    /providers     → list available providers + models     │
│                                                                  │
│  /api/credits/*       CreditService                              │
│    GET    /              → get balance + ledger                  │
│    POST   /onchain       → verify tx → credit balance            │
│    POST   /webhooks      → payment provider webhook              │
│                                                                  │
│  /api/profile/*       ProfileService                             │
│    GET    /              → wallet info + created agents + stats  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow Diagrams

### 4.1 Agent Publish Flow (Production)

```
Creator (browser)
    │
    ├─ 1. Sign SIWE nonce → JWT
    │
    ├─ 2. POST /api/agents (name, description, price, model)
    │       → AgentService.createAgent()
    │       → Turso INSERT → returns agentId
    │
    ├─ 3. POST /api/storage/upload (knowledge file)
    │       → StorageAdapter.upload(bytes)
    │       → Lighthouse.uploadBuffer() → Filecoin deal
    │       → returns { cid: "bafyXXX", uri: "ipfs://bafyXXX" }
    │       → AgentService.attachKnowledge(agentId, uri)
    │
    ├─ 4. POST /api/agents/:id/publish
    │       → buildManifest(agent)
    │       → ArweaveAdapter.upload(manifestJson)
    │       → returns { txId: "ARXXXXXX", uri: "ar://ARXXXXXX" }
    │       → AgentService.applyPublishResult(agentId, txId)
    │       → Turso UPDATE → published = 1
    │
    └─ 5. Agent visible in marketplace
```

### 4.2 Agent Run Flow (Production, Streaming)

```
User (browser) → Chat UI
    │
    ├─ 1. Verify JWT (SIWE session)
    │
    ├─ 2. POST /api/agents/:id/run (SSE stream)
    │       → AgentService.getAgentById()
    │       → StorageAdapter.download(knowledgeUri) → IPFS gateway
    │       → ComputeService.runInference({ systemPrompt, knowledge, userInput })
    │          ├─ Route: OpenRouter / 0G Compute / EigenLayer AVS
    │          └─ Stream tokens via SSE
    │       → Credit deduction: Turso UPDATE (atomic)
    │       → AgentService.recordRun()
    │
    └─ 3. Client receives streamed output → renders in chat UI
```

### 4.3 Credit Top-Up Flow (Africa Mobile Money)

```
User (mobile Africa)
    │
    ├─ 1. Select "Top up via M-Pesa"
    │
    ├─ 2. POST /api/credits/fiat { provider: "mpesa", amount: 100 KES }
    │       → MobileMoneyAdapter.createOrder()
    │       → M-Pesa STK Push to user's phone
    │
    ├─ 3. User confirms on phone
    │
    ├─ 4. M-Pesa webhook → POST /api/webhooks/payments
    │       → CreditService.reconcileTopup()
    │       → Turso UPDATE credits
    │
    └─ 5. User sees updated credit balance (WebSocket / polling)
```

---

## 5. On-Chain / Off-Chain Boundary Logic

```
ON-CHAIN (immutable, decentralized):
├── Agent manifests → Arweave (permanent, content-addressed)
├── Knowledge files → Filecoin (deal-based, proof-verified)
├── Credit payments → Base L2 (ETH/USDC transfers)
├── Agent NFT cards → Base L2 (ERC-721 compressed NFTs)
└── Storage proofs → Arweave txId + Filecoin deal ID

OFF-CHAIN (mutable, fast):
├── User credit balances → Turso database (fast read/write)
├── Run logs → Turso database (search, filter)
├── Agent draft state → Turso database (pre-publish)
├── Session/JWT → Turso or Redis (short-lived)
└── Card images (pre-minted) → Cloudflare R2

HYBRID (off-chain backed by on-chain proof):
├── Agent listing → Turso (fast) + Arweave manifest (source of truth)
├── User wallet identity → JWT (fast) + EVM signature (source of truth)
└── Storage verification → Turso hash + live verification against Arweave/Filecoin
```

---

## 6. Multi-Region RPC Failover

```typescript
// lib/rpc/failover.ts — RPC provider with automatic failover

const RPC_PROVIDERS_BY_CHAIN: Record<number, string[]> = {
  1: [  // Ethereum Mainnet
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
    "https://ethereum-rpc.publicnode.com",
  ],
  8453: [  // Base
    "https://mainnet.base.org",
    "https://base.llamarpc.com",
    "https://rpc.ankr.com/base",
  ],
  137: [  // Polygon
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon.llamarpc.com",
  ],
};

// Africa-optimized RPC selection:
// Prefer providers with Cloudflare-proxied endpoints (fastest from Africa)
// Ankr: has Nairobi, Lagos PoPs
// LlamaRPC: Cloudflare-backed, good Africa latency
// PublicNode: distributed globally
```

---

## 7. Wallet Abstraction Layer

```typescript
// lib/wallet/abstraction.ts

type WalletConnector =
  | "injected"          // MetaMask, Rabby
  | "walletconnect"     // Any WC-compatible wallet
  | "coinbase"          // Coinbase Wallet (Africa-friendly, easy KYC)
  | "passkey"           // WebAuthn (no seed phrase — Africa UX priority)
  | "magic"             // Magic.link (email-based, no wallet needed)
  | "privy"             // Privy (social login → embedded wallet)

// Priority ordering for Africa:
// 1. Passkey / Privy (no seed phrase = highest adoption)
// 2. Coinbase Wallet (fiat onramp built-in)
// 3. WalletConnect (broad compatibility)
// 4. Injected (desktop power users)

// Account Abstraction (ERC-4337):
// - Gas-sponsored transactions (platform pays gas for new users)
// - Batch operations (publish + NFT mint in one transaction)
// - Session keys (pre-approve agent runs without signing each one)
```

---

## 8. Fiat Onramp Strategy (Africa-Specific)

| Country | Primary Method | Provider | Notes |
|---------|---------------|----------|-------|
| Nigeria | Bank transfer / USDT | Bitget P2P, Yellow Card | CBN restrictions on crypto direct; USDT common |
| Kenya | M-Pesa | Pesa Link, Transak | M-Pesa API well-documented; large user base |
| Ghana | Mobile Money (MTN/Vodafone) | Transak, Yellowcard | Multiple operators |
| South Africa | EFT / Capitec | Luno, VALR | Most crypto-mature African market |
| Egypt | Bank transfer | LocalBitcoins, Transak | Regulatory improvement trend |
| Uganda/Tanzania | Mobile Money | Transak, Yellow Card | Feature phone users = USSD gateway option |

**Integration recommendation**: Transak SDK (supports 100+ countries, 20+ Africa countries, M-Pesa + mobile money)

```typescript
// components/onramp/TransakWidget.tsx
import transakSDK from "@transak/transak-sdk";

const transak = new transakSDK({
  apiKey: process.env.NEXT_PUBLIC_TRANSAK_API_KEY,
  environment: "PRODUCTION",
  defaultNetwork: "base", // receive on Base L2
  cryptoCurrencyCode: "ETH",
  walletAddress: userWalletAddress,
  fiatCurrency: "KES", // or NGN, GHS, ZAR — auto-detected by locale
  isMobileDevice: true,
  themeColor: "#2B7574", // sea green from design palette
});
```

---

## 9. Low-Bandwidth Optimizations

### Network-Level
- **Brotli compression**: All API responses compressed (70-80% size reduction vs JSON)
- **Response field filtering**: Never return fields not needed by the caller
- **Cursor pagination**: Never load full datasets; 20-item pages with cursor tokens
- **Image optimization**: Next.js Image component with WebP, lazy loading, blur placeholder
- **Service Worker**: Cache agent listings and manifests for offline browsing

### Mobile-Specific
- **Streaming responses**: SSE for agent runs — user sees first token in <500ms
- **Optimistic UI**: Credit deduction shown immediately; reversed if server fails
- **App manifest**: PWA install for home screen — no app store needed
- **Push notifications**: Notify when agent publish completes (async)

### Data Size Targets
| Resource | Current | Target |
|----------|---------|--------|
| Agent listing page | ~500KB JS | <200KB with code splitting |
| Agent card image | 200-500KB base64 in DB | <50KB WebP via CDN |
| Agent manifest | 1-2KB JSON | <1KB compressed |
| Knowledge file retrieval | Full file | Chunked streaming |
| Initial page load (LCP) | Unknown | <2.5s on 3G |

---

## 10. Regulatory Adaptability

### Data Residency
- **Arweave**: No data residency control (global permanence) — use encryption for PII
- **Filecoin**: Storage provider selection by geography possible — GDPR data residency feasible
- **Turso**: Geo-distributed replicas; primary region configurable (EU for GDPR, US for US users)
- **Cloudflare R2**: Region-configurable bucket — GDPR EEA bucket for EU users

### GDPR Compliance Path
1. Encrypt all PII before upload to Arweave (user cannot be identified without key)
2. User profiles stored in Turso (deletable on request)
3. On-chain actions (NFT transfers) are immutable — inform users clearly
4. Right to erasure: delete from Turso + revoke encryption keys (data on Arweave becomes meaningless)

### KYC/AML for High-Value Top-Ups
- For top-ups >$500 USD equivalent: integrate Sumsub or Persona for KYC
- Transak handles KYC for fiat onramp flows automatically
- All credit top-up transactions logged in Turso with tx hashes for audit trail
