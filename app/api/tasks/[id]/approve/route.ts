import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { approveTask } from "@/lib/task-service";
import { recalculateIntegrity, computeAndAwardBadges } from "@/lib/reputation";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const taskId = Number(id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  try {
    const result = await approveTask(taskId, await resolveUserId(request));
    const task = "task" in result ? result.task : result;

    // Update integrity and badges for the worker
    if (task.assigneeId) {
      await recalculateIntegrity(task.assigneeId);
      await computeAndAwardBadges(task.assigneeId);
    }

    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve task";
    const status = message.includes("Not authorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
