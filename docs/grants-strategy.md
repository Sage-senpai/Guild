# Grants Strategy — Guild (formerly Ajently)

> Document date: 2026-02-28
> Goal: Secure $200K-$1M in non-dilutive grants over 12 months

---

## Executive Summary

Guild is strategically positioned to capture grants from multiple protocol ecosystems simultaneously. Our positioning at the intersection of **decentralized AI**, **decentralized storage**, **Africa market**, and **consumer Web3** creates unique overlapping grant eligibility.

**Target grant total (12 months)**: $200,000 – $1,000,000 in tokens + cash

---

## Tier 1 — Immediate Applications (Month 1-2)

### 1.1 Filecoin Foundation Developer Grant

**Program**: Filecoin Foundation grants.filecoin.io
**Grant size**: $25,000 – $100,000
**Application type**: Open, rolling
**Likelihood**: HIGH (85%)

**Why we qualify**:
- Knowledge files stored as Filecoin deals = primary storage use case
- IPFS CIDs for knowledge retrieval = protocol adoption
- Consumer application (not just tooling) = grants committee preference
- Africa user base = social impact + geographic diversity bonus

**Application narrative**:
> Guild is deploying Filecoin as the production storage layer for AI agent knowledge bases — the private data files that give AI agents expertise in specific domains. Every agent published on Guild stores its knowledge file as a Filecoin deal via Lighthouse, generating demand for Filecoin storage at scale. At 10,000 agents published (our 12-month target), this represents ~50GB of new Filecoin storage demand.

**Deliverables to propose**:
- Lighthouse SDK integration (publishable as open-source)
- IPFS retrieval gateway integration
- Blog post: "Building an AI Agent Marketplace on Filecoin"
- Demo video showing storage proof flow

**Timeline**: Apply month 1. Decision in 4-6 weeks. Milestone payments over 3 months.

---

### 1.2 Superteam Africa Grants

**Program**: Superteam Africa (via Solana Foundation)
**Grant size**: $2,000 – $25,000
**Application type**: Rolling; fast decisions (2-3 weeks)
**Likelihood**: HIGH (80%)

**Why we qualify**:
- Africa-first product design
- Mobile money integration (M-Pesa, MTN, Airtel)
- Team with Africa connections
- Product accessible to non-crypto users

**Note**: This grant is smaller but comes with community access — local meetups, demo days, press coverage, ambassador network. The non-financial value is significant.

**Deliverables**:
- Local community event (virtual is acceptable)
- Content about Guild in Superteam newsletter
- Integration with Superteam Nigeria/Kenya community Discord

---

### 1.3 Arweave / Forward Research Grant

**Program**: Forward Research (Arweave ecosystem fund)
**Grant size**: $10,000 – $100,000
**Application type**: Open
**Likelihood**: MEDIUM-HIGH (70%)

**Why we qualify**:
- Agent manifests stored permanently on Arweave
- Novel use case: AI agent permanence as permaweb content
- Turbo/Irys integration = protocol adoption
- GraphQL indexer usage: agents discoverable via Arweave explorer

**Application narrative**:
> Guild is building the first permaweb-native AI agent marketplace. Agent manifests — the cryptographic definition of an AI agent — are published permanently to Arweave. This means once an agent is published on Guild, it exists forever: no platform can censor it, no company can delete it. We're extending the permaweb vision from static content to living AI systems.

**Deliverables**:
- Arweave Turbo/Irys integration (open-source adapter)
- Arweave GraphQL indexing for agent discovery
- Blog post on Arweave Mirror: "The Permaweb AI Agent"

---

## Tier 2 — Month 2-4 Applications

### 2.1 Base Ecosystem Fund

**Program**: Base Ecosystem Fund (Coinbase)
**Grant size**: $50,000 – $500,000
**Application type**: Application + interview
**Likelihood**: MEDIUM (60%)

