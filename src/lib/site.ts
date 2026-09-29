const DEFAULT_SITE_URL = "https://yohan-work.github.io/agentive";

function resolveSiteUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) {
    return DEFAULT_SITE_URL;
  }

  try {
    return new URL(candidate.includes("://") ? candidate : `https://${candidate}`).toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  name: "Agent Archive",
  description: "A curated library of AI agents, prompts, and workflow recipes for real-world work.",
  tagline: "Curated AI agents with prompts, runbooks, evaluations, and install kits for Codex, Claude, and Cursor.",
  repoUrl: "https://github.com/yohan-work/agentive",
  url: resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
};
