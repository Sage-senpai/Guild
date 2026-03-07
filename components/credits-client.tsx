"use client";

import { useEffect, useMemo, useState } from "react";
import { parseEther } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useChains,
  usePublicClient,
  useSendTransaction,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-fetch";
import { formatCredits } from "@/lib/format";
import type { CreditLedgerRecord, TopupOrderRecord } from "@/lib/types";

type CreditsPayload = {
  stats: {
    remaining: number;
    used: number;
    toppedUp: number;
  };
  ledger: CreditLedgerRecord[];
  topups: TopupOrderRecord[];
  error?: string;
};

type PaymentRail = "native" | "stablecoin" | "fiat";

const QUICK_ADD_AMOUNTS = ["5", "10", "25", "50"] as const;
const TOPUP_TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TOPUP_TREASURY_ADDRESS?.trim() as
  | `0x${string}`
  | undefined;

export function CreditsClient() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fundingOnchain, setFundingOnchain] = useState(false);
  const [simulatingId, setSimulatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [state, setState] = useState<CreditsPayload | null>(null);
  const [amount, setAmount] = useState("5");
  const [rail, setRail] = useState<PaymentRail>("native");
  const [offchainCurrency, setOffchainCurrency] = useState("USDC");
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | null>(null);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const publicClient = usePublicClient({ chainId });
  const { sendTransactionAsync } = useSendTransaction();
  const { data: nativeBalance, refetch: refetchNativeBalance } = useBalance({
    address,
    chainId,
    query: { enabled: Boolean(address) },
  });

  const activeChain = useMemo(
    () => chains.find((chain) => chain.id === chainId),
    [chainId, chains],
  );
  const nativeSymbol = activeChain?.nativeCurrency.symbol ?? "NATIVE";

  async function loadCredits() {
    setLoading(true);
    const response = await apiFetch("/api/credits");
    const payload = (await response.json()) as CreditsPayload;
    if (!response.ok) {
      setError(payload.error ?? "Failed to load credits");
      setLoading(false);
      return;
    }
    setState(payload);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    void loadCredits();
  }, []);

  const pendingTopups = useMemo(
    () => state?.topups.filter((topup) => topup.status === "pending") ?? [],
    [state?.topups],
  );

  async function createOffchainTopup() {
    if (rail === "native") {
      return;
    }

    setSubmitting(true);
    setError("");
    const response = await apiFetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        rail,
        currency: offchainCurrency,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Failed to create top-up");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    await loadCredits();
  }

  async function addFundsFromWallet() {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount to top up.");
      return;
    }

    if (!isConnected || !address) {
      setError("Connect your wallet before topping up onchain.");
      return;
    }

    if (!TOPUP_TREASURY_ADDRESS) {
      setError("Onchain top-up is not configured. Missing NEXT_PUBLIC_TOPUP_TREASURY_ADDRESS.");
      return;
    }

    if (!publicClient) {
      setError("No RPC client available for the active chain.");
      return;
    }

    setFundingOnchain(true);
    setError("");

    try {
      const hash = await sendTransactionAsync({
        to: TOPUP_TREASURY_ADDRESS,
        chainId,
        value: parseEther(amount),
      });
      setPendingTxHash(hash);

      await publicClient.waitForTransactionReceipt({ hash });

      const response = await apiFetch("/api/credits/onchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: hash,
          chainId,
          fromAddress: address,
          currency: nativeSymbol.toUpperCase(),
          expectedAmount: amount,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to verify onchain top-up");
      }

      await Promise.all([loadCredits(), refetchNativeBalance()]);
      setPendingTxHash(null);
    } catch (onchainError) {
      setError(onchainError instanceof Error ? onchainError.message : "Failed to process onchain top-up");
    } finally {
      setFundingOnchain(false);
    }
  }

  async function simulateWebhook(topupId: number) {
    setSimulatingId(topupId);
    setError("");
    const response = await apiFetch(`/api/credits/${topupId}/simulate`, { method: "POST" });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Failed to reconcile top-up");
      setSimulatingId(null);
      return;
    }
    setSimulatingId(null);
    await loadCredits();
  }

  if (loading) {
    return (
      <div className="panel flex items-center justify-center py-16">
        <p className="muted text-sm">Loading credits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance overview */}
      <div className="panel p-5">
        <h1 className="font-display text-2xl font-bold text-ink">Credits</h1>
        <p className="muted mt-1 text-sm">
          Fund your account onchain, with stablecoins, or via fiat checkout.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Available", value: formatCredits(state?.stats.remaining ?? 0) },
            { label: "Used", value: formatCredits(state?.stats.used ?? 0) },
            { label: "Topped Up", value: formatCredits(state?.stats.toppedUp ?? 0) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-ink/10 bg-chalk px-4 py-3">
              <p className="text-xs font-medium text-ink/50">{label}</p>
              <p className="mt-0.5 text-lg font-bold text-ink">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add funds */}
      <section className="panel p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Add Funds</h2>
          <div className="inline-flex rounded-xl border border-ink/15 bg-chalk p-1 text-sm">
            <button
              type="button"
              onClick={() => setRail("native")}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${rail === "native" ? "bg-ink text-white" : "hover:bg-ink/8"}`}
            >
              Onchain
            </button>
            <button
              type="button"
              onClick={() => { setRail("stablecoin"); setOffchainCurrency("USDC"); }}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${rail === "stablecoin" ? "bg-ink text-white" : "hover:bg-ink/8"}`}
            >
              Stablecoin
            </button>
            <button
              type="button"
              onClick={() => { setRail("fiat"); setOffchainCurrency("USD"); }}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${rail === "fiat" ? "bg-ink text-white" : "hover:bg-ink/8"}`}
            >
              Fiat
            </button>
          </div>
        </div>

        {rail === "native" ? (
          <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUICK_ADD_AMOUNTS.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                      amount === quickAmount
                        ? "border-ink bg-ink text-white"
                        : "border-ink/20 bg-white hover:border-teal hover:bg-teal/5"
                    }`}
                  >
                    {quickAmount} {nativeSymbol}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-ink/15 bg-white p-3">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">
                  Custom Amount
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.currentTarget.value)}
                    type="number"
                    min={0}
                    step="0.0001"
                    className="w-full rounded-lg border border-ink/15 bg-chalk px-3 py-2 text-sm focus:border-teal focus:outline-none"
                    placeholder="0.00"
                  />
                  <span className="shrink-0 text-sm font-semibold text-ink">{nativeSymbol}</span>
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={fundingOnchain || !isConnected}
                onClick={addFundsFromWallet}
              >
                {fundingOnchain ? "Confirming..." : `Add ${amount || "0"} ${nativeSymbol}`}
              </Button>
            </div>

            <aside className="rounded-2xl border border-teal/20 bg-teal/5 p-4 text-sm">
              <p className="mb-3 font-semibold text-teal">How it works</p>
              <ol className="space-y-1.5 text-ink/70">
                <li>1. Send native tokens from your wallet to our treasury.</li>
                <li>2. Backend verifies the tx hash on-chain before crediting.</li>
                <li>3. Credits appear after block confirmation.</li>
              </ol>
              <div className="mt-4 space-y-1 rounded-xl border border-ink/10 bg-white/60 p-3 font-mono text-xs text-ink/60">
                <p><span className="font-semibold not-italic text-ink">Chain:</span> {activeChain?.name ?? "Not detected"}</p>
                <p><span className="font-semibold not-italic text-ink">Wallet:</span> {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Not connected"}</p>
                <p>
                  <span className="font-semibold not-italic text-ink">Balance:</span>{" "}
                  {nativeBalance ? `${Number(nativeBalance.formatted).toFixed(4)} ${nativeBalance.symbol}` : "–"}
                </p>
                <p className="break-all"><span className="font-semibold not-italic text-ink">Treasury:</span> {TOPUP_TREASURY_ADDRESS ?? "Not configured"}</p>
                {pendingTxHash ? (
                  <p className="break-all text-teal"><span className="font-semibold">Pending tx:</span> {pendingTxHash}</p>
                ) : null}
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-4">
            <input
              value={amount}
              onChange={(event) => setAmount(event.currentTarget.value)}
              type="number"
              min={1}
              step="0.01"
              className="rounded-xl border border-ink/20 bg-chalk px-3 py-2 text-sm focus:border-teal focus:outline-none"
              placeholder="Amount"
            />
            <select
              value={offchainCurrency}
              onChange={(event) => setOffchainCurrency(event.currentTarget.value.toUpperCase())}
              className="rounded-xl border border-ink/20 bg-chalk px-3 py-2 text-sm focus:border-teal focus:outline-none"
            >
              {rail === "stablecoin" ? (
                <>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                  <option value="DAI">DAI</option>
                </>
              ) : (
                <>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="AED">AED</option>
                </>
              )}
            </select>
            <div className="rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-sm text-ink/60">
              Rail: {rail}
            </div>
            <Button type="button" disabled={submitting} onClick={createOffchainTopup}>
              {submitting ? "Creating..." : "Create Order"}
            </Button>
          </div>
        )}
      </section>

      {/* Pending reconciliation */}
      {pendingTopups.length > 0 && (
        <section className="panel p-5">
          <h2 className="mb-3 text-lg font-bold text-ink">Pending Reconciliation</h2>
          <div className="space-y-2">
            {pendingTopups.map((topup) => (
              <article key={topup.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-chalk px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink">Order #{topup.id}</p>
                  <p className="font-mono text-xs text-ink/50">{topup.providerReference}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink/60">{topup.rail} · {topup.currency} {topup.amount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={simulatingId === topup.id}
                    onClick={() => { void simulateWebhook(topup.id); }}
                  >
                    {simulatingId === topup.id ? "Reconciling..." : "Simulate"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Credit ledger */}
      <section className="panel p-5">
        <h2 className="mb-3 text-lg font-bold text-ink">Credit Ledger</h2>
        {state?.ledger.length ? (
          <div className="space-y-2">
            {state.ledger.slice(0, 25).map((entry) => (
              <article key={entry.id} className="flex items-center justify-between rounded-xl border border-ink/8 bg-chalk/60 px-4 py-3 text-sm">
                <div>
                  <span className="font-semibold capitalize text-ink">{entry.kind}</span>
                  {entry.note ? <p className="muted text-xs">{entry.note}</p> : null}
                  <p className="muted text-xs">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-mono text-sm font-bold ${entry.amount > 0 ? "text-teal" : "text-flare"}`}>
                  {entry.amount > 0 ? "+" : ""}{formatCredits(entry.amount)}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted text-sm">No ledger entries yet.</p>
        )}
      </section>

      {error ? (
        <div className="rounded-xl border border-flare/20 bg-flare/5 px-4 py-3 text-sm font-semibold text-flare">
          {error}
        </div>
      ) : null}
    </div>
  );
}
