import os from "node:os";
import path from "node:path";

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const FALLBACK_DATA_DIR = path.join(os.tmpdir(), "guild");

export const DATA_DIR = process.env.GUILD_DATA_DIR
  ? path.resolve(process.env.GUILD_DATA_DIR)
  : process.env.VERCEL
    ? FALLBACK_DATA_DIR
    : DEFAULT_DATA_DIR;

export function resolveDataPath(...segments: string[]): string {
  return path.join(DATA_DIR, ...segments);
}
