import type { Agent } from "@/types/agent";
import type { PortableAgentCard } from "@/types/portable-agent";
import { titleCase } from "./utils";

function bulletList(items: string[]) {
  if (!items.length) {
    return "- Not specified";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function toPortableAgentCard(agent: Agent): PortableAgentCard {
  return {
    version: "1.0",
    slug: agent.slug,
    name: agent.name,
    summary: agent.summary,
    description: agent.description,
    roleInstruction: `You are ${agent.name}. ${agent.summary}`,
    useCases: agent.useCases,
    inputs: agent.inputs,
    outputs: agent.outputs,
    prompt: agent.prompt,
    exampleInput: agent.exampleInput,
    exampleOutput: agent.exampleOutput,
    bestPractices: agent.bestPractices ?? [],
    limitations: agent.limitations ?? [],
    realUseCases: agent.realUseCases ?? [],
    installTargets: agent.installTargets ?? [],
    projectUse: agent.projectUse,
    runbook: agent.runbook,
    instructions: agent.prompt,
    contextRequirements: agent.inputs,
    expectedProjectFiles: agent.projectUse?.setupFiles ?? [],
    usageExamples: [agent.exampleInput, ...(agent.realUseCases ?? []).map((useCase) => useCase.exampleInput)].filter(
      (value): value is string => Boolean(value)
    ),
    targetFiles: agent.projectUse?.setupFiles ?? [],
    tags: agent.tags,
    metadata: {
      roles: agent.roles,
      categories: agent.categories,
      tools: agent.tools,
      difficulty: agent.difficulty,
      automationLevel: agent.automationLevel,
      verifiedStatus: agent.verifiedStatus,
      updatedAt: agent.updatedAt
    }
  };
}

export function toAgentJson(agent: Agent) {
  return JSON.stringify(toPortableAgentCard(agent), null, 2);
}

export function toAgentMarkdown(agent: Agent) {
  const card = toPortableAgentCard(agent);

  return `# Agent: ${card.name}

## Role
${card.roleInstruction}

## What this agent does
${card.description}

## When to use
${bulletList(card.useCases)}

## Required inputs
${bulletList(card.inputs)}

## Expected outputs
${bulletList(card.outputs)}

## Operating instructions
${card.prompt}

## Example input
${card.exampleInput ?? "Not provided"}

## Example output
${card.exampleOutput ?? "Not provided"}

## Best practices
${bulletList(card.bestPractices)}

## Limitations
${bulletList(card.limitations)}

## Real use cases
${card.realUseCases.length
  ? card.realUseCases
      .map(
        (useCase) => `### ${useCase.title}
- Context: ${useCase.context}
- Problem: ${useCase.problem}
- How to use: ${useCase.howToUse}
- Example input: ${useCase.exampleInput}
- Expected result: ${useCase.expectedResult}${useCase.recommendedWorkflow ? `\n- Recommended workflow: ${useCase.recommendedWorkflow}` : ""}`
      )
      .join("\n\n")
  : "Not provided"}

## Project install
${card.installTargets.length ? `Targets: ${card.installTargets.join(", ")}` : "Not installable yet"}
${card.projectUse ? `Recommended placement: ${card.projectUse.recommendedPlacement}` : ""}

## Runbook
${card.runbook
  ? `### Project context
${bulletList(card.runbook.projectContext)}

### Input template
${card.runbook.inputTemplate}

### Output checklist
${bulletList(card.runbook.outputChecklist)}

### Failure modes
${bulletList(card.runbook.failureModes)}`
  : "Not provided"}

## Metadata
- Slug: ${card.slug}
- Roles: ${card.metadata.roles.map(titleCase).join(", ")}
- Categories: ${card.metadata.categories.map(titleCase).join(", ")}
- Tools: ${card.metadata.tools.join(", ")}
- Difficulty: ${titleCase(card.metadata.difficulty)}
- Automation level: ${card.metadata.automationLevel}/5
- Verified status: ${titleCase(card.metadata.verifiedStatus)}
- Updated at: ${card.metadata.updatedAt}
`;
}

export function toChatPromptBundle(agent: Agent) {
  return `${toAgentMarkdown(agent)}

---

Use this agent for the next task. First, ask only for missing required inputs that are necessary to produce the expected outputs. If enough context is provided, proceed directly.`;
}
