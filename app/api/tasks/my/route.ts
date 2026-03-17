import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { listTasksByPoster, listTasksByWorker } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await resolveUserId(request);

  const [posted, working] = await Promise.all([
    listTasksByPoster(userId, 50),
    listTasksByWorker(userId, 50),
  ]);

  return NextResponse.json({ posted, working, userId });
}
