# Storage Layer Analysis — Ajently MVP v1

> Audit date: 2026-02-28
> Focus: 0G Storage dependency evaluation and replacement pathway

---

## 1. Current 0G Storage Integration

### What Is Stored

| Asset | Storage Location | Format | Size Range |
|-------|-----------------|--------|------------|
| Agent manifest | 0G Storage (or mock FS) | JSON | 500B – 2KB |
| Knowledge file | 0G Storage (or local FS) | Text/PDF/binary | 1KB – 5MB |
| Card image | SQLite (base64 data URL) | PNG/JPEG base64 | 50KB – 500KB |
| Run logs | SQLite | Text | 100B – 50KB |

### How It Works

```typescript
// 1. Upload: lib/zero-g/storage.ts
const payload = new MemData(data);           // 0G MemData wrapper
await payload.merkleTree();                  // compute Merkle tree
const [receipt, error] = await indexer.upload(payload, evmRpc, signer);
// Returns: { rootHash, txHash }

// 2. URI scheme: 0g://<rootHash>
// 3. Retrieval: indexer.download(rootHash, outputFilePath, verify=true)
```

### Strengths of 0G Storage
- Merkle-root content addressing with on-chain proof (immutable audit trail)
- Transaction hash serves as publication proof (hackathon requirement satisfied)
- Built-in data integrity verification on download
- `MemData` class handles chunking + tree construction automatically

### Weaknesses of 0G Storage
- **Testnet only** — production mainnet is not yet fully launched; reliability unclear
- **Single signer** — all uploads use one server wallet, not user wallets
- **Slow uploads** — Merkle tree + on-chain settlement adds 5-30 seconds to publish flow
- **No CDN** — downloads go through storage indexer RPCs (not edge-cached)
- **Limited geographic presence** — no confirmed African PoP
- **Ecosystem maturity** — small developer community, limited tooling beyond the SDK
- **Grant status** — 0G Foundation's hackathon grants are well-defined but longer-term ecosystem grants are less established

---

## 2. Storage Modularity Assessment

**Current modularity score: 7/10**

The `lib/zero-g/storage.ts` module exposes 4 clean public functions:
```typescript
export async function uploadManifest(manifest: object, options?): Promise<UploadResult>
export async function uploadKnowledge(payload: Uint8Array, options?): Promise<UploadResult>
export async function downloadText(uri: string, fallback?): Promise<string>
export function storageMode(): "real" | "mock"
```

**Gap**: `UploadResult.uri` uses `0g://` scheme. These URIs are stored in the database. Replacing the storage layer also requires:
1. A URI migration strategy (or schema-version the URI format)
2. Updating `downloadText()` to parse non-0G URIs

**Proposed abstraction** (for full modularity):
```typescript
// lib/storage/adapter.ts
interface StorageAdapter {
  name: string;
  upload(data: Uint8Array, metadata?: Record<string, string>): Promise<UploadResult>;
  download(uri: string): Promise<Uint8Array>;
  verify(uri: string, expectedHash: string): Promise<boolean>;
  getProof(uri: string): Promise<StorageProof | null>;
}

// lib/storage/index.ts
export function getStorageAdapter(): StorageAdapter {
  const mode = process.env.STORAGE_PROVIDER ?? "0g";
  if (mode === "arweave") return new ArweaveAdapter();
  if (mode === "filecoin") return new FilecoinAdapter();
  if (mode === "ipfs") return new IpfsAdapter();
  return new ZeroGAdapter(); // current
}
```

---

## 3. Alternative Storage Evaluation

### 3.1 Arweave

| Criterion | Score | Notes |
|-----------|-------|-------|
| Permanence | 10/10 | Pay-once, store forever model |
| Content addressing | 9/10 | Transaction IDs are content hashes |
| Proof of storage | 8/10 | Merkle proofs on Arweave DA layer |
| Developer tooling | 8/10 | `arweave-js`, Ardrive SDK, Turbo uploads |
| Cost (2026) | 6/10 | ~$0.001-$0.01/KB — manageable for manifests |
| African latency | 6/10 | No dedicated Africa gateways; use Cloudflare CDN on top |
| Grant ecosystem | 7/10 | Forward Research grants; Gitcoin rounds |
| Throughput | 7/10 | ~1-2 TPS native; Turbo upload service increases throughput |
| Compliance | 7/10 | Permanent storage is double-edged for GDPR (right to be forgotten) |

**Verdict**: Best choice for **permanent manifest storage**. The "pay once, store forever" model aligns with the agent marketplace concept. Arweave's graphQL indexer allows querying all manifests by creator address, enabling trustless discovery.

