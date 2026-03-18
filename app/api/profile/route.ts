import { NextResponse } from "next/server";

import {
  resolveUserId,
  getCreditStats,
  getUserById,
  listAgentsByCreator,
  listCreditLedgerForUser,
  listTopupOrdersForUser,
  updateUsername,
  deleteUserAccount,
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

export async function PUT(request: Request) {
  const userId = await resolveUserId(request);
  const body = (await request.json()) as { username?: string };

  const username = body.username?.trim().slice(0, 30) || null;
  if (username && !/^[a-zA-Z0-9_.-]{2,30}$/.test(username)) {
    return NextResponse.json(
      { error: "Username must be 2-30 characters: letters, numbers, _, ., -" },
      { status: 400 },
    );
  }

  await updateUsername(userId, username);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await resolveUserId(request);
  const body = (await request.json()) as { walletAddress?: string };

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!body.walletAddress || body.walletAddress.toLowerCase() !== user.walletAddress.toLowerCase()) {
    return NextResponse.json(
      { error: "Wallet address does not match. Enter your full wallet address to confirm." },
      { status: 400 },
    );
  }

  await deleteUserAccount(userId);
  return NextResponse.json({ ok: true, deleted: true });
}
