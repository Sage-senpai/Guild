import { getAccount } from "@wagmi/core";
import { wagmiConfig } from "@/components/web3-provider";

/**
 * Wrapper around `fetch` that automatically attaches the connected wallet
 * address as an `x-wallet-address` header so API routes can identify the user.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const account = getAccount(wagmiConfig);
  const headers = new Headers(init?.headers);

  if (account.address && !headers.has("x-wallet-address")) {
    headers.set("x-wallet-address", account.address);
  }

  return fetch(input, { ...init, headers });
}
