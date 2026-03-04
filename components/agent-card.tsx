import Link from "next/link";

import { cardBackgroundImage } from "@/lib/agent-card-visual";
import { formatUsd } from "@/lib/format";
import type { AgentRecord } from "@/lib/types";

export function AgentCard({ agent }: { agent: AgentRecord }) {
  return (
    <article className="card-surface group flex flex-col p-5">
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
