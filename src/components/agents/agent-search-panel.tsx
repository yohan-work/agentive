"use client";

import { type ComponentProps, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Agent, Difficulty, VerifiedStatus } from "@/types/agent";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { filterAgents, getUniqueTools, searchAgents, type AgentFilters } from "@/lib/search";
import { titleCase } from "@/lib/utils";
import { AgentGrid } from "./agent-grid";

const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];
const statuses: VerifiedStatus[] = ["unverified", "community", "tested", "expert"];
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
  const dictionary = getDictionary(locale);
  const labels = dictionary.agentSearch;
  const meta = dictionary.agentMeta;
  const difficultyLabel = (value: string) => meta.difficulty[value as Difficulty];
  const statusLabel = (value: string) => meta.status[value as VerifiedStatus];
  const [query, setQuery] = useState(initialQuery);
  // When the URL query changes (e.g. top-nav search), adopt it without resetting the other filters.
  const [appliedInitialQuery, setAppliedInitialQuery] = useState(initialQuery);
  if (initialQuery !== appliedInitialQuery) {
    setAppliedInitialQuery(initialQuery);
    setQuery(initialQuery);
  }
  const [filters, setFilters] = useState<AgentFilters>({});
  const tools = useMemo(() => getUniqueTools(agents), [agents]);
  const results = useMemo(() => filterAgents(searchAgents(agents, query), filters), [agents, filters, query]);
  const activeFilters = [
    query ? `${labels.search}: ${query}` : undefined,
    filters.role ? `${labels.role}: ${titleCase(filters.role)}` : undefined,
    filters.category ? `${labels.category}: ${titleCase(filters.category)}` : undefined,
    filters.difficulty ? `${labels.difficulty}: ${difficultyLabel(filters.difficulty)}` : undefined,
    filters.automationLevel ? `${labels.automation}: ${filters.automationLevel}/5` : undefined,
    filters.tool ? `${labels.tool}: ${filters.tool}` : undefined,
    filters.verifiedStatus ? `${labels.verified}: ${statusLabel(filters.verifiedStatus)}` : undefined,
    filters.installableOnly ? labels.installableOnly : undefined
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
          placeholder={labels.placeholder}
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
          {labels.installableOnly}
        </label>
        <FilterRow title={labels.role} values={roles} active={filters.role} onSelect={(value) => setFilter("role", value)} />
        <FilterRow title={labels.category} values={categories} active={filters.category} onSelect={(value) => setFilter("category", value)} />
        <FilterRow
          title={labels.difficulty}
          values={difficulties}
          active={filters.difficulty}
          onSelect={(value) => setFilter("difficulty", value)}
          label={difficultyLabel}
        />
        <FilterRow title={labels.automation} values={levels} active={filters.automationLevel} onSelect={(value) => setFilter("automationLevel", value)} label={(value) => `${value}/5`} />
        <FilterRow title={labels.tool} values={tools} active={filters.tool} onSelect={(value) => setFilter("tool", value)} label={(value) => value} />
        <FilterRow
          title={labels.verified}
          values={statuses}
          active={filters.verifiedStatus}
          onSelect={(value) => setFilter("verifiedStatus", value)}
          label={statusLabel}
        />
      </div>

      <div className="rounded-lg border border-line bg-panel/45 p-4">
        <div className="flex flex-col gap-3 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between">
          <span>{formatCount(labels.showing, { shown: results.length, total: agents.length })}</span>
          <button type="button" onClick={clearAll} className="self-start text-sky-200 transition hover:text-primary sm:self-auto">
            {labels.clearAll}
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
        <p className="mt-3 text-xs text-muted">{labels.searchScope}</p>
      </div>

      <div className="flex items-center justify-between text-sm text-secondary">
        <span>{formatCount(labels.resultCount, { count: results.length })}</span>
        <button type="button" onClick={() => setFilters({})} className="text-sky-200 transition hover:text-primary">
          {labels.clearFilters}
        </button>
      </div>

      <AgentGrid agents={results} locale={locale} />
    </div>
  );
}

// Fills {name} placeholders in a dictionary string, highlighting the {shown} count as the old markup did.
function formatCount(template: string, values: Record<string, number>) {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = part.match(/^\{(\w+)\}$/)?.[1];
    if (!key || !(key in values)) return part;
    return (
      <span key={index} className={key === "shown" ? "font-semibold text-primary" : undefined}>
        {values[key]}
      </span>
    );
  });
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

/** Seeds the search box from `?query=` on the client. The static page renders the unfiltered list. */
export function AgentSearchPanelFromUrl(props: Omit<ComponentProps<typeof AgentSearchPanel>, "initialQuery">) {
  const query = useSearchParams().get("query") ?? "";
  return <AgentSearchPanel {...props} initialQuery={query} />;
}
