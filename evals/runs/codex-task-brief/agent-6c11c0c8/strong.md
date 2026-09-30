# Task brief: persist /agents filters in the URL

## 1. Goal

Make every filter on the /agents page (plus the search query) round-trip through the URL, so a filtered view can be shared as a link and survives a reload, without breaking the static export.

## 2. Context

- Stack: Next.js 16 App Router, TypeScript, Tailwind. `output: "export"` static build deployed to GitHub Pages. No middleware and no server-side `searchParams`; query strings are read on the client with `useSearchParams`.
- Pages live under `src/app/[locale]/` (locales: `en`, `ko`).
- `src/components/agents/agent-search-panel.tsx` (client component): holds `query` and `filters` (type `AgentFilters`) in `useState`. Exports:
  - `AgentSearchPanel`: the panel itself.
  - `AgentSearchPanelFromUrl`: reads `?query=` via `useSearchParams` and passes it as `initialQuery`. Today it only seeds the query once; role, category, difficulty, automation level, tool, verified status, and "installable only" are React state only and are lost on reload.
- `src/lib/search.ts`: `AgentFilters` type, `searchAgents`, `filterAgents`, `getUniqueTools`.
- `src/app/[locale]/agents/page.tsx`: renders `<Suspense fallback={<AgentSearchPanel .../>}><AgentSearchPanelFromUrl .../></Suspense>`. The Suspense boundary is what lets `useSearchParams` work in a static export. Keep it.
- `src/components/layout/top-nav.tsx`: the header search navigates to `/agents?query=...`.
- `tests/search.test.ts`: `node:test` suite, run with `npm test` (tsx loader).
- `src/i18n/dictionaries.ts`: any new UI string must be added to both `en` and `ko`.

## 3. Requirements

**URL format**

1. Filters are stored as query params on the /agents URL. Use these names: `query`, `role`, `difficulty`, `automation`, `installable`. For the other three filters, use `category`, `tool`, and `verified` [ASSUMPTION: the request does not name these params. If you choose different names, state them in the PR description].
2. Each param's value must match the value the matching `AgentFilters` field already stores. Read `AgentFilters` in `src/lib/search.ts` before writing code, and keep its shape. If a field is multi-select (an array), serialize it as one comma-separated param (`?role=developer,designer`) [ASSUMPTION: the request only shows single values].
3. `installable` is written as `installable=1` only when "installable only" is on. When it is off, the param is left out.
4. Serialization leaves out every filter that is at its default or empty value, so an unfiltered page has a bare `/agents` URL. Params are written in a fixed order: `query` first, then the filters in the order of `AgentFilters`. The same state must always produce the same string.

**Pure parse/serialize functions** (in `src/lib/search.ts`, next to `AgentFilters`)

5. Add `parseAgentFilters(params: URLSearchParams, …)` that returns `{ query, filters }`, and `serializeAgentFilters({ query, filters })` that returns a query string with no leading `?`. The names are suggestions; the functions themselves are required. Neither function may touch React, `window`, or the router, so both can be unit tested.
6. Invalid values are ignored one param at a time and never throw:
   - An unknown enum value (`?difficulty=expertish`, `?automation=9`, `?verified=maybe`) means that filter falls back to its default.
   - Valid params in the same URL still apply. For example, `?role=developer&difficulty=expertish` filters by role only.
   - `tool` is valid only if it appears in `getUniqueTools(...)` for the loaded agents, so the parser takes the list of allowed tools as an argument.
   - `installable` counts as on only when the value is `1`. Any other value is off.
   - For list params, keep the valid entries and drop the invalid ones.
   - Repeated params (`?role=a&role=b`): use the first one [ASSUMPTION].
   - Empty values (`?role=`) mean the default.
   - For each allowed value set, reuse the constant the filter chips are built from. Do not write a second copy of the list.
7. Round trip: for any valid state, `parseAgentFilters(new URLSearchParams(serializeAgentFilters(state)))` must equal `state`.

**Panel behavior** (`agent-search-panel.tsx`)

