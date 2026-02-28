# Guild — Feature Specifications

> Version: 1.0 | February 2026
> Format: Current state → Target state for each feature

---

## Core Features

---

### F-01: Agent Marketplace

**Current**: Grid of published agents with search + category filter. Only agents with 0G storage proof shown.

**Target**:
- Three-column desktop grid / single column mobile
- Left sidebar filter (desktop): category, model type, price range, storage proof status
- Category pill horizontal scroll (mobile)
- Featured section: editor's picks, most-run this week, new arrivals
- Search: instant results with debounce (300ms), highlights matching terms
- Sort: newest, most popular, lowest price, highest rated
- Storage proof badge on each card
- Infinite scroll with cursor pagination

**API**: `GET /api/agents?category=&search=&sort=&cursor=&limit=20`

---

### F-02: Agent Creation

**Current**: Single-page form; agent created as draft; publish is a separate step.

**Target (3-step wizard)**:

Step 1 — Identity:
- Name (max 60 chars)
- Category (single select from 8 categories)
- Description (max 280 chars, Twitter-style limit)
- Card gradient picker (visual preview)
- Card image upload (optional; auto-generates gradient if not provided)

Step 2 — Intelligence:
- Model selector with capability badges (text/vision/image)
- System prompt (unlimited; token counter + cost estimate shown)
- Knowledge file upload (PDF, TXT, MD up to 5MB)
- Knowledge file preview after upload

Step 3 — Economics:
- Price per run (0.01 – 10.00 credits, 0.01 step)
- Suggested prices based on model cost
- Revenue estimate: "If 100 users run this agent, you earn X credits"
- Preview final card before publishing

Publication flow:
1. Create draft (instant, local state)
2. Upload knowledge to Filecoin/Lighthouse (background, progress shown)
3. Generate and upload manifest to Arweave (background)
4. Agent live in marketplace with storage proof

---

### F-03: Agent Running (Chat)

**Current**: Synchronous chat; single-model routing; no streaming; cost shown after.

**Target**:
- **Streaming responses**: SSE — user sees first token in <500ms
- **Cost pre-estimation**: Show estimated cost before user sends message
- **Attachment support**: Image upload for vision models
- **Conversation history**: Store last 20 messages in session (not persisted across sessions)
- **Agent knowledge indicator**: Show "Using knowledge: filename.pdf" when knowledge is loaded
- **Compute mode badge**: Real-time indicator of which provider is being used
- **Stop generation**: Cancel button during streaming
- **Copy / Share message**: Right-click or long-press on any message
- **Markdown rendering**: Full MD support (headings, code blocks, tables, lists)
- **Code block features**: Copy button, language detection, syntax highlighting (Shiki)
- **Insufficient credits**: Show top-up prompt inline, not just an error

---

### F-04: Credit Economy

**Current**: Credits in SQLite per demo user. Top-up via ETH on 7 chains. No real fiat integration.

**Target**:

Top-up methods:
- **ETH/USDC on Base** (primary; low gas)
- **ETH on Polygon/Arbitrum** (via bridge or direct)
- **M-Pesa** (Kenya; STK push to user phone)
- **MTN Mobile Money** (Ghana, Uganda, Cameroon)
- **Airtel Money** (East/West Africa)
- **Card payment** (via Transak; last resort — highest fees)

Credit display:
- Balance in credits + approximate USD value
- Low balance warning at 10 credits
- Auto-suggest top-up when balance insufficient

Credit ledger:
- Full transaction history with pagination
- Filter by type (topup, run_debit)
- Export as CSV
- Webhook for external reconciliation

---

### F-05: Storage Proofs

**Current**: 0G Storage; fake demo hashes; verify button calls live storage API.

**Target**:

Publication proof:
- **Arweave transaction ID** as manifest proof
- **Filecoin deal ID** as knowledge file proof
- Both displayed on agent detail page
- Links to Arweave block explorer + Filecoin explorer

Verification:
- One-click "Verify" button fetches manifest from Arweave
- Hash verification: downloaded content hash == stored rootHash
- Verification result shows: bytes downloaded, time, hash match status
- "Last verified" timestamp stored locally

Storage badge states:
- `verified` — on-chain proof confirmed < 24h ago
- `unverified` — not yet verified this session (click to verify)
- `demo` — demo agent with placeholder proof (clearly labeled)
- `pending` — publish in progress

