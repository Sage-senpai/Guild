"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-fetch";
import type { TaskReviewRecord, UserBadgeRecord } from "@/lib/types";

type WorkerProfile = {
  user: { id: number; walletAddress: string; integrityScore: number };
  stats: {
    tasksCompleted: number;
    tasksPosted: number;
    avgWorkerRating: number;
    avgPosterRating: number;
    totalEarnings: number;
    categoryBreakdown: Record<string, number>;
  };
  reviews: TaskReviewRecord[];
  badges: UserBadgeRecord[];
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="font-[var(--font-mono)] text-sm">
      {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      <span className="ml-1 text-xs text-ink/50">{rating.toFixed(1)}</span>
    </span>
  );
}

function IntegrityBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-mint" : score >= 50 ? "bg-amber-400" : "bg-flare";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-ink/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="font-[var(--font-mono)] text-xs">{score}/100</span>
    </div>
  );
}

export default function WorkerProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params?.id);

  const [data, setData] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Invalid user ID.");
      setLoading(false);
      return;
    }

    apiFetch(`/api/users/${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          setError("User not found.");
          setLoading(false);
          return;
        }
        setData((await res.json()) as WorkerProfile);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile.");
        setLoading(false);
      });
  }, [userId]);

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
          <p className="mb-4 text-lg font-bold">Profile not found</p>
          <p className="muted mb-6 text-sm">{error}</p>
          <Link href="/humans" className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">
            Back to Tasks
          </Link>
        </div>
      </main>
    );
  }

  const { user, stats, reviews, badges } = data;
  const shortWallet = `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`;

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <section className="glass rounded-3xl p-6 shadow-panel sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-flare">
              Worker Profile
            </p>
            <h1 className="text-2xl font-black">{shortWallet}</h1>
          </div>
          <IntegrityBar score={user.integrityScore} />
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={`${b.badgeType}-${b.category}`}
                className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold capitalize"
              >
                {b.badgeType.replace(/_/g, " ")}
                {b.category ? ` (${b.category})` : ""}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Stats grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-2xl p-4 text-center shadow-panel">
          <p className="text-2xl font-black">{stats.tasksCompleted}</p>
          <p className="muted text-xs font-semibold">Tasks Completed</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center shadow-panel">
          <p className="text-2xl font-black">{stats.totalEarnings.toFixed(2)}</p>
          <p className="muted text-xs font-semibold">Credits Earned</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center shadow-panel">
          {stats.avgWorkerRating > 0 ? (
            <StarRating rating={stats.avgWorkerRating} />
          ) : (
            <p className="text-2xl font-black">—</p>
          )}
          <p className="muted text-xs font-semibold">Worker Rating</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center shadow-panel">
          <p className="text-2xl font-black">{stats.tasksPosted}</p>
          <p className="muted text-xs font-semibold">Tasks Posted</p>
        </div>
      </section>

      {/* Category expertise */}
      {Object.keys(stats.categoryBreakdown).length > 0 && (
        <section className="glass rounded-3xl p-6 shadow-panel">
          <h2 className="mb-3 text-lg font-bold">Category Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <span key={cat} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold capitalize">
                  {cat} — {count} done
                </span>
              ))}
          </div>
        </section>
      )}

      {/* Reviews received */}
      <section className="glass rounded-3xl p-6 shadow-panel">
        <h2 className="mb-3 text-lg font-bold">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="muted text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-ink/10 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <StarRating rating={r.rating} />
                  <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold uppercase">
                    by {r.role}
                  </span>
                </div>
                {r.comment && <p className="muted mt-1.5">{r.comment}</p>}
                <p className="muted mt-1 text-xs">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="pb-4">
        <Link href="/humans" className="muted text-sm font-semibold hover:text-ink">
          ← Back to Tasks
        </Link>
      </div>
    </main>
  );
}
