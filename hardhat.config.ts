import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";
const MOONSCAN_KEY = process.env.MOONSCAN_API_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
  },
  networks: {
    // ── Polkadot Hub (primary target for hackathon) ────────────────
    polkadotHub: {
      url: "https://eth-rpc.polkadot.io",
      chainId: 420420419,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    polkadotHubTestnet: {
      url: "https://eth-rpc-testnet.polkadot.io",
      chainId: 420420417,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    // ── Moonbeam (Polkadot parachain) ──────────────────────────────
    moonbaseAlpha: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    moonbeam: {
      url: "https://rpc.api.moonbeam.network",
      chainId: 1284,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      polkadotHubTestnet: "no-api-key-needed",
      polkadotHub: "no-api-key-needed",
      moonbaseAlpha: MOONSCAN_KEY,
      moonbeam: MOONSCAN_KEY,
    },
    customChains: [
      {
        network: "polkadotHubTestnet",
        chainId: 420420417,
        urls: {
          apiURL: "https://blockscout-testnet.polkadot.io/api",
          browserURL: "https://blockscout-testnet.polkadot.io",
        },
      },
      {
        network: "polkadotHub",
        chainId: 420420419,
        urls: {
          apiURL: "https://blockscout.polkadot.io/api",
          browserURL: "https://blockscout.polkadot.io",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
