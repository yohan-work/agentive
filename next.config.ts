import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH when the site is served from a sub-path (e.g. "/agentive" on GitHub Pages).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  // Pin the workspace root to this project so a lockfile in a parent directory is never picked up.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname }
};

export default nextConfig;
