import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";
dotenv.config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: "./contracts",
  },
  networks: {
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
};

export default config;
