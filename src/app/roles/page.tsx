import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/common/card";
import { AppShell } from "@/components/layout/app-shell";
import { agents } from "@/data/agents";
import { roles } from "@/data/taxonomy";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Roles"
};

export default function RolesPage() {
  return (
    <AppShell toc={[{ title: "Roles", href: "#roles" }]}>
      <header id="roles" className="mb-8 border-b border-line pb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Audience</p>
        <h1 className="text-4xl font-semibold text-primary">Roles</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">
          Start from the user role and find agents that fit the work context.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const count = agents.filter((agent) => agent.roles.includes(role.slug)).length;
          return (
            <Link key={role.slug} href={`/roles/${role.slug}`}>
              <Card className="h-full p-5">
                <p className="text-sm text-muted">{pluralize(count, "agent")}</p>
                <h2 className="mt-2 text-xl font-semibold text-primary">{role.name}</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">{role.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-200">
                  Browse role <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
