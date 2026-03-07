import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { applyForTask, getKiltCredential, isHumanVerified } from "@/lib/task-service";
import { applyTaskSchema } from "@/lib/validation";

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

  const userId = await resolveUserId(request);

  // Proof of Personhood check
  const credential = await getKiltCredential(userId);
  if (!isHumanVerified(credential)) {
    return NextResponse.json(
      { error: "Proof of Personhood required. Verify via /api/kilt/verify first." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = applyTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const application = await applyForTask(taskId, userId, parsed.data.message);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply for task";
    const status = message.includes("already") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
