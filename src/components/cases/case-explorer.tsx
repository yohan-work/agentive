"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/common/badge";
import { Card } from "@/components/common/card";
import { EmptyState } from "@/components/common/empty-state";
import { searchUseCases, type AgentUseCaseRecord } from "@/lib/use-cases";
import { titleCase } from "@/lib/utils";

type CaseFilters = {
  role?: string;
  category?: string;
  workflow?: string;
};

export function CaseExplorer({
  useCases,
  roles,
  categories,
  workflows
}: {
  useCases: AgentUseCaseRecord[];
  roles: string[];
  categories: string[];
  workflows: string[];
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CaseFilters>({});

  const results = useMemo(() => {
    return searchUseCases(useCases, query).filter((useCase) => {
      if (filters.role && !useCase.roles.includes(filters.role)) return false;
      if (filters.category && !useCase.categories.includes(filters.category)) return false;
      if (filters.workflow && useCase.recommendedWorkflow !== filters.workflow) return false;
      return true;
    });
  }, [filters, query, useCases]);

  const activeCount = [filters.role, filters.category, filters.workflow].filter(Boolean).length + (query ? 1 : 0);

  function setFilter(key: keyof CaseFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: current[key] === value ? undefined : value }));
  }

  function clearAll() {
    setQuery("");
    setFilters({});
  }

  return (
    <div className="space-y-6">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search use cases by problem, workflow, agent, role..."
          className="h-12 w-full rounded-lg border border-line bg-panel pl-10 pr-4 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <div className="space-y-4 rounded-lg border border-line bg-panel/60 p-4">
        <FilterRow title="Role" values={roles} active={filters.role} onSelect={(value) => setFilter("role", value)} />
        <FilterRow title="Category" values={categories} active={filters.category} onSelect={(value) => setFilter("category", value)} />
        <FilterRow title="Workflow" values={workflows} active={filters.workflow} onSelect={(value) => setFilter("workflow", value)} label={(value) => value} />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel/45 p-4 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing <span className="font-semibold text-primary">{results.length}</span> of {useCases.length} use cases
          {activeCount ? ` across ${activeCount} active filters` : ""}
        </span>
        <button type="button" onClick={clearAll} className="self-start text-sky-200 transition hover:text-primary sm:self-auto">
          Clear all
        </button>
      </div>

      {results.length ? (
        <div className="grid gap-4">
          {results.map((useCase) => (
            <CaseCard key={useCase.id} useCase={useCase} />
          ))}
        </div>
      ) : (
        <EmptyState title="No use cases found." description="Try another problem, role, workflow, or agent keyword." />
      )}
    </div>
  );
}

function CaseCard({ useCase }: { useCase: AgentUseCaseRecord }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {useCase.installable ? <Badge tone="success">Project-ready</Badge> : null}
            {useCase.roles.slice(0, 2).map((role) => (
              <Badge key={role}>{titleCase(role)}</Badge>
            ))}
            {useCase.categories.slice(0, 2).map((category) => (
              <Badge key={category} tone="accent">
                {titleCase(category)}
              </Badge>
            ))}
          </div>
          <h2 className="text-xl font-semibold text-primary">{useCase.title}</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">{useCase.problem}</p>
        </div>
        <Link href={`/agents/${useCase.agentSlug}`} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-sky-200">
          Use this agent now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Context" value={useCase.context} />
        <Field label="How to use" value={useCase.howToUse} />
        <Field label="Expected result" value={useCase.expectedResult} />
        <Field label="Recommended workflow" value={useCase.recommendedWorkflow ?? "Standalone agent"} />
      </div>

      <div className="mt-5 rounded-md border border-line bg-[#08090c] p-4">
        <p className="mb-2 font-mono text-xs text-muted">example input</p>
        <p className="text-sm leading-6 text-secondary">{useCase.exampleInput}</p>
      </div>
      <p className="mt-3 text-xs text-muted">Agent: {useCase.agentName}</p>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="text-sm leading-6 text-secondary">{value}</p>
    </div>
  );
}

function FilterRow({
  title,
  values,
  active,
  onSelect,
  label = titleCase
}: {
  title: string;
  values: string[];
  active?: string;
  onSelect: (value: string) => void;
  label?: (value: string) => string;
}) {
  if (!values.length) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={
              active === value
                ? "rounded-md border border-accent/40 bg-accent/15 px-2.5 py-1 text-xs font-medium text-sky-200"
                : "rounded-md border border-line bg-elevated px-2.5 py-1 text-xs font-medium text-secondary transition hover:border-accent/35 hover:text-primary"
            }
          >
            {label(value)}
          </button>
        ))}
      </div>
    </div>
  );
}
