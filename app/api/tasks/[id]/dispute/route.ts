import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { disputeTask } from "@/lib/task-service";

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
    const task = await disputeTask(taskId, await resolveUserId(request));
    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to dispute task";
    const status = message.includes("Not authorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
