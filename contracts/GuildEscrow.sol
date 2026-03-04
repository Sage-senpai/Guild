// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  GuildEscrow
 * @notice Task escrow contract for the Guild Human Task Marketplace.
 *
 *         Flow:
 *          1. Poster calls `postTask()` — locks credits in the contract.
 *          2. Worker claims or is selected by poster.
 *          3. Worker submits proof; poster calls `approveTask()` — releases credits.
 *          4. If disputed, admin arbitrates via `resolveDispute()`.
 *          5. Poster can cancel before a worker is assigned.
 *
 * Security properties:
 *  - Checks-Effects-Interactions pattern throughout
 *  - Re-entrancy guarded by `nonReentrant` modifier
 *  - Platform fee capped at 10% (1000 bps) to prevent admin abuse
 *  - All state changes happen before external calls
 *  - Emergency pause by DEFAULT_ADMIN_ROLE
 *  - Dispute timeout: if admin does not resolve within DISPUTE_WINDOW,
 *    either party can call `claimDisputeTimeout()` — defaults to worker
 *
 * Audit notes:
 *  - No native ETH; only GuildCredit ERC-20 transfers
 *  - `GuildCredit.transferFrom` requires prior approval; no pull-payment
 *  - Task IDs increment monotonically; no collision
 *  - Re-entrancy: credit token must be trusted (no callback hooks in standard ERC-20)
 *  - Overflow: Solidity 0.8.x checked arithmetic
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GuildEscrow is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant PAUSER_ROLE     = keccak256("PAUSER_ROLE");

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 public constant MAX_FEE_BPS   = 1000;  // 10% max platform fee
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant DISPUTE_WINDOW  = 7 days;

    // ── Enums ─────────────────────────────────────────────────────────────────
    enum TaskStatus {
        Open,       // 0: accepting workers
        Assigned,   // 1: worker locked in
        Submitted,  // 2: worker submitted proof
        Approved,   // 3: payment released to worker
        Disputed,   // 4: under arbitration
        Cancelled,  // 5: poster cancelled
        Expired     // 6: deadline passed without approval
    }

    // ── Structs ───────────────────────────────────────────────────────────────
    struct Task {
        uint256  id;
        address  poster;
        address  worker;
        uint256  reward;        // credits locked (net of platform fee)
        uint256  platformFee;   // credits going to treasury
        uint64   deadline;
        uint64   disputedAt;    // timestamp when dispute raised
        string   proofUri;      // IPFS URI of submission proof
        TaskStatus status;
    }

    // ── State ─────────────────────────────────────────────────────────────────
    IERC20  public immutable creditToken;
    address public           treasury;
    uint256 public           feeBps;        // current platform fee in basis points
    uint256 private          _nextTaskId;

    mapping(uint256 => Task) public tasks;

    // ── Events ────────────────────────────────────────────────────────────────
    event TaskPosted(uint256 indexed taskId, address indexed poster, uint256 reward, uint64 deadline);
    event TaskClaimed(uint256 indexed taskId, address indexed worker);
    event TaskSubmitted(uint256 indexed taskId, address indexed worker, string proofUri);
    event TaskApproved(uint256 indexed taskId, address indexed worker, uint256 payout);
    event TaskDisputed(uint256 indexed taskId, address indexed disputedBy);
    event TaskResolved(uint256 indexed taskId, address indexed winner, uint256 payout);
    event TaskCancelled(uint256 indexed taskId);
    event TaskExpired(uint256 indexed taskId);
    event FeeUpdated(uint256 newFeeBps);
    event TreasuryUpdated(address newTreasury);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(
        address admin,
        address _creditToken,
        address _treasury,
        uint256 _feeBps
    ) {
        require(admin        != address(0), "GuildEscrow: zero admin");
        require(_creditToken != address(0), "GuildEscrow: zero token");
        require(_treasury    != address(0), "GuildEscrow: zero treasury");
        require(_feeBps       <= MAX_FEE_BPS, "GuildEscrow: fee too high");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ARBITRATOR_ROLE,    admin);
        _grantRole(PAUSER_ROLE,        admin);

        creditToken = IERC20(_creditToken);
        treasury    = _treasury;
        feeBps      = _feeBps;
    }

    // ── Post Task ─────────────────────────────────────────────────────────────

    /**
     * @notice Post a new task and lock reward credits in escrow.
     * @param rewardGross Total credits to lock (includes platform fee).
     * @param deadline    Unix timestamp when task expires.
     */
    function postTask(
        uint256 rewardGross,
        uint64  deadline
    ) external nonReentrant whenNotPaused returns (uint256 taskId) {
        require(rewardGross > 0,             "GuildEscrow: zero reward");
        require(deadline > block.timestamp,  "GuildEscrow: deadline in past");

        uint256 fee    = (rewardGross * feeBps) / BPS_DENOMINATOR;
        uint256 reward = rewardGross - fee;

        taskId = ++_nextTaskId;
        tasks[taskId] = Task({
            id:          taskId,
            poster:      _msgSender(),
            worker:      address(0),
            reward:      reward,
            platformFee: fee,
            deadline:    deadline,
            disputedAt:  0,
            proofUri:    "",
            status:      TaskStatus.Open
        });

        // Pull credits from poster (requires prior approval)
        creditToken.safeTransferFrom(_msgSender(), address(this), rewardGross);

        emit TaskPosted(taskId, _msgSender(), reward, deadline);
    }

    // ── Claim ─────────────────────────────────────────────────────────────────

    /**
     * @notice Worker claims an open task (instant-assign type).
     */
    function claimTask(uint256 taskId) external nonReentrant whenNotPaused {
        Task storage t = _requireTask(taskId);
        require(t.status   == TaskStatus.Open,    "GuildEscrow: not open");
        require(t.deadline  > block.timestamp,    "GuildEscrow: expired");
        require(t.poster   != _msgSender(),       "GuildEscrow: poster cannot claim");

        t.worker = _msgSender();
        t.status = TaskStatus.Assigned;

        emit TaskClaimed(taskId, _msgSender());
    }

    /**
     * @notice Poster selects an applicant (apply-type tasks).
     */
    function selectWorker(uint256 taskId, address worker) external whenNotPaused {
        Task storage t = _requireTask(taskId);
        require(t.poster   == _msgSender(),       "GuildEscrow: not poster");
        require(t.status   == TaskStatus.Open,    "GuildEscrow: not open");
        require(t.deadline  > block.timestamp,    "GuildEscrow: expired");
        require(worker     != address(0),         "GuildEscrow: zero worker");
        require(worker     != _msgSender(),       "GuildEscrow: self-select");

        t.worker = worker;
        t.status = TaskStatus.Assigned;

        emit TaskClaimed(taskId, worker);
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    /**
     * @notice Worker submits proof of work.
     * @param proofUri IPFS URI or URL linking to proof.
     */
    function submitWork(uint256 taskId, string calldata proofUri)
        external whenNotPaused
    {
        Task storage t = _requireTask(taskId);
        require(t.worker   == _msgSender(),        "GuildEscrow: not worker");
        require(t.status   == TaskStatus.Assigned, "GuildEscrow: not assigned");
        require(t.deadline  > block.timestamp,     "GuildEscrow: expired");
        require(bytes(proofUri).length > 0,        "GuildEscrow: empty proof");

        t.proofUri = proofUri;
        t.status   = TaskStatus.Submitted;

        emit TaskSubmitted(taskId, _msgSender(), proofUri);
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    /**
     * @notice Poster approves submission — releases reward to worker and fee to treasury.
     */
    function approveTask(uint256 taskId) external nonReentrant whenNotPaused {
        Task storage t = _requireTask(taskId);
        require(t.poster == _msgSender(),          "GuildEscrow: not poster");
        require(
            t.status == TaskStatus.Submitted ||
            t.status == TaskStatus.Assigned,       // direct approval without submission
            "GuildEscrow: not submitted"
        );

        t.status = TaskStatus.Approved;

        _releasePayout(t);
        emit TaskApproved(taskId, t.worker, t.reward);
    }

    // ── Dispute ───────────────────────────────────────────────────────────────

    /**
     * @notice Poster or worker raises a dispute.
     */
    function raiseDispute(uint256 taskId) external whenNotPaused {
        Task storage t = _requireTask(taskId);
        require(
            _msgSender() == t.poster || _msgSender() == t.worker,
            "GuildEscrow: not party"
        );
        require(
            t.status == TaskStatus.Submitted ||
            t.status == TaskStatus.Assigned,
            "GuildEscrow: cannot dispute"
        );

        t.status     = TaskStatus.Disputed;
        t.disputedAt = uint64(block.timestamp);

        emit TaskDisputed(taskId, _msgSender());
    }

    /**
     * @notice Arbitrator resolves a dispute in favour of poster or worker.
     * @param favourWorker If true, worker gets the reward; if false, poster is refunded.
     */
    function resolveDispute(uint256 taskId, bool favourWorker)
        external nonReentrant onlyRole(ARBITRATOR_ROLE)
    {
        Task storage t = _requireTask(taskId);
        require(t.status == TaskStatus.Disputed, "GuildEscrow: not disputed");

        t.status = TaskStatus.Approved; // reuse Approved as "settled"

        address winner;
        uint256 payout;

        if (favourWorker) {
            winner = t.worker;
            _releasePayout(t);
            payout = t.reward;
        } else {
            winner = t.poster;
            // Refund full amount (reward + fee) to poster
            payout = t.reward + t.platformFee;
            creditToken.safeTransfer(t.poster, payout);
        }

        emit TaskResolved(taskId, winner, payout);
    }

    /**
     * @notice If admin doesn't resolve within DISPUTE_WINDOW, worker can claim.
     *         This prevents the admin from blocking payouts indefinitely.
     */
    function claimDisputeTimeout(uint256 taskId) external nonReentrant {
        Task storage t = _requireTask(taskId);
        require(t.status == TaskStatus.Disputed, "GuildEscrow: not disputed");
        require(
            block.timestamp >= t.disputedAt + DISPUTE_WINDOW,
            "GuildEscrow: window not elapsed"
        );
        require(_msgSender() == t.worker, "GuildEscrow: only worker");

        t.status = TaskStatus.Approved;
        _releasePayout(t);

        emit TaskResolved(taskId, t.worker, t.reward);
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    /**
     * @notice Poster cancels a task that has not yet been assigned.
     *         Full refund (reward + fee) is returned.
     */
    function cancelTask(uint256 taskId) external nonReentrant whenNotPaused {
        Task storage t = _requireTask(taskId);
        require(t.poster == _msgSender(),       "GuildEscrow: not poster");
        require(t.status == TaskStatus.Open,    "GuildEscrow: not open");

        t.status = TaskStatus.Cancelled;

        uint256 refund = t.reward + t.platformFee;
        creditToken.safeTransfer(t.poster, refund);

        emit TaskCancelled(taskId);
    }

    // ── Expire ────────────────────────────────────────────────────────────────

    /**
     * @notice Mark an unassigned task as expired once its deadline has passed.
     *         Full refund returned to poster.
     */
    function expireTask(uint256 taskId) external nonReentrant {
        Task storage t = _requireTask(taskId);
        require(t.status == TaskStatus.Open,  "GuildEscrow: not open");
        require(block.timestamp > t.deadline, "GuildEscrow: not expired");

        t.status = TaskStatus.Expired;

        uint256 refund = t.reward + t.platformFee;
        creditToken.safeTransfer(t.poster, refund);

        emit TaskExpired(taskId);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setFee(uint256 newFeeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeBps <= MAX_FEE_BPS, "GuildEscrow: fee too high");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "GuildEscrow: zero treasury");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ── Internal helpers ──────────────────────────────────────────────────────

    function _requireTask(uint256 taskId) internal view returns (Task storage) {
        Task storage t = tasks[taskId];
        require(t.id != 0, "GuildEscrow: task not found");
        return t;
    }

    function _releasePayout(Task storage t) internal {
        if (t.platformFee > 0) {
            creditToken.safeTransfer(treasury, t.platformFee);
        }
        if (t.reward > 0) {
            creditToken.safeTransfer(t.worker, t.reward);
        }
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function totalTasks() external view returns (uint256) {
        return _nextTaskId;
    }
}
