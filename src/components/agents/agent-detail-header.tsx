import type { Agent } from "@/types/agent";
import { Badge, DifficultyBadge, StatusBadge } from "@/components/common/badge";
import { titleCase } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";

export function AgentDetailHeader({ agent }: { agent: Agent }) {
  return (
    <header className="border-b border-line pb-8">
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={agent.verifiedStatus} />
        <DifficultyBadge difficulty={agent.difficulty} />
        <Badge tone="accent">Automation {agent.automationLevel}/5</Badge>
      </div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-normal text-primary sm:text-5xl">{agent.name}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-secondary">{agent.summary}</p>
        </div>
        <BookmarkButton slug={agent.slug} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {agent.roles.map((role) => (
          <Badge key={role}>{titleCase(role)}</Badge>
        ))}
        {agent.categories.map((category) => (
          <Badge key={category}>{titleCase(category)}</Badge>
        ))}
      </div>
    </header>
  );
}
