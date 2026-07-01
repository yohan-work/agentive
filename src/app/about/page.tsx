import type { Metadata } from "next";
import { Card } from "@/components/common/card";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "About"
};

export default function AboutPage() {
  return (
    <AppShell toc={[{ title: "What it is", href: "#what-it-is" }, { title: "Roadmap", href: "#roadmap" }]}>
      <header id="what-it-is" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">About</p>
        <h1 className="text-4xl font-semibold text-primary">Agent Archive</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-secondary">
          Agent Archive is a curated library of AI agents, prompts, and workflow recipes for real-world work. The MVP focuses on information architecture, search, detailed usage context, copy-ready prompts, and workflow packs.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Work context", "Agents are described by use case, input, output, and limits."],
          ["Reusable prompts", "Every detail page includes a copy-ready prompt block."],
          ["Future platform", "The structure can later expand into execution, submissions, teams, and private archives."]
        ].map(([title, description]) => (
          <Card key={title} className="p-5">
            <h2 className="font-semibold text-primary">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">{description}</p>
          </Card>
        ))}
      </section>
      <section id="roadmap" className="mt-10 border-t border-line pt-8">
        <h2 className="text-2xl font-semibold text-primary">Roadmap</h2>
        <ul className="mt-4 grid gap-3 text-sm text-secondary">
          {["Supabase database", "Authentication", "Community submissions", "Agent execution", "Team workspace", "Private internal agent archive"].map((item) => (
            <li key={item} className="rounded-md border border-line bg-panel px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
