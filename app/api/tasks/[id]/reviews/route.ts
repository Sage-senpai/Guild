import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { getTaskReviews, submitTaskReview } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const reviews = await getTaskReviews(taskId);
  return NextResponse.json({ reviews });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const userId = await resolveUserId(request);
  const body = (await request.json()) as { rating?: number; comment?: string };

  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  try {
    const review = await submitTaskReview({
      taskId,
      reviewerId: userId,
      rating: body.rating,
      comment: body.comment,
    });
    return NextResponse.json({ review });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit review" },
      { status: 400 },
    );
  }
}
