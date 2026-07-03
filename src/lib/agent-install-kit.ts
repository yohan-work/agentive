import type { Agent } from "@/types/agent";
import { toPortableAgentCard } from "./agent-export";
import { titleCase } from "./utils";

export type InstallKitFile = {
  filename: string;
  content: string;
  mimeType: string;
};

function list(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- Not specified";
}

function agentInstructions(agent: Agent) {
  return `# ${agent.name}

## Role
${agent.summary}

## When To Use
${list(agent.useCases)}

## Required Project Context
${list(agent.inputs)}

## Operating Instructions
${agent.prompt}

## Output Format
${list(agent.outputs)}

## Review Checklist
${list(agent.bestPractices ?? [])}

## Quality Evaluation
${agent.evaluation ? `Quality score: ${agent.evaluation.qualityScore}/5` : "Not evaluated"}
${agent.evaluation ? `Tested with: ${agent.evaluation.testedWith.join(", ")}` : ""}

## Decision Guide
${agent.decisionGuide?.length
  ? agent.decisionGuide
      .map(
        (item) => `### ${item.question}
${item.guidance}${item.alternativeAgentSlug ? `\n\nRelated option: ${item.alternativeAgentSlug}` : ""}`
      )
      .join("\n\n")
  : "Not provided"}

## Limitations
${list(agent.limitations ?? [])}
`;
}

export function toCodexAgentFile(agent: Agent) {
  return `${agentInstructions(agent)}
## Codex Usage
- Read the repository before proposing changes.
- Prefer small, verifiable edits.
- Preserve existing project conventions.
- Report changed files and validation commands.
`;
}

export function toClaudeProjectFile(agent: Agent) {
  return `${agentInstructions(agent)}
## Claude Project Usage
- Treat this file as the active project agent instruction.
- Ask for missing context only when required.
- Separate assumptions from confirmed project facts.
- Use concise, implementation-ready output.
`;
}

export function toCursorRuleFile(agent: Agent) {
  return `---
description: ${agent.summary}
globs:
  - "**/*"
alwaysApply: false
---

${agentInstructions(agent)}
`;
}

export function toInstallManifest(agent: Agent) {
  return JSON.stringify(toPortableAgentCard(agent), null, 2);
}

export function toInstallReadme(agent: Agent) {
  return `# ${agent.name} Install Kit

This kit contains project-ready files for using ${agent.name} inside Codex, Claude, or Cursor.

## Files
${list(agent.projectUse?.setupFiles ?? [])}

## Recommended Placement
${agent.projectUse?.recommendedPlacement ?? "Copy the relevant file into your project root or tool-specific rules directory."}

## Install Notes
${list(agent.projectUse?.installNotes ?? [])}

## Agent Metadata
- Slug: ${agent.slug}
- Roles: ${agent.roles.map(titleCase).join(", ")}
- Categories: ${agent.categories.map(titleCase).join(", ")}
- Tools: ${agent.tools.join(", ")}
- Difficulty: ${titleCase(agent.difficulty)}
- Automation level: ${agent.automationLevel}/5
${agent.evaluation ? `- Quality score: ${agent.evaluation.qualityScore}/5` : ""}
`;
}

export function toRunbookFile(agent: Agent) {
  if (!agent.runbook) {
    return `# ${agent.name} Runbook

No runbook has been curated for this agent yet.
`;
  }

  return `# ${agent.name} Runbook

## Project Context To Prepare
${list(agent.runbook.projectContext)}

## Input Template
${agent.runbook.inputTemplate}

## Starter Inputs
${agent.runbook.starterInputs?.length
  ? agent.runbook.starterInputs
      .map((starter) => `### ${starter.label}
${starter.description}

${starter.value}`)
      .join("\n\n")
  : "Not provided"}

## Setup Context Notes
${list(agent.runbook.setupContextNotes ?? [])}

## Good Input Example
${agent.runbook.goodInputExample}

## Weak Input Example
${agent.runbook.badInputExample}

## Weak Input Diagnostics
${agent.runbook.weakInputFixes?.length
  ? agent.runbook.weakInputFixes
      .map(
        (fix) => `### ${fix.weakInput}
- Why it fails: ${fix.whyItFails}
- Stronger input: ${fix.strongerInput}`
      )
      .join("\n\n")
  : "Not provided"}

## Expected Output Shape
${list(agent.runbook.expectedOutputShape ?? [])}

## Output Checklist
${list(agent.runbook.outputChecklist)}

## Failure Modes
${list(agent.runbook.failureModes)}

## Handoff Tips
${list(agent.runbook.handoffTips)}
`;
}

export function toEvaluationFile(agent: Agent) {
  if (!agent.evaluation) {
    return `# ${agent.name} Evaluation

No quality evaluation has been curated for this agent yet.
`;
  }

  return `# ${agent.name} Evaluation

## Quality Score
${agent.evaluation.qualityScore}/5

## Tested With
${list(agent.evaluation.testedWith)}

## Recommended For
${list(agent.evaluation.recommendedFor)}

## Not Recommended For
${list(agent.evaluation.notRecommendedFor)}

## Known Weaknesses
${list(agent.evaluation.knownWeaknesses)}

## Evaluation Criteria
${list(agent.evaluation.evaluationCriteria)}

## Sample Runs
${agent.evaluation.sampleRuns
  .map(
    (sample) => `### ${sample.title}

Input:
${sample.input}

Expected output:
${sample.expectedOutputSummary}

Sample output:
${sample.sampleOutput}

Review notes:
${list(sample.reviewNotes)}`
  )
  .join("\n\n")}
`;
}

export function getInstallKitFiles(agent: Agent): InstallKitFile[] {
  if (!agent.installTargets?.length || !agent.projectUse) {
    return [];
  }

  return [
    {
      filename: `${agent.slug}-AGENTS.md`,
      content: toCodexAgentFile(agent),
      mimeType: "text/markdown;charset=utf-8"
    },
    {
      filename: `${agent.slug}-CLAUDE.md`,
      content: toClaudeProjectFile(agent),
      mimeType: "text/markdown;charset=utf-8"
    },
    {
      filename: `${agent.slug}-cursor-rule.mdc`,
      content: toCursorRuleFile(agent),
      mimeType: "text/markdown;charset=utf-8"
    },
    {
      filename: `${agent.slug}-agent.json`,
      content: toInstallManifest(agent),
      mimeType: "application/json;charset=utf-8"
    },
    {
      filename: `${agent.slug}-README.md`,
      content: toInstallReadme(agent),
      mimeType: "text/markdown;charset=utf-8"
    },
    {
      filename: `${agent.slug}-RUNBOOK.md`,
      content: toRunbookFile(agent),
      mimeType: "text/markdown;charset=utf-8"
    },
    {
      filename: `${agent.slug}-EVALUATION.md`,
      content: toEvaluationFile(agent),
      mimeType: "text/markdown;charset=utf-8"
    }
  ];
}
