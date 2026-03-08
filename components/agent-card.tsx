import Link from "next/link";

import { cardBackgroundImage } from "@/lib/agent-card-visual";
import { formatUsd } from "@/lib/format";
import type { AgentRecord } from "@/lib/types";

function StarRating({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null;
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25;
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-px text-xs" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < full ? "text-amber-500" : i === full && hasHalf ? "text-amber-400" : "text-ink/15"}>
            ★
          </span>
        ))}
      </div>
      <span className="font-mono text-[10px] text-ink/40">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}

function AgentBadges({ agent }: { agent: AgentRecord }) {
  const badges: Array<{ label: string; color: string }> = [];

  if (agent.totalReviews >= 25 && agent.avgRating >= 4.5) {
    badges.push({ label: "Top Rated", color: "bg-amber-100 text-amber-800 border-amber-300" });
  } else if (agent.totalReviews >= 10 && agent.avgRating >= 4.0) {
    badges.push({ label: "Rising Star", color: "bg-purple-50 text-purple-700 border-purple-200" });
  }

  if (agent.listingStatus === "flagged") {
    badges.push({ label: "Under Review", color: "bg-flare/10 text-flare border-flare/20" });
  }

  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span key={b.label} className={`rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${b.color}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function AgentCard({ agent }: { agent: AgentRecord }) {
  const isTopRated = agent.totalReviews >= 10 && agent.avgRating >= 4.5;

  return (
    <article className={`card-surface group flex flex-col p-5 ${isTopRated ? "ring-2 ring-amber-400/30" : ""}`}>
      {/* Header row */}
      <div className="mb-4 flex items-start gap-3">
        {/* Avatar */}
        <div
          className="h-11 w-11 shrink-0 rounded-xl border border-stone/30 bg-cover bg-center"
          style={{ backgroundImage: cardBackgroundImage(agent.cardImageDataUrl, agent.cardGradient) }}
        />
        {/* Meta */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="tag">{agent.category}</span>
            {agent.published ? (
              <span className="tag" style={{ color: "#2B7574", borderColor: "rgba(43,117,116,0.3)", background: "rgba(43,117,116,0.08)" }}>
                Live
              </span>
            ) : (
              <span className="tag" style={{ color: "#861211", borderColor: "rgba(134,18,17,0.25)", background: "rgba(134,18,17,0.07)" }}>
                Draft
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-ink/50">{formatUsd(agent.pricePerRun)} / run</p>
        </div>
      </div>

      {/* Badges & Rating */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <AgentBadges agent={agent} />
        <StarRating rating={agent.avgRating} count={agent.totalReviews} />
      </div>

      {/* Content */}
      <h3 className="mb-1.5 text-lg font-bold leading-snug text-ink">{agent.name}</h3>
      <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/55">
        {agent.description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Link
          href={`/agents/${agent.id}/chat`}
          className="flex-1 rounded-xl bg-ink py-2 text-center text-sm font-semibold text-white transition hover:bg-teal"
        >
          Run Agent
        </Link>
        <Link
          href={`/agents/${agent.id}`}
          className="rounded-xl border border-stone px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-ink/30 hover:text-ink"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
