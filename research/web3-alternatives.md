# Web3 Stack Alternatives Research

> Research date: 2026-02-28
> Context: Replacing/supplementing 0G Storage + 0G Compute in Ajently's architecture

---

## Evaluation Framework

Each protocol is scored across 8 dimensions (1-10):
1. **Ecosystem Maturity** — SDK quality, documentation, community size
2. **Bounty Availability** — Active hackathon/bounty programs in 2025-2026
3. **Grant Pipeline** — Foundation grant programs, size, accessibility
4. **Throughput** — Transactions per second / data throughput capability
5. **Cost** — Economic efficiency for the use case
6. **African Infra Compatibility** — Low-latency nodes in Africa, mobile-friendly
7. **Compliance Friendliness** — GDPR, KYC/AML, data residency options
8. **Community Strength** — Developer ecosystem, tooling, support

---

## Storage Layer Alternatives

### Arweave

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 8/10 | ArDrive, Turbo, Bundlr/Irys; 7+ years old; active developer ecosystem |
| Bounty Availability | 7/10 | Open Web Foundry grants; ETHGlobal prize track; periodic bounties |
| Grant Pipeline | 7/10 | Forward Research grants (Arweave ecosystem fund); $5M+ allocated |
| Throughput | 6/10 | ~1-2 TPS native; Turbo/Irys bundler: hundreds of items/sec |
| Cost | 7/10 | ~$0.001-0.01/KB; one-time payment; stable pricing |
| African Infra | 6/10 | No dedicated African gateways; Cloudflare arweave.net CDN helps |
| Compliance | 6/10 | Data permanent = GDPR tension; workaround: encrypt before upload |
| Community | 8/10 | Strong DeFi + NFT + permaweb community; growing dev grants |
| **Total** | **55/80** | |

**Best for**: Permanent manifest storage, agent metadata, audit trails
**Killer feature**: GraphQL indexer over all Arweave data — enables trustless agent discovery

---

### Filecoin / Lighthouse / web3.storage

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 9/10 | Largest decentralized storage network; 3000+ storage providers globally |
| Bounty Availability | 9/10 | FVM Foundry hackathon; Gitcoin rounds; DataDAO bounties; ETH Denver |
| Grant Pipeline | 9/10 | Filecoin Foundation + Protocol Labs: $200M+ grant program; DeStor, FFDW |
| Throughput | 8/10 | Lighthouse: 100MB+ uploads; IPFS retrieval via CDN |
| Cost | 9/10 | Near-zero via Filecoin Plus datacap; competitive even without |
| African Infra | 6/10 | IPFS gateways globally; some storage providers in Africa (Lighthouse expanding) |
| Compliance | 7/10 | CID-based; pinning can be stopped; not truly deletable from all nodes |
| Community | 9/10 | Most active decentralized storage community; Protocol Labs backing |
| **Total** | **66/80** | |

**Best for**: Knowledge file storage, large document storage, DataDAO pattern
**Killer feature**: Proof-of-Replication + Proof-of-Spacetime = strongest on-chain storage verification available

---

### IPFS + Pinata

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 10/10 | De facto standard for NFT/Web3 content; universal support |
| Bounty Availability | 6/10 | Less direct bounties; covered indirectly by Filecoin/ETH rounds |
| Grant Pipeline | 5/10 | No direct grant program; Protocol Labs covers some IPFS work |
| Throughput | 9/10 | HTTP API; high throughput; Cloudflare-cached retrieval |
| Cost | 7/10 | Pinata free: 1GB; paid: $0.15/GB/month — affordable |
| African Infra | 7/10 | `cloudflare-ipfs.com` gateway has excellent Africa coverage |
| Compliance | 6/10 | Files can be unpinned; may persist in network |
| Community | 10/10 | Largest Web3 storage community; every major NFT platform uses it |
| **Total** | **60/80** | |

**Best for**: CDN layer, image storage, fast content retrieval
**Limitation**: Not permanent; no on-chain proof without Filecoin

---

