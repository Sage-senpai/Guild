import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import {
  submitReview,
  listReviewsForAgent,
  getAgentRatingStats,
  computeAndAwardBadges,
} from "@/lib/reputation";
import { submitReviewSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agentId = Number(id);
  if (!Number.isInteger(agentId) || agentId <= 0) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const [reviews, stats] = await Promise.all([
    listReviewsForAgent(agentId),
    getAgentRatingStats(agentId),
  ]);

  return NextResponse.json({ reviews, stats });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agentId = Number(id);
  if (!Number.isInteger(agentId) || agentId <= 0) {
    return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });
  }

  const userId = await resolveUserId(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submitReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const review = await submitReview({
      agentId,
      userId,
      runId: parsed.data.runId,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    });

    // Trigger badge re-computation for the agent creator
    await computeAndAwardBadges(userId);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
