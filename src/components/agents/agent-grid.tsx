import type { Agent } from "@/types/agent";
import { EmptyState } from "@/components/common/empty-state";
import { defaultLocale, type Locale } from "@/i18n/config";
import { AgentCard } from "./agent-card";

export function AgentGrid({ agents, locale = defaultLocale }: { agents: Agent[]; locale?: Locale }) {
  if (!agents.length) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {agents.map((agent) => (
        <AgentCard key={agent.slug} agent={agent} locale={locale} />
      ))}
    </div>
  );
}
