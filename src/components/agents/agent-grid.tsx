import type { Agent } from "@/types/agent";
import { EmptyState } from "@/components/common/empty-state";
import { AgentCard } from "./agent-card";

export function AgentGrid({ agents }: { agents: Agent[] }) {
  if (!agents.length) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {agents.map((agent) => (
        <AgentCard key={agent.slug} agent={agent} />
      ))}
    </div>
  );
}
