# Guild — Pitch Deck Narrative

> Version: 1.0 | February 2026
> Stage: MVP → Seed
> Audience: Web3 Foundation, Protocol Labs, Arbitrum DAO, early-stage VCs

---

## The Slide Deck Narrative

---

### SLIDE 1 — The Problem

**500 million people in Africa cannot access quality AI tools.**

Not because they lack devices or data plans. Because the tools that exist:
- Are priced in USD, billed monthly, for people earning $5/day
- Require credit cards that 80% of Africans don't have
- Are controlled by companies that can (and do) restrict access without notice
- Offer no way for local builders to earn from building AI tools for their community

Meanwhile, 1.4 billion people globally are creating AI agents — prompts, tools, systems — with **no marketplace to share or monetize them**.

---

### SLIDE 2 — The Opportunity

**AI agents are the new apps. There is no App Store for them.**

- OpenAI's GPT Store has 3M+ custom GPTs — but zero creator monetization
- Hugging Face Spaces has 500K+ demos — but no payment rail
- Character.ai has 20M users — but creators get nothing

**The AI agent economy is being built. The distribution layer doesn't exist yet.**

Market size:
- AI software market: $184 billion by 2030 (Grand View Research)
- Creator economy: $480 billion by 2027 (Goldman Sachs)
- Intersection: **AI creator tools and distribution** — underserved, fast-growing

---

### SLIDE 3 — The Solution

**Guild is a decentralized marketplace for AI agents.**

Creators publish agents. Users run them. Value flows directly between them — no middleman.

```
Creator publishes agent:
  → System prompt + knowledge file → stored permanently on Arweave
  → Agent manifest → cryptographic proof of existence
  → Listed in marketplace → discoverable by anyone

User runs agent:
  → Pays in credits (from ETH, USDC, or mobile money)
  → Agent runs through decentralized compute
  → Output delivered. Credits deducted. Creator earns.
```

**Three properties that define Guild**:
1. **Permanent** — agents stored on Arweave live forever; cannot be censored or deleted
2. **Verifiable** — every agent has a storage proof; users can verify what they're running
3. **Global** — no bank account required; top up with M-Pesa, Airtel, or any wallet

---

### SLIDE 4 — Product Demo

**Marketplace** — browse 50+ agents across 8 categories
**Create** — publish an agent in 3 steps (name, prompt, price)
**Run** — chat with any agent, debit credits in real-time
**Credits** — top up via ETH, USDC, or M-Pesa
**Storage Proof** — every agent links to its Arweave/Filecoin proof

*[Link to live demo: https://guild.io]*

---

### SLIDE 5 — Traction (fill in with real numbers)

```
Metric                        Value
─────────────────────────────────────────────────────
Agents published              [X]
Total agent runs              [X]
Unique wallet addresses        [X]
Countries reached             [X]
Hackathon prizes won          [List prizes]
Storage proofs generated      [X]
Average cost per run          $0.02
```

---

### SLIDE 6 — Why Web3

1. **Creator ownership**: System prompts stored on Arweave are owned by the creator's wallet — not by Guild
2. **Censorship resistance**: No platform can remove an agent that's on Arweave
3. **Cross-border payments**: ETH, USDC, and native token payments work the same in Lagos, Nairobi, and New York
4. **Composability**: Agents can be tokens; other protocols can integrate them; no permission needed
5. **Verifiable compute**: EigenLayer AVS roadmap enables cryptographic proof that a specific model ran a specific input

---

### SLIDE 7 — Africa-First, Global-Scale

**Why Africa first?**
- 400M+ internet users, 80% mobile-only
- Creator economy growing 25% YoY in sub-Saharan Africa
- 60% of Africa is under 25 — digital-native, AI-curious
- Mobile money penetration: 48% in East Africa vs 3% for bank cards
- Superteam Africa already active in Nigeria, Kenya, Ghana

**What Africa-first means in product terms**:
- PWA (no app store required)
- M-Pesa, MTN Mobile Money, Airtel Money credit top-ups
- Brotli-compressed, low-bandwidth API responses
- Offline agent catalog browsing
- Sub-$0.01 per agent run (accessible pricing)

**Why this scales globally**: Mobile-first, low-bandwidth design is just good product. Every optimization for Africa improves the experience everywhere.

---

### SLIDE 8 — Business Model

```
Revenue Stream        Mechanism              Margin
─────────────────────────────────────────────────────────────
Platform fee          5% of credit top-ups   ~95%
Premium listings      Featured placement     100%
Enterprise tier       Private agent hosting  70-80%
API access (future)   Agents via API         ~90%
Token (future)        Protocol fee in GUILD  ~100%
```

**Unit economics**:
- Average run cost: $0.025 (compute cost to platform)
- Average price per run: $0.03 (creator-set)
- Platform take: 5% of top-ups = $0.005 per $0.10 credited
- Break-even: 500 active users, 10 runs/day each

---

### SLIDE 9 — Technology Stack

```
Layer              Technology              Why
─────────────────────────────────────────────────────────────
Frontend           Next.js 16 + React 19   Best DX + edge perf
Wallet             RainbowKit + Wagmi       Multi-chain standard
Database           Turso (libSQL edge)     Global reads <5ms
Storage            Arweave + Filecoin      Permanent + verified
CDN                Cloudflare              100+ Africa PoPs
Compute            OpenRouter + 0G         Multi-model routing
Blockchain         Base L2 (roadmap)       Low cost, high adoption
Auth               SIWE (roadmap)          Wallet-native sessions
```

---

### SLIDE 10 — Team

```
[Founder Name]     Background — Web3 / AI / Africa experience
[Co-founder]       Background — Engineering / Protocol
[Advisor]          Background — DeFi / Grants / Ecosystem
```

---

### SLIDE 11 — Roadmap

```
Q1 2026 (Now)
  ✓ MVP live with 0G Storage integration
  ✓ 12+ demo agents, credit economy working
  → Storage migration to Arweave + Filecoin
  → SIWE authentication + user isolation

Q2 2026
  → Mobile-optimized redesign (this design system)
  → M-Pesa / mobile money credit top-up
  → Filecoin + Arweave grants secured
  → ETHGlobal hackathon entry

Q3 2026
  → Base L2 credit registry contract
  → 1,000 active users
  → Superteam Africa partnership
  → Arbitrum LTIPP application

Q4 2026
  → Agent-as-NFT (ERC-721 on Base)
  → 10,000 agents published
  → Seed round ($500K-$2M)
  → EigenLayer verifiable inference (pilot)

2027
  → 100,000 users, 50,000 agents
  → Multi-chain (Solana blinks)
  → Protocol token launch
  → Series A
```

---

### SLIDE 12 — The Ask

**Seeking: $[X] in [grants / pre-seed / seed]**

Use of funds:
```
Engineering (3 devs × 12 months)    60%
Growth / Africa community            20%
Infrastructure (compute, storage)    10%
Legal / compliance                   10%
```

**Non-dilutive grants we are pursuing**:
- Filecoin Foundation Developer Grant ($50K)
- Base Ecosystem Fund ($100K)
- Arbitrum LTIPP ($200K in ARB)
- Superteam Africa ($10K)
- Optimism RPGF (retroactive, based on impact)

---

### CONTACT

```
Website:  https://guild.io
Email:    [founder@guild.io]
Twitter:  @guildprotocol
GitHub:   github.com/guildprotocol
Deck:     [link]
```
