# Guild Smart Contract — Audit Report

> Date: 2026-03-01
> Auditor: Internal pre-deployment review
> Contracts: GuildCredit.sol · GuildAgent.sol · GuildEscrow.sol
> Solidity: ^0.8.24
> OpenZeppelin: ^5.x

---

## Executive Summary

| Contract | Critical | High | Medium | Low | Informational |
|----------|----------|------|--------|-----|---------------|
| GuildCredit | 0 | 0 | 0 | 1 | 2 |
| GuildAgent  | 0 | 0 | 1 | 1 | 2 |
| GuildEscrow | 0 | 0 | 1 | 2 | 3 |

All critical and high findings are resolved. Medium findings are acknowledged with mitigations in place.

---

## GuildCredit.sol

### L-1 · Unlimited minting window
**Severity:** Low
**Description:** MINTER_ROLE holders can mint up to `MAX_SUPPLY` in a single transaction. No per-period rate limit.
**Recommendation:** Add a per-epoch mint cap or timelock for large mints. For MVP, the `MAX_SUPPLY` cap and role separation are sufficient.
**Status:** Acknowledged. Monitor via off-chain events.

### I-1 · ERC-20 `approve` race condition
**Severity:** Informational
**Description:** Standard ERC-20 approve front-running. `permit()` (EIP-2612) is included to mitigate.
**Status:** Mitigated via ERC20Permit.

### I-2 · `reason` string stored off-chain only
**Severity:** Informational
**Description:** `reason` param in `mintCredits` / `burnFrom` is emitted in events but not stored on-chain. Fine for audit trail purposes.
**Status:** Acknowledged.

---

## GuildAgent.sol

### M-1 · Counters deprecation in OZ v5
**Severity:** Medium
**Description:** `@openzeppelin/contracts/utils/Counters.sol` was removed in OpenZeppelin v5.
**Fix Applied:** Replace `Counters.Counter` with a plain `uint256 private _tokenIds` and `++_tokenIds` pattern.

```solidity
// BEFORE (OZ v4)
using Counters for Counters.Counter;
Counters.Counter private _tokenIds;
_tokenIds.increment();
tokenId = _tokenIds.current();

// AFTER (OZ v5 compatible)
uint256 private _tokenIds;
tokenId = ++_tokenIds;
```

**Status:** Fixed (see updated contract below).

### L-1 · Royalty receiver cannot be updated
**Severity:** Low
**Description:** Once minted, royalty receiver is permanently the original creator. If creator key is lost, royalties are locked.
**Recommendation:** Add a `updateRoyalty(uint256 tokenId, address newReceiver)` restricted to token owner.
**Status:** Accepted for MVP. Creator key management is user responsibility.

### I-1 · `string.concat` available in 0.8.12+
**Severity:** Informational
**Description:** `string.concat("ipfs://", manifestCid)` is valid in Solidity 0.8.12+. ✓

### I-2 · Soulbound does not block `burn`
**Severity:** Informational
**Description:** ERC-721 burn (`_burn`) is not gated by soulbound check. Owners can destroy their soulbound tokens.
**Recommendation:** This is intentional; owners can always destroy their own property.
**Status:** Acknowledged.

---

## GuildEscrow.sol

### M-1 · `approveTask` accepts `Assigned` status (no submission)
**Severity:** Medium
**Description:** Poster can approve a task that was never submitted (shortcut for trusted workers). This could cause credits to be released without proof.
**Recommendation:** This is an intentional feature for trusted/direct-hire flows. Off-chain UI should warn when approving without a submission.
**Status:** Documented in contract NatSpec.

### L-1 · No worker KILT PoP check on-chain
**Severity:** Low
**Description:** On-chain contract does not verify KILT Proof of Personhood. Sybil resistance is enforced at the application layer.
**Recommendation:** Phase 2: integrate a Moonbeam-deployed KILT attestation oracle.
**Status:** Out of scope for MVP. Enforced via backend API.

### L-2 · `_nextTaskId` starts at 0; first task is ID 1
**Severity:** Low
**Description:** `++_nextTaskId` means task IDs are 1-indexed. Any off-chain system treating 0 as a valid task ID will behave unexpectedly.
**Status:** Documented. Backend uses 1-indexed task IDs matching the DB.

### I-1 · `SafeERC20` used correctly
**Severity:** Informational
**Description:** All external ERC-20 interactions use `SafeERC20.safeTransfer/safeTransferFrom`. ✓

### I-2 · Re-entrancy guard is comprehensive
**Severity:** Informational
**Description:** `nonReentrant` applied to all state-changing functions that make external calls. ✓

### I-3 · Pause does not affect ongoing disputed tasks
**Severity:** Informational
**Description:** `claimDisputeTimeout` does not have `whenNotPaused`. This is intentional — workers can still recover funds via timeout even during a pause.
**Status:** Intentional design decision.

---

## Fixed Contract: GuildAgent.sol (OZ v5 compatible)

The `Counters` import was removed and the state variable was replaced:

```diff
- import "@openzeppelin/contracts/utils/Counters.sol";
  ...
- using Counters for Counters.Counter;
- Counters.Counter private _tokenIds;
+ uint256 private _tokenIds;
  ...
- _tokenIds.increment();
- tokenId = _tokenIds.current();
+ tokenId = ++_tokenIds;
```

See `GuildAgent.sol` for the final version.

---

## Deployment Checklist

- [ ] Deploy on Moonbase Alpha testnet first
- [ ] Verify contracts on Moonbeam explorer (Moonscan)
- [ ] Transfer DEFAULT_ADMIN_ROLE to a multisig (Gnosis Safe)
- [ ] Grant MINTER_ROLE only to the Guild backend EOA / payment processor
- [ ] Grant ARBITRATOR_ROLE to a separate admin wallet
- [ ] Set fee to 250 bps (2.5%) for launch
- [ ] Fund treasury wallet with initial operating credits
- [ ] Run Slither static analysis before mainnet deployment
- [ ] Commission independent audit before significant TVL

---

## Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| @openzeppelin/contracts | ^5.x | Verified, battle-tested |
| Solidity | ^0.8.24 | Latest stable; safe math by default |

---

> This report covers the initial internal review. A professional third-party audit is required before mainnet deployment with significant value at risk.
