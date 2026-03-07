import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { listApplications } from "@/lib/task-service";

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

  try {
    const applications = await listApplications(taskId, await resolveUserId(request));
    return NextResponse.json({ applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list applicants";
    const status = message.includes("Not authorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
