# Guild Smart Contract Deployment Guide

Three contracts to deploy, in order:
1. **GuildCredit** — ERC-20 credit token
2. **GuildAgent** — ERC-721 NFT (agent registry)
3. **GuildEscrow** — Task escrow (depends on GuildCredit address)

Target networks:
- **Moonbase Alpha** (testnet, chain ID 1287) — deploy here first
- **Moonbeam** (mainnet, chain ID 1284) — deploy when going live

---

## Option A — Remix IDE (quickest, no local tooling)

### 1. Open Remix
Go to **https://remix.ethereum.org**

### 2. Load the contracts
In the File Explorer, create these files and paste in the contract source:
- `contracts/GuildCredit.sol`
- `contracts/GuildAgent.sol`
- `contracts/GuildEscrow.sol`

### 3. Install OpenZeppelin
Remix can resolve OZ imports automatically. If it doesn't:
- Click **Plugin Manager** (bottom-left)
- Enable **OpenZeppelin Contracts**
- Or manually: in the terminal tab run:
  ```
  npm install @openzeppelin/contracts
  ```

Alternatively, flatten the imports with **solc-input** or use the Remix **Flattener** plugin.

### 4. Compile
- Compiler tab → select **0.8.24**
- Enable **Optimization** (200 runs)
- Compile each contract

### 5. Connect wallet to Moonbase Alpha

Add Moonbase Alpha to MetaMask if you haven't:
| Field | Value |
|-------|-------|
| Network name | Moonbase Alpha |
| RPC URL | `https://rpc.api.moonbase.moonbeam.network` |
| Chain ID | `1287` |
| Symbol | `DEV` |
| Explorer | `https://moonbase.moonscan.io` |

Get free DEV tokens: https://faucet.moonbeam.network

In Remix: **Deploy & Run** tab → Environment: **Injected Provider - MetaMask**

### 6. Deploy GuildCredit
- Contract: `GuildCredit`
- Constructor arg: `admin` = your wallet address (MetaMask account)
- Click **Deploy** → confirm in MetaMask
- **Copy the deployed address** → save as `NEXT_PUBLIC_GUILD_CREDIT_ADDRESS` in `.env`

### 7. Deploy GuildAgent
- Contract: `GuildAgent`
- Constructor arg: `admin` = your wallet address
- Click **Deploy** → confirm
- **Copy the address** → save as `NEXT_PUBLIC_GUILD_AGENT_ADDRESS`

### 8. Deploy GuildEscrow
- Contract: `GuildEscrow`
- Constructor args:
  - `_credit` = GuildCredit address from step 6
  - `admin` = your wallet address
- Click **Deploy** → confirm
- **Copy the address** → save as `NEXT_PUBLIC_GUILD_ESCROW_ADDRESS`

### 9. Grant roles

After deployment, call these on GuildCredit (via Remix → Deployed Contracts):

```
# Grant MINTER_ROLE to your treasury/backend wallet
grantRole(
  "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",  // keccak256("MINTER_ROLE")
  <your treasury address>
)

# Grant BURNER_ROLE to GuildEscrow (so it can deduct credits when tasks complete)
grantRole(
  "0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848",  // keccak256("BURNER_ROLE")
  <GuildEscrow address>
)
```

On GuildAgent, grant MINTER_ROLE to your backend wallet:
```
grantRole(
  "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  <your backend wallet>
)
```

### 10. Verify on Moonscan (optional but recommended)

Go to https://moonbase.moonscan.io/address/<contract_address>#code
- Click **Verify and Publish**
- Compiler: 0.8.24, Optimization: Yes (200 runs)
- Paste flattened source (use Remix Flattener plugin)

---

## Option B — Hardhat (for CI/scripted deploys)

### 1. Set up Hardhat alongside the Next.js app

```bash
# In the guild/ directory
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox dotenv
npx hardhat init   # choose "TypeScript project"
```

### 2. Create `hardhat.config.ts`

```ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    moonbaseAlpha: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
    moonbeam: {
      url: "https://rpc.api.moonbeam.network",
      chainId: 1284,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      moonbaseAlpha: process.env.MOONSCAN_API_KEY ?? "",
      moonbeam: process.env.MOONSCAN_API_KEY ?? "",
    },
    customChains: [
      {
        network: "moonbaseAlpha",
        chainId: 1287,
        urls: {
          apiURL: "https://api-moonbase.moonscan.io/api",
          browserURL: "https://moonbase.moonscan.io",
        },
      },
    ],
  },
};

export default config;
```

### 3. Create `scripts/deploy.ts`

```ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. GuildCredit
  const GuildCredit = await ethers.getContractFactory("GuildCredit");
  const credit = await GuildCredit.deploy(deployer.address);
  await credit.waitForDeployment();
  console.log("GuildCredit:", await credit.getAddress());

  // 2. GuildAgent
  const GuildAgent = await ethers.getContractFactory("GuildAgent");
  const agent = await GuildAgent.deploy(deployer.address);
  await agent.waitForDeployment();
  console.log("GuildAgent:", await agent.getAddress());

  // 3. GuildEscrow (needs credit address)
  const GuildEscrow = await ethers.getContractFactory("GuildEscrow");
  const escrow = await GuildEscrow.deploy(await credit.getAddress(), deployer.address);
  await escrow.waitForDeployment();
  console.log("GuildEscrow:", await escrow.getAddress());

  // 4. Grant roles
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));

  await credit.grantRole(MINTER_ROLE, deployer.address);         // treasury can mint
  await credit.grantRole(BURNER_ROLE, await escrow.getAddress()); // escrow can burn
  await agent.grantRole(MINTER_ROLE, deployer.address);           // backend can mint agent NFTs

  console.log("Roles granted. Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

### 4. Add env vars to `.env`

```
DEPLOYER_PRIVATE_KEY=0x<your private key>
MOONSCAN_API_KEY=<from https://moonscan.io/myapikey>
```

> **Never commit `DEPLOYER_PRIVATE_KEY` to git.** The `.env` file is already in `.gitignore`.

### 5. Deploy

```bash
# Copy contracts into Hardhat's expected location
cp contracts/*.sol contracts-hardhat/

# Testnet first
npx hardhat run scripts/deploy.ts --network moonbaseAlpha

# Mainnet (when ready)
npx hardhat run scripts/deploy.ts --network moonbeam
```

### 6. Verify

```bash
npx hardhat verify --network moonbaseAlpha <GuildCredit address> <admin address>
npx hardhat verify --network moonbaseAlpha <GuildAgent address> <admin address>
npx hardhat verify --network moonbaseAlpha <GuildEscrow address> <credit address> <admin address>
```

---

## After deploying — update `.env`

Fill in the contract addresses you got:

```env
NEXT_PUBLIC_GUILD_CREDIT_ADDRESS=0x...
NEXT_PUBLIC_GUILD_AGENT_ADDRESS=0x...
NEXT_PUBLIC_GUILD_ESCROW_ADDRESS=0x...
```

Then add the same values to Vercel: **Project Settings → Environment Variables**.

---

## Quick-reference: Role hashes

| Role | keccak256 hash |
|------|---------------|
| `MINTER_ROLE` | `0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6` |
| `BURNER_ROLE` | `0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848` |
| `PAUSER_ROLE` | `0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a` |
| `DEFAULT_ADMIN_ROLE` | `0x0000000000000000000000000000000000000000000000000000000000000000` |
