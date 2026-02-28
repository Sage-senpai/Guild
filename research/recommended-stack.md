# Recommended Web3 Stack — Ajently

> Research date: 2026-02-28
> Decision framework: Africa-first, grant-rich, technically sound, production-viable

---

## Three Recommended Stack Options

---

## Option A: Ethereum L2 (Base) + Arweave + Filecoin (Recommended)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  USER LAYER                             │
│  Mobile-first Next.js PWA                               │
│  RainbowKit → Base + Mainnet + Polygon                  │
│  Coinbase Wallet + WalletConnect                        │
│  Fiat onramp: Coinbase Pay / MoonPay                    │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│               BLOCKCHAIN LAYER (Base)                   │
│  Credit Registry Contract (ERC-20 or custom balance)    │
│  Agent Registry Contract (ERC-721 agent NFTs)           │
│  Payment settlement: ETH / USDC on Base                 │
│  ~$0.001-0.01 per transaction                           │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│               STORAGE LAYER                             │
│  Arweave (Turbo/Irys) → Agent manifests, system prompts │
│  Filecoin (Lighthouse) → Knowledge files, large docs    │
│  IPFS/Cloudflare → CDN for fast content retrieval       │
│  Cloudflare R2 → Card images, static assets            │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│               COMPUTE LAYER                             │
│  OpenRouter (primary) → 18+ models, reliable API        │
│  EigenLayer AVS → Verifiable inference (roadmap)        │
│  Self-hosted Ollama nodes → Private enterprise agents   │
└─────────────────────────────────────────────────────────┘
│               DATABASE LAYER                            │
│  Turso (libSQL) → Global edge replicas                  │
│  Cloudflare Workers → Stateless API edge functions      │
└─────────────────────────────────────────────────────────┘
```

### Why This Stack

**Base advantages**:
- Coinbase backing = regulatory clarity + institutional trust
- Coinbase OnRamp: fiat → crypto in 170+ countries including Africa
- Low gas (EIP-4844 blobs): $0.001-0.01/tx
- Coinbase Wallet = best mobile UX for non-crypto users
- $50M+ in Base Ecosystem Fund grants available
- Coinbase has significant African user base (Nigeria, South Africa top markets)

**Arweave advantages**:
- Pay-once, store forever: zero ongoing storage cost for manifests
- Transaction ID = cryptographic proof (stronger than testnet hashes)
- GraphQL indexer: trustless agent discovery without central indexer
- Turbo upload service: high throughput, affordable even for many small files
- Forward Research grants available

**Filecoin advantages**:
- Proof-of-Spacetime: strongest available on-chain storage proof
- Near-zero cost with Filecoin Plus datacap
- Lighthouse SDK: simple API, IPFS-compatible CIDs
- Protocol Labs grants: best grant program in decentralized storage
- Storage providers emerging in Africa (expanding)

### Grant Capture Potential
| Funder | Potential | Type |
|--------|-----------|------|
| Base Ecosystem Fund | $50K-$500K | Storage + consumer app |
| Filecoin Foundation | $25K-$250K | Knowledge storage use case |
| Arweave Forward Research | $10K-$100K | Permaweb manifest layer |
| Optimism RPGF | Variable | If open-sourced as public good |
| **Estimated total** | **$85K-$850K** | Multiple stacks |

### Trade-offs
| Pro | Con |
|-----|-----|
| Best fiat onramp for Africa via Coinbase | EVM-only (Solana users excluded) |
| Most regulatory-friendly option | Base is OP Stack = Coinbase dependency |
| Highest grant capture probability | Arweave permanent storage = GDPR tension for EU users |
| Strong mobile UX via Coinbase Wallet | Need to handle AR:// and IPFS:// URI schemes in DB |
| Low-cost transactions | Compute layer still centralized (OpenRouter) |

---

## Option B: Polkadot Parachain + Filecoin + EigenLayer AVS

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  USER LAYER                             │
│  Mobile-first Next.js PWA                               │
│  Polkadot.js / SubWallet / Talisman                     │
│  Fiat onramp: Transak (Africa) / Banxa                  │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│          SOVEREIGN PARACHAIN (Substrate)                 │
│  Custom runtime with AgentPallet, CreditPallet           │
│  XCM: cross-chain interoperability                      │
│  HRMP channels to Acala (DeFi), Moonbeam (EVM)         │
│  DOT/KSM for gas; custom token for platform             │
│  ~$0.001-0.01/tx on parachain                          │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│               STORAGE LAYER (Filecoin)                  │
│  Lighthouse: manifest + knowledge storage               │
│  IPFS retrieval via Cloudflare gateway                  │
│  Merkle CIDs stored in parachain state                  │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│          VERIFIABLE COMPUTE (EigenLayer AVS)             │
│  AVS: cryptographic proof that specific model ran input  │
│  Restaked ETH = economic security for inference proofs  │
│  Fallback: OpenRouter for non-verified runs             │
└─────────────────────────────────────────────────────────┘
```

### Why This Stack

**Polkadot advantages**:
- Sovereign chain = full control over fees, governance, upgradability
- Forkless runtime upgrades via Substrate
- XCM: native cross-chain asset transfers (DOT ↔ KSM ↔ other parachains)
- Web3 Foundation grants: most systematic grant program ($100K+ typical)
- No competition for blockspace (own parachain/coretime slot)
- BABE/GRANDPA consensus = fast finality (~6 seconds)

