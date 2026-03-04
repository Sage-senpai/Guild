import Link from "next/link";

import {
  DEMO_USER_ID,
  getCreditStats,
  getUserById,
  listAgentsByCreator,
  listCreditLedgerForUser,
  listTopupOrdersForUser,
} from "@/lib/agent-service";
import { formatCredits, formatDate, formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [user, agents, creditStats, ledger, topups] = await Promise.all([
    getUserById(DEMO_USER_ID),
    listAgentsByCreator(DEMO_USER_ID),
    getCreditStats(DEMO_USER_ID),
    listCreditLedgerForUser(DEMO_USER_ID, 15),
    listTopupOrdersForUser(DEMO_USER_ID, 15),
  ]);

  if (!user) {
    return (
      <main>
        <div className="panel p-10 text-center">
          <p className="text-ink/60">User profile not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Identity card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-teal p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_90%_10%,rgba(134,18,17,0.2),transparent)]"
        />
        <div className="relative">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/50">
            Guild Member
          </p>
          <h1 className="font-display text-3xl font-bold text-white">Your Profile</h1>
          <p className="mt-2 font-mono text-xs text-white/50 break-all">{user.walletAddress}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Available", value: formatCredits(user.credits) },
              { label: "Used", value: formatCredits(creditStats.used) },
              { label: "Topped Up", value: formatCredits(creditStats.toppedUp) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3"
              >
                <p className="text-xs font-medium text-white/50">{label}</p>
                <p className="mt-0.5 text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Link
              href="/credits"
              className="inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-chalk"
            >
              Top Up Credits
            </Link>
          </div>
        </div>
      </section>

      {/* Recent credit activity */}
      <section className="panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-ink">Recent Credit Activity</h2>
        {ledger.length === 0 ? (
          <p className="muted text-sm">No credit activity yet.</p>
        ) : (
          <div className="space-y-2">
            {ledger.map((entry) => (
              <article
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-ink/8 bg-chalk/60 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold capitalize text-ink">{entry.kind}</span>
                  <p className="muted text-xs">{formatDate(entry.createdAt)}</p>
                </div>
                <span
                  className={`font-mono text-sm font-bold ${entry.amount > 0 ? "text-teal" : "text-flare"}`}
                >
                  {entry.amount > 0 ? "+" : ""}
                  {formatCredits(entry.amount)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Top-up orders */}
      <section className="panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-bold text-ink">Top-Up Orders</h2>
        {topups.length === 0 ? (
          <p className="muted text-sm">No top-up orders yet.</p>
        ) : (
          <div className="space-y-2">
            {topups.map((order) => (
              <article
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/8 bg-chalk/60 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-semibold text-ink">Order #{order.id}</span>
                  <p className="muted text-xs">
                    {order.rail} · {order.currency} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal">{formatCredits(order.amount)}</span>
                  <span
                    className={`tag text-[10px] uppercase tracking-wide ${
                      order.status === "completed"
                        ? "bg-mint/20 text-teal"
                        : order.status === "pending"
                          ? "bg-ink/10 text-ink"
                          : "bg-flare/15 text-flare"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Your agents */}
      <section className="panel p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Your Agents</h2>
          <Link
            href="/create"
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal"
          >
            New Agent
          </Link>
        </div>
        {agents.length === 0 ? (
          <p className="muted text-sm">No agents yet. Create your first AI agent.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {agents.map((agent) => (
              <article
                key={agent.id}
                className="card-surface p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{agent.name}</p>
                  <span className="font-mono text-xs text-ink/50">
                    {formatUsd(agent.pricePerRun)}/run
                  </span>
                </div>
                <p className="muted mb-3 text-xs leading-relaxed line-clamp-2">{agent.description}</p>
                <div className="flex items-center justify-between">
                  <span
                    className={`tag text-[10px] uppercase tracking-wide ${
                      agent.published ? "bg-mint/20 text-teal" : "bg-ink/10 text-ink/60"
                    }`}
                  >
                    {agent.published ? "Published" : "Draft"}
                  </span>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold transition hover:bg-ink/5"
                  >
                    Open
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
