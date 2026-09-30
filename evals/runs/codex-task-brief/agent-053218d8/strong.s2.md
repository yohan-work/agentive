## Goal

Store all `/agents` filters (and the search query) in the URL. A filtered view should then be shareable, survive a reload, and restore the same results and highlighted chips.

## Context

- Next.js 16 App Router, `output: "export"`, deployed to GitHub Pages. There is no middleware and no server-side `searchParams`. Read query strings on the client with `useSearchParams`.
- Pages live under `src/app/[locale]/` (`en`, `ko`). `src/app/[locale]/agents/page.tsx` renders `<Suspense fallback={<AgentSearchPanel .../>}><AgentSearchPanelFromUrl .../></Suspense>`.
- `src/components/agents/agent-search-panel.tsx` is a client component. It holds `query` and `filters: AgentFilters` in `useState`. `AgentSearchPanelFromUrl` reads `?query=` once and passes it in as `initialQuery`. All other filters exist only in React state.
- `src/lib/search.ts` contains `AgentFilters`, `searchAgents`, `filterAgents`, and `getUniqueTools`.
- `src/components/layout/top-nav.tsx`: the header search navigates to `/agents?query=...`.
- `tests/search.test.ts` runs through `npm test` (node:test with the tsx loader).
- `src/i18n/dictionaries.ts`: every new UI string needs both an `en` and a `ko` entry.

## Requirements

1. Add pure functions `parseAgentFilters(params: URLSearchParams)` and `serializeAgentFilters(query, filters): URLSearchParams` to `src/lib/search.ts`. Both functions must cover every field of `AgentFilters` and `query`.
2. Param names: `query`, `role`, `category`, `difficulty`, `automation`, `tool`, `verified`, `installable`.
   - `installable` is written as `installable=1` and left out when false.
   - [ASSUMPTION] If an `AgentFilters` field holds several values, write it as one comma-separated param (for example `role=developer,designer`). Use the existing field shapes. Do not change the type.
3. Validation is one rule: a value that is not one of the allowed values for its field is dropped. This covers unknown enum values, `?automation=9`, empty strings, and unknown params. The remaining valid params still apply. Parsing never throws.
   - Allowed values come from the existing types and data: the `AgentFilters` unions, and the agent data for `tool` via `getUniqueTools`.
   - Inputs that equal the default (empty or false) are not written. Params are written in a fixed order, so the same state always produces the same URL.
4. On first render, the panel builds its `query` and `filters` from the URL.
   - The panel re-syncs when the URL changes from outside the panel, for example when the header search runs while `/agents` is already open.
   - Replace the one-time `initialQuery` seeding.
5. Every filter change, query edit, "Clear all", and "Clear filters only" updates the URL with `router.replace(`${pathname}?${params}`, { scroll: false })`, keeping the current locale path. It must not create a history entry per click or scroll to the top.
   - "Clear all" leaves the URL with no params.
   - "Clear filters only" leaves only `?query=` (or no params if the query is empty).
6. Header search in `top-nav.tsx`:
   - On an `/agents` page, it sets or replaces `query` and keeps every other current param.
   - On any other page, it keeps today's behavior (`/agents?query=...`).
7. The Suspense fallback (`AgentSearchPanel` without URL state) keeps working, so the static build does not need `searchParams` at build time.
8. Unit tests in `tests/search.test.ts` must cover:
   - a round trip (serialize, then parse, returns equal state) for a state that sets every field;
   - defaults being left out of the output;
   - invalid values being dropped while valid siblings are kept (`?difficulty=expertish&role=developer` returns only `role`; `?automation=9` returns no automation filter);
   - `installable=1` compared with a missing param or `installable=0`.

**Suggested (not required)**
- Debounce URL writes while typing in the search box (about 300 ms), so `router.replace` does not run on every keystroke.
- On the next write, remove invalid params that were dropped from the URL.

## Non-goals

- Saving filters to localStorage or any other storage.
- Changing search ranking, `searchAgents` or `filterAgents` logic, or adding new filter types.
- Adding dependencies, middleware, or server-side `searchParams` usage.
- Changing the design of the filter UI beyond what URL syncing needs.

## Acceptance checks

- `npm run check:data`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` all pass. `npm run build` produces `out/` with no dynamic-server-usage errors.
- Selecting Developer, Advanced, and Installable only in `npm run dev` turns the URL into `/en/agents?role=developer&difficulty=advanced&installable=1`. The back button does not step through each click, and the page does not scroll to the top.
- Opening that URL directly in a new tab, and doing the same under `/ko/agents?...`, shows the same result count and the same highlighted chips.
- `/en/agents?difficulty=expertish&automation=9&role=developer` renders without errors and applies only the `role` filter.
- With filters active, "Clear filters only" leaves only `?query=...`, and "Clear all" leaves `/en/agents` with no params.
- With `/en/agents?role=developer` open, using the header search for "review" gives `?query=review&role=developer`. The role chip stays highlighted and the results update without a reload.