### Ceramic Network

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 7/10 | ComposeDB is stable; used by major social protocols |
| Bounty Availability | 5/10 | Gitcoin ecosystem; limited direct bounties |
| Grant Pipeline | 5/10 | 3Box Labs has ecosystem grants; smaller program |
| Throughput | 6/10 | Not designed for large file storage; optimized for structured data |
| Cost | 7/10 | Node hosting or rely on community infrastructure |
| African Infra | 5/10 | No Africa-specific nodes documented |
| Compliance | 7/10 | User-controlled data streams; DID-based consent |
| Community | 6/10 | Active but niche; strong in identity/social use cases |
| **Total** | **48/80** | |

**Best for**: User profiles, mutable agent metadata (description updates), social features
**Not for**: Large file storage, immutable manifests

---

### Aleph.im

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 6/10 | Growing; storage + compute in one platform |
| Bounty Availability | 5/10 | Occasional bounties; smaller program |
| Grant Pipeline | 5/10 | Aleph Foundation grants; limited info |
| Throughput | 7/10 | Decent API throughput; supports streaming |
| Cost | 7/10 | ALEPH token payments; competitive |
| African Infra | 5/10 | No documented Africa PoP |
| Compliance | 6/10 | Similar to IPFS; node-pinned |
| Community | 5/10 | Smaller but active |
| **Total** | **46/80** | |

**Best for**: Combined storage + compute use case; Aleph functions for serverless compute

---

## Compute / L2 Chain Alternatives

### Arbitrum (Arbitrum One / Orbit)

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 10/10 | Largest EVM L2 by TVL; full EVM equivalence; excellent tooling |
| Bounty Availability | 9/10 | Arbitrum Odyssey; LTIPP; Gitcoin rounds; ETHGlobal |
| Grant Pipeline | 9/10 | Arbitrum DAO: $300M+ ARB grants; LTIPP 2024 heavily funded DeFi + infra |
| Throughput | 8/10 | ~40,000 TPS theoretical; 4000+ TPS practical; sub-second finality |
| Cost | 8/10 | ~$0.01-0.05/tx; Arbitrum Stylus enables WASM contracts (lower gas) |
| African Infra | 8/10 | Arbitrum One uses Ethereum L1 for security; any EVM RPC works; Ankr/Alchemy have Africa nodes |
| Compliance | 8/10 | EVM-compatible; enterprise-grade tooling; regulators familiar |
| Community | 10/10 | Largest L2 developer community; 1000+ deployed dApps |
| **Total** | **70/80** | |

**Best for**: Smart contract deployment, credit registry, agent NFTs, on-chain marketplace
**Orbit**: Custom L3 on Arbitrum — could run dedicated agent marketplace chain

---

### Base (Coinbase)

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 9/10 | OP Stack; rapidly growing; Coinbase backing provides institutional credibility |
| Bounty Availability | 8/10 | Base ecosystem fund; ETHGlobal prizes; Coinbase Ventures grants |
| Grant Pipeline | 8/10 | Base Ecosystem Fund: $50M+ allocated; strong for consumer apps |
| Throughput | 8/10 | OP Stack; similar to Optimism; improving with OP mainnet upgrades |
| Cost | 9/10 | Very low gas; EIP-4844 blobs reduce costs further |
| African Infra | 7/10 | Coinbase OnRamp has some Africa support; Quicknode has Africa nodes |
| Compliance | 9/10 | Coinbase regulatory track record; most compliance-friendly L2 |
| Community | 9/10 | Fast-growing; consumer-focused; strong NFT/social ecosystem |
| **Total** | **67/80** | |

**Best for**: Consumer-facing app deployment, fiat onramps, regulatory compliance
**Killer feature**: Coinbase OnRamp + Coinbase Wallet = lowest friction onboarding globally

---

