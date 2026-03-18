import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { listNotifications, getUnreadCount, markNotificationsRead } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await resolveUserId(request);
  const [notifications, unread] = await Promise.all([
    listNotifications(userId),
    getUnreadCount(userId),
  ]);
  return NextResponse.json({ notifications, unread });
}

export async function PUT(request: Request) {
  const userId = await resolveUserId(request);
  const body = (await request.json()) as { ids?: number[] };
  await markNotificationsRead(userId, body.ids);
  return NextResponse.json({ ok: true });
}
