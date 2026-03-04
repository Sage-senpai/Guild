import type { NextConfig } from "next";
import fs from "fs";

// On Windows the filesystem stores the directory with its original casing
// (e.g. "Guild"), while process.cwd() returns whatever the shell typed.
// outputFileTracingRoot needs the canonical path to avoid Next.js treating
// the parent user home as the project root and finding the wrong @next/swc.
const projectRoot = fs.realpathSync(process.cwd());

const nextConfig: NextConfig = {
  serverExternalPackages: ["sql.js", "@kiltprotocol/sdk-js"],
  outputFileTracingRoot: projectRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
