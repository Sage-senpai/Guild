import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { createTask, listTasks } from "@/lib/task-service";
import { createTaskSchema, listTasksSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = listTasksSchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    taskType: searchParams.get("task_type") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const tasks = await listTasks(parsed.data);
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { task } = await createTask({ ...parsed.data, posterId: await resolveUserId(request) });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create task";
    const status = message === "INSUFFICIENT_CREDITS" ? 402 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
