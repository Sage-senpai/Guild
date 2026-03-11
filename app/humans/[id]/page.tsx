"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CancelButton, ReviewActions, TaskActionsClient } from "@/components/task-actions-client";
import { apiFetch } from "@/lib/api-fetch";
import type { TaskRecord } from "@/lib/types";

const CATEGORY_ICONS: Record<string, string> = {
  testnet: "🔗",
  discord: "💬",
  defi: "📈",
  nft: "🎨",
  social: "📣",
  review: "🔍",
  data: "📋",
  other: "📌",
};

function timeRemaining(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `${Math.ceil(ms / 60_000)}m remaining`;
  if (hours < 24) return `${hours}h remaining`;
  return `${Math.floor(hours / 24)}d remaining`;
}

function StatusBadge({ status }: { status: TaskRecord["status"] }) {
  const styles: Record<string, string> = {
    open: "bg-mint/25 text-ink",
    assigned: "bg-ember/25 text-ink",
    submitted: "bg-ink/10 text-ink",
    approved: "bg-mint/40 text-ink",
    disputed: "bg-flare/20 text-flare",
    cancelled: "bg-ink/10 text-ink",
    expired: "bg-ink/10 text-ink",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[status] ?? "bg-ink/10 text-ink"}`}
    >
      {status}
    </span>
  );
}

type TaskPageData = {
  task: TaskRecord;
  userId: number;
  verified: boolean;
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = Number(params?.id);

  const [data, setData] = useState<TaskPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`);
      if (!res.ok) {
        setError("Task not found. It may still be loading — try refreshing.");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as TaskPageData;
      setData(json);
      setLoading(false);
    } catch {
      setError("Failed to load task. Please try again.");
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (Number.isInteger(taskId) && taskId > 0) {
      load();
    } else {
      setError("Invalid task ID.");
      setLoading(false);
    }
  }, [taskId, load]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
          <p className="muted text-sm font-semibold">Loading task…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-md text-center">
          <p className="mb-4 text-lg font-bold">Could not load task</p>
          <p className="muted mb-6 text-sm">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setLoading(true); setError(null); load(); }}
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Retry
            </button>
            <Link
              href="/humans"
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Back to Tasks
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { task, userId, verified } = data;
  const isWorker = task.assigneeId === userId;
  const isPoster = task.posterId === userId;
  const icon = CATEGORY_ICONS[task.category] ?? "📌";
  const remaining = timeRemaining(task.deadline);

  return (
    <main className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link href="/humans" className="muted text-sm font-semibold hover:text-ink">
          ← Back to Tasks
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header card */}
        <div className="glass rounded-3xl px-6 py-7 shadow-panel sm:px-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold capitalize">
              {task.category}
            </span>
            <span className="rounded-full border border-ink/15 px-2 py-0.5 text-xs font-medium">
              {task.taskType === "instant" ? "Instant claim" : "Apply mode"}
            </span>
            <StatusBadge status={task.status} />
          </div>

          <h1 className="mb-3 text-2xl font-black leading-snug sm:text-3xl">{task.title}</h1>

          <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="font-bold">
              {task.reward.toFixed(2)} ✦ credits reward
            </span>
            <span className={`font-semibold ${remaining === "Expired" ? "text-flare" : "muted"}`}>
              ⏰ {remaining}
            </span>
            {verified && (
              <span className="rounded-full bg-mint/25 px-2 py-0.5 text-xs font-semibold text-ink">
                ✓ Verified Human
              </span>
            )}
          </div>

          <div className="muted rounded-2xl bg-ink/[0.03] p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {task.description}
          </div>

          {task.proofUrl && (
            <div className="mt-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                Submitted proof
              </span>
              <a
                href={task.proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate text-sm font-semibold text-ink underline"
              >
                {task.proofUrl}
              </a>
            </div>
          )}
        </div>

        {/* Worker actions (claim / apply / submit proof) */}
        {!isPoster && (
          <TaskActionsClient task={task} verified={verified} isWorker={isWorker} />
        )}

        {/* Poster: review submitted proof */}
        {isPoster && task.status === "submitted" && (
          <ReviewActions taskId={task.id} />
        )}

        {/* Poster: cancel (open or assigned only) */}
        {isPoster && (task.status === "open" || task.status === "assigned") && (
          <details className="rounded-2xl border border-ink/10 p-4">
            <summary className="cursor-pointer text-xs font-semibold text-ink/50 hover:text-ink">
              Cancel this task
            </summary>
            <div className="mt-3">
              <p className="muted mb-3 text-sm">
                Cancelling refunds the full reward + fee back to your balance.
              </p>
              <CancelButton taskId={task.id} />
            </div>
          </details>
        )}
      </div>
    </main>
  );
}
