import { NextResponse } from "next/server";

import { DEMO_USER_ID } from "@/lib/agent-service";
import { verifyKiltCredential } from "@/lib/kilt/verify";
import { upsertKiltCredential } from "@/lib/task-service";
import { verifyKiltSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = verifyKiltSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { credentialJson, attestationId } = parsed.data;

  let result;
  try {
    result = await verifyKiltCredential(credentialJson);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (!result.valid) {
    return NextResponse.json({ error: "Credential verification failed" }, { status: 422 });
  }

  await upsertKiltCredential({
    userId: DEMO_USER_ID,
    credentialHash: result.credentialHash,
    attestationId,
    expiresAt: null,
  });

  return NextResponse.json({
    verified: true,
    claimerDid: result.claimerDid,
    attesterDid: result.attesterDid,
  });
}
