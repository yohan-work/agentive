# Task brief: persist /agents filters in the URL

## 1. Goal
Mirror every filter on the `/agents` page in the URL query string. A filtered view can then be shared as a link and survives a reload. This has to keep working in the static GitHub Pages export.

## 2. Context
- Next.js 16 App Router, TypeScript, Tailwind. The build uses `output: "export"` and deploys to GitHub Pages. There is no middleware and no server-side `searchParams`. Read query strings only on the client with `useSearchParams`.
- Pages live under `src/app/[locale]/` (`en`, `ko`).
- `src/components/agents/agent-search-panel.tsx` is a client component. It keeps `query` and `filters` (type `AgentFilters`) in `useState`. It exports:
  - `AgentSearchPanel`
  - `AgentSearchPanelFromUrl`, which reads `?query=` with `useSearchParams` and passes it as `initialQuery`. The query is seeded once. Changes to the URL later are not picked up.
- `src/lib/search.ts` defines the `AgentFilters` type plus `searchAgents`, `filterAgents` and `getUniqueTools`.
- `src/app/[locale]/agents/page.tsx` renders `<Suspense fallback={<AgentSearchPanel .../>}><AgentSearchPanelFromUrl .../></Suspense>`.
- `src/components/layout/top-nav.tsx`: the header search navigates to `/agents?query=...`.
- `tests/search.test.ts` is a `node:test` suite. `npm test` runs it with the tsx loader.
- `src/i18n/dictionaries.ts`: every new UI string needs both an `en` and a `ko` entry.
- Filters that exist today: role, category, difficulty, automation level, tool, verified status and "installable only". Only `query` is read from the URL today.

## 3. Requirements
1. Add a pure `parse` function and a pure `serialize` function. `parse` turns URL search params into `{ query, filters: AgentFilters }`. `serialize` turns that state back into a query string. Put them in `src/lib/search.ts` [ASSUMPTION: this is the right home because `AgentFilters` lives there]. They must not import React or Next.
2. Param names:
   - `query` for the search text
   - `role`, `difficulty` and `installable=1`, as in the user's example URL
   - `automation` for automation level
   - `category`, `tool` and `verified` for the rest [ASSUMPTION: these three names are not specified; use them unless the user says otherwise]
3. Valid values come from the existing `AgentFilters` type and the option lists the panel already renders. Do not add or rename any values.
4. If an `AgentFilters` field holds several values, repeat the param (for example `?tool=a&tool=b`) [ASSUMPTION: the user has not chosen a format for multi-value params]. If a field holds one value, use one param.
5. Invalid-value rule, stated once here: during parsing, silently drop any value that is not valid for its key. Drop repeated values past the first when the field holds one value. Drop unknown keys. `installable` is on only for `1`; any other value counts as off. Parsing must never throw. If the URL still has leftover invalid params after parsing, the next URL write removes them.
6. `serialize` leaves out default or empty values, so a panel with no filters gives an empty string. Keys come out in a fixed order, so the same state always gives the same string.
7. Round-trip: `parse(serialize(state))` deep-equals `state` for every valid state.
8. When any filter changes, update the URL with `router.replace(..., { scroll: false })`. Keep the current locale path and do not add a history entry.
9. The panel shows whatever the URL says. Loading `/en/agents?role=developer&difficulty=advanced&installable=1` directly gives the same results and the same highlighted chips as selecting those filters by hand. If the URL changes while the page is open (for example from the top-nav search), the panel updates. It no longer seeds the state only once.
10. "Clear all" removes every param, including `query`. "Clear filters only" removes the filter params and keeps `query`.
11. Top-nav search sets or replaces `query` only. If the user is already on `/agents` with filters, those filter params stay. From any other page it still goes to `/agents?query=...` as it does today.
12. The Suspense fallback `AgentSearchPanel` still renders during the static build without reading the URL.
13. Unit tests in `tests/search.test.ts` must cover:
    - parse of each filter key
    - serialize of each filter key
    - the round-trip from requirement 7
    - an empty state giving an empty string
    - the invalid-value rule from requirement 5, including `?difficulty=expertish`, `?automation=9`, an unknown key, `installable=yes`, and a repeated param on a one-value field

**Suggested (not required)**
- Debounce URL writes while the user types in the search box (about 300 ms).

## 4. Non-goals
- Saving filters to localStorage.
- Changing the search ranking in `searchAgents` or the matching in `filterAgents`.
- Adding filter types or filter values.
- Adding new dependencies.
- Adding middleware, server-side `searchParams`, or anything else that breaks `output: "export"`.

## 5. Acceptance checks
Run these, and all must pass:
```bash
npm run check:data
npm run lint
npm run typecheck
npm test
npm run build
```
`npm run build` must write `out/` and report no dynamic server usage.

Manual checks against the static build (serve `out/`, or use `npm run dev`):
1. On `/en/agents`, select role = developer, difficulty = advanced and "installable only". The URL becomes `/en/agents?role=developer&difficulty=advanced&installable=1` (plus the other active params in the fixed order). The Back button does not step through each click, and the page does not scroll to the top.
2. Reload that URL, or open it in a new tab. You see the same results and the same highlighted chips. Repeat on `/ko/agents`.
3. Open `/en/agents?difficulty=expertish&automation=9&foo=bar&role=developer`. The page renders with no error, and only the role filter is active. After the next filter change, the URL no longer contains `expertish`, `automation=9` or `foo`.
4. With filters active, run a search from the top-nav. `query` updates and the filter params are still in the URL.
5. "Clear filters only" leaves only `?query=...`. "Clear all" leaves `/en/agents` with no params.

## 6. Open questions
None block the work. Two assumptions need confirming: the param names `category`, `tool` and `verified` (requirement 2) and repeated params for multi-value fields (requirement 4). Codex should go ahead with these as written. If "Clear all" and "Clear filters only" do not exist yet in the panel, add them, with `en` and `ko` strings in `src/i18n/dictionaries.ts`.
