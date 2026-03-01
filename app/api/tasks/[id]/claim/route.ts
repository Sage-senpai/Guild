import { NextResponse } from "next/server";

import { DEMO_USER_ID } from "@/lib/agent-service";
import { claimTask, getKiltCredential, isHumanVerified } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const taskId = Number(id);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  // Proof of Personhood check
  const credential = await getKiltCredential(DEMO_USER_ID);
  if (!isHumanVerified(credential)) {
    return NextResponse.json(
      { error: "Proof of Personhood required. Verify via /api/kilt/verify first." },
      { status: 403 },
    );
  }

  try {
    const task = await claimTask(taskId, DEMO_USER_ID);
    return NextResponse.json({ task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to claim task";
    const status =
      message.includes("already") || message.includes("own") || message.includes("expired")
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
