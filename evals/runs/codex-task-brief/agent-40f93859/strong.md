# Task brief: persist /agents filters in the URL

## 1. Goal

Make every filter on the `/agents` page (search query, role, category, difficulty, automation level, tool, verified status, "installable only") round-trip through the URL query string. A filtered view can then be shared as a link and survives a reload.

## 2. Context

- **Stack:** Next.js 16 App Router, TypeScript, Tailwind. `output: "export"` static build, deployed to GitHub Pages. There is no middleware and no server-side `searchParams`, so query strings must be read on the client with `useSearchParams`. Pages live under `src/app/[locale]/` (`en`, `ko`).
- **Current behavior:** only `?query=` is read, and only once, to seed the search box. All other filters live in React state and are lost on reload.
- **Files:**
  - `src/components/agents/agent-search-panel.tsx`: client component. It holds `query` and `filters` (type `AgentFilters`) in `useState`. It exports `AgentSearchPanel` and `AgentSearchPanelFromUrl`. The second one reads `?query=` via `useSearchParams` and passes `initialQuery`.
  - `src/lib/search.ts`: defines the `AgentFilters` type plus `searchAgents`, `filterAgents` and `getUniqueTools`.
  - `src/app/[locale]/agents/page.tsx`: renders `<Suspense fallback={<AgentSearchPanel .../>}><AgentSearchPanelFromUrl .../></Suspense>`. Keep this Suspense boundary; the static export needs it for `useSearchParams`.
  - `src/components/layout/top-nav.tsx`: the header search navigates to `/agents?query=...`.
  - `tests/search.test.ts`: node:test suite, run with `npm test` (tsx loader).
  - `src/i18n/dictionaries.ts`: any new UI string needs both an `en` and a `ko` entry.

## 3. Requirements

**URL format**

1. Filters map to query params as follows. `query`, `role`, `difficulty`, `automation` and `installable` come from the request. `category`, `tool` and `verified` are [ASSUMPTION] names that follow the same pattern.

   | Filter | Param | Written when |
   |---|---|---|
   | search text | `query` | non-empty after trim |
   | role | `role` | set |
   | category | `category` | set |
   | difficulty | `difficulty` | set |
   | automation level | `automation` | set |
   | tool | `tool` | set |
   | verified status | `verified` | set |
   | installable only | `installable=1` | true |

   A filter that is unset or at its default is **omitted** from the URL. The URL never contains an empty param like `role=`.
2. If a field of `AgentFilters` holds several values, serialize it as repeated params (`?tool=a&tool=b`) and parse it back with `getAll`. [ASSUMPTION] I have not seen whether any field is an array.
3. Params are written in a fixed order: the order of the table above. This keeps shareable URLs and test expectations deterministic.

**Parse / serialize (pure, testable)**

4. Add two pure functions to `src/lib/search.ts`. Suggested names are `parseAgentFilterParams(params: URLSearchParams): { query: string; filters: AgentFilters }` and `serializeAgentFilterParams(query: string, filters: AgentFilters): URLSearchParams`. They must not use React or Next.
5. **Invalid-value rule (the single edge-case rule):** for each param, a value is accepted only if it is one of that filter's allowed values. Any other value is dropped for that filter alone, with no error, and the other params are still applied. This covers unknown enum values (`?difficulty=expertish`, `?automation=9`), empty values, and `installable` values other than `1`. Unknown param names are also ignored.
   - Allowed values for the enum-like filters come from the existing `AgentFilters` value sets or constants. [ASSUMPTION] Do not hard-code a second copy if a source list already exists.
   - For `tool`, the parse function takes the list of known tools as an argument (from `getUniqueTools`), so it stays pure.
6. Round trip: `parse(serialize(q, f))` deep-equals `{ query: q, filters: f }` for any valid input.

**Component behavior**

7. `AgentSearchPanelFromUrl` initializes `query` and `filters` from `parseAgentFilterParams(useSearchParams())`. Chips and results are therefore correct on the first client render after loading a URL directly.
8. Every change to a filter or to the query writes the URL with `router.replace(`${pathname}?${params}`, { scroll: false })`. When nothing is set, it writes `pathname` with no `?`. The locale prefix (`/en/agents`, `/ko/agents`) is preserved, no history entry is pushed, and the page does not scroll.
9. When the URL changes while the page stays mounted, the panel state re-syncs from the new URL. This happens, for example, when the header search is used on `/agents`, or on back/forward.
10. "Clear all" removes every filter param and `query`. "Clear filters only" removes every filter param and keeps `query`. [ASSUMPTION] Both controls already exist. If "Clear filters only" does not exist, see Open questions.
11. The fallback `AgentSearchPanel` (no URL) keeps working as it does today.

**Top-nav search**

12. On the agents page, a header search updates only `query` and keeps every other current param, e.g. `/en/agents?role=developer&query=foo`. From any other page it navigates to `/<locale>/agents?query=...` as it does today.

## Suggested (not required)

- Debounce the URL write for typing in the search box (~300 ms) so the URL is not replaced on every keystroke. Filter chips still write immediately.

## 4. Non-goals

- Do not save filters to localStorage or any other storage.
- Do not change search ranking, `searchAgents` scoring, or `filterAgents` semantics.
- Do not add new filter types or new filter values.
- Add no new dependencies, middleware, `headers()`, or server-side `searchParams` usage.
- Do not change `page.tsx` beyond what is needed to keep the Suspense boundary working.

## 5. Acceptance checks

**Automated.** In `tests/search.test.ts`, add tests for:
- serializing each filter on its own, including `installable=1` and param order (req. 1–3);
- serializing empty or default filters to an empty string;
- round trip `parse(serialize(x))` (req. 6);
- `?difficulty=expertish`, `?automation=9`, `?installable=true`, `?role=` and an unknown `?foo=bar` all yielding default values for those filters, while a valid param in the same URL is still applied (req. 5);
- an unknown `tool` value being dropped (req. 5).

Then run each of these; each must exit 0:
```bash
npm run check:data
npm run lint
npm run typecheck
npm test
npm run build   # must produce out/ with no dynamic-server-usage error
```

**Manual.** Run `npm run dev` and check:
1. On `/en/agents`, select role "developer", difficulty "advanced" and "installable only". The URL becomes `/en/agents?role=developer&difficulty=advanced&installable=1`, the page does not scroll, and Back does not step through each click.
2. Reload that URL, or open it in a new tab. The same results show and the same chips are highlighted.
3. Open `/en/agents?difficulty=expertish&automation=9&role=developer`. The page renders without errors, only the role filter is applied, and nothing is thrown in the console.
4. With filters active, type "review" in the header search. The URL keeps the filters and adds `query=review`, and the results update without a full reload.
5. "Clear filters only" leaves `/en/agents?query=review`. "Clear all" leaves `/en/agents`.
6. Repeat step 1 on `/ko/agents`. The `/ko` prefix is kept.

## 6. Open questions

None block the work. If "Clear filters only" does not exist yet, add it next to "Clear all" with new `en` and `ko` strings in `src/i18n/dictionaries.ts`, and flag it in the PR description.
