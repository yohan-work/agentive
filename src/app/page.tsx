import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AgentGrid } from "@/components/agents/agent-grid";
import { ButtonLink } from "@/components/common/button";
import { Card } from "@/components/common/card";
import { SectionHeading } from "@/components/common/section-heading";
import { ImpactShowcase } from "@/components/impact/impact-showcase";
import { AppShell } from "@/components/layout/app-shell";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { featuredAgents } from "@/data/agents";
import { impactScenarios } from "@/data/impact-scenarios";
import { categories, roles, taskTags } from "@/data/taxonomy";
import { workflows } from "@/data/workflows";
import { defaultLocale, type Locale, withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";

const browseTasks = Array.from(new Set([...taskTags, ...categories.slice(0, 4).map((category) => category.slug)]));

function HomePageContent({ locale = defaultLocale }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);
  const toc = [
    { title: dictionary.home.overviewTitle, href: "#overview" },
    { title: "Impact", href: "#impact" },
    { title: dictionary.home.featuredAgents, href: "#featured-agents" },
    { title: dictionary.home.browseByRole, href: "#browse-by-role" },
    { title: dictionary.home.browseByTask, href: "#browse-by-task" },
    { title: dictionary.home.workflowPacks, href: "#workflow-packs" }
  ];

  return (
    <AppShell toc={toc}>
      <section className="border-b border-line pb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.home.eyebrow}</p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-normal text-primary sm:text-6xl">{dictionary.home.title}</h1>
        <p className="mt-4 max-w-3xl text-xl leading-8 text-secondary">
          {dictionary.home.subtitle}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary">
          {dictionary.home.description}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink href={withLocale("/agents", locale)} variant="primary">
            {dictionary.common.browseAgents} <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href={withLocale("/workflows", locale)}>{dictionary.common.exploreWorkflows}</ButtonLink>
        </div>
      </section>

      <section id="overview" className="border-b border-line py-10">
        <SectionHeading
          title={dictionary.home.overviewTitle}
          description={dictionary.home.overviewDescription}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {["Context first", "Copy-ready prompts", "Workflow packs"].map((item) => (
            <Card key={item} className="p-5">
              <h3 className="font-semibold text-primary">{item}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Agents are organized around actual jobs to be done, not abstract prompt tricks.
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section id="impact" className="border-b border-line py-10">
        <SectionHeading
          title={dictionary.home.impactTitle}
          description={dictionary.home.impactDescription}
        />
        <ImpactShowcase scenarios={impactScenarios} locale={locale} />
      </section>

      <section id="featured-agents" className="border-b border-line py-10">
        <SectionHeading title={dictionary.home.featuredAgents} description={dictionary.home.featuredDescription} />
        <AgentGrid agents={featuredAgents} locale={locale} />
      </section>

      <section id="browse-by-role" className="border-b border-line py-10">
        <SectionHeading title={dictionary.home.browseByRole} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.slice(0, 6).map((role) => (
            <Link key={role.slug} href={withLocale(`/roles/${role.slug}`, locale)} className="rounded-lg border border-line bg-panel p-4 transition hover:border-accent/35 hover:bg-elevated">
              <h3 className="font-semibold text-primary">{role.name}</h3>
              <p className="mt-1 text-sm leading-6 text-secondary">{role.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="browse-by-task" className="border-b border-line py-10">
        <SectionHeading title={dictionary.home.browseByTask} />
        <div className="flex flex-wrap gap-2">
          {browseTasks.map((task) => (
            <Link key={task} href={`${withLocale("/agents", locale)}?query=${task}`} className="rounded-md border border-line bg-elevated px-3 py-2 text-sm text-secondary transition hover:border-accent/35 hover:text-primary">
              {task}
            </Link>
          ))}
        </div>
      </section>

      <section id="workflow-packs" className="py-10">
        <SectionHeading title={dictionary.home.workflowPacks} description={dictionary.home.workflowDescription} />
        <div className="grid gap-4">
          {workflows.slice(0, 4).map((workflow) => (
            <WorkflowCard key={workflow.slug} workflow={workflow} locale={locale} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default async function HomePage() {
  return <HomePageContent locale={await getRequestLocale()} />;
}
