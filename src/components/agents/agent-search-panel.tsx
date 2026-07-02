"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Agent } from "@/types/agent";
import { defaultLocale, type Locale } from "@/i18n/config";
import { filterAgents, getUniqueTools, searchAgents, type AgentFilters } from "@/lib/search";
import { titleCase } from "@/lib/utils";
import { AgentGrid } from "./agent-grid";

const difficulties = ["beginner", "intermediate", "advanced"];
const statuses = ["unverified", "tested", "community", "expert"];
const levels = ["1", "2", "3", "4", "5"];

export function AgentSearchPanel({
  agents,
  initialQuery = "",
  roles,
  categories,
  locale = defaultLocale
}: {
  agents: Agent[];
  initialQuery?: string;
  roles: string[];
  categories: string[];
  locale?: Locale;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<AgentFilters>({});
  const tools = useMemo(() => getUniqueTools(agents), [agents]);
  const results = useMemo(() => filterAgents(searchAgents(agents, query), filters), [agents, filters, query]);
  const activeFilters = [
    query ? `Search: ${query}` : undefined,
    filters.role ? `Role: ${titleCase(filters.role)}` : undefined,
    filters.category ? `Category: ${titleCase(filters.category)}` : undefined,
    filters.difficulty ? `Difficulty: ${titleCase(filters.difficulty)}` : undefined,
    filters.automationLevel ? `Automation: ${filters.automationLevel}/5` : undefined,
    filters.tool ? `Tool: ${filters.tool}` : undefined,
    filters.verifiedStatus ? `Verified: ${titleCase(filters.verifiedStatus)}` : undefined,
    filters.installableOnly ? "Installable only" : undefined
  ].filter((item): item is string => Boolean(item));

  function setFilter(key: keyof AgentFilters, value: string) {
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
          placeholder="Search by name, role, task, tag, or tool..."
          className="h-12 w-full rounded-lg border border-line bg-panel pl-10 pr-4 text-sm text-primary outline-none transition placeholder:text-muted focus:border-accent/55 focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <div className="space-y-4 rounded-lg border border-line bg-panel/60 p-4">
        <label className="flex items-center gap-3 rounded-md border border-line bg-elevated px-3 py-2 text-sm text-secondary">
          <input
            type="checkbox"
            checked={Boolean(filters.installableOnly)}
            onChange={(event) => setFilters((current) => ({ ...current, installableOnly: event.target.checked }))}
            className="h-4 w-4 accent-sky-400"
          />
          Installable only
        </label>
        <FilterRow title="Role" values={roles} active={filters.role} onSelect={(value) => setFilter("role", value)} />
        <FilterRow title="Category" values={categories} active={filters.category} onSelect={(value) => setFilter("category", value)} />
        <FilterRow title="Difficulty" values={difficulties} active={filters.difficulty} onSelect={(value) => setFilter("difficulty", value)} />
        <FilterRow title="Automation" values={levels} active={filters.automationLevel} onSelect={(value) => setFilter("automationLevel", value)} label={(value) => `${value}/5`} />
        <FilterRow title="Tool" values={tools} active={filters.tool} onSelect={(value) => setFilter("tool", value)} label={(value) => value} />
        <FilterRow title="Verified" values={statuses} active={filters.verifiedStatus} onSelect={(value) => setFilter("verifiedStatus", value)} />
      </div>

      <div className="rounded-lg border border-line bg-panel/45 p-4">
        <div className="flex flex-col gap-3 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing <span className="font-semibold text-primary">{results.length}</span> of {agents.length} agents
          </span>
          <button type="button" onClick={clearAll} className="self-start text-sky-200 transition hover:text-primary sm:self-auto">
            Clear all
          </button>
        </div>
        {activeFilters.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span key={filter} className="rounded-md border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-medium text-sky-200">
                {filter}
              </span>
            ))}
          </div>
        ) : null}
        <p className="mt-3 text-xs text-muted">
          Search includes agent metadata, tools, prompt context, and Korean real-use-case scenarios.
        </p>
      </div>

      <div className="flex items-center justify-between text-sm text-secondary">
        <span>{results.length} agents</span>
        <button type="button" onClick={() => setFilters({})} className="text-sky-200 transition hover:text-primary">
          Clear filters only
        </button>
      </div>

      <AgentGrid agents={results} locale={locale} />
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
