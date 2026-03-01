import { NextResponse } from "next/server";

import { DEMO_USER_ID } from "@/lib/agent-service";
import { getKiltCredential, isHumanVerified } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const credential = await getKiltCredential(DEMO_USER_ID);
  const verified = isHumanVerified(credential);

  return NextResponse.json({
    verified,
    credential: credential
      ? {
          credentialHash: credential.credentialHash,
          verifiedAt: credential.verifiedAt,
          expiresAt: credential.expiresAt,
        }
      : null,
  });
}