8. On load, `AgentSearchPanelFromUrl` parses every param, not only `query`. The first client render then shows the filtered results and the highlighted chips.
9. Every filter change writes the URL with `router.replace(url, { scroll: false })`, where `router` comes from `next/navigation`. That call must not add a history entry and must not scroll the page. Build the path from `usePathname()` so the locale prefix (`/en/`, `/ko/`) and any deploy base path carry over. Do not hard-code `/en/agents`.
10. The URL always holds the current `query` together with the filters, so an edited search box is never overwritten by a stale `?query=` [ASSUMPTION: typing in the search box also updates `?query=`].
11. The panel follows later URL changes too, not just the first load: if the search params change while the page is mounted (for example, the top-nav search is used on /agents), the panel's state updates. Avoid a state → URL → state loop: do not call `replace` when the serialized string already equals the current search string.
12. "Clear all" resets both query and filters, which leaves a bare `/agents`. "Clear filters only" resets the filters and keeps `?query=`. If either control does not exist yet, add it, with its label in both `en` and `ko` in `dictionaries.ts` [ASSUMPTION: the acceptance criteria assume both exist].
13. The `Suspense` fallback (`AgentSearchPanel` with no URL state) stays as it is. The statically rendered HTML is unfiltered, and the client applies the URL on hydration.

**Top-nav search** (`top-nav.tsx`)

14. When the header search is submitted while the current page is /agents, it keeps every current param except `query`, sets `query` to the new term, and removes `query` if the term is empty. On any other page it keeps today's behavior and goes to `/agents?query=...`, keeping the current locale prefix as it does today.

**Tests** (`tests/search.test.ts`)

15. Add unit tests for:
    - The round trip in requirement 7 for a state with every filter set, and for the empty state (which serializes to `""`).
    - Every invalid case in requirement 6: `expertish`, `automation=9`, an unknown tool, `installable=true`, `installable=0`, an empty value, and a valid param next to an invalid one.
    - Stable param order.
    - Leaving out default values.

### Suggested (not required)

- Debounce the URL write while the user types in the search box (about 300 ms). Chip clicks still write immediately.
- When a URL with invalid values loads, rewrite it to the cleaned form once with `replace`.

## 4. Non-goals

- Saving filters to localStorage or any other storage.
- Changing search ranking or `searchAgents`/`filterAgents` matching logic.
- Adding new filter types or changing the existing filter UI beyond the two clear controls in requirement 12.
- Adding dependencies, middleware, `headers()`, server-side `searchParams`, or `generateStaticParams` for query strings.
- Changing pages other than /agents, except the submit behavior in `top-nav.tsx`.

## 5. Acceptance checks

**Commands** (all must exit 0):

```bash
npm run check:data
npm run lint
npm run typecheck
npm test        # includes the new parse/serialize tests from requirement 15
npm run build   # out/ is produced; no "dynamic server usage" or missing-Suspense error for useSearchParams
```

**Manual checks** (run `npm run dev`, then repeat the checks that concern loading a URL against the built `out/` served by any static file server):

| # | Action | Expected |
|---|---|---|
| A | On `/en/agents`, select role Developer, difficulty Advanced, and turn on "installable only" | URL becomes `/en/agents?role=developer&difficulty=advanced&installable=1`. Back button count is unchanged. Scroll position is unchanged. |
| B | Reload that URL, or open it in a new tab | Same result list and the same chips highlighted |
| C | Open `/en/agents?difficulty=expertish&automation=9` | Page renders with no error in the console or overlay. Difficulty and automation are unfiltered. |
| D | Open `/en/agents?role=developer&difficulty=expertish` | Filtered by role only |
| E | With filters and `?query=foo` active, click "Clear filters only" | URL is `/en/agents?query=foo` |
| F | Click "Clear all" | URL is `/en/agents` with no params |
| G | With filters active on /agents, search "bar" from the top nav | URL keeps the filter params and `query=bar`. Results update without a reload. |
| H | From another page (for example, the home page), search from the top nav | Goes to `/<locale>/agents?query=...` as it does today |
| I | Repeat A and B on `/ko/agents` | Same behavior, and the locale prefix is kept |

## 6. Open questions

None blocking. The [ASSUMPTION] items above (names of the `category`, `tool`, and `verified` params; how multi-select values are encoded; whether the search box writes `?query=`; whether the clear controls already exist) should be confirmed in the PR description if the code shows otherwise.
