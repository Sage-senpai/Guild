import { expect } from "chai";
import { ethers } from "hardhat";
import { GuildCredit, GuildEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("GuildEscrow", () => {
  let credit: GuildCredit;
  let escrow: GuildEscrow;
  let admin: HardhatEthersSigner;
  let poster: HardhatEthersSigner;
  let worker: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  const ARBITRATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ARBITRATOR_ROLE"));

  const FEE_BPS = 500n; // 5%
  const BPS_DENOM = 10_000n;
  const REWARD_GROSS = ethers.parseEther("100");
  const EXPECTED_FEE = (REWARD_GROSS * FEE_BPS) / BPS_DENOM; // 5 ETH
  const EXPECTED_NET = REWARD_GROSS - EXPECTED_FEE; // 95 ETH

  async function futureDeadline(seconds = 86400): Promise<number> {
    const latest = await time.latest();
    return latest + seconds;
  }

  async function postAndFundTask(): Promise<bigint> {
    const deadline = await futureDeadline();
    await credit.connect(poster).approve(await escrow.getAddress(), REWARD_GROSS);
    const tx = await escrow.connect(poster).postTask(REWARD_GROSS, deadline);
    const receipt = await tx.wait();
    const event = receipt!.logs.find(
      (l) => escrow.interface.parseLog({ topics: l.topics as string[], data: l.data })?.name === "TaskPosted"
    );
    const parsed = escrow.interface.parseLog({ topics: event!.topics as string[], data: event!.data });
    return parsed!.args.taskId;
  }

  beforeEach(async () => {
    [admin, poster, worker, treasury] = await ethers.getSigners();

    // Deploy GuildCredit
    const CreditFactory = await ethers.getContractFactory("GuildCredit");
    credit = await CreditFactory.deploy(admin.address);
    await credit.waitForDeployment();

    // Deploy GuildEscrow (5% fee)
    const EscrowFactory = await ethers.getContractFactory("GuildEscrow");
    escrow = await EscrowFactory.deploy(
      admin.address,
      await credit.getAddress(),
      treasury.address,
      FEE_BPS
    );
    await escrow.waitForDeployment();

    // Grant minter role to admin for funding test accounts
    await credit.connect(admin).grantRole(MINTER_ROLE, admin.address);

    // Fund poster with credits
    await credit.connect(admin).mintCredits(poster.address, ethers.parseEther("10000"), "test-fund");
  });

  // ── Deployment ──────────────────────────────────────────────────────

  describe("Deployment", () => {
    it("should set credit token, treasury, and fee", async () => {
      expect(await escrow.creditToken()).to.equal(await credit.getAddress());
      expect(await escrow.treasury()).to.equal(treasury.address);
      expect(await escrow.feeBps()).to.equal(FEE_BPS);
    });

    it("should grant admin roles", async () => {
      expect(await escrow.hasRole(ethers.ZeroHash, admin.address)).to.be.true;
      expect(await escrow.hasRole(ARBITRATOR_ROLE, admin.address)).to.be.true;
    });

    it("should start with zero tasks", async () => {
      expect(await escrow.totalTasks()).to.equal(0);
    });

    it("should revert on zero admin", async () => {
      const F = await ethers.getContractFactory("GuildEscrow");
      await expect(F.deploy(ethers.ZeroAddress, await credit.getAddress(), treasury.address, 500))
        .to.be.revertedWith("GuildEscrow: zero admin");
    });

    it("should revert on fee exceeding MAX_FEE_BPS (10%)", async () => {
      const F = await ethers.getContractFactory("GuildEscrow");
      await expect(F.deploy(admin.address, await credit.getAddress(), treasury.address, 1001))
        .to.be.revertedWith("GuildEscrow: fee too high");
    });
  });

  // ── Post Task ───────────────────────────────────────────────────────

  describe("postTask", () => {
    it("should create a task and lock credits", async () => {
      const taskId = await postAndFundTask();
      const task = await escrow.getTask(taskId);
      expect(task.poster).to.equal(poster.address);
      expect(task.reward).to.equal(EXPECTED_NET);
      expect(task.platformFee).to.equal(EXPECTED_FEE);
      expect(task.status).to.equal(0); // Open
    });

    it("should transfer credits from poster to escrow", async () => {
      const balBefore = await credit.balanceOf(poster.address);
      await postAndFundTask();
      const balAfter = await credit.balanceOf(poster.address);
      expect(balBefore - balAfter).to.equal(REWARD_GROSS);
      expect(await credit.balanceOf(await escrow.getAddress())).to.equal(REWARD_GROSS);
    });

    it("should emit TaskPosted event", async () => {
      const deadline = await futureDeadline();
      await credit.connect(poster).approve(await escrow.getAddress(), REWARD_GROSS);
      await expect(escrow.connect(poster).postTask(REWARD_GROSS, deadline))
        .to.emit(escrow, "TaskPosted");
    });

    it("should increment task counter", async () => {
      await postAndFundTask();
      await postAndFundTask();
      expect(await escrow.totalTasks()).to.equal(2);
    });

    it("should revert on zero reward", async () => {
      const deadline = await futureDeadline();
      await expect(escrow.connect(poster).postTask(0, deadline))
        .to.be.revertedWith("GuildEscrow: zero reward");
    });

    it("should revert on deadline in the past", async () => {
      const pastDeadline = (await time.latest()) - 100;
      await credit.connect(poster).approve(await escrow.getAddress(), REWARD_GROSS);
      await expect(escrow.connect(poster).postTask(REWARD_GROSS, pastDeadline))
        .to.be.revertedWith("GuildEscrow: deadline in past");
    });
  });

  // ── Claim ───────────────────────────────────────────────────────────

  describe("claimTask", () => {
    it("should allow a worker to claim an open task", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      const task = await escrow.getTask(taskId);
      expect(task.worker).to.equal(worker.address);
      expect(task.status).to.equal(1); // Assigned
    });

    it("should emit TaskClaimed event", async () => {
      const taskId = await postAndFundTask();
      await expect(escrow.connect(worker).claimTask(taskId))
        .to.emit(escrow, "TaskClaimed")
        .withArgs(taskId, worker.address);
    });

    it("should revert if poster tries to claim own task", async () => {
      const taskId = await postAndFundTask();
      await expect(escrow.connect(poster).claimTask(taskId))
        .to.be.revertedWith("GuildEscrow: poster cannot claim");
    });

    it("should revert if task already claimed", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await expect(escrow.connect(admin).claimTask(taskId))
        .to.be.revertedWith("GuildEscrow: not open");
    });
  });

  // ── Select Worker ───────────────────────────────────────────────────

  describe("selectWorker", () => {
    it("should allow poster to select a worker", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(poster).selectWorker(taskId, worker.address);
      const task = await escrow.getTask(taskId);
      expect(task.worker).to.equal(worker.address);
      expect(task.status).to.equal(1); // Assigned
    });

    it("should revert if non-poster tries to select", async () => {
      const taskId = await postAndFundTask();
      await expect(escrow.connect(worker).selectWorker(taskId, worker.address))
        .to.be.revertedWith("GuildEscrow: not poster");
    });

    it("should revert on self-select", async () => {
      const taskId = await postAndFundTask();
      await expect(escrow.connect(poster).selectWorker(taskId, poster.address))
        .to.be.revertedWith("GuildEscrow: self-select");
    });
  });

  // ── Submit Work ─────────────────────────────────────────────────────

  describe("submitWork", () => {
    it("should allow worker to submit proof", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await escrow.connect(worker).submitWork(taskId, "ipfs://QmProof123");
      const task = await escrow.getTask(taskId);
      expect(task.proofUri).to.equal("ipfs://QmProof123");
      expect(task.status).to.equal(2); // Submitted
    });

    it("should emit TaskSubmitted event", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await expect(escrow.connect(worker).submitWork(taskId, "ipfs://QmProof"))
        .to.emit(escrow, "TaskSubmitted")
        .withArgs(taskId, worker.address, "ipfs://QmProof");
    });

    it("should revert if not the assigned worker", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await expect(escrow.connect(poster).submitWork(taskId, "ipfs://fake"))
        .to.be.revertedWith("GuildEscrow: not worker");
    });

    it("should revert on empty proof", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await expect(escrow.connect(worker).submitWork(taskId, ""))
        .to.be.revertedWith("GuildEscrow: empty proof");
    });
  });

  // ── Approve ─────────────────────────────────────────────────────────

  describe("approveTask", () => {
    it("should release reward to worker and fee to treasury", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await escrow.connect(worker).submitWork(taskId, "ipfs://QmProof");

      const workerBalBefore = await credit.balanceOf(worker.address);
      const treasuryBalBefore = await credit.balanceOf(treasury.address);

      await escrow.connect(poster).approveTask(taskId);

      expect(await credit.balanceOf(worker.address) - workerBalBefore).to.equal(EXPECTED_NET);
      expect(await credit.balanceOf(treasury.address) - treasuryBalBefore).to.equal(EXPECTED_FEE);
    });

    it("should set task status to Approved", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await escrow.connect(poster).approveTask(taskId); // direct approval without submission
      expect((await escrow.getTask(taskId)).status).to.equal(3); // Approved
    });

    it("should emit TaskApproved event", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await escrow.connect(worker).submitWork(taskId, "ipfs://proof");
      await expect(escrow.connect(poster).approveTask(taskId))
        .to.emit(escrow, "TaskApproved")
        .withArgs(taskId, worker.address, EXPECTED_NET);
    });

    it("should revert if non-poster tries to approve", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await expect(escrow.connect(worker).approveTask(taskId))
        .to.be.revertedWith("GuildEscrow: not poster");
    });
  });

  // ── Cancel ──────────────────────────────────────────────────────────

  describe("cancelTask", () => {
    it("should refund poster in full (reward + fee)", async () => {
      const balBefore = await credit.balanceOf(poster.address);
      const taskId = await postAndFundTask();
      await escrow.connect(poster).cancelTask(taskId);
      const balAfter = await credit.balanceOf(poster.address);
      expect(balAfter).to.equal(balBefore); // full refund
    });

    it("should set status to Cancelled", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(poster).cancelTask(taskId);
      expect((await escrow.getTask(taskId)).status).to.equal(5); // Cancelled
    });

    it("should revert if task already assigned", async () => {
      const taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await expect(escrow.connect(poster).cancelTask(taskId))
        .to.be.revertedWith("GuildEscrow: not open");
    });

    it("should revert if non-poster cancels", async () => {
      const taskId = await postAndFundTask();
      await expect(escrow.connect(worker).cancelTask(taskId))
        .to.be.revertedWith("GuildEscrow: not poster");
    });
  });

  // ── Expire ──────────────────────────────────────────────────────────

  describe("expireTask", () => {
    it("should refund poster after deadline passes", async () => {
      const deadline = await futureDeadline(60); // 60 seconds
      await credit.connect(poster).approve(await escrow.getAddress(), REWARD_GROSS);
      const tx = await escrow.connect(poster).postTask(REWARD_GROSS, deadline);
      const receipt = await tx.wait();
      const event = receipt!.logs.find(
        (l) => escrow.interface.parseLog({ topics: l.topics as string[], data: l.data })?.name === "TaskPosted"
      );
      const taskId = escrow.interface.parseLog({ topics: event!.topics as string[], data: event!.data })!.args.taskId;

      // Fast-forward past deadline
      await time.increase(120);

      const balBefore = await credit.balanceOf(poster.address);
      await escrow.connect(admin).expireTask(taskId);
      const balAfter = await credit.balanceOf(poster.address);
      expect(balAfter - balBefore).to.equal(REWARD_GROSS);
      expect((await escrow.getTask(taskId)).status).to.equal(6); // Expired
    });

    it("should revert if deadline not yet passed", async () => {
      const taskId = await postAndFundTask();
      await expect(escrow.connect(admin).expireTask(taskId))
        .to.be.revertedWith("GuildEscrow: not expired");
    });
  });

  // ── Disputes ────────────────────────────────────────────────────────

  describe("Disputes", () => {
    let taskId: bigint;

    beforeEach(async () => {
      taskId = await postAndFundTask();
      await escrow.connect(worker).claimTask(taskId);
      await escrow.connect(worker).submitWork(taskId, "ipfs://proof");
    });

    it("should allow poster to raise dispute", async () => {
      await escrow.connect(poster).raiseDispute(taskId);
      expect((await escrow.getTask(taskId)).status).to.equal(4); // Disputed
    });

    it("should allow worker to raise dispute", async () => {
      await escrow.connect(worker).raiseDispute(taskId);
      expect((await escrow.getTask(taskId)).status).to.equal(4);
    });

    it("should emit TaskDisputed event", async () => {
      await expect(escrow.connect(poster).raiseDispute(taskId))
        .to.emit(escrow, "TaskDisputed")
        .withArgs(taskId, poster.address);
    });

    it("should revert if non-party raises dispute", async () => {
      await expect(escrow.connect(admin).raiseDispute(taskId))
        .to.be.revertedWith("GuildEscrow: not party");
    });

    describe("resolveDispute", () => {
      beforeEach(async () => {
        await escrow.connect(poster).raiseDispute(taskId);
      });

      it("should pay worker when resolved in their favour", async () => {
        const workerBal = await credit.balanceOf(worker.address);
        await escrow.connect(admin).resolveDispute(taskId, true);
        expect(await credit.balanceOf(worker.address) - workerBal).to.equal(EXPECTED_NET);
        expect((await escrow.getTask(taskId)).status).to.equal(3); // Approved (settled)
      });

      it("should refund poster when resolved against worker", async () => {
        const posterBal = await credit.balanceOf(poster.address);
        await escrow.connect(admin).resolveDispute(taskId, false);
        expect(await credit.balanceOf(poster.address) - posterBal).to.equal(REWARD_GROSS);
      });

      it("should emit TaskResolved event", async () => {
        await expect(escrow.connect(admin).resolveDispute(taskId, true))
          .to.emit(escrow, "TaskResolved")
          .withArgs(taskId, worker.address, EXPECTED_NET);
      });

      it("should revert if caller lacks ARBITRATOR_ROLE", async () => {
        await expect(escrow.connect(poster).resolveDispute(taskId, true))
          .to.be.reverted;
      });
    });

    describe("claimDisputeTimeout", () => {
      beforeEach(async () => {
        await escrow.connect(poster).raiseDispute(taskId);
      });

      it("should allow worker to claim after DISPUTE_WINDOW (7 days)", async () => {
        await time.increase(7 * 24 * 60 * 60 + 1); // 7 days + 1 second
        const workerBal = await credit.balanceOf(worker.address);
        await escrow.connect(worker).claimDisputeTimeout(taskId);
        expect(await credit.balanceOf(worker.address) - workerBal).to.equal(EXPECTED_NET);
      });

      it("should revert before DISPUTE_WINDOW elapsed", async () => {
        await time.increase(6 * 24 * 60 * 60); // only 6 days
        await expect(escrow.connect(worker).claimDisputeTimeout(taskId))
          .to.be.revertedWith("GuildEscrow: window not elapsed");
      });

      it("should revert if non-worker claims timeout", async () => {
        await time.increase(7 * 24 * 60 * 60 + 1);
        await expect(escrow.connect(poster).claimDisputeTimeout(taskId))
          .to.be.revertedWith("GuildEscrow: only worker");
      });
    });
  });

  // ── Admin functions ─────────────────────────────────────────────────

  describe("Admin", () => {
    it("should allow admin to update fee", async () => {
      await escrow.connect(admin).setFee(250);
      expect(await escrow.feeBps()).to.equal(250);
    });

    it("should reject fee above MAX_FEE_BPS", async () => {
      await expect(escrow.connect(admin).setFee(1001))
        .to.be.revertedWith("GuildEscrow: fee too high");
    });

    it("should allow admin to update treasury", async () => {
      await escrow.connect(admin).setTreasury(worker.address);
      expect(await escrow.treasury()).to.equal(worker.address);
    });

    it("should reject zero treasury address", async () => {
      await expect(escrow.connect(admin).setTreasury(ethers.ZeroAddress))
        .to.be.revertedWith("GuildEscrow: zero treasury");
    });

    it("should pause and unpause", async () => {
      await escrow.connect(admin).pause();
      expect(await escrow.paused()).to.be.true;

      const deadline = await futureDeadline();
      await credit.connect(poster).approve(await escrow.getAddress(), REWARD_GROSS);
      await expect(escrow.connect(poster).postTask(REWARD_GROSS, deadline)).to.be.reverted;

      await escrow.connect(admin).unpause();
      expect(await escrow.paused()).to.be.false;
    });
  });

  // ── Full lifecycle integration test ─────────────────────────────────

  describe("Full lifecycle: post → claim → submit → approve", () => {
    it("should complete the entire happy path", async () => {
      // 1. Post task
      const posterStart = await credit.balanceOf(poster.address);
      const taskId = await postAndFundTask();

      // 2. Worker claims
      await escrow.connect(worker).claimTask(taskId);

      // 3. Worker submits proof
      await escrow.connect(worker).submitWork(taskId, "ipfs://QmFinalProof");

      // 4. Poster approves
      await escrow.connect(poster).approveTask(taskId);

      // Verify final balances
      const posterEnd = await credit.balanceOf(poster.address);
      const workerEnd = await credit.balanceOf(worker.address);
      const treasuryEnd = await credit.balanceOf(treasury.address);

      expect(posterStart - posterEnd).to.equal(REWARD_GROSS);   // poster paid full amount
      expect(workerEnd).to.equal(EXPECTED_NET);                  // worker got net reward
      expect(treasuryEnd).to.equal(EXPECTED_FEE);                // treasury got fee

      // Verify task state
      const task = await escrow.getTask(taskId);
      expect(task.status).to.equal(3); // Approved
      expect(task.proofUri).to.equal("ipfs://QmFinalProof");
    });
  });
});
