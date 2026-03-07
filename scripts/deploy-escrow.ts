import pkg from "hardhat";
const { ethers } = pkg;

const CREDIT_ADDR = "0xFf055832F3C54F7d949B890DA77aa35cA412151A";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV");

  // GuildEscrow: (admin, creditToken, treasury, feeBps)
  console.log("\n--- Deploying GuildEscrow ---");
  const GuildEscrow = await ethers.getContractFactory("GuildEscrow");
  const escrow = await GuildEscrow.deploy(deployer.address, CREDIT_ADDR, deployer.address, 250);
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("GuildEscrow deployed:", escrowAddr);

  // Grant BURNER_ROLE on GuildCredit to GuildEscrow
  console.log("\n--- Granting BURNER_ROLE to GuildEscrow ---");
  const credit = await ethers.getContractAt("GuildCredit", CREDIT_ADDR);
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
  const tx = await credit.grantRole(BURNER_ROLE, escrowAddr);
  await tx.wait();
  console.log("GuildCredit: BURNER_ROLE granted to GuildEscrow");

  console.log("\n========================================");
  console.log(`NEXT_PUBLIC_GUILD_ESCROW_ADDRESS=${escrowAddr}`);
  console.log("========================================");
}

main().catch((e) => { console.error(e); process.exit(1); });
