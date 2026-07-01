import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/common/card";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { categories } from "@/data/taxonomy";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Categories"
};

export default function CategoriesPage() {
  return (
    <AppShell toc={[{ title: "Categories", href: "#categories" }]}>
      <header id="categories" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Taxonomy</p>
        <h1 className="text-4xl font-semibold text-primary">Categories</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          Browse agents by the kind of work they support.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const categoryAgents = agents.filter((agent) => agent.categories.includes(category.slug));
          return (
            <Link key={category.slug} href={`/categories/${category.slug}`}>
              <Card className="h-full p-5">
                <p className="text-sm text-muted">{pluralize(categoryAgents.length, "agent")}</p>
                <h2 className="mt-2 text-xl font-semibold text-primary">{category.name}</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">{category.description}</p>
                <p className="mt-4 text-xs leading-5 text-muted">
                  Featured: {categoryAgents.slice(0, 3).map((agent) => agent.name).join(", ") || "No agents yet"}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-200">
                  Browse category <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
