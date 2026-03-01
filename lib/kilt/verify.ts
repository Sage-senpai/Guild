/**
 * KILT Protocol credential verification.
 *
 * KILT_VERIFY_MODE controls behaviour:
 *   "real"  — uses @kiltprotocol/sdk-js (install the package first)
 *   "mock"  — accepts any well-formed JSON credential (dev / demo only)
 *
 * Default: "mock" when NODE_ENV !== "production", else "real".
 */

import crypto from "node:crypto";

export type KiltVerifyResult = {
  valid: boolean;
  credentialHash: string;
  claimerDid: string;
  attesterDid: string;
};

function getMode(): "real" | "mock" {
  if (process.env.KILT_VERIFY_MODE === "real") return "real";
  if (process.env.KILT_VERIFY_MODE === "mock") return "mock";
  return process.env.NODE_ENV === "production" ? "real" : "mock";
}

/**
 * Derives a stable hash from the raw credential JSON so we can store it
 * as a unique identifier in the database.
 */
function hashCredentialJson(credentialJson: string): string {
  return crypto.createHash("sha256").update(credentialJson).digest("hex");
}

/**
 * Verifies a KILT credential using the real @kiltprotocol/sdk-js SDK.
 * Requires KILT_WSS_ADDRESS env var pointing to a Spiritnet / Peregrine node.
 */
async function verifyReal(credentialJson: string): Promise<KiltVerifyResult> {
  // Dynamic import so the package is optional until actually needed.
  // Run: npm install @kiltprotocol/sdk-js  to enable real verification.
  const { Verifier, connect, disconnect } = await import("@kiltprotocol/sdk-js").catch(() => {
    throw new Error(
      "KILT SDK not installed. Run: npm install @kiltprotocol/sdk-js\n" +
        "Or set KILT_VERIFY_MODE=mock for development.",
    );
  });

  const wssAddress =
    process.env.KILT_WSS_ADDRESS ?? "wss://spiritnet.kilt.io";

  await connect(wssAddress);
  try {
    // KILT SDK v1.x: credential is a W3C VerifiableCredential JSON-LD object.
    const credential = JSON.parse(credentialJson) as Record<string, unknown>;
    const result = await Verifier.verifyCredential({ credential: credential as unknown as Parameters<typeof Verifier.verifyCredential>[0]["credential"] });

    // Claimer = credentialSubject.id (W3C VC standard field); attester = issuer.
    const credSubject = credential.credentialSubject as Record<string, unknown> | undefined;
    const claimerDid = String(credSubject?.id ?? credential.holder ?? "");
    const attesterDid = String(credential.issuer ?? "");

    return {
      valid: result.verified,
      credentialHash: hashCredentialJson(credentialJson),
      claimerDid,
      attesterDid,
    };
  } finally {
    await disconnect();
  }
}

/**
 * Mock verifier for development and demos.
 * Accepts any JSON that parses successfully and contains a "claim" field.
 * Never use in production.
 */
function verifyMock(credentialJson: string): KiltVerifyResult {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(credentialJson) as Record<string, unknown>;
  } catch {
    return {
      valid: false,
      credentialHash: "",
      claimerDid: "",
      attesterDid: "",
    };
  }

  // Basic structural check — a real KILT credential must have these fields.
  const hasStructure =
    typeof parsed === "object" &&
    parsed !== null &&
    ("claim" in parsed || "credential" in parsed || "claimHash" in parsed);

  const claimerDid =
    (parsed.claimerDid as string | undefined) ??
    (parsed.claim as Record<string, unknown> | undefined)?.owner?.toString() ??
    "did:kilt:mock:claimer";

  const attesterDid =
    (parsed.attesterDid as string | undefined) ?? "did:kilt:mock:attester";

  return {
    valid: hasStructure,
    credentialHash: hashCredentialJson(credentialJson),
    claimerDid: String(claimerDid),
    attesterDid: String(attesterDid),
  };
}

/**
 * Main entry-point called by the /api/kilt/verify route.
 */
export async function verifyKiltCredential(credentialJson: string): Promise<KiltVerifyResult> {
  const mode = getMode();
  if (mode === "real") {
    return verifyReal(credentialJson);
  }
  return verifyMock(credentialJson);
}
