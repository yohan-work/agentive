import type { Agent, AgentSource } from "@/types/agent";
// Generated from content/agents/*.yaml by scripts/build-content.mjs (runs before dev, build, and typecheck).
import agentSources from "./generated/agents.json";

// Install guidance is the same for every project-ready agent, so it lives here instead of in each content file.
const projectUse: NonNullable<Agent["projectUse"]> = {
  recommendedPlacement: "Project root for AGENTS.md and CLAUDE.md; .cursor/rules for Cursor rules.",
  setupFiles: [
    "AGENTS.md",
    "CLAUDE.md",
    ".cursor/rules/{agent-slug}.mdc",
    "agent.json",
    "README.md",
    "RUNBOOK.md",
    "EVALUATION.md"
  ],
  installNotes: [
    "Copy AGENTS.md into the project root for Codex-style coding-agent instructions.",
    "Copy CLAUDE.md into the project root when using Claude with project context.",
    "Copy the Cursor rule into .cursor/rules when using Cursor.",
    "Keep agent.json alongside project documentation if another tool needs machine-readable metadata.",
    "Use RUNBOOK.md to prepare context, run the agent, and review the output before handoff.",
    "Use EVALUATION.md to understand tested scenarios, sample outputs, weaknesses, and review criteria."
  ]
};

export const agents: Agent[] = (agentSources as unknown as AgentSource[]).map((agent) =>
  agent.installTargets?.length ? { ...agent, projectUse } : agent
);

export const featuredAgents = agents.slice(0, 6);

export function getAgentBySlug(slug: string) {
  return agents.find((agent) => agent.slug === slug);
}
