import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so a lockfile in a parent directory is never picked up.
  outputFileTracingRoot: __dirname
};

export default nextConfig;
