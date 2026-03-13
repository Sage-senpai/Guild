"use client";

import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-fetch";

type WalletGateProps = {
  children: React.ReactNode;
  /** Minimum credits required. Defaults to 0 (just require wallet). */
  minCredits?: number;
  /** Custom message shown when wallet is not connected. */
  connectMessage?: string;
  /** Custom message shown when credits are insufficient. */
  creditsMessage?: string;
};

/**
 * Wraps content that requires a connected wallet (and optionally a minimum
 * credit balance). Shows a connect prompt or insufficient-credits warning
 * instead of the children when the requirements are not met.
 */
export function WalletGate({
  children,
  minCredits = 0,
  connectMessage = "Connect your wallet to continue.",
  creditsMessage,
}: WalletGateProps) {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  useEffect(() => {
    if (!isConnected || !address || minCredits <= 0) return;

    let cancelled = false;
    setLoadingCredits(true);

    apiFetch("/api/profile")
      .then((res) => res.json())
      .then((data: { user?: { credits: number } }) => {
        if (!cancelled) {
          setCredits(data.user?.credits ?? 0);
          setLoadingCredits(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCredits(0);
          setLoadingCredits(false);
        }
      });

    return () => { cancelled = true; };
  }, [isConnected, address, minCredits]);

  // ── Not connected ───────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center text-center">
        <div className="rounded-3xl border border-ink/15 bg-chalk/60 p-8 shadow-panel">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ink/5 text-2xl">
            🔒
          </div>
          <h2 className="mb-2 text-xl font-black">Wallet Required</h2>
          <p className="muted mb-6 text-sm">{connectMessage}</p>
          <button
            type="button"
            onClick={() => openConnectModal?.()}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-ink/90"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // ── Checking credits ────────────────────────────────────────────────
  if (minCredits > 0 && loadingCredits) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
          <p className="muted text-sm">Checking balance…</p>
        </div>
      </div>
    );
  }

  // ── Insufficient credits ────────────────────────────────────────────
  if (minCredits > 0 && credits !== null && credits < minCredits) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center text-center">
        <div className="rounded-3xl border border-ink/15 bg-chalk/60 p-8 shadow-panel">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-flare/10 text-2xl">
            ✦
          </div>
          <h2 className="mb-2 text-xl font-black">Insufficient Credits</h2>
          <p className="muted mb-2 text-sm">
            {creditsMessage ??
              `You need at least ${minCredits.toFixed(2)} credits. Your balance is ${(credits ?? 0).toFixed(2)}.`}
          </p>
          <a
            href="/credits"
            className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-ink/90"
          >
            Top Up Credits
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