**Why we qualify**:
- Consumer application (Coinbase's stated preference)
- Africa user base = Coinbase's global expansion market
- Coinbase OnRamp integration for fiat-to-credit
- Base L2 smart contracts for credit registry
- Low-friction wallet experience = aligns with Base's mass adoption mission

**What to build for this grant**:
- Credit registry smart contract on Base mainnet
- Coinbase OnRamp integration
- Coinbase Wallet deep link integration
- Co-marketing with Base team

**Ask**: $100,000 to fund 3 months of development + marketing

---

### 2.2 Arbitrum DAO LTIPP

**Program**: Long-Term Incentive Pilot Program
**Grant size**: $50,000 – $3,000,000 in ARB
**Application type**: Forum proposal → Snapshot vote → DAO approval
**Likelihood**: MEDIUM (55%)

**Strategy**:
- Deploy agent registry + credit contract on Arbitrum
- Request ARB emissions to incentivize agent creation and runs
- Position as consumer onboarding tool for Arbitrum ecosystem

**Forum proposal outline**:
```
Title: [LTIPP] Guild AI Agent Marketplace — Incentivizing
       Creator Economy on Arbitrum

Summary:
  Guild is an AI agent marketplace. We are requesting [X] ARB
  to incentivize:
  - Agent creation (publishers earn ARB bonus)
  - Agent usage (users earn ARB for first 100 runs)
  - Creator retention (top creators receive ARB staking rewards)

Deployment plan:
  - Month 1: Deploy contracts on Arbitrum One
  - Month 2-4: ARB incentive distribution
  - Month 5-6: Report on traction + retention metrics
```

**Timeline**: Forum post → 2-week discussion → Snapshot vote → DAO execution. Allow 8 weeks total.

---

### 2.3 Google for Startups — Accelerator: Africa

**Program**: Google for Startups Accelerator Africa (cohort program)
**Grant size**: $200,000 in Google Cloud credits + technical mentorship
**Application type**: Competitive cohort (2-3 cohorts/year)
**Likelihood**: MEDIUM (50%)

**Why we qualify**:
- AI-powered startup with Africa market focus
- Verifiable traction (agent runs, user count)
- Strong founder narrative (building for Africa, not extracting from it)
- Google Cloud credits = production infrastructure at zero cost

**What this unlocks**:
- $200K in GCP credits = ~2 years of infrastructure cost-free
- Access to Google's ML APIs and AI models
- Technical mentorship from Google engineers
- Potential Google Cloud partnership for marketing

---

## Tier 3 — Month 4-6 Applications

### 3.1 Optimism RPGF

**Program**: Retroactive Public Goods Funding (RetroPGF) — rounds ongoing
**Grant size**: Variable; historically $10K – $500K for individual projects
**Timeline**: Retroactive — apply after proving impact
**Likelihood**: MEDIUM (50%)

**Strategy**: Build in public. Document everything. Create impact.

**Impact metrics to track for RPGF**:
- Number of agents published
- Number of unique creators
- Number of countries reached
- Open-source code published + forks/stars
- Educational content (blog posts, tutorials)

**RPGF narrative**:
> Guild is public goods infrastructure for the AI creator economy. By open-sourcing our storage adapter layer, we're creating reusable primitives that any Web3 application can use to integrate Arweave + Filecoin storage. Our Africa-first design creates resources (documentation, UX patterns, mobile money integrations) that benefit the entire African Web3 ecosystem.

**What to open source** (specifically for RPGF eligibility):
- `@guild/storage-adapters` — Arweave + Filecoin adapters
- `@guild/agent-schema` — open JSON schema for AI agent manifests
- `@guild/siwe-next` — Next.js SIWE authentication library

---

### 3.2 Web3 Foundation Grants (if Substrate parachain)

**Program**: Web3 Foundation Open Grants Program
**Grant size**: $10,000 – $100,000 per milestone
**Application type**: GitHub PR to w3f/grants repository
**Likelihood**: MEDIUM (60%) — if Polkadot integration is built

**Only pursue if**: Team decides to build a Substrate-based agent registry or Polkadot parachain integration.

**Potential proposal**: "Polkadot Agent Registry Pallet — A Substrate pallet for on-chain AI agent registration with IPFS/Arweave storage proofs"

---

## Grant Application Operations

### Team Structure Needed
- **Grant writer** (part-time, 10h/week): Research, write, submit, track
- **Technical lead**: Builds grant deliverables; technical documentation
- **Community manager**: Engage with grant committee communities (Discord, forums)

### Grant Management System
```
Grant Tracker (Notion/Linear)
  ├── Active Applications
  │   ├── Filecoin Foundation — submitted Feb 28 — awaiting decision
  │   ├── Superteam Africa — draft in progress
  │   └── Arweave Forward Research — planned March 15
  ├── Approved Grants
  ├── Milestone Tracking
  │   ├── Milestone 1: [deliverable] — [due date] — [status]
  │   └── Milestone 2: [deliverable] — [due date] — [status]
  └── Rejected Applications (with learnings)
```

### Grant Deliverable Calendar (12 months)

| Month | Grant | Deliverable |
|-------|-------|-------------|
| 1 | Filecoin Foundation | Lighthouse SDK integration + blog post |
| 1 | Superteam Africa | Africa demo day presentation |
| 2 | Arweave Forward Research | Turbo integration + Mirror article |
| 3 | Base Ecosystem Fund | Credit registry contract deployed |
| 4 | Filecoin Foundation | Milestone 2: IPFS gateway, 100 agents on Filecoin |
| 5 | Arbitrum DAO | Forum proposal live |
| 6 | Google for Startups | Application submitted (next cohort) |
| 7 | Optimism RPGF | Impact report published |
| 8 | Base Ecosystem Fund | Coinbase OnRamp live |
| 9 | All | Quarterly grants report |
| 12 | Optimism RPGF | Apply to Round 6 |

---

## Estimated Grant Revenue

| Grant | Conservative | Optimistic |
|-------|-------------|------------|
| Filecoin Foundation | $25,000 | $100,000 |
| Superteam Africa | $5,000 | $25,000 |
| Arweave Forward Research | $10,000 | $100,000 |
| Base Ecosystem Fund | $50,000 | $250,000 |
| Arbitrum LTIPP (ARB tokens) | $25,000 | $500,000 |
| Google for Startups (Cloud credits) | $50,000 | $200,000 |
| Optimism RPGF | $10,000 | $200,000 |
| **TOTAL** | **$175,000** | **$1,375,000** |

---

## Risk Mitigation

| Risk | Probability | Mitigation |
|------|------------|------------|
| Grant delayed by DAO vote | Medium | Apply early; build community support before snapshot |
| Milestones harder than expected | Medium | Scope milestones conservatively; underpromise, overdeliver |
| Grant denominated in volatile token | Medium | Request stable portion in USDC; hedge ARB if received |
| Competing projects approved first | Low | First-mover advantage; unique Africa angle |
| Grant committee changes priorities | Low | Maintain relationships with multiple programs |
