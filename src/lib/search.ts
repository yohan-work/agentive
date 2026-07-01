import type { Agent } from "@/types/agent";

export type AgentFilters = {
  role?: string;
  category?: string;
  difficulty?: string;
  automationLevel?: string;
  tool?: string;
  verifiedStatus?: string;
  installableOnly?: boolean;
};

export function searchAgents(agents: Agent[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return agents;
  }

  return agents.filter((agent) => {
    const haystack = [
      agent.name,
      agent.summary,
      agent.description,
      ...agent.tags,
      ...agent.categories,
      ...agent.roles,
      ...agent.tools,
      ...(agent.realUseCases ?? []).flatMap((useCase) => [
        useCase.title,
        useCase.context,
        useCase.problem,
        useCase.howToUse,
        useCase.exampleInput,
        useCase.expectedResult,
        useCase.recommendedWorkflow ?? ""
      ])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}

export function filterAgents(agents: Agent[], filters: AgentFilters) {
  return agents.filter((agent) => {
    if (filters.role && !agent.roles.includes(filters.role)) return false;
    if (filters.category && !agent.categories.includes(filters.category)) return false;
    if (filters.difficulty && agent.difficulty !== filters.difficulty) return false;
    if (filters.automationLevel && String(agent.automationLevel) !== filters.automationLevel) return false;
    if (filters.tool && !agent.tools.includes(filters.tool)) return false;
    if (filters.verifiedStatus && agent.verifiedStatus !== filters.verifiedStatus) return false;
    if (filters.installableOnly && !agent.installTargets?.length) return false;
    return true;
  });
}

export function getUniqueTools(agents: Agent[]) {
  return Array.from(new Set(agents.flatMap((agent) => agent.tools))).sort();
}
