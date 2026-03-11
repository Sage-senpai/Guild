"use client";

import Link from "next/link";
import { useState } from "react";

import { apiFetch } from "@/lib/api-fetch";
import { TASK_CATEGORIES } from "@/lib/types";

const DEADLINE_OPTIONS = [
  { label: "1 hour", value: 1 },
  { label: "6 hours", value: 6 },
  { label: "12 hours", value: 12 },
  { label: "24 hours", value: 24 },
  { label: "48 hours", value: 48 },
  { label: "7 days", value: 168 },
];

const PLATFORM_FEE_RATE = 0.05;

type CreatedTask = {
  id: number;
  title: string;
  category: string;
  taskType: string;
  reward: number;
};

export default function PostTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(TASK_CATEGORIES[0]);
  const [taskType, setTaskType] = useState<"instant" | "apply">("instant");
  const [reward, setReward] = useState(2);
  const [deadlineHours, setDeadlineHours] = useState(24);
  const [maxApplicants, setMaxApplicants] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTask, setCreatedTask] = useState<CreatedTask | null>(null);

  const fee = Math.round(reward * PLATFORM_FEE_RATE * 100) / 100;
  const total = Math.round((reward + fee) * 100) / 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = {
      title,
      description,
      category,
      taskType,
      reward,
      deadlineHours,
    };
    if (taskType === "apply" && maxApplicants) {
      body.maxApplicants = Number(maxApplicants);
    }

    try {
      const res = await apiFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { task?: CreatedTask; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to post task");
        return;
      }
      if (data.task) {
        setCreatedTask(data.task);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (createdTask) {
    return (
      <main className="mx-auto max-w-2xl space-y-6">
        <section className="glass rounded-3xl p-6 shadow-panel sm:p-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-mint">
            Success
          </p>
          <h1 className="text-3xl font-black">Task Posted</h1>
          <p className="muted mt-2">Your task is live and waiting for workers.</p>
        </section>

        <section className="glass rounded-3xl p-6 shadow-panel sm:p-8">
          <h2 className="text-2xl font-bold">{createdTask.title}</h2>
          <div className="mt-3 grid gap-2 rounded-xl border border-ink/15 p-4 text-sm sm:grid-cols-2">
            <p>
              <span className="font-semibold">Category:</span>{" "}
              {createdTask.category.charAt(0).toUpperCase() + createdTask.category.slice(1)}
            </p>
            <p>
              <span className="font-semibold">Type:</span>{" "}
              {createdTask.taskType === "instant" ? "Instant claim" : "Apply mode"}
            </p>
            <p>
              <span className="font-semibold">Reward:</span> {createdTask.reward.toFixed(2)} credits
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/humans/${createdTask.id}`}
              className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
            >
              View Task
            </Link>
            <button
              onClick={() => setCreatedTask(null)}
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Post Another
            </button>
            <Link
              href="/humans"
              className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold transition hover:bg-ink/5"
            >
              Back to Tasks
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl">
      <div className="glass rounded-3xl px-6 py-8 shadow-panel sm:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-flare">
          Human Task Marketplace
        </p>
        <h1 className="mb-6 text-2xl font-black">Post a Task</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-semibold">
              What do you need done?
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "Test the Acme bridge on Arbitrum testnet"'
              maxLength={120}
              required
              className="w-full rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none ring-flare focus:ring-2"
            />
            <p className="mt-0.5 text-right text-xs text-ink/40">{title.length}/120</p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Instructions (what exactly should they do?)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              required
              className="w-full rounded-xl border border-ink/20 bg-transparent p-3 text-sm outline-none ring-flare focus:ring-2"
            />
            <p className="mt-0.5 text-right text-xs text-ink/40">{description.length}/1000</p>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm outline-none ring-flare focus:ring-2"
            >
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Assignment type */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Assignment</label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="taskType"
                  value="instant"
                  checked={taskType === "instant"}
                  onChange={() => setTaskType("instant")}
                  className="accent-ink"
                />
                <span>
                  <strong>Instant claim</strong>
                  <span className="muted ml-1 text-xs">— first come, first served</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="taskType"
                  value="apply"
                  checked={taskType === "apply"}
                  onChange={() => setTaskType("apply")}
                  className="accent-ink"
                />
                <span>
                  <strong>Apply mode</strong>
                  <span className="muted ml-1 text-xs">— you select who does it</span>
                </span>
              </label>
            </div>
          </div>

          {/* Max applicants (apply mode only) */}
          {taskType === "apply" && (
            <div>
              <label className="mb-1 block text-sm font-semibold">
                Max applicants{" "}
                <span className="muted font-normal">(leave blank for unlimited)</span>
              </label>
              <input
                type="number"
                value={maxApplicants}
                onChange={(e) => setMaxApplicants(e.target.value)}
                min={1}
                max={50}
                placeholder="e.g. 10"
                className="w-36 rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none ring-flare focus:ring-2"
              />
            </div>
          )}

          {/* Reward */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Reward</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={reward}
                onChange={(e) => setReward(Number(e.target.value))}
                min={0.5}
                max={50}
                step={0.5}
                className="w-28 rounded-xl border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none ring-flare focus:ring-2"
              />
              <span className="text-sm font-semibold">credits</span>
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-ink/60">
              <div className="flex justify-between">
                <span>Platform fee (5%)</span>
                <span>{fee.toFixed(2)} ✦</span>
              </div>
              <div className="flex justify-between font-semibold text-ink">
                <span>Total deducted from your balance</span>
                <span>{total.toFixed(2)} ✦</span>
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-1 block text-sm font-semibold">Deadline</label>
            <select
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(Number(e.target.value))}
              className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-sm outline-none ring-flare focus:ring-2"
            >
              {DEADLINE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-xl bg-flare/10 px-3 py-2 text-sm font-semibold text-flare">
              {error === "INSUFFICIENT_CREDITS"
                ? "Insufficient credits. Add credits to your balance first."
                : error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-ink py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? "Posting…" : `Post Task — ${total.toFixed(2)} ✦`}
          </button>
        </form>
      </div>
    </main>
  );
}