---

### F-06: Wallet Authentication (Roadmap)

**Current**: No real auth; everything uses DEMO_USER_ID = 1.

**Target — SIWE (Sign-In with Ethereum)**:

Flow:
1. User clicks "Connect Wallet"
2. Wallet connected (RainbowKit) — address shown
3. User clicks "Sign In"
4. App fetches nonce: `GET /api/auth/nonce`
5. App constructs SIWE message, requests signature from wallet
6. App verifies: `POST /api/auth/verify { message, signature }`
7. Server returns JWT (24h expiry)
8. All subsequent requests include `Authorization: Bearer <jwt>`
9. Server resolves `userId` from JWT

User record created automatically on first SIWE:
```sql
INSERT OR IGNORE INTO users (wallet_address, credits)
VALUES (?, 10.00);  -- 10 credits welcome bonus
```

Session management:
- Persist JWT in `httpOnly` cookie (XSS-safe)
- Refresh token silently before expiry
- Sign out: invalidate JWT, clear cookie

---

### F-07: Creator Profile

**Current**: Shows wallet + credits + created agents (demo user only).

**Target**:

Public profile page (`/profile/0x1234...`):
- Wallet address (ENS name if registered)
- Avatar (ENS avatar or generated from address)
- Published agents count
- Total agent runs (public statistic)
- List of published agents

Private profile (when viewing own profile):
- All of the above
- Draft agents (not yet published)
- Credit balance + add credits button
- Run history (all runs by this user)
- Edit agent details (name, description, price)

---

### F-08: Agent-as-NFT (Roadmap — Base L2)

**Future feature: every published agent becomes an NFT**

- Each agent publish mints an ERC-721 token on Base
- Token ID = agent ID in marketplace
- Token metadata points to Arweave manifest URI
- Ownership = creator control
- Transfer = change agent creator attribution
- Secondary sales = protocol earns royalty (5%)

This enables:
- Agents as tradeable digital assets
- Investment in popular agents
- Creator exit via agent sale
- Fractional ownership (ERC-1155 future)

---

### F-09: Knowledge Base as DataDAO (Roadmap — Filecoin)

**Future feature: collective knowledge curation**

Multiple creators can contribute to a shared knowledge base:
- Knowledge base stored as Filecoin FVM smart contract
- Contributors earn GUILD tokens proportional to usage
- Agents can subscribe to knowledge bases (dynamic retrieval)
- Knowledge bases can be monetized independently

---

### F-10: Verifiable Inference (Roadmap — EigenLayer AVS)

**Future feature: cryptographic proof that inference happened correctly**

An EigenLayer AVS (Actively Validated Service) operated by Ajently:
- User runs agent → request sent to AVS operator set
- Operators run inference + sign the result
- Threshold signature (e.g., 2/3 of operators) required
- Result + signature stored with the run record
- Users can verify: this exact model + input = this output

Value proposition:
- Enterprise users can verify AI outputs without trusting the platform
- Compliance use cases (medical, legal, financial AI)
- On-chain smart contracts can consume verified AI outputs

---

## Feature Priority Matrix

| Feature | Priority | Status | Effort | Grant Angle |
|---------|----------|--------|--------|-------------|
| Streaming responses | P0 | In progress | 3d | — |
| SIWE auth | P0 | Planned | 2w | — |
| Arweave storage | P0 | Planned | 1w | Arweave grants |
| Filecoin knowledge | P0 | Planned | 1w | Filecoin grants |
| M-Pesa top-up | P1 | Planned | 1w | Africa grants |
| Mobile redesign | P1 | Planned | 3w | — |
| Base L2 contracts | P1 | Planned | 2w | Base grants |
| Agent-as-NFT | P2 | Roadmap | 2w | — |
| DataDAO knowledge | P2 | Roadmap | 4w | Filecoin grants |
| EigenLayer AVS | P3 | Roadmap | 8w | EigenLayer grants |
| Multi-turn chat | P1 | Planned | 1w | — |
| Creator public profile | P1 | Planned | 3d | — |
| ENS integration | P2 | Roadmap | 2d | — |
| Knowledge base sharing | P2 | Roadmap | 3w | — |
