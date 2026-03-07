import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV");

  // 1. GuildCredit (ERC-20)
  console.log("\n--- Deploying GuildCredit ---");
  const GuildCredit = await ethers.getContractFactory("GuildCredit");
  const credit = await GuildCredit.deploy(deployer.address);
  await credit.waitForDeployment();
  const creditAddr = await credit.getAddress();
  console.log("GuildCredit deployed:", creditAddr);

  // 2. GuildAgent (ERC-721)
  console.log("\n--- Deploying GuildAgent ---");
  const GuildAgent = await ethers.getContractFactory("GuildAgent");
  const agent = await GuildAgent.deploy(deployer.address);
  await agent.waitForDeployment();
  const agentAddr = await agent.getAddress();
  console.log("GuildAgent deployed:", agentAddr);

  // 3. GuildEscrow (admin, creditToken, treasury, feeBps)
  //    feeBps = 250 → 2.5% platform fee
  console.log("\n--- Deploying GuildEscrow ---");
  const GuildEscrow = await ethers.getContractFactory("GuildEscrow");
  const escrow = await GuildEscrow.deploy(deployer.address, creditAddr, deployer.address, 250);
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("GuildEscrow deployed:", escrowAddr);

  // 4. Grant roles
  console.log("\n--- Granting roles ---");
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

  let tx = await credit.grantRole(MINTER_ROLE, deployer.address);
  await tx.wait();
  console.log("GuildCredit: MINTER_ROLE granted to deployer");

  tx = await credit.grantRole(BURNER_ROLE, escrowAddr);
  await tx.wait();
  console.log("GuildCredit: BURNER_ROLE granted to GuildEscrow");

  tx = await agent.grantRole(MINTER_ROLE, deployer.address);
  await tx.wait();
  console.log("GuildAgent: MINTER_ROLE granted to deployer");

  // Summary
  console.log("\n========================================");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log(`NEXT_PUBLIC_GUILD_CREDIT_ADDRESS=${creditAddr}`);
  console.log(`NEXT_PUBLIC_GUILD_AGENT_ADDRESS=${agentAddr}`);
  console.log(`NEXT_PUBLIC_GUILD_ESCROW_ADDRESS=${escrowAddr}`);
  console.log("========================================");
  console.log("Copy the above into your .env file.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
