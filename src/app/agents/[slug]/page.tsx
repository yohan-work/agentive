import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentDetailHeader } from "@/components/agents/agent-detail-header";
import { AgentExportPanel } from "@/components/agents/agent-export-panel";
import { DetailSection } from "@/components/agents/detail-section";
import { RelatedAgents } from "@/components/agents/related-agents";
import { CodeBlock } from "@/components/common/code-block";
import { Tag } from "@/components/common/tag";
import { AppShell } from "@/components/layout/app-shell";
import { agents, getAgentBySlug } from "@/data/agents";

const toc = [
  { title: "What this agent does", href: "#what-this-agent-does" },
  { title: "Use this agent", href: "#use-this-agent" },
  { title: "When to use", href: "#when-to-use" },
  { title: "Inputs", href: "#inputs" },
  { title: "Outputs", href: "#outputs" },
  { title: "Prompt", href: "#prompt" },
  { title: "Example", href: "#example" },
  { title: "Best practices", href: "#best-practices" },
  { title: "Limitations", href: "#limitations" },
  { title: "Related agents", href: "#related-agents" }
];

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  return {
    title: agent?.name ?? "Agent"
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const related = (agent.relatedAgents ?? [])
    .map((relatedSlug) => getAgentBySlug(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <AppShell toc={toc}>
      <AgentDetailHeader agent={agent} />
      <DetailSection id="what-this-agent-does" title="What this agent does">
        <p>{agent.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {agent.tags.map((tag) => (
            <Tag key={tag} value={tag} />
          ))}
        </div>
      </DetailSection>
      <DetailSection id="use-this-agent" title="Use this agent">
        <AgentExportPanel agent={agent} />
      </DetailSection>
      <DetailSection id="when-to-use" title="When to use">
        <List items={agent.useCases} />
      </DetailSection>
      <DetailSection id="inputs" title="Inputs">
        <List items={agent.inputs} />
      </DetailSection>
      <DetailSection id="outputs" title="Outputs">
        <List items={agent.outputs} />
      </DetailSection>
      <DetailSection id="prompt" title="Prompt">
        <CodeBlock value={agent.prompt} />
      </DetailSection>
      <DetailSection id="example" title="Example">
        <div className="grid gap-4 md:grid-cols-2">
          <ExampleBlock title="Example input" value={agent.exampleInput ?? "No example input provided."} />
          <ExampleBlock title="Example output" value={agent.exampleOutput ?? "No example output provided."} />
        </div>
      </DetailSection>
      <DetailSection id="best-practices" title="Best practices">
        <List items={agent.bestPractices ?? []} />
      </DetailSection>
      <DetailSection id="limitations" title="Limitations">
        <List items={agent.limitations ?? []} />
      </DetailSection>
      <DetailSection id="related-agents" title="Related agents">
        <RelatedAgents agents={related} />
      </DetailSection>
    </AppShell>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="rounded-md border border-line bg-panel px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function ExampleBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <h3 className="mb-2 text-sm font-semibold text-primary">{title}</h3>
      <p className="text-sm leading-6 text-secondary">{value}</p>
    </div>
  );
}
