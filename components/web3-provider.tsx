"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import type { Chain } from "wagmi/chains";
import {
  arbitrum,
  base,
  mainnet,
  moonbaseAlpha,
  moonbeam,
  optimism,
  polygon,
} from "wagmi/chains";

// ── Polkadot Hub (MainNet) — EVM-compatible via ETH RPC proxy ────────────
const polkadotHub: Chain = {
  id: 420420419,
  name: "Polkadot Hub",
  nativeCurrency: { name: "DOT", symbol: "DOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc.polkadot.io"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout.polkadot.io" },
  },
};

// ── Polkadot Hub TestNet (Paseo) — for development & hackathons ──────────
const polkadotHubTestnet: Chain = {
  id: 420420417,
  name: "Polkadot Hub TestNet",
  nativeCurrency: { name: "PAS", symbol: "PAS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-testnet.polkadot.io"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout-testnet.polkadot.io" },
  },
  testnet: true,
};

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ||
  "00000000000000000000000000000000";

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim()) {
  // Do not fail builds/prerender when env is missing. Wallet connections
  // will remain disabled until a real WalletConnect project id is configured.
  console.warn("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing. Using fallback project id.");
}

export const wagmiConfig = getDefaultConfig({
  appName: "Guild",
  projectId,
  chains: [
    polkadotHub,
    polkadotHubTestnet,
    moonbeam,
    moonbaseAlpha,
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
  ],
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
