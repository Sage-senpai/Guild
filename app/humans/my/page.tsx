"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-fetch";
import { WalletGate } from "@/components/wallet-gate";
import type { TaskRecord } from "@/lib/types";

type MyTasksData = {
  posted: TaskRecord[];
  working: TaskRecord[];
  userId: number;
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-mint/25 text-ink",
  assigned: "bg-amber-100 text-amber-900",
  submitted: "bg-blue-100 text-blue-900",
  approved: "bg-mint/40 text-ink",
  disputed: "bg-flare/20 text-flare",
  cancelled: "bg-ink/10 text-ink",
  expired: "bg-ink/10 text-ink",
};

function TaskRow({ task, role }: { task: TaskRecord; role: "poster" | "worker" }) {
  return (
    <Link
      href={`/humans/${task.id}`}
      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 px-4 py-3 text-sm transition hover:bg-ink/[0.02]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{task.title}</p>
        <p className="muted mt-0.5 text-xs capitalize">{task.category} · {task.reward.toFixed(2)} credits</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_STYLES[task.status] ?? "bg-ink/10 text-ink"}`}>
          {task.status}
        </span>
        {role === "poster" && task.status === "open" && (
          <span className="text-xs text-ink/40">awaiting workers</span>
        )}
        {role === "poster" && task.status === "submitted" && (
          <span className="text-xs font-semibold text-blue-600">needs review</span>
        )}
        {role === "worker" && task.status === "assigned" && (
          <span className="text-xs font-semibold text-amber-600">submit proof</span>
        )}
      </div>
    </Link>
  );
}

function MyTasksDashboard() {
  const [data, setData] = useState<MyTasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posted" | "working">("posted");

  useEffect(() => {
    apiFetch("/api/tasks/my")
      .then(async (res) => {
        if (res.ok) setData((await res.json()) as MyTasksData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
      </main>
    );
  }

  const posted = data?.posted ?? [];
  const working = data?.working ?? [];
  const tasks = tab === "posted" ? posted : working;

  // Counts for attention badges
  const needsReview = posted.filter((t) => t.status === "submitted").length;
  const needsProof = working.filter((t) => t.status === "assigned").length;

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <section className="glass rounded-3xl p-6 shadow-panel sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-flare">
              Task Manager
            </p>
            <h1 className="text-2xl font-black">My Tasks</h1>
          </div>
          <Link
            href="/humans/post"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Post Task
          </Link>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("posted")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "posted" ? "bg-ink text-white" : "border border-ink/20 hover:bg-ink/5"
          }`}
        >
          Posted ({posted.length})
          {needsReview > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-flare text-[10px] text-white">
              {needsReview}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("working")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "working" ? "bg-ink text-white" : "border border-ink/20 hover:bg-ink/5"
          }`}
        >
          Working ({working.length})
          {needsProof > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white">
              {needsProof}
            </span>
          )}
        </button>
      </div>

      {/* Task list */}
      <section className="space-y-2">
        {tasks.length === 0 ? (
          <div className="panel py-12 text-center">
            <p className="mb-2 text-lg font-bold">
              {tab === "posted" ? "No tasks posted yet" : "No tasks claimed yet"}
            </p>
            <p className="muted mb-4 text-sm">
              {tab === "posted"
                ? "Post a task and let workers help you out."
                : "Browse open tasks and start earning credits."}
            </p>
            <Link
              href={tab === "posted" ? "/humans/post" : "/humans"}
              className="inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white"
            >
              {tab === "posted" ? "Post a Task" : "Browse Tasks"}
            </Link>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskRow key={task.id} task={task} role={tab === "posted" ? "poster" : "worker"} />
          ))
        )}
      </section>

      <div>
        <Link href="/humans" className="muted text-sm font-semibold hover:text-ink">
          ← Back to Marketplace
        </Link>
      </div>
    </main>
  );
}

export default function MyTasksPage() {
  return (
    <WalletGate connectMessage="Connect your wallet to manage your tasks.">
      <MyTasksDashboard />
    </WalletGate>
  );
}
