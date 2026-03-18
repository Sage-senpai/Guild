import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { getKiltCredential, getTaskById, getTaskReviews, isHumanVerified, updateTask } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const taskId = Number(id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const task = await getTaskById(taskId);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const userId = await resolveUserId(request);
  const [credential, reviews] = await Promise.all([
    getKiltCredential(userId),
    getTaskReviews(taskId),
  ]);
  const verified = isHumanVerified(credential);

  return NextResponse.json({
    task,
    userId,
    verified,
    reviews,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  const userId = await resolveUserId(request);
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    maxWorkers?: number;
    deadline?: string;
  };

  try {
    const task = await updateTask(taskId, userId, body);
    return NextResponse.json({ task });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update task" },
      { status: 400 },
    );
  }
}
