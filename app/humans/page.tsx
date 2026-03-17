import Link from "next/link";

import { TaskCard } from "@/components/task-card";
import { listTasks, expireOverdueTasks } from "@/lib/task-service";
import { getUserById } from "@/lib/agent-service";
import { TASK_CATEGORIES } from "@/lib/types";

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
    status: "all",
  });

  // Batch-fetch poster integrity scores
  const posterIds = [...new Set(tasks.map((t) => t.posterId))];
  const posterMap = new Map<number, number>();
  await Promise.all(
    posterIds.map(async (pid) => {
      const user = await getUserById(pid);
      if (user) posterMap.set(pid, user.integrityScore);
    }),
  );

  return (
    <main className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-teal to-ink px-6 py-10 sm:px-10">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_20%,rgba(134,18,17,0.25),transparent)]"
        />
        <div className="relative grid gap-6 lg:grid-cols-[2fr_auto] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-mint" />
              Human Task Marketplace
            </p>
            <h1 className="font-display max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">
              Earn credits for crypto&nbsp;work.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
              Same-day micro-tasks for the crypto-native. Claim a task, deliver the work, earn
              credits. Proof of Personhood required — Sybil-resistant by design.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Link
              href="/humans/post"
              className="rounded-2xl bg-white px-6 py-3 text-center text-sm font-bold text-ink shadow-lg transition hover:bg-chalk hover:-translate-y-0.5"
            >
              Post a Task
            </Link>
            <Link
              href="/humans/my"
              className="rounded-2xl border border-white/30 px-6 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              My Tasks
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="panel px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {/* Category pills */}
          <Link
            href="/humans"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !category ? "bg-ink text-white" : "border border-ink/20 hover:bg-ink/8"
            }`}
          >
            All categories
          </Link>
          {TASK_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/humans?category=${cat}${taskType ? `&task_type=${taskType}` : ""}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                category === cat ? "bg-ink text-white" : "border border-ink/20 hover:bg-ink/8"
              }`}
            >
              {cat}
            </Link>
          ))}

          {/* Separator */}
          <span className="mx-1 my-auto h-4 w-px bg-ink/15" />

          {/* Task type pills */}
          <Link
            href={`/humans${category ? `?category=${category}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !taskType ? "bg-teal text-white" : "border border-ink/20 hover:bg-ink/8"
            }`}
          >
            All types
          </Link>
          <Link
            href={`/humans?task_type=instant${category ? `&category=${category}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              taskType === "instant" ? "bg-teal text-white" : "border border-ink/20 hover:bg-ink/8"
            }`}
          >
            Instant claim
          </Link>
          <Link
            href={`/humans?task_type=apply${category ? `&category=${category}` : ""}`}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              taskType === "apply" ? "bg-teal text-white" : "border border-ink/20 hover:bg-ink/8"
            }`}
          >
            Apply mode
          </Link>
        </div>
      </div>

      {/* Task grid */}
      <div>
        {tasks.length === 0 ? (
          <div className="panel py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/5 text-2xl">
              📋
            </div>
            <p className="mb-2 text-lg font-bold text-ink">No open tasks right now</p>
            <p className="muted mb-6 text-sm">Be the first to post a task and get help today.</p>
            <Link
              href="/humans/post"
              className="inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal"
            >
              Post a Task
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} posterIntegrity={posterMap.get(task.posterId)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