### Optimism / OP Stack

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 9/10 | Mature; Superchain vision; Base, Mode, Zora, etc. all built on OP Stack |
| Bounty Availability | 8/10 | Optimism Collective RPGF rounds; Gitcoin; ETHGlobal |
| Grant Pipeline | 9/10 | Optimism RPGF: hundreds of millions in grants; ongoing rounds |
| Throughput | 8/10 | Similar to Base; ~2000 TPS practical |
| Cost | 9/10 | Very low with EIP-4844; ~$0.001-0.01/tx |
| African Infra | 7/10 | Standard EVM RPC providers; no Africa-specific nodes |
| Compliance | 8/10 | Well-established; regulatory clarity similar to Ethereum |
| Community | 9/10 | Strong open-source community; Superchain growing |
| **Total** | **67/80** | |

**Best for**: Public goods funding through RPGF — Ajently as public infrastructure could qualify
**Killer feature**: Retroactive Public Goods Funding (RPGF) — get grants after proving impact

---

### Polygon CDK (zkEVM)

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 8/10 | zkEVM in production; Polygon PoS largest DeFi ecosystem after Ethereum |
| Bounty Availability | 8/10 | Polygon Village grants; ETHGlobal; Gitcoin |
| Grant Pipeline | 8/10 | Polygon Foundation: $100M+ in grants; Village Incubator |
| Throughput | 9/10 | zkEVM: high throughput; CDK chains: custom DA = very high throughput |
| Cost | 8/10 | Very low; zkEVM gas competitive; CDK with Celestia DA = near-zero |
| African Infra | 8/10 | Polygon PoS has the best Africa RPC coverage; MaticVigil, QuickNode nodes |
| Compliance | 7/10 | ZK proofs = privacy-preserving; good for GDPR |
| Community | 9/10 | Large community; strong enterprise partnerships |
| **Total** | **65/80** | |

**Best for**: Africa market (best existing RPC coverage); sovereign app-chain via CDK
**Killer feature**: Polygon's existing Africa network penetration is the best of any L2

---

### Solana

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 9/10 | High-performance L1; mature DeFi + NFT ecosystem |
| Bounty Availability | 8/10 | Solana Hackathons (Colosseum); Superteam DAO bounties; extensive ecosystem grants |
| Grant Pipeline | 8/10 | Solana Foundation Grants; Superteam (Africa chapter active); Colosseum |
| Throughput | 10/10 | ~65,000 TPS; sub-400ms finality; parallelized execution |
| Cost | 10/10 | ~$0.00001/tx — effectively free |
| African Infra | 7/10 | Superteam Africa is active in Nigeria, Ghana, Kenya; ecosystem growing |
| Compliance | 6/10 | Centralization concerns; less familiar to regulators |
| Community | 9/10 | Fast-growing; Breakpoint conference draws global community |
| **Total** | **67/80** | |

**Best for**: High-volume micropayments (agent runs = $0.01-0.05), NFT agent cards
**African angle**: Superteam Africa chapter provides local community + grants access
**Risk**: Solana has had historical downtime incidents; not EVM-compatible (requires different toolchain)

---

### Polkadot / Kusama Parachains

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 8/10 | Substrate framework; 50+ active parachains; XCM cross-chain messaging |
| Bounty Availability | 7/10 | Polkadot Bounties Program; Kusama treasury; ecosystem grants |
| Grant Pipeline | 9/10 | Web3 Foundation Grants: 600+ funded projects; W3F open grants program ongoing |
| Throughput | 8/10 | Parachain: ~1000 TPS; upcoming Polkadot 2.0 = elastic scaling |
| Cost | 8/10 | DOT/KSM transactions cheap; parachain slot no longer required (Polkadot 2.0 coretime) |
| African Infra | 5/10 | Limited Africa-specific node operators; generally lower coverage |
| Compliance | 8/10 | Substrate enables on-chain governance + compliance features |
| Community | 8/10 | Strong technical community; Parity backing |
| **Total** | **61/80** | |

**Best for**: Custom sovereign chain via Substrate; enterprise use case where chain control is required
**Killer feature**: Web3 Foundation grants are the most systematic and well-documented in the space

---

