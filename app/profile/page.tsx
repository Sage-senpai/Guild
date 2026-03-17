"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";

import { WalletGate } from "@/components/wallet-gate";
import { apiFetch } from "@/lib/api-fetch";
import { formatCredits, formatDate, formatUsd } from "@/lib/format";
import { AGENT_BADGE_LABELS, HUMAN_BADGE_LABELS, FREE_AGENT_SLOTS } from "@/lib/types";
import type { AgentBadge, AgentRecord, HumanBadge } from "@/lib/types";

type ProfileData = {
  user: {
    id: number;
    walletAddress: string;
    credits: number;
    integrityScore: number;
  };
  agents: AgentRecord[];
  stats: { used: number; toppedUp: number };
  ledger: Array<{
    id: number;
    kind: string;
    amount: number;
    createdAt: string;
  }>;
  topups: Array<{
    id: number;
    rail: string;
    currency: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  reputation: {
    integrityScore: number;
    tasksCompleted: number;
    tasksDisputed: number;
    tasksPosted: number;
    agentsPublished: number;
    agentBadges: string[];
    humanBadges: Array<{ badge: string; category: string | null }>;
    categoryExpertise: Record<string, number>;
  };
};

function integrityColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 70) return "bg-mint";
  if (score >= 50) return "bg-amber-500";
  return "bg-flare";
}

function integrityLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}

export default function ProfilePage() {
  return (
    <WalletGate connectMessage="Connect your wallet to view your profile, credits, and agents.">
      <ProfileContent />
    </WalletGate>
  );
}

