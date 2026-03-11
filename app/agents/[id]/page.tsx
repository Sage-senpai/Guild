"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { cardBackgroundImage } from "@/lib/agent-card-visual";
import { PublishAgentButton } from "@/components/publish-agent-button";
import { Separator } from "@/components/ui/separator";
import { VerifyStorageButton } from "@/components/verify-storage-button";
import { apiFetch } from "@/lib/api-fetch";
import { formatDate, formatUsd } from "@/lib/format";
import type { AgentRecord, RunRecord } from "@/lib/types";

export default function AgentDetailPage() {
  const params = useParams<{ id: string }>();
  const agentId = Number(params?.id);

  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await apiFetch(`/api/agents/${agentId}`);
        if (cancelled) return;

        if (!res.ok) {
          setError("Agent not found. It may still be loading — try refreshing.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as { agent?: AgentRecord; runs?: RunRecord[] };
        if (cancelled) return;

        setAgent(data.agent ?? null);
        setRuns(data.runs ?? []);
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
          <p className="muted text-sm font-semibold">Loading agent…</p>
        </div>
      </main>
    );
  }

  if (error || !agent) {
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
            <Link
              href="/"
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="space-y-6">
        <div>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-start gap-4">
              <div
                className="h-12 w-12 shrink-0 rounded-full border border-ink/15 bg-cover bg-center"
                style={{
                  backgroundImage: cardBackgroundImage(agent.cardImageDataUrl, agent.cardGradient),
                }}
              />
              <div>
                <p className="mb-2 inline-block rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold">
                  {agent.category}
                </p>
                <h1 className="text-3xl font-black">{agent.name}</h1>
                <p className="muted mt-2 max-w-3xl">{agent.description}</p>
              </div>
            </div>
            <p className="font-[var(--font-mono)] text-sm">{formatUsd(agent.pricePerRun)} / run</p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-ink/15 p-4 text-sm sm:grid-cols-2">
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {agent.published ? "Published" : "Draft"}
            </p>
            <p>
              <span className="font-semibold">Created:</span> {formatDate(agent.createdAt)}
            </p>
            <p className="truncate">
              <span className="font-semibold">Model:</span> {agent.model}
            </p>
            <p className="truncate">
              <span className="font-semibold">Manifest URI:</span> {agent.manifestUri ?? "Not published"}
            </p>
            <p className="truncate">
              <span className="font-semibold">Storage Hash:</span>{" "}
              {agent.storageHash ?? "Not published"}
            </p>
            <p className="truncate">
              <span className="font-semibold">Manifest Tx Hash:</span>{" "}
              {agent.manifestTxHash ?? "Not available"}
            </p>
            <p className="truncate">
              <span className="font-semibold">Knowledge URI:</span> {agent.knowledgeUri ?? "None"}
            </p>
            <p className="truncate">
              <span className="font-semibold">Knowledge Tx Hash:</span>{" "}
              {agent.knowledgeTxHash ?? "Not available"}
            </p>
            <p>
              <span className="font-semibold">Card Gradient:</span> {agent.cardGradient}
            </p>
            <p>
              <span className="font-semibold">Custom Card Image:</span>{" "}
              {agent.cardImageDataUrl ? "Uploaded" : "Not uploaded"}
            </p>
            <p>
              <span className="font-semibold">Knowledge file:</span>{" "}
              {agent.knowledgeFilename ?? "None attached"}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/agents/${agent.id}/chat`}
              className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Open Chat
            </Link>
            {agent.published ? <VerifyStorageButton agentId={agent.id} /> : null}
            {agent.published ? null : <PublishAgentButton agentId={agent.id} />}
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="mb-3 text-xl font-bold">System Prompt</h2>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl border border-ink/15 p-4 text-sm">
            {agent.systemPrompt}
          </pre>
        </div>

        <Separator />

        <div>
          <h2 className="mb-3 text-xl font-bold">Recent Runs</h2>
          {runs.length === 0 ? (
            <p className="muted text-sm">No runs yet.</p>
          ) : (
            <div className="space-y-3">
              {runs.slice(0, 8).map((run) => (
                <article key={run.id} className="rounded-2xl border border-ink/15 p-3 text-sm">
                  <p className="mb-1 font-semibold">{formatDate(run.createdAt)}</p>
                  <p className="mb-1">
                    <span className="font-semibold">Input:</span> {run.input}
                  </p>
                  <p className="mb-1">
                    <span className="font-semibold">Output:</span> {run.output}
                  </p>
                  <p className="font-[var(--font-mono)] text-xs uppercase">
                    Cost {formatUsd(run.cost)} | Mode {run.computeMode}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
