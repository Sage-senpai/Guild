import { NextResponse } from "next/server";

import {
  resolveUserId,
  getCreditStats,
  getUserById,
  listAgentsByCreator,
  listCreditLedgerForUser,
  listTopupOrdersForUser,
} from "@/lib/agent-service";
import { getUserReputation, computeAndAwardBadges } from "@/lib/reputation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await resolveUserId(request);
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Refresh badges on profile load
  await computeAndAwardBadges(userId);

  const [agents, stats, ledger, topups, reputation] = await Promise.all([
    listAgentsByCreator(userId),
    getCreditStats(userId),
    listCreditLedgerForUser(userId, 20),
    listTopupOrdersForUser(userId, 20),
    getUserReputation(userId),
  ]);
  return NextResponse.json({ user, agents, stats, ledger, topups, reputation });
}
