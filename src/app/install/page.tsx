import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckSquare, Code2, FileCode2, FolderDown } from "lucide-react";
import { Badge } from "@/components/common/badge";
import { Card } from "@/components/common/card";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { starterPacks } from "@/data/starter-packs";
import { defaultLocale, type Locale, withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";

export const metadata: Metadata = {
  title: "Install Agents"
};

function InstallPageContent({ locale = defaultLocale }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);
  const toc = [
    { title: dictionary.install.title, href: "#install" },
    { title: "How it works", href: "#how-it-works" },
    { title: dictionary.install.starterPacks, href: "#starter-packs" },
    { title: dictionary.install.projectReadyAgents, href: "#project-ready" }
  ];
  const installableAgents = agents
    .filter((agent) => agent.installTargets?.length)
    .sort((a, b) => (b.evaluation?.qualityScore ?? 0) - (a.evaluation?.qualityScore ?? 0) || a.name.localeCompare(b.name));
  const agentsBySlug = new Map(installableAgents.map((agent) => [agent.slug, agent]));

  return (
    <AppShell toc={toc}>
      <header id="install" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.install.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-primary">{dictionary.install.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary">
          {dictionary.install.description}
        </p>
      </header>

      <section id="how-it-works" className="border-b border-line pb-8">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5">
            <FolderDown className="mb-4 h-6 w-6 text-sky-200" />
            <h2 className="font-semibold text-primary">Download Kit</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">Open an installable agent and download project-ready files from the Use this agent panel.</p>
          </Card>
          <Card className="p-5">
            <FileCode2 className="mb-4 h-6 w-6 text-sky-200" />
            <h2 className="font-semibold text-primary">Copy Files</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">Place AGENTS.md and CLAUDE.md in the project root, and Cursor rules in .cursor/rules.</p>
          </Card>
          <Card className="p-5">
            <Code2 className="mb-4 h-6 w-6 text-sky-200" />
            <h2 className="font-semibold text-primary">Run With Context</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">Ask your coding agent to follow the installed file while working on the repository.</p>
          </Card>
          <Card className="p-5">
            <CheckSquare className="mb-4 h-6 w-6 text-sky-200" />
            <h2 className="font-semibold text-primary">Review Output</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">Use RUNBOOK.md and EVALUATION.md to check assumptions, sample outputs, risks, and handoff quality.</p>
          </Card>
        </div>
      </section>

      <section id="starter-packs" className="border-b border-line py-8">
        <h2 className="text-2xl font-semibold text-primary">{dictionary.install.starterPacks}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
          Pick a pack when you know the project role but not the exact agent. Each pack links to installable agents with runbooks and quality evaluations.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {starterPacks.map((pack) => {
            const packAgents = pack.steps.map((step) => agentsBySlug.get(step.agentSlug)).filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
            const averageQuality =
              packAgents.reduce((total, agent) => total + (agent.evaluation?.qualityScore ?? 0), 0) / Math.max(packAgents.length, 1);
            const firstAgent = agentsBySlug.get(pack.firstAgentSlug);

            return (
              <Card key={pack.slug} className="h-full p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="success">{packAgents.length} agents</Badge>
                  <Badge tone="accent">Avg quality {averageQuality.toFixed(1)}/5</Badge>
                  <Badge>{pack.estimatedTime}</Badge>
                </div>
                <h3 className="text-lg font-semibold text-primary">{pack.name}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{pack.summary}</p>
                <p className="mt-3 text-sm leading-6 text-secondary">
                  Start with{" "}
                  {firstAgent ? (
                    <Link
                      href={withLocale(`/agents/${firstAgent.slug}`, locale)}
                      className="font-medium text-sky-200 transition hover:text-primary"
                    >
                      {firstAgent.name}
                    </Link>
                  ) : (
                    "the first listed agent"
                  )}
                  . Final output: {pack.finalOutput}
                </p>
                <div className="mt-4 space-y-3">
                  {pack.steps.map((step) => {
                    const agent = agentsBySlug.get(step.agentSlug);

                    if (!agent) {
                      return null;
                    }

                    return (
                      <div key={`${pack.slug}-${step.agentSlug}`} className="rounded-md border border-line bg-elevated p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold text-primary">
                            {step.order}. {agent.name}
                          </p>
                          <Link
                            href={withLocale(`/agents/${agent.slug}`, locale)}
                            className="text-xs font-medium text-sky-200 transition hover:text-primary"
                          >
                            Open agent
                          </Link>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-secondary">{step.purpose}</p>
                        <p className="mt-2 text-xs leading-5 text-muted">Handoff: {step.handoff}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="project-ready" className="py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-primary">{dictionary.install.projectReadyAgents}</h2>
            <p className="mt-2 text-sm text-secondary">{installableAgents.length} agents currently include install kits.</p>
          </div>
          <Link href={withLocale("/agents", locale)} className="hidden text-sm font-medium text-sky-200 sm:inline-flex">
            Browse all agents
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {installableAgents.map((agent) => (
            <Link key={agent.slug} href={withLocale(`/agents/${agent.slug}`, locale)}>
              <Card className="h-full p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="success">Installable</Badge>
                  {agent.evaluation ? <Badge tone="accent">Quality {agent.evaluation.qualityScore}/5</Badge> : null}
                  {agent.installTargets?.map((target) => (
                    <Badge key={target}>{target}</Badge>
                  ))}
                </div>
                <h3 className="text-lg font-semibold text-primary">{agent.name}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{agent.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-200">
                  Open kit <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default async function InstallPage() {
  return <InstallPageContent locale={await getRequestLocale()} />;
}
