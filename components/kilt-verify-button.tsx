"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/api-fetch";

type Props = {
  onVerified?: () => void;
};

export function KiltVerifyButton({ onVerified }: Props) {
  const [open, setOpen] = useState(false);
  const [credentialJson, setCredentialJson] = useState("");
  const [attestationId, setAttestationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/kilt/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialJson, attestationId }),
      });
      const data = (await res.json()) as { error?: string; verified?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Verification failed");
        return;
      }
      setDone(true);
      onVerified?.();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/25 px-3 py-1.5 text-sm font-semibold text-ink">
        ✓ Verified Human
      </span>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
        >
          Verify I&apos;m Human →
        </button>
      ) : (
        <div className="glass rounded-2xl p-5">
          <h3 className="mb-1 text-base font-bold">Verify You&apos;re Human</h3>
          <p className="muted mb-4 text-sm">
            Guild uses{" "}
            <a
              href="https://www.kilt.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              KILT Protocol
            </a>{" "}
            — no biometrics, no ID scan. Link Twitter, GitHub, or Discord once.
          </p>

          <label className="mb-1 block text-xs font-semibold">
            Credential JSON (from Sporran wallet)
          </label>
          <textarea
            value={credentialJson}
            onChange={(e) => setCredentialJson(e.target.value)}
            rows={4}
            placeholder='{"claim": {...}, "claimNonceMap": {...}, ...}'
            className="mb-3 w-full rounded-xl border border-ink/20 bg-transparent p-3 font-mono text-xs outline-none ring-flare focus:ring-2"
          />

          <label className="mb-1 block text-xs font-semibold">Attestation ID</label>
          <input
            value={attestationId}
            onChange={(e) => setAttestationId(e.target.value)}
            placeholder="0x..."
            className="mb-4 w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none ring-flare focus:ring-2"
          />

          {error && (
            <p className="mb-3 rounded-xl bg-flare/10 px-3 py-2 text-xs font-semibold text-flare">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={loading || !credentialJson || !attestationId}
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Submit Credential"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
