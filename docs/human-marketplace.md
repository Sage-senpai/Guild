# Human Task Marketplace — Feature Specification

> Document date: 2026-03-01
> Status: Approved for development
> Stack: Moonbeam (EVM on Polkadot) + KILT Protocol (PoP) + Credits system

---

## 1. Concept

Guild's Human Marketplace is a micro-task board for crypto-native work. Think of it as the layer between "I have a task I'd pay $2 for" and "I have skills and 20 minutes."

It is **not** a freelance platform. It is **not** a long-term contract board. It is a **same-day task board** where:
- Task posters list specific, bounded crypto tasks with a fixed credit reward
- Verified humans claim or apply for tasks they can do
- Proof is submitted, approved, and credits transfer — all within the platform

The AI agent marketplace remains unchanged. The Human tab sits alongside it.

---

## 2. What Makes This Different from Upwork/Fiverr

| Dimension | Upwork/Fiverr | Guild Human |
|-----------|--------------|-------------|
| Contract length | Days to months | Hours to 1 day |
| Reward size | $10–$10,000 | $0.50–$50 |
| Skill verification | Portfolio/reviews | Proof of Personhood |
| Payment | Bank transfer (days) | Credits (instant) |
| Task type | Any | Crypto/Web3 only |
| Identity | LinkedIn-style profile | Wallet + PoP badge |
| Posting friction | High (project brief) | Low (3 fields + reward) |
| Africa access | Requires bank card | Mobile money top-up |

---

## 3. Proof of Personhood — KILT Protocol

### Why KILT

KILT is a Polkadot parachain dedicated to decentralized identity. A KILT credential is:
- **Reusable**: verified once, used across all Guild tasks forever
- **Non-biometric**: verification via social accounts (Twitter, GitHub, Discord, email)
- **Private**: only the credential hash is stored on-chain; personal data stays with the user
- **XCM-compatible**: native to Polkadot ecosystem (aligns with Moonbeam integration)

### Verification Flow

```
User wants to claim/post a task
    │
    ├─ Has KILT credential in Guild?
    │   YES → proceed
    │   NO ↓
    │
    ├─ Click "Verify I'm Human" → open KILT verification flow
    │   1. Install Sporran wallet (or use existing)
    │   2. Link Twitter OR GitHub OR Discord account (via SocialKYC)
    │   3. Receive attestation on KILT Spiritnet
    │   4. Submit credential hash to Guild: POST /api/kilt/verify
    │   5. Guild stores: { userId, credentialHash, verifiedAt }
    │
    └─ Badge: "✓ Human" on profile and task cards
```

### What KILT Verification Proves
- This wallet is controlled by a real person
- That person has an active social account (Twitter/GitHub/Discord)
- One wallet = one person (Sybil resistance)

