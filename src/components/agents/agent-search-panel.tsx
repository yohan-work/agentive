"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Agent } from "@/types/agent";
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
  categories
}: {
  agents: Agent[];
  initialQuery?: string;
  roles: string[];
  categories: string[];
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<AgentFilters>({});
  const tools = useMemo(() => getUniqueTools(agents), [agents]);
  const results = useMemo(() => filterAgents(searchAgents(agents, query), filters), [agents, filters, query]);

  function setFilter(key: keyof AgentFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: current[key] === value ? undefined : value }));
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
        <FilterRow title="Role" values={roles} active={filters.role} onSelect={(value) => setFilter("role", value)} />
        <FilterRow title="Category" values={categories} active={filters.category} onSelect={(value) => setFilter("category", value)} />
        <FilterRow title="Difficulty" values={difficulties} active={filters.difficulty} onSelect={(value) => setFilter("difficulty", value)} />
        <FilterRow title="Automation" values={levels} active={filters.automationLevel} onSelect={(value) => setFilter("automationLevel", value)} label={(value) => `${value}/5`} />
        <FilterRow title="Tool" values={tools} active={filters.tool} onSelect={(value) => setFilter("tool", value)} label={(value) => value} />
        <FilterRow title="Verified" values={statuses} active={filters.verifiedStatus} onSelect={(value) => setFilter("verifiedStatus", value)} />
      </div>

      <div className="flex items-center justify-between text-sm text-secondary">
        <span>{results.length} agents</span>
        <button type="button" onClick={() => setFilters({})} className="text-sky-200 transition hover:text-primary">
          Clear filters
        </button>
      </div>

      <AgentGrid agents={results} />
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
