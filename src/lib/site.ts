const DEFAULT_ORIGIN = "https://yohan-work.github.io";

// Only the origin is taken from NEXT_PUBLIC_SITE_URL; the path always comes from NEXT_PUBLIC_BASE_PATH,
// so absolute URLs (metadata, OG image) can never disagree with where the files are actually served.
function resolveOrigin(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) {
    return DEFAULT_ORIGIN;
  }

  try {
    return new URL(candidate.includes("://") ? candidate : `https://${candidate}`).origin;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

const origin = resolveOrigin(process.env.NEXT_PUBLIC_SITE_URL);
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

export const siteConfig = {
  name: "Agent Archive",
  description: "A curated library of AI agents, prompts, and workflow recipes for real-world work.",
  tagline: "Curated AI agents with prompts, runbooks, evaluations, and install kits for Codex, Claude, and Cursor.",
  repoUrl: "https://github.com/yohan-work/agentive",
  origin,
  basePath,
  url: `${origin}${basePath}`,
  ogImagePath: `${basePath}/og-image.png`
};
