# Grants Strategy — Guild

> Version: 2.0 | March 2026
> Stack: Polkadot · KILT · Crust · Moonbeam · PAPI
> Goal: Secure $175K–$705K in non-dilutive grants over 12 months

---

## Executive Summary

Guild is strategically positioned at the intersection of **Polkadot-native identity**, **decentralised AI**, **decentralised storage**, and **Africa market access**. This creates overlapping grant eligibility across multiple ecosystems — Polkadot Treasury, Web3 Foundation, Crust, KILT, Moonbeam, and Superteam Africa.

Our Polkadot-native stack (KILT PoP, People Chain identity, Crust storage, PAPI, Moonbeam EVM) means we are not a peripheral ecosystem partner — we are a core Polkadot use case.

---

## Tier 1 — Highest Priority

### 1. Web3 Foundation Open Grants

**URL**: https://grants.web3.foundation/
**Amount**: $10K–$100K per grant (multi-grant possible)
**Cadence**: Rolling applications

**Angle**:
- PAPI (`polkadot-api`) integration in a production dApp is a direct W3F priority
- Polkadot People Chain identity lookup with UI (display name, judgements)
- KILT Protocol PoP implementation — W3F co-funded KILT
- Africa-first market (aligns with W3F inclusion mandate)

**Deliverables for application**:
1. PAPI client + People Chain identity module (`lib/papi/`)
2. Crust Network storage integration replacing 0G
3. Published agent with verifiable on-chain manifest
4. Open-source codebase + technical write-up

**Estimated grant**: $50K–$100K (split across 2 milestones)

---

### 2. Polkadot Treasury

**URL**: https://polkadot.polkassembly.io/
**Amount**: Variable (DOT-denominated, $50K–$500K range)
**Cadence**: Ongoing proposals; monthly council votes

**Angle**:
- Guild is a showcase dApp for the full Polkadot stack: KILT + People Chain + Crust + Moonbeam + PAPI
- Human Task Marketplace: real economic activity flowing through Polkadot ecosystem
- Africa market expansion = new users onboarded to Polkadot-native products
- Marketing asset: "App Store for AI agents, built on Polkadot"

**Proposal sections**:
- Problem statement (AI agent ownership, Africa exclusion)
- Technical integration details (PAPI, Crust, KILT, Moonbeam)
- Deliverables + timeline
- Team credentials
- Metrics: active users, tasks completed, agent runs, credits volume

**Estimated grant**: $100K–$200K DOT equivalent

---

### 3. Moonbeam Foundation Grants

**URL**: https://moonbeam.foundation/grants/
**Amount**: $30K–$150K
**Cadence**: Rolling

**Angle**:
- Task escrow smart contract deployment on Moonbeam (Solidity)
- Agent-as-NFT (ERC-721) on Moonbeam with Crust metadata
- USDC on Moonbeam as primary Guild credit top-up rail
- XCM integration demo (Moonbeam ↔ KILT credential verification)

**Deliverables**:
1. `TaskEscrow.sol` deployed on Moonbeam mainnet
2. ERC-721 agent minting contract
3. USDC credit top-up via Moonbeam OnRamp
4. Integration guide

**Estimated grant**: $50K–$100K

---

### 4. KILT Foundation / BOTLabs

**URL**: https://www.kilt.io/
**Amount**: $20K–$80K
**Cadence**: Quarterly

**Angle**:
- Guild is the first consumer product implementing KILT PoP for human task marketplace gating
- Live use case: KILT credentials required to claim $0.50–$50 micro-tasks
- Demonstrates KILT's SocialKYC → Spiritnet attestation → dApp integration flow
- Real transaction volume on KILT Spiritnet

**Deliverables**:
1. Open-source KILT integration (`lib/kilt/verify.ts`)
2. `KILT_VERIFY_MODE=real` live on Spiritnet
3. Case study: "How Guild uses KILT for Sybil-resistant task marketplace"
4. Co-marketing: KILT docs linking to Guild as reference implementation

