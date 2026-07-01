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

function createEvaluation(agent: Agent): NonNullable<Agent["evaluation"]> {
  return {
    qualityScore: 4,
    testedWith: defaultTargets,
    recommendedFor: [
      `Teams that need ${agent.outputs[0] ?? "a practical handoff"} from real project context`,
      `Projects where ${agent.inputs[0] ?? "clear input context"} is available before the agent runs`,
      "Repeatable work that benefits from a checklist-driven review step"
    ],
    notRecommendedFor: [
      "Tasks with no project context, source material, or decision owner",
      "Fully autonomous production changes without human review",
      "Work requiring legal, financial, medical, or compliance sign-off"
    ],
    knownWeaknesses: [
      "Output quality drops when the request omits constraints, examples, or target audience",
      "The agent can over-generalize if the project state is not pasted or referenced",
      "Final decisions still need review by the project owner"
    ],
    evaluationCriteria: [
      "Uses only supplied project facts and labels assumptions clearly",
      `Produces ${agent.outputs[0] ?? "the primary expected output"} in a usable handoff format`,
      "Includes risks, missing context, and concrete next actions",
      "Matches the tone, constraints, and level of detail requested by the user"
    ],
    sampleRuns: [
      {
        title: `${agent.name} project handoff`,
        input: agent.exampleInput ?? agent.useCases[0] ?? agent.summary,
        expectedOutputSummary: `A project-ready response that includes ${agent.outputs.slice(0, 2).join(" and ") || "the expected deliverable"}.`,
        sampleOutput:
          agent.exampleOutput ??
          `The agent should return a structured draft with assumptions, project-specific recommendations, review notes, and next actions for ${agent.useCases[0] ?? agent.summary}.`,
        reviewNotes: [
          "Check that the output refers to the supplied project context instead of generic advice.",
          "Confirm the deliverable can be pasted into a ticket, PR, document, or team handoff.",
          "Ask one revision pass if the output misses risks, constraints, or owner-ready next steps."
        ]
      }
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
      setupFiles: ["AGENTS.md", "CLAUDE.md", ".cursor/rules/{agent-slug}.mdc", "agent.json", "README.md", "RUNBOOK.md", "EVALUATION.md"],
      installNotes: [
        "Copy AGENTS.md into the project root for Codex-style coding-agent instructions.",
        "Copy CLAUDE.md into the project root when using Claude with project context.",
        "Copy the Cursor rule into .cursor/rules when using Cursor.",
        "Keep agent.json alongside project documentation if another tool needs machine-readable metadata.",
        "Use RUNBOOK.md to prepare context, run the agent, and review the output before handoff.",
        "Use EVALUATION.md to understand tested scenarios, sample outputs, weaknesses, and review criteria."
      ]
    },
    runbook: createRunbook(agent),
    evaluation: createEvaluation(agent)
  };
}
