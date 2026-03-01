import Link from "next/link";

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

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    open: "bg-mint/25 text-ink",
    assigned: "bg-ember/25 text-ink",
    submitted: "bg-ink/10 text-ink",
    approved: "bg-mint/40 text-ink",
    disputed: "bg-flare/20 text-flare",
    cancelled: "bg-ink/10 text-ink",
    expired: "bg-ink/10 text-ink",
  };
  return styles[status] ?? "bg-ink/10 text-ink";
}

export function TaskCard({ task }: { task: TaskRecord }) {
  const icon = CATEGORY_ICONS[task.category] ?? "📌";
  const remaining = timeRemaining(task.deadline);
  const isExpired = remaining === "Expired";

  return (
    <article className="glass animate-rise rounded-2xl p-5 shadow-panel">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold capitalize">
              {task.category}
            </span>
            <span className="ml-1.5 rounded-full border border-ink/15 px-2 py-0.5 text-xs font-medium">
              {task.taskType === "instant" ? "Instant claim" : "Apply mode"}
            </span>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBadge(task.status)}`}
        >
          {task.status}
        </span>
      </div>

      <h3 className="mb-1.5 text-lg font-bold leading-snug">{task.title}</h3>

      <p className="muted mb-3 line-clamp-3 text-sm">{task.description}</p>

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className={`font-semibold ${isExpired ? "text-flare" : "muted"}`}>
          ⏰ {remaining}
        </span>
        <span className="font-bold text-ink">
          {task.reward.toFixed(2)} ✦ credits
        </span>
        <span className="muted">Verified Human only</span>
      </div>

      <div className="flex items-center gap-2">
        {task.status === "open" && (
          <Link
            href={`/humans/${task.id}`}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            {task.taskType === "instant" ? "Claim Task →" : "Apply →"}
          </Link>
        )}
        <Link
          href={`/humans/${task.id}`}
          className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold transition hover:bg-ink/5"
        >
          View Details
        </Link>
      </div>
    </article>
  );
}
