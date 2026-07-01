import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckSquare, Code2, FileCode2, FolderDown } from "lucide-react";
import { Badge } from "@/components/common/badge";
import { Card } from "@/components/common/card";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";

export const metadata: Metadata = {
  title: "Install Agents"
};

const toc = [
  { title: "Install agents", href: "#install" },
  { title: "How it works", href: "#how-it-works" },
  { title: "Recommended starts", href: "#recommended-starts" },
  { title: "Project-ready agents", href: "#project-ready" }
];

export default function InstallPage() {
  const installableAgents = agents.filter((agent) => agent.installTargets?.length);

  return (
    <AppShell toc={toc}>
      <header id="install" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Project-ready</p>
        <h1 className="text-4xl font-semibold text-primary">Install Agents</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary">
          Download agent kits, copy the generated files into your project, and use the included runbook to prepare context and review outputs.
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
            <p className="mt-2 text-sm leading-6 text-secondary">Use RUNBOOK.md to check assumptions, risks, missing context, and handoff quality.</p>
          </Card>
        </div>
      </section>

      <section id="recommended-starts" className="border-b border-line py-8">
        <h2 className="text-2xl font-semibold text-primary">Recommended starts</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["I want better Codex task briefs", "codex-task-brief"],
            ["I want better PR/code review", "pr-review-agent"],
            ["I want reusable team workflows", "operations-sop-agent"]
          ].map(([title, slug]) => (
            <Link key={slug} href={`/agents/${slug}`}>
              <Card className="h-full p-5">
                <h3 className="font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">Open the agent, copy the input template, then download the kit when it fits your workflow.</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-200">
                  Start here <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section id="project-ready" className="py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Project-ready agents</h2>
            <p className="mt-2 text-sm text-secondary">{installableAgents.length} agents currently include install kits.</p>
          </div>
          <Link href="/agents" className="hidden text-sm font-medium text-sky-200 sm:inline-flex">
            Browse all agents
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {installableAgents.map((agent) => (
            <Link key={agent.slug} href={`/agents/${agent.slug}`}>
              <Card className="h-full p-5">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge tone="success">Installable</Badge>
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
