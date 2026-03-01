# Guild — Pitch Deck Narrative

> Version: 2.0 | March 2026
> Stage: MVP → Seed
> Audience: Web3 Foundation, Polkadot Treasury, Crust/CESS, Superteam Africa, early-stage VCs

---

## The Slide Deck Narrative

---

### Slide 1 — Opening Hook

**"AI is eating the world. But who owns the agents?"**

Every major company is racing to build AI agents. None of them let you own, monetize, or permanently preserve what you build. If OpenAI closes your account, your agents vanish. If the API changes, your workflows break.

Guild is the App Store for AI agents — permanently stored, creator-owned, censorship-resistant. And it runs on Polkadot.

---

### Slide 2 — Problem

Three broken dynamics:

**For creators**: You build an AI workflow, share it, get zero revenue. Your system prompt lives in someone's closed platform and disappears the moment they change their ToS.

**For users**: You can't discover or compare specialized AI agents. You're stuck with generic chatbots, rewriting the same prompt 100 times.

**For Africa**: $10/month AI subscriptions are inaccessible. No mobile money support. No local currency. No acknowledgement that 500M+ people exist.

---

### Slide 3 — Solution

Guild is a decentralized marketplace where:

- **Creators** publish AI agents with a permanent on-chain storage proof (Crust Network / IPFS)
- **Users** discover and run specialized agents using credits (topped up via M-Pesa, MTN Mobile Money, or USDC on Moonbeam)
- **Workers** earn credits completing crypto-native micro-tasks (Human Task Marketplace)

Everything is Polkadot-native: identity via KILT Protocol, storage via Crust Network, future contracts on Moonbeam.

---

### Slide 4 — Product

**Two tabs. One platform.**

**[Agents Tab]** — AI agent marketplace
- 12+ demo agents live: Viral Hook Architect, Pull Request Reviewer, SQL Fixer, Brand Moodboarder...
- Each agent: system prompt + optional knowledge file + price per run
- 18+ AI models via OpenRouter; decentralised inference via 0G Compute
- Storage proof on every published agent

**[Humans Tab]** — Human task marketplace (new)
- Same-day crypto micro-tasks: testnet runs, Discord tasks, DeFi interactions, social tasks
- $0.50–$50 credit rewards
- Proof of Personhood required (KILT credential) — Sybil-resistant by design
- Instant-claim or apply-mode per task
- Credits transfer atomically on approval; 48h auto-release

---

### Slide 5 — Why Polkadot

Polkadot isn't just a chain — it's the stack that makes Guild's architecture possible.

| Need | Polkadot Solution |
|------|-------------------|
| Proof of Personhood | **KILT Protocol** — Polkadot parachain for W3C verifiable credentials |
| On-chain identity | **Polkadot People Chain** — system parachain (Aug 2024), identity registrars |
| Decentralised storage | **Crust Network** — Polkadot parachain, IPFS incentive layer |
| EVM smart contracts | **Moonbeam** — EVM-compatible parachain, XCM-connected |
| TypeScript client | **PAPI** (`polkadot-api`) — <50kB, type-safe, light-client first |
| Cross-chain payments | **XCM** — native Polkadot messaging, USDC on Moonbeam |

The upcoming **DIM1/DIM2 (Project Individuality)** system from Gavin Wood (June 2025) will provide native ZK-based proof of personhood directly in the protocol — Guild is architected to adopt it as it launches.

---

### Slide 6 — Africa-First Strategy

Africa is the world's youngest continent. 70% of its population is under 30. They are crypto-native, mobile-first, and excluded from traditional AI pricing.

**The opportunity**:
- 500M+ active mobile money users (M-Pesa: 50M in Kenya alone)
- Growing developer community (Superteam Nigeria, Ghana, Kenya chapters)
- No local-currency AI subscription products
- Web3 adoption outpacing fiat banking infrastructure in East Africa

