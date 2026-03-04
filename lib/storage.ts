/**
 * Guild Storage Layer
 * Supports two backends:
 *   - mock  : local filesystem (dev only)
 *   - crust : Crust Network IPFS gateway (production)
 *
 * Replaces the removed 0G stack.
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { resolveDataPath } from "@/lib/data-dir";

export type UploadResult = {
  rootHash: string;
  uri: string;
  transactionHash: string | null;
  mode: "crust" | "mock";
};

type UploadOptions = {
  requireReal?: boolean;
};

const MOCK_STORAGE_DIR = resolveDataPath("mock-storage");
const DOWNLOAD_DIR = resolveDataPath("downloads");

// ── Config helpers ────────────────────────────────────────────────────────────

function crustEnabled(): boolean {
  return (
    process.env.STORAGE_PROVIDER === "crust" &&
    Boolean(process.env.CRUST_GATEWAY?.trim())
  );
}

export function storageMode(): "crust" | "mock" {
  return crustEnabled() ? "crust" : "mock";
}

export function getRealStorageConfigError(): string | null {
  if (process.env.STORAGE_PROVIDER !== "crust") {
    return "STORAGE_PROVIDER must be set to 'crust'";
  }
  if (!process.env.CRUST_GATEWAY?.trim()) {
    return "CRUST_GATEWAY is missing";
  }
  return null;
}

// ── IPFS CID hash helper ──────────────────────────────────────────────────────

function sha256Hex(data: Uint8Array): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function uriFromCid(cid: string): string {
  return `ipfs://${cid}`;
}

function cidFromUri(uri: string): string {
  const trimmed = uri.trim();
  if (trimmed.startsWith("ipfs://")) return trimmed.slice("ipfs://".length);
  if (trimmed.startsWith("0g://")) return trimmed.slice("0g://".length);
  return trimmed;
}

// ── Mock backend ──────────────────────────────────────────────────────────────

async function uploadToMock(data: Uint8Array): Promise<UploadResult> {
  await fs.mkdir(MOCK_STORAGE_DIR, { recursive: true });
  const rootHash = sha256Hex(data);
  const filePath = path.join(MOCK_STORAGE_DIR, rootHash);
  await fs.writeFile(filePath, data);
  return { rootHash, uri: uriFromCid(rootHash), transactionHash: null, mode: "mock" };
}

async function downloadFromMock(
  hash: string,
  fallbackLocalPath?: string | null,
): Promise<string> {
  const filePath = path.join(MOCK_STORAGE_DIR, hash);
  try {
    const content = await fs.readFile(filePath);
    return content.toString("utf-8");
  } catch {
    if (!fallbackLocalPath) return "";
    const local = await fs.readFile(fallbackLocalPath);
    return local.toString("utf-8");
  }
}

// ── Crust Network backend ─────────────────────────────────────────────────────

async function uploadToCrust(data: Uint8Array): Promise<UploadResult> {
  const gateway = process.env.CRUST_GATEWAY!.replace(/\/$/, "");
  const rootHash = sha256Hex(data);
  const filename = `guild-${rootHash.slice(0, 16)}`;

  const formData = new FormData();
  formData.append("file", new Blob([data as Uint8Array<ArrayBuffer>]), filename);

  const res = await fetch(`${gateway}/api/v0/add?pin=true&wrap-with-directory=false`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Crust IPFS upload failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { Hash?: string; hash?: string };
  const cid = json.Hash ?? json.hash;
  if (!cid) {
    throw new Error("Crust IPFS upload returned no CID");
  }

  return {
    rootHash,
    uri: uriFromCid(cid),
    transactionHash: cid,
    mode: "crust",
  };
}

async function downloadFromCrust(
  cid: string,
  fallbackLocalPath?: string | null,
): Promise<string> {
  const gateway = (process.env.CRUST_GATEWAY ?? "https://ipfs.io").replace(/\/$/, "");
  await fs.mkdir(DOWNLOAD_DIR, { recursive: true });

  const res = await fetch(`${gateway}/ipfs/${cid}`);
  if (!res.ok) {
    if (fallbackLocalPath) {
      const local = await fs.readFile(fallbackLocalPath);
      return local.toString("utf-8");
    }
    throw new Error(`Crust IPFS download failed (${res.status}) for CID: ${cid}`);
  }

  return res.text();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function uploadManifest(
  manifest: object,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const requireReal = options.requireReal ?? false;
  const body = Buffer.from(JSON.stringify(manifest, null, 2), "utf-8");

  if (requireReal && !crustEnabled()) {
    throw new Error(getRealStorageConfigError() ?? "Real storage is required but unavailable");
  }

  if (!crustEnabled()) {
    return uploadToMock(body);
  }

  try {
    return await uploadToCrust(body);
  } catch (error) {
    if (requireReal) throw error;
    console.warn(
      "Crust upload failed for manifest, falling back to mock:",
      error instanceof Error ? error.message : error,
    );
    return uploadToMock(body);
  }
}

export async function uploadKnowledge(
  payload: Uint8Array,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const requireReal = options.requireReal ?? false;

  if (requireReal && !crustEnabled()) {
    throw new Error(getRealStorageConfigError() ?? "Real storage is required but unavailable");
  }

  if (!crustEnabled()) {
    return uploadToMock(payload);
  }

  try {
    return await uploadToCrust(payload);
  } catch (error) {
    if (requireReal) throw error;
    console.warn(
      "Crust upload failed for knowledge, falling back to mock:",
      error instanceof Error ? error.message : error,
    );
    return uploadToMock(payload);
  }
}

export async function downloadText(
  uri: string,
  fallbackLocalPath?: string | null,
): Promise<string> {
  return downloadTextByRootHash(cidFromUri(uri), fallbackLocalPath);
}

export async function downloadTextByRootHash(
  hash: string,
  fallbackLocalPath?: string | null,
): Promise<string> {
  const normalizedHash = cidFromUri(hash);

  if (!crustEnabled()) {
    return downloadFromMock(normalizedHash, fallbackLocalPath);
  }

  return downloadFromCrust(normalizedHash, fallbackLocalPath);
}
