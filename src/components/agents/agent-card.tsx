import Link from "next/link";
import { ArrowRight, Gauge, Wrench } from "lucide-react";
import type { Agent } from "@/types/agent";
import { Badge, DifficultyBadge, StatusBadge } from "@/components/common/badge";
import { Card } from "@/components/common/card";
import { Tag } from "@/components/common/tag";
import { titleCase } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className="group flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={agent.verifiedStatus} />
          <DifficultyBadge difficulty={agent.difficulty} />
          {agent.installTargets?.length ? <Badge tone="success">Installable</Badge> : null}
        </div>
        <BookmarkButton slug={agent.slug} compact />
      </div>
      <Link href={`/agents/${agent.slug}`} className="block">
        <h3 className="text-lg font-semibold text-primary transition group-hover:text-sky-200">{agent.name}</h3>
        <p className="mt-2 min-h-[48px] text-sm leading-6 text-secondary">{agent.summary}</p>
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        {agent.tags.slice(0, 4).map((tag) => (
          <Tag key={tag} value={tag} />
        ))}
      </div>
      <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-secondary">
        <div className="flex flex-wrap gap-2">
          {agent.roles.slice(0, 3).map((role) => (
            <Badge key={role}>{titleCase(role)}</Badge>
          ))}
        </div>
        <p className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted" />
          Automation level {agent.automationLevel}/5
        </p>
        <p className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted" />
          {agent.tools.slice(0, 3).join(", ")}
        </p>
      </div>
      <Link href={`/agents/${agent.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky-200">
        View agent <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  );
}
