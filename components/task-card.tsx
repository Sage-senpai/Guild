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
    <article className="card-surface flex flex-col p-5">
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-lg"
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="flex flex-wrap gap-1">
            <span className="tag bg-ink/6 capitalize text-ink">{task.category}</span>
            <span className="tag border border-ink/15 text-ink/60">
              {task.taskType === "instant" ? "Instant" : "Apply"}
            </span>
          </div>
        </div>
        <span className={`tag text-[10px] font-semibold uppercase tracking-wide ${statusBadge(task.status)}`}>
          {task.status}
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-1.5 text-base font-bold leading-snug text-ink">{task.title}</h3>

      {/* Description */}
      <p className="muted mb-4 line-clamp-3 flex-1 text-sm leading-relaxed">{task.description}</p>

      {/* Meta row */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/8 pt-3 text-xs">
        <span className={`font-medium ${isExpired ? "font-semibold text-flare" : "muted"}`}>
          ⏰ {remaining}
        </span>
        <span className="font-bold text-teal">{task.reward.toFixed(2)} credits</span>
        <span className="muted ml-auto">PoP required</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {task.status === "open" && (
          <Link
            href={`/humans/${task.id}`}
            className="flex-1 rounded-xl bg-ink px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-teal"
          >
            {task.taskType === "instant" ? "Claim Task" : "Apply Now"}
          </Link>
        )}
        <Link
          href={`/humans/${task.id}`}
          className="rounded-xl border border-ink/20 px-4 py-2 text-sm font-semibold transition hover:bg-ink/5"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
