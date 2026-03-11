import { expect } from "chai";
import { ethers } from "hardhat";
import { GuildCredit } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GuildCredit", () => {
  let credit: GuildCredit;
  let admin: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let burner: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

  beforeEach(async () => {
    [admin, minter, burner, user] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("GuildCredit");
    credit = await Factory.deploy(admin.address);
    await credit.waitForDeployment();

    // Grant roles
    await credit.connect(admin).grantRole(MINTER_ROLE, minter.address);
    await credit.connect(admin).grantRole(BURNER_ROLE, burner.address);
  });

  // ── Deployment ──────────────────────────────────────────────────────

  describe("Deployment", () => {
    it("should set name and symbol", async () => {
      expect(await credit.name()).to.equal("Guild Credit");
      expect(await credit.symbol()).to.equal("GUILD");
    });

    it("should grant DEFAULT_ADMIN_ROLE and PAUSER_ROLE to admin", async () => {
      expect(await credit.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await credit.hasRole(PAUSER_ROLE, admin.address)).to.be.true;
    });

    it("should have 18 decimals", async () => {
      expect(await credit.decimals()).to.equal(18);
    });

    it("should have zero initial supply", async () => {
      expect(await credit.totalSupply()).to.equal(0);
    });

    it("should revert on zero admin address", async () => {
      const Factory = await ethers.getContractFactory("GuildCredit");
      await expect(Factory.deploy(ethers.ZeroAddress)).to.be.revertedWith("GuildCredit: zero admin");
    });
  });

  // ── Minting ─────────────────────────────────────────────────────────

  describe("Minting", () => {
    const amount = ethers.parseEther("1000");

    it("should allow MINTER_ROLE to mint credits", async () => {
      await credit.connect(minter).mintCredits(user.address, amount, "top-up");
      expect(await credit.balanceOf(user.address)).to.equal(amount);
    });

    it("should emit CreditsMinted event", async () => {
      await expect(credit.connect(minter).mintCredits(user.address, amount, "test-mint"))
        .to.emit(credit, "CreditsMinted")
        .withArgs(user.address, amount, "test-mint");
    });

    it("should revert if caller lacks MINTER_ROLE", async () => {
      await expect(credit.connect(user).mintCredits(user.address, amount, "hack"))
        .to.be.reverted;
    });

    it("should revert on mint to zero address", async () => {
      await expect(credit.connect(minter).mintCredits(ethers.ZeroAddress, amount, "bad"))
        .to.be.revertedWith("GuildCredit: mint to zero");
    });

    it("should revert on zero amount", async () => {
      await expect(credit.connect(minter).mintCredits(user.address, 0, "zero"))
        .to.be.revertedWith("GuildCredit: zero amount");
    });

    it("should revert when exceeding MAX_SUPPLY", async () => {
      const maxSupply = await credit.MAX_SUPPLY();
      await credit.connect(minter).mintCredits(user.address, maxSupply, "max");
      await expect(credit.connect(minter).mintCredits(user.address, 1, "over"))
        .to.be.revertedWith("GuildCredit: cap exceeded");
    });
  });

  // ── Burning ─────────────────────────────────────────────────────────

  describe("Burning", () => {
    const amount = ethers.parseEther("500");

    beforeEach(async () => {
      await credit.connect(minter).mintCredits(user.address, amount, "setup");
    });

    it("should allow token holder to burn own tokens", async () => {
      await credit.connect(user).burn(ethers.parseEther("100"));
      expect(await credit.balanceOf(user.address)).to.equal(ethers.parseEther("400"));
    });

    it("should allow BURNER_ROLE to burnFrom with allowance", async () => {
      const burnAmount = ethers.parseEther("200");
      await credit.connect(user).approve(burner.address, burnAmount);
      await credit.connect(burner)["burnFrom(address,uint256,string)"](user.address, burnAmount, "escrow-spend");
      expect(await credit.balanceOf(user.address)).to.equal(ethers.parseEther("300"));
    });

    it("should emit CreditsBurned on authorised burnFrom", async () => {
      const burnAmount = ethers.parseEther("50");
      await credit.connect(user).approve(burner.address, burnAmount);
      await expect(credit.connect(burner)["burnFrom(address,uint256,string)"](user.address, burnAmount, "fee"))
        .to.emit(credit, "CreditsBurned")
        .withArgs(user.address, burnAmount, "fee");
    });

    it("should revert burnFrom without BURNER_ROLE", async () => {
      await credit.connect(user).approve(admin.address, amount);
      await expect(credit.connect(admin)["burnFrom(address,uint256,string)"](user.address, amount, "nope"))
        .to.be.reverted;
    });

    it("should revert burnFrom when allowance insufficient", async () => {
      await credit.connect(user).approve(burner.address, ethers.parseEther("10"));
      await expect(
        credit.connect(burner)["burnFrom(address,uint256,string)"](user.address, ethers.parseEther("100"), "over")
      ).to.be.revertedWith("GuildCredit: burn exceeds allowance");
    });
  });

  // ── Pause ───────────────────────────────────────────────────────────

  describe("Pausable", () => {
    it("should allow PAUSER_ROLE to pause", async () => {
      await credit.connect(admin).pause();
      expect(await credit.paused()).to.be.true;
    });

    it("should block transfers when paused", async () => {
      const amount = ethers.parseEther("100");
      await credit.connect(minter).mintCredits(user.address, amount, "pre-pause");
      await credit.connect(admin).pause();
      await expect(credit.connect(user).transfer(admin.address, amount)).to.be.reverted;
    });

    it("should block minting when paused", async () => {
      await credit.connect(admin).pause();
      await expect(credit.connect(minter).mintCredits(user.address, 1, "paused")).to.be.reverted;
    });

    it("should allow transfers after unpause", async () => {
      const amount = ethers.parseEther("100");
      await credit.connect(minter).mintCredits(user.address, amount, "setup");
      await credit.connect(admin).pause();
      await credit.connect(admin).unpause();
      await credit.connect(user).transfer(admin.address, amount);
      expect(await credit.balanceOf(admin.address)).to.equal(amount);
    });
  });

  // ── ERC-20 basics ───────────────────────────────────────────────────

  describe("ERC-20 transfers", () => {
    const amount = ethers.parseEther("1000");

    beforeEach(async () => {
      await credit.connect(minter).mintCredits(user.address, amount, "setup");
    });

    it("should transfer between accounts", async () => {
      await credit.connect(user).transfer(admin.address, ethers.parseEther("250"));
      expect(await credit.balanceOf(admin.address)).to.equal(ethers.parseEther("250"));
      expect(await credit.balanceOf(user.address)).to.equal(ethers.parseEther("750"));
    });

    it("should approve and transferFrom", async () => {
      await credit.connect(user).approve(admin.address, ethers.parseEther("500"));
      await credit.connect(admin).transferFrom(user.address, minter.address, ethers.parseEther("500"));
      expect(await credit.balanceOf(minter.address)).to.equal(ethers.parseEther("500"));
    });
  });
});
