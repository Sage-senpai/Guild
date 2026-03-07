import { NextResponse } from "next/server";

import {
  createTopupOrder,
  resolveUserId,
  getCreditStats,
  getUserById,
  listCreditLedgerForUser,
  listTopupOrdersForUser,
} from "@/lib/agent-service";
import { createTopupSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await resolveUserId(request);
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [stats, ledger, topups] = await Promise.all([
    getCreditStats(userId),
    listCreditLedgerForUser(userId, 100),
    listTopupOrdersForUser(userId, 100),
  ]);

  return NextResponse.json({ user, stats, ledger, topups });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createTopupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid top-up request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const order = await createTopupOrder({
    userId: await resolveUserId(request),
    rail: parsed.data.rail,
    currency: parsed.data.currency,
    amount: parsed.data.amount,
  });

  return NextResponse.json(
    {
      order,
      checkout: {
        message: "Top-up order created. Complete payment and send webhook to reconcile credits.",
        providerReference: order.providerReference,
      },
    },
    { status: 201 },
  );
}
