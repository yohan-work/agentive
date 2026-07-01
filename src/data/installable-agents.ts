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

function createRunbook(agent: Agent) {
  const contextFields = Array.from(new Set(["Project goal", "Current repository or workflow context", ...agent.inputs]));
  const outputChecklist = Array.from(
    new Set([
      ...agent.outputs.map((output) => `Includes ${output}`),
      "States assumptions separately from confirmed facts",
      "Lists concrete next actions",
      "Calls out risks or missing context"
    ])
  );

  return {
    projectContext: contextFields,
    inputTemplate: `Project:

Goal:

Current context:

Constraints:

Available files, notes, or data:

Expected output:
${agent.outputs.map((output) => `- ${output}`).join("\n")}`,
    goodInputExample: `${agent.exampleInput ?? agent.useCases[0] ?? agent.summary}

Goal: produce ${agent.outputs[0] ?? "a practical output"} for a real project.
Constraints: keep the result specific, structured, and ready for handoff.`,
    badInputExample: `Help me with ${agent.name}.`,
    outputChecklist,
    failureModes: [
      "The input is too broad or lacks project context",
      "The output is generic and does not mention concrete constraints",
      "The result skips assumptions, risks, or next actions",
      "The agent invents project facts that were not provided"
    ],
    handoffTips: [
      "Paste relevant project files, notes, or constraints before asking for the final output.",
      "Ask for a first draft, then request a stricter revision using the checklist.",
      "Keep the generated output with the project ticket, PR, proposal, or team document."
    ]
  };
}

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
      setupFiles: ["AGENTS.md", "CLAUDE.md", ".cursor/rules/{agent-slug}.mdc", "agent.json", "README.md", "RUNBOOK.md"],
      installNotes: [
        "Copy AGENTS.md into the project root for Codex-style coding-agent instructions.",
        "Copy CLAUDE.md into the project root when using Claude with project context.",
        "Copy the Cursor rule into .cursor/rules when using Cursor.",
        "Keep agent.json alongside project documentation if another tool needs machine-readable metadata.",
        "Use RUNBOOK.md to prepare context, run the agent, and review the output before handoff."
      ]
    },
    runbook: createRunbook(agent)
  };
}