### What KILT Does NOT Prove
- Real name, location, or age
- Experience or skills
- Task completion quality (that's the rating system)

### Server-Side Verification

```typescript
// lib/kilt/verify.ts
import { Credential, Did } from "@kiltprotocol/sdk-js";

export async function verifyKiltCredential(credentialJson: string): Promise<{
  valid: boolean;
  claimerDid: string;
  attesterDid: string;
}> {
  const credential = Credential.fromJSON(JSON.parse(credentialJson));
  const { verified, claimerDid, attesterDid } = await Credential.verify(credential);
  return { valid: verified, claimerDid, attesterDid };
}
```

---

## 4. Task Data Model

### Task Record

```typescript
type TaskCategory =
  | "testnet"      // Testnet interactions (faucet claims, swaps, bridges)
  | "discord"      // Join server, react, post in channel
  | "defi"         // Liquidity provision, staking, voting
  | "nft"          // Mint, list, trade NFTs
  | "social"       // Retweet, quote tweet, follow
  | "review"       // Test a protocol, submit bug report
  | "data"         // Fill form, verify on-chain data
  | "other";       // Catch-all

type TaskType = "instant" | "apply";

type TaskStatus =
  | "open"        // No assignee yet
  | "assigned"    // Worker selected/claimed
  | "submitted"   // Worker submitted proof, awaiting approval
  | "approved"    // Poster approved, credits transferred
  | "disputed"    // Poster disputed submission
  | "cancelled"   // Poster cancelled (credits returned)
  | "expired";    // Deadline passed without completion

type TaskRecord = {
  id: number;
  title: string;
  description: string;
  category: TaskCategory;
  taskType: TaskType;
  reward: number;           // in credits
  posterId: number;
  assigneeId: number | null;
  status: TaskStatus;
  proofUrl: string | null;
  deadline: string;         // ISO timestamp
  maxApplicants: number | null; // apply mode only; null = unlimited
  createdAt: string;
  completedAt: string | null;
};

type TaskApplicationRecord = {
  id: number;
  taskId: number;
  applicantId: number;
  message: string | null;
  status: "pending" | "selected" | "rejected";
  createdAt: string;
};
```

---

## 5. Task Lifecycle

### Instant-Claim Task

```
Poster creates task (instant-claim)
    → Credits reserved from poster balance
    → Task status: "open"

Any verified human clicks "Claim"
    → Task status: "assigned"
    → Other claimers blocked

Worker does the task + submits proof URL
    → Task status: "submitted"

Poster reviews proof:
    ├─ Approves → credits transferred to worker → status: "approved"
    └─ Disputes → opens dispute (48h window)

If no action in 48h after submission:
    → Auto-release to worker → status: "approved"
```

### Apply-Mode Task

```
Poster creates task (apply mode)
    → Credits reserved
    → Task status: "open"

Workers apply (with optional message)
    → Applications stored
    → Task remains "open" until poster selects

Poster reviews applicants → selects one
    → Selected applicant: status "selected"
    → Others: status "rejected" (notified)
    → Task status: "assigned"

... same as instant-claim from "assigned" onward
```

---

## 6. Credit Reservation Logic

When a task is posted:
```sql
-- Reserve credits from poster
-- credits must be >= reward + platform_fee
UPDATE users SET credits = credits - (reward + platform_fee) WHERE id = poster_id;
INSERT INTO credit_ledger (user_id, kind, amount, note)
VALUES (poster_id, 'task_reserve', -(reward + fee), 'Task #id reserved');
```

When task is approved:
```sql
-- Release to worker (reward minus platform fee)
UPDATE users SET credits = credits + reward WHERE id = worker_id;
INSERT INTO credit_ledger (user_id, kind, amount, note)
VALUES (worker_id, 'task_earn', reward, 'Task #id completed');
-- Platform fee already collected from poster reserve
```

When task is cancelled:
```sql
-- Full refund to poster
UPDATE users SET credits = credits + (reward + platform_fee) WHERE id = poster_id;
INSERT INTO credit_ledger (user_id, kind, amount, note)
VALUES (poster_id, 'task_refund', reward + fee, 'Task #id cancelled');
```

**Platform fee**: 5% of task reward (same as agent side)

---

## 7. API Endpoints

| Method | Endpoint | Auth | PoP Required | Description |
|--------|----------|------|-------------|-------------|
| GET | `/api/tasks` | Optional | No | List open tasks |
| POST | `/api/tasks` | Required | No | Create task (poster only) |
| GET | `/api/tasks/:id` | Optional | No | Task detail |
| POST | `/api/tasks/:id/claim` | Required | **Yes** | Instant claim |
| POST | `/api/tasks/:id/apply` | Required | **Yes** | Submit application |
| GET | `/api/tasks/:id/applicants` | Required (poster) | No | List applicants |
| POST | `/api/tasks/:id/select/:appId` | Required (poster) | No | Select applicant |
| POST | `/api/tasks/:id/submit` | Required (worker) | No | Submit proof |
| POST | `/api/tasks/:id/approve` | Required (poster) | No | Approve proof → transfer credits |
| POST | `/api/tasks/:id/dispute` | Required (poster) | No | Dispute proof |
| POST | `/api/tasks/:id/cancel` | Required (poster) | No | Cancel task → refund |
| POST | `/api/kilt/verify` | Required | — | Submit KILT credential |
| GET | `/api/kilt/status` | Required | — | Check user's PoP status |

---

## 8. UI Screens

### 8.1 Humans Tab (Main Listing)

```
[Agents]  [Humans ●]   ← tab switcher in header

┌─────────────────────────────────────────────────────┐
│  🔍 Search tasks...            [Category ▾] [Sort ▾] │
│  [testnet] [discord] [defi] [nft] [social] [review]  │
└─────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  TASK CARD                                           │
│                                                      │
│  Help test Acme Protocol bridge on Arbitrum Sepolia  │
│  [testnet]  ·  Instant claim  ·  ⏰ 6h remaining     │
│                                                      │
│  Bridge 0.1 ETH from Arbitrum Sepolia → OP Sepolia, │
│  share your tx hash as proof.                        │
│                                                      │
│  Reward: 2.00 ✦ credits    ✓ Verified Human only    │
│                                                      │
│  [ Claim Task → ]                                    │
└──────────────────────────────────────────────────────┘
```

### 8.2 Task Card

Each task card shows:
- Title (bold, Playfair Display)
- Category badge + task type (instant/apply)
- Time remaining until deadline
- Short description (3-line clamp)
- Reward in credits + "Verified Human only" badge
- Primary CTA: "Claim Task" or "Apply" depending on type
- Status indicator if already claimed/submitted

### 8.3 Create Task Form (3 fields + reward)

```
┌─────────────────────────────────────────────────────┐
│  Post a Task                                         │
│                                                      │
│  What do you need done?                              │
│  ┌──────────────────────────────────────────────┐   │
│  │ e.g. "Test the Acme bridge on Arbitrum testnet" │  │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Instructions (what exactly should they do?)         │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Category      [testnet ▾]                           │
│                                                      │
│  Assignment     ○ Instant claim  ● Apply mode        │
│                                                      │
│  Reward          [ 2.00 ] credits                    │
│  Platform fee    0.10 credits (5%)                   │
│  Total deducted  2.10 credits                        │
│                                                      │
│  Deadline        [ 24h ▾ ]                           │
│                                                      │
│  [ Post Task ]    Your balance: 142.50 ✦             │
└─────────────────────────────────────────────────────┘
```

### 8.4 PoP Verification Flow (gating for workers)

```
Worker clicks "Claim Task" without PoP:
┌─────────────────────────────────────────────────────┐
│                                                      │
│  Verify You're Human                                 │
│                                                      │
│  Guild requires Proof of Personhood to claim tasks.  │
│  We use KILT Protocol — no biometrics, no ID scan.   │
│                                                      │
│  How it works:                                       │
│  1. Link a Twitter, GitHub, or Discord account      │
│  2. Get a reusable credential (one-time, ~2 min)    │
│  3. Claim any task, forever — no repeats            │
│                                                      │
│  [ Verify with KILT → ]      [ Learn more ]          │
└─────────────────────────────────────────────────────┘
```

---

## 9. Moonbeam Integration

### Why Moonbeam for this feature

The task escrow and KILT credential verification both benefit from being on Moonbeam:
- **EVM-compatible**: can use existing Solidity + ethers.js toolchain
- **XCM to KILT**: Moonbeam can query KILT Spiritnet via XCM cross-chain messages
- **Low gas**: Moonbeam transactions are cheap (GLMR token, low fees)
- **Web3 Foundation grants**: Moonbeam is a flagship Polkadot parachain — deploying here qualifies for W3F and Moonbeam ecosystem grants

### Moonbeam Smart Contract (Phase 2 — on-chain escrow)

For Phase 1, credits are managed in the Guild database (same as agent credits). For Phase 2, task rewards can optionally be held in a Moonbeam smart contract:

```solidity
// contracts/TaskEscrow.sol (Phase 2)
// SPDX-License-Identifier: ISC
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TaskEscrow {
    struct Task {
        address poster;
        address worker;
        uint256 reward;
        uint256 deadline;
        bool completed;
        bool disputed;
    }

    mapping(uint256 => Task) public tasks;
    uint256 public nextTaskId;
    uint256 public platformFeeBps = 500; // 5%
    address public treasury;

    event TaskCreated(uint256 indexed taskId, address poster, uint256 reward);
    event TaskClaimed(uint256 indexed taskId, address worker);
    event TaskApproved(uint256 indexed taskId);
    event TaskDisputed(uint256 indexed taskId);

    function createTask(uint256 reward, uint256 duration) external payable {
        require(msg.value >= reward, "Insufficient value");
        uint256 taskId = nextTaskId++;
        tasks[taskId] = Task({
            poster: msg.sender,
            worker: address(0),
            reward: reward,
            deadline: block.timestamp + duration,
            completed: false,
            disputed: false
        });
        emit TaskCreated(taskId, msg.sender, reward);
    }

    function approveTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(msg.sender == task.poster, "Not poster");
        require(task.worker != address(0), "No worker");
        require(!task.completed, "Already completed");

        uint256 fee = (task.reward * platformFeeBps) / 10000;
        uint256 workerPayout = task.reward - fee;

        task.completed = true;
        payable(task.worker).transfer(workerPayout);
        payable(treasury).transfer(fee);

        emit TaskApproved(taskId);
    }
}
```

---

## 10. Task Categories & Examples

| Category | Icon | Example Tasks | Typical Reward |
|----------|------|--------------|----------------|
| `testnet` | 🔗 | Bridge ETH on testnet, claim faucet, swap tokens | 1–5 ✦ |
| `discord` | 💬 | Join server, get a role, post in #general | 0.5–2 ✦ |
| `defi` | 📈 | Provide liquidity, vote on governance proposal | 2–10 ✦ |
| `nft` | 🎨 | Mint a free NFT, list on marketplace, transfer | 1–5 ✦ |
| `social` | 📣 | Retweet with comment, quote post about project | 0.5–2 ✦ |
| `review` | 🔍 | Test protocol, submit feedback form, find bugs | 3–20 ✦ |
| `data` | 📋 | Verify on-chain data, fill survey, check accuracy | 1–5 ✦ |

---

## 11. Worker Profile Additions

The existing user profile gains:
- **PoP Badge**: "✓ Verified Human" (KILT credential confirmed)
- **Tasks completed**: count of approved tasks
- **Tasks earned**: total credits earned from tasks
- **Completion rate**: approved / total assigned (shown when ≥3 tasks)
- **Skill tags** (optional, user-set): e.g., "DeFi", "NFTs", "EVM", "Testnet"

---

## 12. Dispute Resolution (Phase 1)

For Phase 1, disputes are resolved manually:
1. Poster clicks "Dispute" within 48h of proof submission
2. Guild support reviews the task description vs submitted proof
3. Resolution: credits go to worker (if proof valid) or poster (if proof invalid)
4. Both parties notified via in-app notification

For Phase 2: DAO-based dispute resolution with randomly selected verified humans as jurors.

---

## 13. Anti-Abuse Measures

- **PoP required to claim/apply**: prevents bot farming
- **One claim per task**: a worker cannot claim the same task twice
- **Poster PoP optional but recommended**: posters don't need PoP but PoP-verified posters get a "Verified Poster" badge
- **Reward ceiling**: max 50 credits per task in Phase 1 (prevent exploitation)
- **Rate limiting**: max 10 task claims per day per verified human
- **Duplicate task detection**: server-side check for identical title+description within 24h
- **Cancellation penalty**: posters who cancel >3 tasks in 7 days pay a 10% penalty
