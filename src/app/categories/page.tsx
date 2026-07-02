import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/common/card";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { categories } from "@/data/taxonomy";
import { defaultLocale, type Locale, withLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getRequestLocale } from "@/i18n/server";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Categories"
};

function CategoriesPageContent({ locale = defaultLocale }: { locale?: Locale }) {
  const dictionary = getDictionary(locale);

  return (
    <AppShell toc={[{ title: dictionary.categories.title, href: "#categories" }]}>
      <header id="categories" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{dictionary.categories.eyebrow}</p>
        <h1 className="text-4xl font-semibold text-primary">{dictionary.categories.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          {dictionary.categories.description}
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const categoryAgents = agents.filter((agent) => agent.categories.includes(category.slug));
          return (
            <Link key={category.slug} href={withLocale(`/categories/${category.slug}`, locale)}>
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

export default async function CategoriesPage() {
  return <CategoriesPageContent locale={await getRequestLocale()} />;
}
