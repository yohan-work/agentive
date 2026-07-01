import type { Agent, AgentUseCase } from "@/types/agent";

export type AgentUseCaseRecord = AgentUseCase & {
  id: string;
  agentSlug: string;
  agentName: string;
  agentSummary: string;
  roles: string[];
  categories: string[];
  tags: string[];
};

export function getAgentUseCases(agents: Agent[]): AgentUseCaseRecord[] {
  return agents.flatMap((agent) =>
    (agent.realUseCases ?? []).map((useCase, index) => ({
      ...useCase,
      id: `${agent.slug}-${index}`,
      agentSlug: agent.slug,
      agentName: agent.name,
      agentSummary: agent.summary,
      roles: agent.roles,
      categories: agent.categories,
      tags: agent.tags
    }))
  );
}

export function searchUseCases(useCases: AgentUseCaseRecord[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return useCases;
  }

  return useCases.filter((useCase) =>
    [
      useCase.title,
      useCase.context,
      useCase.problem,
      useCase.howToUse,
      useCase.exampleInput,
      useCase.expectedResult,
      useCase.recommendedWorkflow ?? "",
      useCase.agentName,
      useCase.agentSummary,
      ...useCase.roles,
      ...useCase.categories,
      ...useCase.tags
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized)
  );
}
