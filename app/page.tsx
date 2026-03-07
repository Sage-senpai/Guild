import Link from "next/link";
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight02Icon } from '@hugeicons/core-free-icons';

import { AgentCard } from "@/components/agent-card";
import { listAgents } from "@/lib/agent-service";
import { AGENT_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const category = params.category === "all" ? "" : (params.category ?? "");

  const agents = await listAgents({ search, category, includeDrafts: false });

  return (
    <main>
      <div className="space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-teal to-ink px-8 py-12 sm:px-12 sm:py-16">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-end">
            <div>
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-mint/80">
                The Agent Marketplace
              </p>
              <h1 className="font-display max-w-2xl text-4xl font-bold leading-tight text-stone sm:text-5xl lg:text-6xl">
                Your craft.<br />Your agents.<br />
                <span className="text-mint">Your guild.</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-stone/70">
                Discover, publish, and run AI agents. Built on open infrastructure — decentralized by design, Africa-first in spirit.
              </p>
            </div>
            <div className="flex lg:justify-end">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-mint px-6 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5 hover:bg-mint/90"
              >
                Publish an Agent
                <HugeiconsIcon icon={ArrowRight02Icon} size={16} />
              </Link>
            </div>
          </div>
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(43,117,116,0.25),transparent_60%)]" />
        </section>

        {/* Search & Filter */}
        <div>
          <form className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search agents..."
              className="w-full rounded-xl border border-stone/30 bg-white px-4 py-2.5 text-sm text-ink outline-none ring-mint transition placeholder:text-stone/50 focus:ring-2"
            />
            <Select name="category" defaultValue={category || "all"}>
              <SelectTrigger className="w-full rounded-xl border border-stone/30 bg-white px-4 py-2.5 text-sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All categories</SelectItem>
                  {AGENT_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90"
            >
              Search
            </Button>
          </form>
        </div>

        <Separator className="border-stone/20" />

        {/* Grid */}
        <div>
          {agents.length === 0 ? (
            <div className="rounded-2xl border border-stone/20 bg-white/60 p-14 text-center">
              <p className="mb-1 text-lg font-bold text-ink">No agents found</p>
              <p className="mb-5 text-sm text-ink/50">Be the first to publish one.</p>
              <Link
                href="/create"
                className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink hover:bg-ink/5"
              >
                Create Agent
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
