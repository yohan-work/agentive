## Goal

Persist every `/agents` filter (plus the search query) in the URL so a filtered view can be shared and survives a reload, without breaking the static export.

## Context

- Next.js 16 App Router, `output: "export"`, deployed to GitHub Pages. No middleware, no server-side `searchParams`: read the query string on the client with `useSearchParams`.
- `src/components/agents/agent-search-panel.tsx`: client component that keeps `query` and `filters` (`AgentFilters`) in `useState`. `AgentSearchPanelFromUrl` reads `?query=` once and passes it as `initialQuery`. The other filters (role, category, difficulty, automation level, tool, verified status, installable only) are never written to or read from the URL.
- `src/lib/search.ts`: `AgentFilters`, `searchAgents`, `filterAgents`, `getUniqueTools`.
- `src/app/[locale]/agents/page.tsx`: renders `<Suspense fallback={<AgentSearchPanel …/>}><AgentSearchPanelFromUrl …/></Suspense>`.
- `src/components/layout/top-nav.tsx`: the header search navigates to `/agents?query=…`.
- `tests/search.test.ts`: `node:test` suite, run with `npm test`.
- `src/i18n/dictionaries.ts`: every new UI string needs both `en` and `ko`.

## Requirements

1. Add two pure functions to `src/lib/search.ts` (no React or Next imports), so they can be unit tested:
   - `parseAgentFilters(params: URLSearchParams)` returns `{ query, filters: AgentFilters }`.
   - `serializeAgentFilters(query, filters)` returns a `URLSearchParams`.
2. Param names: `query`, `role`, `category`, `difficulty`, `automation`, `tool`, `verified`, `installable`. Encode each value exactly as it is stored in `AgentFilters`. If a field holds several values, join them with commas (`role=developer,designer`). `installable=1` means on. Leave out empty or default values, and always write params in the order listed here so the same filters always produce the same URL.
3. Invalid values are dropped one at a time, and parsing never throws. A value is invalid if it is not in the allowed set for its field (for `tool`, the set is the tools the agent list actually contains, as `getUniqueTools` returns them). Unknown param names are ignored. Examples: `?difficulty=expertish` gives no difficulty filter; `?automation=9` gives no automation filter; `?role=developer,bogus` gives `role=developer`; `?installable=yes` gives installable off.
4. On load, `AgentSearchPanelFromUrl` builds its initial state from `parseAgentFilters`, so both the result list and the highlighted chips match the URL.
5. Each change to a filter or the query writes the URL with `router.replace(`${pathname}?${params}`, { scroll: false })`, keeping the current locale path. When no params are left, write the bare pathname with no trailing `?`.
6. The panel follows URL changes that happen after mount (for example the header search while you are already on `/agents`): when `useSearchParams` changes, state is re-read from it.
7. "Clear all" removes every param. "Clear filters only" keeps `query` and removes the rest.
8. Top-nav search: when you are already on `/agents`, it only sets or replaces `query` and keeps every other param. From any other page it behaves as it does today (`/agents?query=…`).
9. The Suspense fallback still renders without reading search params, so the build keeps static.
10. Unit tests in `tests/search.test.ts` cover:
    - a round trip (serialize, then parse) of a fully populated filter set;
    - empty filters serializing to an empty string;
    - stable param order;
    - each invalid case listed in Requirement 3;
    - "clear filters only" keeping `query`, if you implement it as a helper.

### Suggested (not required)

- Debounce the URL write for typing in the search box (about 300 ms), so `replace` isn't called on every keystroke. Chip clicks still update right away.

## Non-goals

- Saving filters to localStorage.
- Changing the search ranking or `searchAgents` / `filterAgents` behavior.
- Adding new filter types or changing the filter UI.
- New dependencies.

## Acceptance checks

1. `npm run check:data`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all pass. `out/` contains `en/agents` and `ko/agents`, and the build reports no dynamic server usage.
2. Run `npm run dev` and open `/en/agents`. Select role "developer", difficulty "advanced", and installable only. The URL becomes `/en/agents?role=developer&difficulty=advanced&installable=1`, the page does not scroll to the top, and Back leaves `/agents` instead of stepping through each click.
3. Reload that URL, or open it in a new tab. The results and highlighted chips are the same.
4. Open `/en/agents?difficulty=expertish&automation=9&role=developer`. The page renders with only the developer filter applied, and there are no console errors.
5. With filters active and a query set, "Clear filters only" leaves only `?query=…` and "Clear all" leaves `/en/agents`.
6. On `/en/agents?role=developer`, search "review" from the header. The URL becomes `/en/agents?query=review&role=developer`, and both the search box and the results update.
7. Repeat check 2 on `/ko/agents`. The locale stays `ko`.