**Guild's Africa advantage**:
- M-Pesa STK push credit top-up (Kenya)
- MTN Mobile Money (Ghana, Uganda, Cameroon)
- Airtel Money (East/West Africa)
- Human Task Marketplace creates income for crypto-native workers
- Testnet tasks, Discord tasks, DeFi tasks — work that African users are already doing

---

### Slide 7 — Technology Stack

```
Frontend: Next.js 16 + TypeScript + React 19
           Design system: Deep Teal / Sea Green / Crimson (Polkadot palette)

Identity:  KILT Protocol (PoP via W3C VCs on Spiritnet)
           Polkadot People Chain (on-chain display name + registrar judgements)
           DIM1/DIM2 — roadmap

Storage:   Crust Network (IPFS + Polkadot incentive layer)
           Current: 0G testnet (migration planned)

Contracts: Moonbeam EVM (task escrow Phase 2, agent NFTs Phase 3)

Client:    polkadot-api (PAPI) — type-safe, light-client, <50kB

Database:  sql.js → Turso (libSQL) — migration planned for multi-user support
Auth:      SIWE / Substrate signature — planned (currently DEMO_USER_ID)
AI:        OpenRouter (18+ models) + 0G Compute + Mock fallback
```

---

### Slide 8 — Market Size

**AI Agents**: $45B market by 2030 (Grand View Research). No dominant open marketplace exists.

**Human Micro-Tasks**: $4.2B global crowdsourcing market (rising with Web3 participation incentives).

**Africa Digital Economy**: $712B TAM by 2050 (IFC). Mobile money penetration = distribution moat.

**Polkadot Ecosystem**: $8B+ DOT market cap. 50+ active parachains. Web3 Foundation actively funds projects in this stack.

---

### Slide 9 — Traction

- ✅ AI Agent Marketplace: 12+ demo agents, search, publish, run, chat
- ✅ Human Task Marketplace: full task lifecycle, KILT PoP, credit escrow
- ✅ Multi-chain credit top-up (ETH, USDC on 6 chains)
- ✅ Polkadot stack: KILT SDK integrated, @kiltprotocol/sdk-js installed
- 🔄 PAPI integration in progress
- 🔄 Crust Network storage migration in progress

---

### Slide 10 — Business Model

**Platform fee**: 5% on all task rewards (task marketplace)
**Run fee**: Creator sets price per agent run; Guild earns 0% (growth phase), 10% later
**Credit spread**: Credits purchased at market rate; platform earns on float
**Subscription** (future): Pro tier — unlimited runs, priority compute, analytics

At scale (100K active users, $2 average monthly spend): **$200K MRR**

---

### Slide 11 — Grant Strategy

Non-dilutive capital as primary funding path:

| Funder | Target | Rationale |
|--------|--------|-----------|
| Web3 Foundation | $50–250K | PAPI + People Chain + KILT integration |
| Polkadot Treasury | $50–200K DOT | Ecosystem dApp, Africa market, KILT PoP |
| Crust Foundation | $20–80K | Primary storage partner; integration showcase |
| Superteam Africa | $5–25K | Africa-first mobile money + micro-task economy |
| Moonbeam Foundation | $30–100K | EVM dApp, task escrow contracts |
| KILT Foundation | $20–50K | PoP use case, Human Marketplace showcase |

Total target: **$175K–$705K** in grants over 12 months.

---

### Slide 12 — The Ask

**$500K seed round** (alongside non-dilutive grants):
- 40% — Engineering (PAPI, Crust storage, auth, streaming)
- 25% — Africa market (M-Pesa/MTN integration, BD in Kenya/Nigeria)
- 20% — Protocol partnerships (Moonbeam, Crust, KILT ecosystem)
- 15% — Operations + legal

**What we will do with it**:
In 12 months: 10K+ active users, live in Kenya and Nigeria, Crust storage deployed, Moonbeam task escrow live, DIM1 integration when Polkadot ships it.

---

> Built on Polkadot. Africa-first. Human-verified. Open forever.
