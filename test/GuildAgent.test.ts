import { expect } from "chai";
import { ethers } from "hardhat";
import { GuildAgent } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GuildAgent", () => {
  let agent: GuildAgent;
  let admin: HardhatEthersSigner;
  let minterAccount: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
  const TEST_CID = "QmXoYpP9T3d5qKRb1ECzS2q1FVbgjbUFXpH7eg5asuf6eK";

  beforeEach(async () => {
    [admin, minterAccount, creator, buyer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("GuildAgent");
    agent = await Factory.deploy(admin.address);
    await agent.waitForDeployment();

    await agent.connect(admin).grantRole(MINTER_ROLE, minterAccount.address);
  });

  // ── Deployment ──────────────────────────────────────────────────────

  describe("Deployment", () => {
    it("should set name and symbol", async () => {
      expect(await agent.name()).to.equal("Guild Agent");
      expect(await agent.symbol()).to.equal("GAGENT");
    });

    it("should grant admin roles", async () => {
      expect(await agent.hasRole(ethers.ZeroHash, admin.address)).to.be.true;
      expect(await agent.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
    });

    it("should have zero total minted", async () => {
      expect(await agent.totalMinted()).to.equal(0);
    });

    it("should revert on zero admin", async () => {
      const Factory = await ethers.getContractFactory("GuildAgent");
      await expect(Factory.deploy(ethers.ZeroAddress)).to.be.revertedWith("GuildAgent: zero admin");
    });
  });

  // ── Minting ─────────────────────────────────────────────────────────

  describe("Minting", () => {
    it("should mint an agent NFT", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      expect(await agent.ownerOf(1)).to.equal(creator.address);
      expect(await agent.totalMinted()).to.equal(1);
    });

    it("should set correct token URI with ipfs:// prefix", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      expect(await agent.tokenURI(1)).to.equal(`ipfs://${TEST_CID}`);
    });

    it("should record the creator", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      expect(await agent.creators(1)).to.equal(creator.address);
    });

    it("should emit AgentMinted event", async () => {
      await expect(agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, true))
        .to.emit(agent, "AgentMinted")
        .withArgs(1, creator.address, TEST_CID, true);
    });

    it("should assign sequential token IDs", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      await agent.connect(minterAccount).mintAgent(buyer.address, "QmSecondCID", false);
      expect(await agent.ownerOf(1)).to.equal(creator.address);
      expect(await agent.ownerOf(2)).to.equal(buyer.address);
      expect(await agent.totalMinted()).to.equal(2);
    });

    it("should revert if caller lacks MINTER_ROLE", async () => {
      await expect(agent.connect(creator).mintAgent(creator.address, TEST_CID, false))
        .to.be.reverted;
    });

    it("should revert on zero creator address", async () => {
      await expect(agent.connect(minterAccount).mintAgent(ethers.ZeroAddress, TEST_CID, false))
        .to.be.revertedWith("GuildAgent: zero creator");
    });

    it("should revert on empty CID", async () => {
      await expect(agent.connect(minterAccount).mintAgent(creator.address, "", false))
        .to.be.revertedWith("GuildAgent: empty CID");
    });
  });

  // ── Royalties (ERC-2981) ────────────────────────────────────────────

  describe("Royalties", () => {
    it("should return 5% royalty to creator", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      const salePrice = ethers.parseEther("10");
      const [receiver, royaltyAmount] = await agent.royaltyInfo(1, salePrice);
      expect(receiver).to.equal(creator.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.5")); // 5% of 10
    });
  });

  // ── Soulbound ───────────────────────────────────────────────────────

  describe("Soulbound", () => {
    it("should block transfer when soulbound", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, true);
      expect(await agent.soulbound(1)).to.be.true;
      await expect(
        agent.connect(creator).transferFrom(creator.address, buyer.address, 1)
      ).to.be.revertedWith("GuildAgent: token is soulbound");
    });

    it("should allow transfer when not soulbound", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      await agent.connect(creator).transferFrom(creator.address, buyer.address, 1);
      expect(await agent.ownerOf(1)).to.equal(buyer.address);
    });

    it("should allow owner to toggle soulbound", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, true);
      await agent.connect(creator).setSoulbound(1, false);
      expect(await agent.soulbound(1)).to.be.false;
      // Now transfer should work
      await agent.connect(creator).transferFrom(creator.address, buyer.address, 1);
      expect(await agent.ownerOf(1)).to.equal(buyer.address);
    });

    it("should emit SoulboundToggled event", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      await expect(agent.connect(creator).setSoulbound(1, true))
        .to.emit(agent, "SoulboundToggled")
        .withArgs(1, true);
    });

    it("should revert setSoulbound from non-owner", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      await expect(agent.connect(buyer).setSoulbound(1, true))
        .to.be.revertedWith("GuildAgent: not owner");
    });
  });

  // ── Pause ───────────────────────────────────────────────────────────

  describe("Pausable", () => {
    it("should block minting when paused", async () => {
      await agent.connect(admin).pause();
      await expect(agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false))
        .to.be.reverted;
    });

    it("should block transfers when paused", async () => {
      await agent.connect(minterAccount).mintAgent(creator.address, TEST_CID, false);
      await agent.connect(admin).pause();
      await expect(agent.connect(creator).transferFrom(creator.address, buyer.address, 1))
        .to.be.reverted;
    });
  });

  // ── supportsInterface ───────────────────────────────────────────────

  describe("ERC-165", () => {
    it("should support ERC-721 interface", async () => {
      expect(await agent.supportsInterface("0x80ac58cd")).to.be.true; // ERC-721
    });

    it("should support ERC-2981 royalty interface", async () => {
      expect(await agent.supportsInterface("0x2a55205a")).to.be.true; // ERC-2981
    });

    it("should support AccessControl interface", async () => {
      expect(await agent.supportsInterface("0x7965db0b")).to.be.true; // IAccessControl
    });
  });
});
