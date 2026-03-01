import Link from "next/link";

import { TaskCard } from "@/components/task-card";
import { listTasks } from "@/lib/task-service";
import { TASK_CATEGORIES } from "@/lib/types";
import { expireOverdueTasks } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export default async function HumansPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; task_type?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "";
  const taskType = params.task_type ?? "";

  // Expire overdue tasks on page load (lightweight sweep)
  try {
    await expireOverdueTasks();
  } catch {
    // Non-fatal
  }

  const tasks = await listTasks({
    category: category || undefined,
    taskType: taskType || undefined,
    status: "open",
  });

  return (
    <main>
      <div className="space-y-8">
        {/* Hero */}
        <div className="glass rounded-3xl px-6 py-8 shadow-panel sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-flare">
                Human Task Marketplace
              </p>
              <h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                Get paid for crypto tasks.
              </h1>
              <p className="muted mt-3 max-w-2xl">
                Same-day micro-tasks for the crypto-native. Claim a task, do the work, earn credits
                instantly. Proof of Personhood required — Sybil-resistant by design.
              </p>
            </div>
            <div className="flex gap-2 lg:justify-end">
              <Link
                href="/humans/post"
                className="rounded-2xl bg-ink px-6 py-3 text-center text-sm font-bold text-white transition hover:-translate-y-0.5"
              >
                Post a Task
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4">
          <form className="flex flex-wrap gap-2">
            {/* Category pills */}
            <Link
              href="/humans"
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-ink/10 ${
                !category ? "bg-ink text-white" : "border border-ink/20"
              }`}
            >
              All
            </Link>
            {TASK_CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/humans?category=${cat}${taskType ? `&task_type=${taskType}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition hover:bg-ink/10 ${
                  category === cat ? "bg-ink text-white" : "border border-ink/20"
                }`}
              >
                {cat}
              </Link>
            ))}

            {/* Task type filter */}
            <div className="ml-auto flex gap-2">
              <Link
                href={`/humans${category ? `?category=${category}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-ink/10 ${
                  !taskType ? "bg-ink/10 font-bold" : "border border-ink/20"
                }`}
              >
                All types
              </Link>
              <Link
                href={`/humans?task_type=instant${category ? `&category=${category}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-ink/10 ${
                  taskType === "instant" ? "bg-ink text-white" : "border border-ink/20"
                }`}
              >
                Instant claim
              </Link>
              <Link
                href={`/humans?task_type=apply${category ? `&category=${category}` : ""}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition hover:bg-ink/10 ${
                  taskType === "apply" ? "bg-ink text-white" : "border border-ink/20"
                }`}
              >
                Apply mode
              </Link>
            </div>
          </form>
        </div>

        {/* Task grid */}
        <div>
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-ink/15 p-10 text-center">
              <p className="mb-3 text-lg font-bold">No open tasks right now</p>
              <p className="muted mb-5 text-sm">Be the first to post a task and get help today.</p>
              <Link
                href="/humans/post"
                className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold hover:bg-ink/5"
              >
                Post a Task
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
