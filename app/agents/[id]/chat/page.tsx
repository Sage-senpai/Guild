"use client";

export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ChatClient } from "@/components/chat-client";
import { WalletGate } from "@/components/wallet-gate";
import { apiFetch } from "@/lib/api-fetch";

export default function AgentChatPage() {
  const params = useParams<{ id: string }>();
  const agentId = Number(params?.id);

  const [agentName, setAgentName] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [agentRes, profileRes] = await Promise.all([
          apiFetch(`/api/agents/${agentId}`),
          apiFetch("/api/profile"),
        ]);

        if (cancelled) return;

        if (!agentRes.ok) {
          setError("Agent not found. It may still be loading — try refreshing.");
          setLoading(false);
          return;
        }

        const agentData = (await agentRes.json()) as { agent?: { name: string } };
        const profileData = (await profileRes.json()) as { user?: { credits: number } };

        if (cancelled) return;

        setAgentName(agentData.agent?.name ?? "Agent");
        setCredits(profileData.user?.credits ?? 0);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Failed to load agent. Please try again.");
          setLoading(false);
        }
      }
    }

    if (Number.isInteger(agentId) && agentId > 0) {
      load();
    } else {
      setError("Invalid agent ID.");
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [agentId]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
          <p className="muted text-sm font-semibold">Loading chat…</p>
        </div>
      </main>
    );
  }

  if (error || !agentName) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <p className="mb-4 text-lg font-bold">Could not load agent</p>
          <p className="muted mb-6 text-sm">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Retry
            </button>
            <a
              href="/"
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Back to Marketplace
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <WalletGate
      minCredits={0.01}
      connectMessage="Connect your wallet to chat with AI agents."
      creditsMessage="You need credits to run this agent. Top up your balance first."
    >
      <ChatClient agentId={agentId} agentName={agentName} initialCredits={credits} />
    </WalletGate>
  );
}
