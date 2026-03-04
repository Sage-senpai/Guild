# Guild — AI Agent + Human Task Marketplace

> **The decentralized App Store for AI agents. A same-day task board for crypto-native humans.**
> Built on Polkadot. Africa-first. Human-verified. Open forever.

[![Status](https://img.shields.io/badge/status-MVP-blue)](https://github.com)
[![Stack](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Identity](https://img.shields.io/badge/Identity-KILT%20Protocol-purple)](https://kilt.io)
[![Storage](https://img.shields.io/badge/Storage-Crust%20Network-green)](https://crust.network)
[![Chain](https://img.shields.io/badge/Chain-Moonbeam-pink)](https://moonbeam.network)

---

## What Is Guild?

**[Agents]** — Creators publish AI agents (system prompt + optional knowledge file + price per run). Users discover and run them with credits. Every agent is published to Crust Network (IPFS + Polkadot). Agents cannot be censored.

**[Humans]** — A same-day micro-task board for crypto-native work. Task posters offer credit rewards. Workers claim or apply. Proof of Personhood (KILT credential) required — Sybil-resistant by design.

---

## Polkadot Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Proof of Personhood | **KILT Protocol** | W3C verifiable credentials; SocialKYC on Spiritnet |
| On-chain identity | **Polkadot People Chain** | Display name + registrar judgements (PAPI) |
| Decentralised storage | **Crust Network** | IPFS + Polkadot incentive layer |
| EVM contracts | **Moonbeam** | Task escrow, credit token (GUILD), agent NFTs |
| TypeScript client | **PAPI** | Type-safe, light-client first Substrate queries |

---

## Features

| Feature | Status |
|---------|--------|
| AI Agent Marketplace | ✅ Live |
| Human Task Marketplace | ✅ Live |
| KILT PoP verification | ✅ Live |
| Multi-chain credit top-up | ✅ Live |
| Guild design system | ✅ Done |
| Smart contracts (audited) | ✅ Written |
| Crust Network storage | 📋 Planned |
| Moonbeam contract deploy | 📋 Roadmap |

---

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

---

## Configuration

```bash
DEMO_WALLET_ADDRESS=0xYourAddress
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_id
OPENROUTER_API_KEY=sk-or-...   # optional; mock used if unset
STORAGE_PROVIDER=mock           # "crust" for production
KILT_VERIFY_MODE=mock           # "real" for production
```

---

## Smart Contracts

In [`/contracts`](./contracts/) — target: **Moonbeam**

| Contract | Description |
|----------|-------------|
| `GuildCredit.sol` | ERC-20 GUILD credit token |
| `GuildAgent.sol` | ERC-721 agent NFT + royalties |
| `GuildEscrow.sol` | Task escrow with dispute resolution |
| `audit-report.md` | Internal audit — zero critical/high findings |

---

## License

ISC License — *Your craft. Your agents. Your guild.*