**EigenLayer AVS advantages**:
- Verifiable AI inference: cryptographic proof that a specific model ran a specific input
- Restaked ETH = $10B+ in economic security backing inference proofs
- This is the key **technical differentiator** no other marketplace offers
- Makes Ajently the first verifiably trustless AI agent marketplace

**Enterprise positioning**:
- Sovereign chain = enterprise clients can verify governance
- Custom compliance modules in Substrate runtime
- Data residency configurability at the chain level

### Grant Capture Potential
| Funder | Potential | Type |
|--------|-----------|------|
| Web3 Foundation | $50K-$300K | Parachain infrastructure |
| Filecoin Foundation | $25K-$250K | Storage layer |
| EigenLayer Foundation | $25K-$200K | AVS development |
| Polkadot DAO Treasury | $50K-$500K | Ecosystem development |
| **Estimated total** | **$150K-$1.25M** | Larger but harder grants |

### Trade-offs
| Pro | Con |
|-----|-----|
| Sovereign chain = full control | Parachain slot cost ($200K+ in DOT) or coretime rental |
| Verifiable inference = unique market position | Polkadot wallet UX is inferior to EVM |
| Web3 Foundation grants systematic | EVM developers unfamiliar with Substrate |
| XCM enables multi-chain future | Longer time-to-market (6-12 months to launch parachain) |
| On-chain governance built-in | African users less familiar with Polkadot |

---

## Option C: Solana + Arweave + Superteam Africa Distribution

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  USER LAYER                             │
│  Mobile-first Next.js PWA + blinks (Solana Actions)    │
│  Phantom / Backpack wallet                              │
│  Fiat onramp: Helio / MoonPay / M-Pesa API (Africa)    │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│               SOLANA L1                                  │
│  SPL Token for credits                                  │
│  Metaplex NFT for agent cards                           │
│  Compressed NFTs (cNFTs): $0.00001 per agent           │
│  Helius RPC: best Solana infrastructure                 │
│  ~$0.00001/tx — effectively free micropayments         │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│               STORAGE LAYER (Arweave)                   │
│  Turbo/Irys: fast bundled uploads                       │
│  Permanent manifests with AR txId                       │
│  IPFS/Cloudflare: fast retrieval CDN                    │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────┐
│               COMPUTE LAYER                             │
│  OpenRouter (primary): 18+ models                       │
│  Solana AI integrations (emerging)                      │
│  Decentralized inference via io.net (Solana-native)     │
└─────────────────────────────────────────────────────────┘
```

### Why This Stack

**Solana advantages**:
- Effectively free micropayments: $0.00001/tx = perfect for per-agent-run credits
- Compressed NFTs (cNFTs): agent cards as NFTs for $0.00001 each
- Solana blinks/actions: share an agent as a URL that executes on click (viral distribution)
- Superteam Africa: established community in Nigeria, Kenya, Ghana with local grants
- io.net: decentralized GPU marketplace built on Solana — future compute integration

**Africa distribution advantages**:
- Superteam Africa runs local hackathons, meetups, and grant programs
- M-Pesa integration possible via third-party bridges
- Solana's mobile-first Saga phone strategy = mobile wallet native support
- Growing Solana DeFi ecosystem in Africa (lower gas = lower barrier)

**Solana blinks as distribution**:
```
Creator shares: https://guild.io/agents/viral-hook?action=run
User clicks → wallet prompts → agent runs → credited automatically
No app install required → viral agent distribution
```

### Grant Capture Potential
| Funder | Potential | Type |
|--------|-----------|------|
| Solana Foundation | $25K-$100K | Developer grants |
| Superteam Africa | $5K-$50K | Africa-specific projects |
| Arweave Forward Research | $10K-$100K | Permaweb layer |
| Colosseum Hackathon | $50K-$500K | Prize pool |
| **Estimated total** | **$90K-$750K** | |

### Trade-offs
| Pro | Con |
|-----|-----|
| Near-zero transaction costs | Not EVM-compatible; different toolchain (Rust/Anchor) |
| Solana blinks = viral distribution mechanism | Solana has had historical downtime incidents |
| Strong Africa community via Superteam | Less enterprise-familiar than EVM |
| Compressed NFTs = affordable agent cards for all | Smaller grant programs than Arbitrum/Optimism |
| io.net = future decentralized compute integration | Requires team to learn Rust/Anchor for contracts |

---

## Final Recommendation

**Recommended starting point: Option A (Base + Arweave + Filecoin)**

**Reasoning**:
1. Lowest migration cost from current stack (EVM-compatible, same wallet infrastructure)
2. Highest probability of near-term grant capture (Base + Filecoin + Arweave all have active programs)
3. Best Africa onramp story (Coinbase OnRamp + Coinbase Wallet)
4. Regulatory clarity matters as Africa gains financial regulation
5. Fastest time-to-market

**12-month roadmap**:
- **Month 1-2**: Replace 0G Storage with Arweave + Filecoin (storage adapter swap)
- **Month 3-4**: Deploy Base contracts (credit registry, agent NFTs)
- **Month 5-6**: Add Coinbase OnRamp, mobile-first redesign, SIWE auth
- **Month 7-9**: Apply for Filecoin + Base grants; first Superteam Africa partnership
- **Month 10-12**: Evaluate EigenLayer AVS for verifiable inference (Option B element)

**If team has Rust/Anchor capability**: Add Option C (Solana blinks) as a distribution channel alongside Option A — the two are complementary, not mutually exclusive.

**If enterprise/institutional clients emerge**: Migrate to Option B parachain for sovereign chain control.
