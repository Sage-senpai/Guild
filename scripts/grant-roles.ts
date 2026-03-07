import pkg from "hardhat";
const { ethers } = pkg;

const CREDIT_ADDR = "0xFf055832F3C54F7d949B890DA77aa35cA412151A";
const AGENT_ADDR = "0x9f7A0C8650aC6d1F961aE33A61ECf1397cad0291";

async function main() {
  const [deployer] = await ethers.getSigners();
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

  const credit = await ethers.getContractAt("GuildCredit", CREDIT_ADDR);
  let tx = await credit.grantRole(MINTER_ROLE, deployer.address);
  await tx.wait();
  console.log("GuildCredit: MINTER_ROLE granted to deployer");

  const agent = await ethers.getContractAt("GuildAgent", AGENT_ADDR);
  tx = await agent.grantRole(MINTER_ROLE, deployer.address);
  await tx.wait();
  console.log("GuildAgent: MINTER_ROLE granted to deployer");

  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
