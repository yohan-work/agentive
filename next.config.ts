import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so a lockfile in a parent directory is never picked up.
  outputFileTracingRoot: process.cwd()
};

export default nextConfig;
