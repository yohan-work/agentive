import type { Agent, InstallTarget } from "@/types/agent";

export const INSTALLABLE_AGENT_SLUGS = [
  "codex-task-brief",
  "pr-review-agent",
  "bug-root-cause-analyst",
  "feature-requirements-analyst",
  "qa-checklist-agent",
  "api-contract-agent",
  "test-case-generator",
  "refactor-plan-agent",
  "security-checklist-agent",
  "performance-audit-agent",
  "design-qa-agent",
  "component-spec-agent",
  "landing-page-critique-agent",
  "readme-generator",
  "release-notes-writer",
  "meeting-summary-agent",
  "policy-doc-writer",
  "operations-sop-agent",
  "customer-feedback-clusterer",
  "product-roadmap-prioritizer"
] as const;

const installableSet = new Set<string>(INSTALLABLE_AGENT_SLUGS);

const defaultTargets: InstallTarget[] = ["codex", "claude", "cursor"];

export function isInstallableAgent(agent: Pick<Agent, "slug">) {
  return installableSet.has(agent.slug);
}

export function withInstallMetadata(agent: Agent): Agent {
  if (!isInstallableAgent(agent)) {
    return agent;
  }

  return {
    ...agent,
    installTargets: defaultTargets,
    projectUse: {
      recommendedPlacement: "Project root for AGENTS.md and CLAUDE.md; .cursor/rules for Cursor rules.",
      setupFiles: ["AGENTS.md", "CLAUDE.md", ".cursor/rules/{agent-slug}.mdc", "agent.json", "README.md"],
      installNotes: [
        "Copy AGENTS.md into the project root for Codex-style coding-agent instructions.",
        "Copy CLAUDE.md into the project root when using Claude with project context.",
        "Copy the Cursor rule into .cursor/rules when using Cursor.",
        "Keep agent.json alongside project documentation if another tool needs machine-readable metadata."
      ]
    }
  };
}