**Integration pattern**:
```typescript
import Arweave from "arweave";
import { TurboFactory } from "@ardrive/turbo-sdk";

const arweave = Arweave.init({ host: "arweave.net", port: 443, protocol: "https" });
const turbo = TurboFactory.authenticated({ privateKey: jwk });

async function uploadToArweave(data: Uint8Array): Promise<UploadResult> {
  const { id } = await turbo.uploadFile({ fileStreamFactory: () => Readable.from(data) });
  return { uri: `ar://${id}`, rootHash: id, transactionHash: id, mode: "real" };
}
```

---

### 3.2 Filecoin (via Lighthouse / web3.storage)

| Criterion | Score | Notes |
|-----------|-------|-------|
| Permanence | 8/10 | Deal-based; deals must be renewed (Filecoin Plus makes this cheap) |
| Content addressing | 10/10 | CIDs are cryptographic content hashes (IPFS-compatible) |
| Proof of storage | 10/10 | Proof-of-Replication + Proof-of-Spacetime on-chain |
| Developer tooling | 8/10 | web3.storage, Lighthouse, NFT.Storage |
| Cost | 9/10 | Near-zero with Filecoin Plus datacap; competitive for large files |
| African latency | 5/10 | IPFS gateways exist globally but sub-Saharan coverage is sparse |
| Grant ecosystem | 9/10 | Protocol Labs has active devgrant program; Filecoin Foundation |
| Throughput | 8/10 | Lighthouse supports high-throughput uploads |
| Compliance | 7/10 | CID-based; files can be pinned/unpinned but not truly deleted from all nodes |

**Verdict**: Best for **knowledge file storage** due to cost-efficiency for larger files. Lighthouse (built on Filecoin) offers simple IPFS pinning + Filecoin deal creation in one API call.

**Integration pattern**:
```typescript
import lighthouse from "@lighthouse-web3/sdk";

async function uploadToFilecoin(data: Buffer): Promise<UploadResult> {
  const response = await lighthouse.uploadBuffer(data, process.env.LIGHTHOUSE_API_KEY!);
  const cid = response.data.Hash;
  return { uri: `ipfs://${cid}`, rootHash: cid, transactionHash: cid, mode: "real" };
}
```

---

### 3.3 IPFS + Pinning Services (Pinata / Infura)

| Criterion | Score | Notes |
|-----------|-------|-------|
| Permanence | 5/10 | Only as permanent as pinning service agreement |
| Content addressing | 10/10 | CIDs; same as Filecoin |
| Proof of storage | 4/10 | No native on-chain proof; requires off-chain attestation |
| Developer tooling | 9/10 | Most mature ecosystem; Pinata, web3.storage, Infura |
| Cost | 8/10 | Pinata free tier: 1GB; paid plans competitive |
| African latency | 6/10 | Cloudflare IPFS gateway (`cloudflare-ipfs.com`) helps |
| Grant ecosystem | 5/10 | Limited direct grants; Filecoin grants cover some IPFS work |
| Throughput | 9/10 | High-throughput via HTTP API |
| Compliance | 6/10 | Files can be unpinned but IPFS network may retain them |

**Verdict**: Excellent for **fast prototyping and content delivery**. Not ideal as the sole storage layer due to lack of permanence guarantees and on-chain proof. Best used as a CDN layer on top of Arweave or Filecoin.

---

### 3.4 Ceramic (Decentralized Data Streams)

| Criterion | Score | Notes |
|-----------|-------|-------|
| Use case fit | 4/10 | Ceramic is for mutable, user-controlled data streams — not ideal for immutable agent manifests |
| Decentralization | 8/10 | DID-based identity + IPFS storage |
| Proof of storage | 3/10 | No native on-chain proof |
| Developer tooling | 6/10 | ComposeDB, Self.ID |
| Cost | 7/10 | Node hosting required or rely on community nodes |

**Verdict**: Not recommended for this use case. Ceramic excels for user profiles, social graphs, and mutable structured data — not immutable agent manifests. Could be useful for the **user profile layer** in a future decentralized identity system.

---

### 3.5 Aleph.im

| Criterion | Score | Notes |
|-----------|-------|-------|
| Use case fit | 8/10 | Decentralized storage + compute in one platform |
| Permanence | 7/10 | Node-pinned; economic incentives for storage |
| Proof of storage | 6/10 | Off-chain verification; not as strong as on-chain Merkle proofs |
| Developer tooling | 6/10 | Python/JS SDKs available but smaller community |
| Cost | 8/10 | ALEPH token payments; competitive rates |
| African latency | 5/10 | No documented Africa PoP |
| Grant ecosystem | 5/10 | Aleph Foundation grants; smaller program |

**Verdict**: Interesting for compute + storage use cases in one SDK. Worth evaluating for the compute layer as an alternative to 0G Compute.

---

## 4. Recommended Storage Strategy

### Primary Recommendation: Arweave (Manifests) + Filecoin/Lighthouse (Knowledge)

```
Agent Manifest (JSON, ~1KB)
  → Arweave (permanent, content-addressed, GraphQL indexable)
  → Cached on IPFS/Cloudflare gateway for fast reads

Knowledge File (text/PDF, up to 5MB)
  → Lighthouse (Filecoin deal + IPFS CID)
  → Retrieved via IPFS gateway (Cloudflare CDN)

Card Images (PNG, ~200KB)
  → Move from SQLite base64 → Cloudflare R2 (S3-compatible, cheap, global CDN)

Database
  → Move from sql.js → Turso/Postgres (no longer in storage layer)
```

### Proof Strategy
- **Arweave**: Transaction ID on Arweave blockchain serves as proof (stronger than 0G testnet)
- **Filecoin**: Lighthouse returns IPFS CID + Filecoin deal ID — both are on-chain proof
- **Hybrid URI format**: `ar://<txId>` for manifests, `ipfs://<cid>` for knowledge

### Migration Path (Zero-Downtime)
1. Deploy new storage adapter alongside 0G adapter
2. New publishes use Arweave/Filecoin
3. Background job re-publishes existing 0G manifests to Arweave (if 0G testnet is sunset)
4. Database column `storage_provider` distinguishes legacy 0G from new providers