### Near / BOS (Blockchain Operating System)

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 8/10 | Aurora (EVM-compatible); sharded L1; B.O.S. for decentralized frontends |
| Bounty Availability | 7/10 | Near Ecosystem Fund; DevHub; HZN accelerator |
| Grant Pipeline | 7/10 | Near Foundation: $50M+ in grants; ongoing quarterly programs |
| Throughput | 9/10 | Sharded: ~100,000 TPS theoretical; fast finality |
| Cost | 9/10 | Near-zero transaction costs; storage staking model |
| African Infra | 6/10 | Better-than-average coverage; Pagoda team active globally |
| Compliance | 7/10 | Account-based model; human-readable addresses |
| Community | 7/10 | Growing; strong in Southeast Asia + Eastern Europe |
| **Total** | **60/80** | |

**Best for**: Decentralized frontend hosting via BOS components; social layer
**Interesting**: B.O.S. allows UI components to be stored on-chain and composed — could serve agent UI components

---

### Celestia (Modular DA Layer)

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 7/10 | Production mainnet since late 2023; rapidly growing modular ecosystem |
| Bounty Availability | 6/10 | Celestia Foundation grants; ecosystem builder programs |
| Grant Pipeline | 7/10 | Celestia Foundation: focused on enabling modular ecosystems |
| Throughput | 10/10 | Data Availability: 6.7MB/block currently; roadmap to 1GB/block |
| Cost | 9/10 | DA costs orders of magnitude cheaper than Ethereum calldata |
| African Infra | 5/10 | Light node designed to run on mobile — phones, Raspberry Pi = African infra-friendly |
| Compliance | 7/10 | Separation of layers enables flexible compliance |
| Community | 7/10 | Strong technical community; growing rapidly |
| **Total** | **58/80** | |

**Best for**: DA layer for a sovereign rollup; extremely cheap data availability
**African angle**: Celestia light node runs on mobile — aligns with Africa's mobile-first infrastructure

---

### EigenLayer (AVS — Actively Validated Services)

| Dimension | Score | Detail |
|-----------|-------|--------|
| Ecosystem Maturity | 7/10 | Production since 2024; restaking ecosystem growing rapidly |
| Bounty Availability | 7/10 | EigenLayer Foundation grants; AVS builder programs |
| Grant Pipeline | 7/10 | EigenLayer Foundation + Eigen Foundation: multiple funding tracks |
| Throughput | 8/10 | Inherits Ethereum security; AVS-specific throughput varies |
| Cost | 7/10 | Restaking costs gas; AVS costs depend on design |
| African Infra | 5/10 | Operator set is Ethereum validator set; no Africa-specific operators |
| Compliance | 7/10 | Ethereum-level compliance |
| Community | 8/10 | Fast-growing; high developer interest |
| **Total** | **56/80** | |

**Best for**: Verifiable AI inference (AVS can provide cryptographic guarantees that a specific model ran a specific input)
**Interesting**: An EigenLayer AVS for Ajently's compute layer would enable **cryptographically verified inference** — a major differentiator

---

## Summary Scorecard

| Protocol | Storage | Compute/L2 | Total | Best Use in Ajently |
|----------|---------|-----------|-------|---------------------|
| Arweave | 55/80 | — | 55 | Manifest storage |
| Filecoin | 66/80 | — | 66 | Knowledge file storage |
| IPFS/Pinata | 60/80 | — | 60 | CDN layer |
| Ceramic | 48/80 | — | 48 | User profiles |
| Aleph.im | 46/80 | — | 46 | Combined storage+compute |
| Arbitrum | — | 70/80 | 70 | Smart contracts, credit registry |
| Base | — | 67/80 | 67 | Consumer onboarding, fiat |
| Optimism | — | 67/80 | 67 | RPGF grants, public goods |
| Polygon CDK | — | 65/80 | 65 | Africa market, app-chain |
| Solana | — | 67/80 | 67 | Micropayments, Africa community |
| Polkadot | — | 61/80 | 61 | Enterprise, sovereign chain |
| Near BOS | — | 60/80 | 60 | Decentralized frontend |
| Celestia | — | 58/80 | 58 | DA layer for rollup |
| EigenLayer | — | 56/80 | 56 | Verifiable AI inference |