**Estimated grant**: $25K–$50K

---

## Tier 2 — High Priority

### 5. Crust Foundation

**URL**: https://crust.network/grants
**Amount**: $20K–$100K
**Cadence**: Quarterly

**Angle**:
- Crust replaces 0G Storage as Guild's primary storage layer
- Every published agent = Crust Network file (IPFS CID + incentive deal)
- Storage verification via PAPI: `api.query.market.filesV2(cid)`
- Demonstrates real storage throughput: agent manifests + knowledge files
- Africa CDN via Crust's decentralised gateway network

**Deliverables**:
1. `lib/storage/crust.ts` — Crust SDK integration
2. Agent manifest + knowledge file upload flow
3. Storage proof verification in UI
4. Open-source guide: "Migrating from 0G to Crust Network"

**Estimated grant**: $30K–$60K

---

### 6. Superteam Africa (Solana Foundation umbrella)

**URL**: https://superteam.fun/grants
**Amount**: $5K–$25K
**Cadence**: Monthly

**Note**: Superteam is Solana-native but has an Africa mandate that overlaps. Guild can apply for the Africa market angle regardless of underlying chain.

**Angle**:
- M-Pesa + MTN Mobile Money credit top-up (Kenya, Ghana, Uganda)
- Human Task Marketplace: income stream for African crypto-native workers
- Testnet tasks for Africa: helps African DeFi protocols attract testers

**Deliverables**:
1. M-Pesa STK push integration
2. MTN Mobile Money integration
3. Africa-specific landing page + marketing
4. Partnership with 2 African Web3 communities (e.g. Web3Lagos, Nairobi Web3)

**Estimated grant**: $10K–$25K

---

### 7. Polkadot People Chain / Parity Technologies

**URL**: https://github.com/paritytech/ecosystem-grants
**Amount**: $15K–$50K

**Angle**:
- First dApp to query People Chain identity in a consumer product
- PAPI integration with People Chain descriptors
- Display on-chain display name + registrar judgements in agent/task UI
- Parity wants People Chain adoption — Guild drives real user queries

---

## Tier 3 — Secondary

### 8. Arbitrum LTIPP / STIP (if EVM component expanded)

Not current priority. Guild is Polkadot-native. If Moonbeam deployment succeeds, may apply for Base or Arbitrum ecosystem fund for the AI agent marketplace side.

### 9. ETH Global / Hackathons

- Enter hackathons with Polkadot + KILT + Crust stack
- Prize pools: $1K–$50K per event
- Builds ecosystem visibility and credibility

---

## Application Calendar

| Month | Application | Amount |
|-------|------------|--------|
| March 2026 | Web3 Foundation (milestone 1) | $30K |
| April 2026 | KILT Foundation | $25K |
| April 2026 | Superteam Africa | $15K |
| May 2026 | Polkadot Treasury proposal | $100K DOT |
| June 2026 | Crust Foundation | $40K |
| June 2026 | Web3 Foundation (milestone 2) | $50K |
| July 2026 | Moonbeam Foundation | $75K |
| Q3 2026 | Polkadot People Chain grant | $30K |

**Cumulative target**: $365K+ in 6 months

---

## Key Positioning Statements

For Web3 Foundation:
> "Guild is the first production application using PAPI (polkadot-api), People Chain identity queries, KILT PoP, and Crust storage together — demonstrating that Polkadot is a complete stack for decentralised AI applications."

For Polkadot Treasury:
> "Guild brings real economic activity to Polkadot: AI agent runs, human task rewards, and Africa fiat onramps — all flowing through Polkadot-native infrastructure."

For KILT:
> "Guild's Human Task Marketplace is the first consumer product requiring KILT credentials for access. We route real social attestation demand through KILT Spiritnet."

For Crust:
> "Every agent published on Guild creates a permanent file on Crust Network. We are a production storage customer demonstrating Crust's value proposition to Web3 developers."
