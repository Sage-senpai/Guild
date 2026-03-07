import { NextResponse } from "next/server";

import { resolveUserId } from "@/lib/agent-service";
import { getKiltCredential, isHumanVerified } from "@/lib/task-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const credential = await getKiltCredential(await resolveUserId(request));
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
