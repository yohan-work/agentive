import type { Agent } from "@/types/agent";
import { AgentCard } from "./agent-card";

export function RelatedAgents({ agents }: { agents: Agent[] }) {
  if (!agents.length) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {agents.map((agent) => (
        <AgentCard key={agent.slug} agent={agent} />
      ))}
    </div>
  );
}