function ProfileContent() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await apiFetch("/api/profile");
        if (!res.ok) {
          setError("Failed to load profile.");
          setLoading(false);
          return;
        }
        const json = (await res.json()) as ProfileData;
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Network error loading profile.");
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
          <p className="muted text-sm font-semibold">Loading profile…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg font-bold">Could not load profile</p>
          <p className="muted mb-4 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const { user, agents, stats, ledger, topups, reputation } = data;
  const freeSlots = Math.max(0, FREE_AGENT_SLOTS - agents.length);

  return (
    <main className="space-y-6">
      {/* Identity card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-teal p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_90%_10%,rgba(134,18,17,0.2),transparent)]"
        />
        <div className="relative">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/50">
            Guild Member
          </p>
          <h1 className="font-display text-3xl font-bold text-white">Your Profile</h1>
          <p className="mt-2 font-mono text-xs text-white/50 break-all">{user.walletAddress}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Available", value: formatCredits(user.credits) },
              { label: "Used", value: formatCredits(stats.used) },
              { label: "Topped Up", value: formatCredits(stats.toppedUp) },
              { label: "Integrity", value: `${reputation.integrityScore}/100` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3"
              >
                <p className="text-xs font-medium text-white/50">{label}</p>
                <p className="mt-0.5 text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/credits"
              className="inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-chalk"
            >
              Top Up Credits
            </Link>
          </div>
        </div>
      </section>

      {/* Integrity & Badges */}
      <section className="panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-ink">Reputation</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Integrity Score</p>
            <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-ink/10">
              <div
                className={`h-full rounded-full transition-all ${integrityColor(reputation.integrityScore)}`}
                style={{ width: `${reputation.integrityScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink/70">
                {reputation.integrityScore}/100 — {integrityLabel(reputation.integrityScore)}
              </span>
              <span className="text-[10px] text-ink/40">
                {reputation.tasksCompleted} completed · {reputation.tasksDisputed} disputed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-ink/10 px-3 py-2">
              <p className="text-xs text-ink/50">Tasks Completed</p>
              <p className="text-lg font-bold text-ink">{reputation.tasksCompleted}</p>
            </div>
            <div className="rounded-xl border border-ink/10 px-3 py-2">
              <p className="text-xs text-ink/50">Tasks Posted</p>
              <p className="text-lg font-bold text-ink">{reputation.tasksPosted}</p>
            </div>
            <div className="rounded-xl border border-ink/10 px-3 py-2">
              <p className="text-xs text-ink/50">Agents Published</p>
              <p className="text-lg font-bold text-ink">{reputation.agentsPublished}</p>
            </div>
            <div className="rounded-xl border border-ink/10 px-3 py-2">
              <p className="text-xs text-ink/50">Free Agent Slots</p>
              <p className="text-lg font-bold text-ink">{freeSlots}/{FREE_AGENT_SLOTS}</p>
            </div>
          </div>
        </div>

        {(reputation.agentBadges.length > 0 || reputation.humanBadges.length > 0) && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-ink">Badges</p>
            <div className="flex flex-wrap gap-2">
              {reputation.agentBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"
                >
                  {AGENT_BADGE_LABELS[badge as AgentBadge] ?? badge}
                </span>
              ))}
              {reputation.humanBadges.map((b) => (
                <span
                  key={`${b.badge}-${b.category}`}
                  className="rounded-full border border-teal/30 bg-mint/10 px-3 py-1 text-xs font-bold text-teal"
                >
                  {HUMAN_BADGE_LABELS[b.badge as HumanBadge] ?? b.badge}
                  {b.category ? ` (${b.category})` : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(reputation.categoryExpertise).length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-ink">Category Expertise</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reputation.categoryExpertise).map(([cat, count]) => (
                <span
                  key={cat}
                  className="rounded-full border border-ink/15 bg-ink/5 px-3 py-1 text-xs font-semibold capitalize text-ink/70"
                >
                  {cat}: {count} tasks
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Task activity quick links */}
      <section className="panel p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Task Activity</h2>
          <Link
            href="/humans/my"
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal"
          >
            Manage Tasks
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ink/10 px-4 py-3 text-center">
            <p className="text-2xl font-black text-ink">{reputation.tasksCompleted}</p>
            <p className="muted text-xs font-semibold">Completed</p>
          </div>
          <div className="rounded-xl border border-ink/10 px-4 py-3 text-center">
            <p className="text-2xl font-black text-ink">{reputation.tasksPosted}</p>
            <p className="muted text-xs font-semibold">Posted</p>
          </div>
          <div className="rounded-xl border border-ink/10 px-4 py-3 text-center">
            <p className="text-2xl font-black text-ink">{reputation.tasksDisputed}</p>
            <p className="muted text-xs font-semibold">Disputed</p>
          </div>
        </div>
      </section>

      {/* Recent credit activity */}
      <section className="panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-ink">Recent Credit Activity</h2>
        {ledger.length === 0 ? (
          <p className="muted text-sm">No credit activity yet.</p>
        ) : (
          <div className="space-y-2">
            {ledger.map((entry) => (
              <article
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-ink/8 bg-chalk/60 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold capitalize text-ink">{entry.kind}</span>
                  <p className="muted text-xs">{formatDate(entry.createdAt)}</p>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${entry.amount > 0 ? "text-teal" : "text-flare"}`}
                >
                  {entry.amount > 0 ? "+" : ""}
                  {formatCredits(entry.amount)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Top-up orders */}
      <section className="panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-ink">Top-Up Orders</h2>
        {topups.length === 0 ? (
          <p className="muted text-sm">No top-up orders yet.</p>
        ) : (
          <div className="space-y-2">
            {topups.map((order) => (
              <article
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/8 bg-chalk/60 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-ink">Order #{order.id}</span>
                  <p className="muted text-xs">
                    {order.rail} · {order.currency} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal">{formatCredits(order.amount)}</span>
                  <span
                    className={`tag text-[10px] uppercase tracking-wide ${
                      order.status === "completed"
                        ? "bg-mint/20 text-teal"
                        : order.status === "pending"
                          ? "bg-ink/10 text-ink"
                          : "bg-flare/15 text-flare"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Your agents */}
      <section className="panel p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Your Agents</h2>
          <Link
            href="/create"
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal"
          >
            New Agent
          </Link>
        </div>
        {agents.length === 0 ? (
          <p className="muted text-sm">No agents yet. Create your first AI agent.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {agents.map((agent) => (
              <article
                key={agent.id}
                className="card-surface p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{agent.name}</p>
                  <span className="font-mono text-xs text-ink/50">
                    {formatUsd(agent.pricePerRun)}/run
                  </span>
                </div>
                <p className="muted mb-2 text-xs leading-relaxed line-clamp-2">{agent.description}</p>
                {agent.totalReviews > 0 && (
                  <p className="mb-2 text-xs text-ink/50">
                    <span className="text-amber-500">★</span> {agent.avgRating.toFixed(1)} ({agent.totalReviews} reviews)
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`tag text-[10px] uppercase tracking-wide ${
                        agent.published ? "bg-mint/20 text-teal" : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {agent.published ? "Published" : "Draft"}
                    </span>
                    {agent.listingStatus === "flagged" && (
                      <span className="tag text-[10px] uppercase tracking-wide bg-flare/10 text-flare">
                        Flagged
                      </span>
                    )}
                    {agent.listingStatus === "suspended" && (
                      <span className="tag text-[10px] uppercase tracking-wide bg-flare/20 text-flare">
                        Suspended
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold transition hover:bg-ink/5"
                  >
                    Open
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
