import { NextResponse } from "next/server";

import { getUserById } from "@/lib/agent-service";
import { getUserReputation, getUserBadges } from "@/lib/reputation";
import { getUserTaskStats, getUserReviews } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [stats, reviews, reputation, badges] = await Promise.all([
    getUserTaskStats(userId),
    getUserReviews(userId),
    getUserReputation(userId),
    getUserBadges(userId),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      integrityScore: user.integrityScore,
    },
    stats,
    reviews: reviews.slice(0, 20),
    reputation,
    badges,
  });
}
