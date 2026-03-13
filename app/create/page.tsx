"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api-fetch";
import { cardBackgroundImage } from "@/lib/agent-card-visual";
import { WalletGate } from "@/components/wallet-gate";
import { AGENT_CARD_GRADIENTS, AGENT_CATEGORIES, AGENT_MODEL_BADGES, AGENT_MODELS } from "@/lib/types";

type CreatedAgent = {
  id: number;
  name: string;
  description: string;
  category: string;
  model: string;
  pricePerRun: number;
  cardGradient: (typeof AGENT_CARD_GRADIENTS)[number];
  cardImageDataUrl: string | null;
  published: boolean;
  manifestUri: string | null;
  storageHash: string | null;
};

type CreateResponse = {
  agent?: CreatedAgent;
  published?: boolean;
  storageMode?: string;
  agentId?: number;
  error?: string;
};

export default function CreateAgentPage() {
  return (
    <WalletGate connectMessage="Connect your wallet to create and publish AI agents.">
      <CreateAgentForm />
    </WalletGate>
  );
}

function CreateAgentForm() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);
  const [cardGradient, setCardGradient] = useState<(typeof AGENT_CARD_GRADIENTS)[number]>("aurora");
  const [cardImagePreviewUrl, setCardImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (cardImagePreviewUrl) {
        URL.revokeObjectURL(cardImagePreviewUrl);
      }
    };
  }, [cardImagePreviewUrl]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setStatus("");

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const response = await apiFetch("/api/agents", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as CreateResponse;

    if (!response.ok) {
      setError(data.error ?? "Failed to create agent");
      setSubmitting(false);
      return;
    }

    const created = data.agent;
    if (created) {
      setCreatedAgent(created);
      setStatus(
        data.published
          ? "Agent created and published to decentralized storage."
          : "Agent created as draft.",
      );
      if (cardImagePreviewUrl) {
        URL.revokeObjectURL(cardImagePreviewUrl);
      }
      setCardImagePreviewUrl(null);
      setCardGradient("aurora");
      formElement.reset();
    } else {
      setError("Invalid response from server");
    }

    setSubmitting(false);
  }

  if (createdAgent) {
    return (
      <main className="mx-auto max-w-3xl space-y-6">
        <section className="glass rounded-3xl p-6 shadow-panel sm:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-mint">
            Success
          </p>
          <h1 className="text-3xl font-black">Agent Created</h1>
          <p className="muted mt-2">{status}</p>
        </section>

        <section className="glass rounded-3xl p-6 shadow-panel sm:p-8">
          <div className="flex items-start gap-4">
            <div
              className="h-14 w-14 shrink-0 rounded-full border border-ink/15 bg-cover bg-center"
              style={{
                backgroundImage: cardBackgroundImage(
                  createdAgent.cardImageDataUrl,
                  createdAgent.cardGradient,
                ),
              }}
            />
            <div className="min-w-0">
              <p className="mb-1 inline-block rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold">
                {createdAgent.category}
              </p>
              <h2 className="text-2xl font-bold">{createdAgent.name}</h2>
              <p className="muted mt-1">{createdAgent.description}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-2 rounded-xl border border-ink/15 p-4 text-sm sm:grid-cols-2">
            <p>
              <span className="font-semibold">Model:</span> {createdAgent.model}
            </p>
            <p>
              <span className="font-semibold">Price:</span> {createdAgent.pricePerRun} credits/run
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {createdAgent.published ? "Published" : "Draft"}
            </p>
            <p className="truncate">
              <span className="font-semibold">Storage:</span>{" "}
              {createdAgent.manifestUri ?? "Not published"}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/agents/${createdAgent.id}/chat`}
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              Open Chat
            </Link>
            <Link
              href={`/agents/${createdAgent.id}`}
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              View Details
            </Link>
            <button
              onClick={() => setCreatedAgent(null)}
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Create Another
            </button>
            <Link
              href="/"
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Back to Marketplace
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <section className="glass rounded-3xl p-6 shadow-panel sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-flare">
          Creator Studio
        </p>
        <h1 className="text-3xl font-black">Create New Agent</h1>
        <p className="muted mt-2">
          Define the agent behavior, attach optional knowledge, then publish to decentralized storage.
        </p>
      </section>

      <section className="glass rounded-3xl p-6 shadow-panel sm:p-8">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={3}
              maxLength={80}
              className="w-full rounded-xl border border-ink/20 px-3 py-2 outline-none ring-flare transition focus:ring-2"
              placeholder="Gen-Z Copywriter"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              maxLength={400}
              rows={3}
              className="w-full rounded-xl border border-ink/20 px-3 py-2 outline-none ring-flare transition focus:ring-2"
              placeholder="Writes viral captions, hooks, and CTA copy."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="w-full rounded-xl border border-ink/20 px-3 py-2 outline-none ring-flare transition focus:ring-2"
                defaultValue="Marketing"
              >
                {AGENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="price_per_run">
                Price Per Run (credits)
              </label>
              <input
                id="price_per_run"
                name="price_per_run"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0.01"
                className="w-full rounded-xl border border-ink/20 px-3 py-2 outline-none ring-flare transition focus:ring-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="card_gradient">
                Card Gradient (default)
              </label>
              <select
                id="card_gradient"
                name="card_gradient"
                onChange={(event) =>
                  setCardGradient(event.currentTarget.value as (typeof AGENT_CARD_GRADIENTS)[number])
                }
                className="w-full rounded-xl border border-ink/20 px-3 py-2 outline-none ring-flare transition focus:ring-2"
                defaultValue="aurora"
              >
                {AGENT_CARD_GRADIENTS.map((gradient) => (
                  <option key={gradient} value={gradient}>
                    {gradient.charAt(0).toUpperCase() + gradient.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="model">
                Model
              </label>
              <select
                id="model"
                name="model"
                className="w-full rounded-xl border border-ink/20 px-3 py-2 outline-none ring-flare transition focus:ring-2"
                defaultValue="openrouter/free"
              >
                {AGENT_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model} - {AGENT_MODEL_BADGES[model]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="system_prompt">
              System Prompt
            </label>
            <textarea
              id="system_prompt"
              name="system_prompt"
              required
              minLength={10}
              maxLength={5000}
              rows={7}
              className="w-full rounded-xl border border-ink/20 px-3 py-2 outline-none ring-flare transition focus:ring-2"
              placeholder="You are a Gen-Z copywriter..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="card_image">
              Agent Profile Image (optional)
            </label>
            <input
              id="card_image"
              name="card_image"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (cardImagePreviewUrl) {
                  URL.revokeObjectURL(cardImagePreviewUrl);
                }
                if (!file) {
                  setCardImagePreviewUrl(null);
                  return;
                }
                setCardImagePreviewUrl(URL.createObjectURL(file));
              }}
              className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
            />
            <p className="muted text-xs">
              Uploading an image sets the agent profile picture. Otherwise, selected gradient is used.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Card Preview</label>
            <div className="flex items-center gap-3 rounded-2xl border-2 border-ink/25 bg-white px-3 py-3">
              <div
                className="h-12 w-12 rounded-full border border-ink/15 bg-cover bg-center"
                style={{
                  backgroundImage: cardBackgroundImage(cardImagePreviewUrl, cardGradient),
                }}
              />
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
                {cardImagePreviewUrl ? "Image profile preview" : `${cardGradient} gradient preview`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="knowledge_file">
              Knowledge File (optional)
            </label>
            <input
              id="knowledge_file"
              name="knowledge_file"
              type="file"
              className="w-full rounded-xl border border-ink/20 px-3 py-2 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-ink/20 bg-white/60 px-3 py-2 text-sm">
            <input type="checkbox" name="publish_now" value="true" defaultChecked />
            Publish immediately to marketplace
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Create Agent"}
          </button>
        </form>

        {status ? <p className="mt-4 text-sm font-semibold text-mint">{status}</p> : null}
        {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>
    </main>
  );
}
