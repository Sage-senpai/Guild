"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { KiltVerifyButton } from "@/components/kilt-verify-button";
import type { TaskRecord } from "@/lib/types";

// ── Claim ─────────────────────────────────────────────────────────────────────

function ClaimButton({ taskId }: { taskId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/claim`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to claim task");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={claim}
        disabled={loading}
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? "Claiming…" : "Claim Task →"}
      </button>
      {error && (
        <p className="mt-2 text-xs font-semibold text-flare">{error}</p>
      )}
    </div>
  );
}

// ── Apply ─────────────────────────────────────────────────────────────────────

function ApplyForm({ taskId }: { taskId: number }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message || undefined }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to apply");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-xl bg-mint/20 px-3 py-2 text-sm font-semibold text-ink">
        ✓ Application submitted! The poster will review and select a worker.
      </p>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold">
        Message to poster{" "}
        <span className="muted font-normal">(optional)</span>
      </label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={500}
        placeholder="Tell the poster why you're the right person for this task…"
        className="mb-3 w-full rounded-xl border border-ink/20 bg-transparent p-3 text-sm outline-none ring-flare focus:ring-2"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit Application →"}
      </button>
      {error && (
        <p className="mt-2 text-xs font-semibold text-flare">{error}</p>
      )}
    </div>
  );
}

// ── Submit Proof ──────────────────────────────────────────────────────────────

export function SubmitProofForm({ taskId }: { taskId: number }) {
  const router = useRouter();
  const [proofUrl, setProofUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to submit proof");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-xl bg-mint/20 px-3 py-2 text-sm font-semibold text-ink">
        ✓ Proof submitted! Waiting for poster approval (auto-approved in 48h).
      </p>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-3 font-bold">Submit Proof</h3>
      <label className="mb-1 block text-sm font-semibold">Proof URL</label>
      <input
        value={proofUrl}
        onChange={(e) => setProofUrl(e.target.value)}
        placeholder="https://etherscan.io/tx/0x..."
        className="mb-3 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none ring-flare focus:ring-2"
      />
      <p className="muted mb-3 text-xs">
        Accepted: tx explorer links, Twitter/X, GitHub, Imgur, Google Drive
      </p>
      <button
        onClick={submit}
        disabled={loading || !proofUrl}
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit Proof →"}
      </button>
      {error && (
        <p className="mt-2 text-xs font-semibold text-flare">{error}</p>
      )}
    </div>
  );
}

// ── Approve / Dispute ─────────────────────────────────────────────────────────

export function ReviewActions({ taskId }: { taskId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "dispute" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "approve" | "dispute") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/${action}`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Action failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-3 font-bold">Review Submission</h3>
      <div className="flex gap-2">
        <button
          onClick={() => act("approve")}
          disabled={!!loading}
          className="rounded-full bg-mint/80 px-5 py-2 text-sm font-bold text-ink transition hover:-translate-y-0.5 disabled:opacity-50"
        >
          {loading === "approve" ? "Approving…" : "Approve & Pay Worker"}
        </button>
        <button
          onClick={() => act("dispute")}
          disabled={!!loading}
          className="rounded-full border border-flare/30 px-5 py-2 text-sm font-bold text-flare transition hover:bg-flare/5 disabled:opacity-50"
        >
          {loading === "dispute" ? "Disputing…" : "Dispute"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs font-semibold text-flare">{error}</p>
      )}
    </div>
  );
}

// ── Cancel ────────────────────────────────────────────────────────────────────

export function CancelButton({ taskId }: { taskId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/cancel`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to cancel");
        return;
      }
      router.push("/humans");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={cancel}
        disabled={loading}
        className="rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold transition hover:bg-ink/5 disabled:opacity-50"
      >
        {loading ? "Cancelling…" : "Confirm Cancel"}
      </button>
      {error && (
        <p className="mt-2 text-xs font-semibold text-flare">{error}</p>
      )}
    </div>
  );
}

// ── PoP gate wrapper ──────────────────────────────────────────────────────────

export function TaskActionsClient({
  task,
  verified,
  isWorker,
}: {
  task: TaskRecord;
  verified: boolean;
  isWorker: boolean;
}) {
  const router = useRouter();

  if (task.status === "assigned" && isWorker) {
    return <SubmitProofForm taskId={task.id} />;
  }

  if (task.status !== "open") return null;

  if (!verified) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="mb-1 font-bold">Proof of Personhood Required</h3>
        <p className="muted mb-4 text-sm">
          Guild requires a KILT credential to claim or apply for tasks. Verify once — valid forever.
        </p>
        <KiltVerifyButton onVerified={() => router.refresh()} />
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="mb-3 font-bold">
        {task.taskType === "instant" ? "Claim This Task" : "Apply for This Task"}
      </h3>
      {task.taskType === "instant" ? (
        <ClaimButton taskId={task.id} />
      ) : (
        <ApplyForm taskId={task.id} />
      )}
    </div>
  );
}
