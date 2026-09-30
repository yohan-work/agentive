# Task: Persist /agents filters in the URL

## Context

Agent Archive is a Next.js 16 App Router + TypeScript + Tailwind site built with `output: "export"` and deployed to GitHub Pages. Everything is static. There is no middleware and no server-side `searchParams`, so query strings must be read on the client with `useSearchParams`. Pages live under `src/app/[locale]/`, with `en` and `ko` locales.

On the `/agents` page, only `?query=` is read today, and only once, to seed the search box. These filters live only in React state and are lost on reload:

- role
- category
- difficulty
- automation level
- tool
- verified status
- "installable only"

## Goal

Make the full filter state (search query plus every filter) round-trip through the URL. A filtered view should be shareable, should survive a reload and should be restored when someone opens it directly.

## Files

| File | Role |
|---|---|
| `src/components/agents/agent-search-panel.tsx` | Client component. Holds `query` and `filters: AgentFilters` in `useState`. Exports `AgentSearchPanel` and `AgentSearchPanelFromUrl`, which reads `?query=` via `useSearchParams` and passes `initialQuery`. |
| `src/lib/search.ts` | `AgentFilters` type, `searchAgents`, `filterAgents`, `getUniqueTools`. |
| `src/app/[locale]/agents/page.tsx` | Renders `<Suspense fallback={<AgentSearchPanel .../>}><AgentSearchPanelFromUrl .../></Suspense>`. |
| `src/components/layout/top-nav.tsx` | Header search. Navigates to `/agents?query=...`. |
| `tests/search.test.ts` | `node:test` suite, run with `npm test` (tsx loader). |
| `src/i18n/dictionaries.ts` | Every new UI string needs both `en` and `ko`. |

Read `AgentFilters` and the filter UI first, so you know which fields are single-value, which are multi-value and which are booleans. Then design the param format to match. Don't change the shape of `AgentFilters`.

## Implementation plan

### 1. Pure parse/serialize helpers (no React)

Add them to `src/lib/search.ts`, or to a new `src/lib/agent-filter-params.ts` if that reads cleaner:

```ts
export function parseAgentSearchParams(
  params: URLSearchParams,
  allowed: AllowedFilterValues, // valid values per field (from taxonomy / getUniqueTools)
): { query: string; filters: AgentFilters };

export function serializeAgentSearchParams(
  query: string,
  filters: AgentFilters,
): URLSearchParams;
```

**Param names.** Use short, stable names:

- `query`: keep this name. The top-nav already uses it.
- `role`
- `category`
- `difficulty`
- `automation`
- `tool`
- `verified`
- `installable=1`

**Multi-value fields.** If any field is an array in `AgentFilters`, use repeated keys (`?tool=a&tool=b`) or a single comma-separated value. Pick one, document it in a comment and handle it in both directions.

**Validation.** Parsing is defensive:

- Only accept values that exist in the allowed set for that field. Drop unknown values silently, e.g. `?difficulty=expertish` or `?automation=9`. For multi-value fields, keep the valid entries and drop the invalid ones.
- `installable`: only `1` (optionally also `true`) means on. Anything else means off.
- Ignore unknown params, empty values and duplicates of single-value fields (take the first valid one).
- Never throw.

**Serialization.** Output is canonical:

- Omit defaults and empty values, so an unfiltered page has no query string at all.
- Emit params in a fixed order: `query` first, then the filters in the order listed above. The same state always produces the same URL.
- Trim `query` and omit it when it is empty.

### 2. Wire the panel to the URL

Work in `agent-search-panel.tsx`:

- **Initial state.** `AgentSearchPanelFromUrl` parses all params with the helpers and passes `initialQuery` and `initialFilters` to `AgentSearchPanel`. The plain `AgentSearchPanel`, used as the Suspense fallback, keeps working with no URL input.
- **Writing the URL.** When filters change, write them back with:

  ```ts
  router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
  ```

  - Get `pathname` from `usePathname()`. Don't hardcode `/en/agents`, so the locale and any trailing slash or `basePath` are preserved.
  - Use `router.replace`, never `push`, so clicks don't create history entries.
  - For the free-text `query`, debounce the URL write (~250–300 ms) so typing doesn't call `replace` on every keystroke. Filter clicks can write immediately.
- **External URL changes.** React to `useSearchParams()` changes. The main case is the top-nav search navigating to `/agents?...` while you are already on `/agents`. When the incoming params differ from the last URL the panel wrote itself, re-parse and update local state.
  - Compare the serialized strings. That avoids a URL → state → URL loop and flicker.
  - Don't make the URL the only source of truth for the text input. The input would lag behind typing.
- **Clear actions.**
  - "Clear all" resets query and filters, which gives a bare pathname with no `?`.
  - "Clear filters only" resets filters and keeps `?query=`.
  - If one of these buttons doesn't exist yet, add it with both `en` and `ko` strings in `dictionaries.ts`.
- **Chips.** Active chips and highlighted states must come from the restored state, so a directly loaded URL shows the right chips.

### 3. Top-nav search

In `top-nav.tsx`:

- **Already on `/agents`** (the pathname ends in `/agents` or `/agents/`): take the current params, set or replace `query`, keep every other param, then navigate. Use `replace` with `scroll: false` if you want to match the panel; either works.
- **Anywhere else:** keep today's behavior and go to `/{locale}/agents?query=...`.
- **Reading current params:** if the top-nav sits in a layout that isn't wrapped in `<Suspense>`, calling `useSearchParams()` there breaks the static build. Read `window.location.search` inside the submit handler instead, which is client-only and safe.

### 4. Static export safety

- `page.tsx` stays a server component with no `searchParams` prop usage, and it keeps the existing `<Suspense>` boundary.
- Every `useSearchParams` call must stay inside a client component that renders under `<Suspense>`.
- Don't add `dynamic = "force-dynamic"`, route handlers or middleware.

## Constraints

- `npm run build` must still produce `out/` with no dynamic server usage errors.
- Use `router.replace` with `{ scroll: false }`. No history entry per click and no scroll-to-top.
- Invalid or unknown param values are ignored and never crash the page.
- The top-nav search keeps working and doesn't wipe other active filters.
- No new dependencies.
- All new UI strings exist in both `en` and `ko`.

## Tests

Add to `tests/search.test.ts`, or a new `tests/agent-filter-params.test.ts` if the test runner picks up `tests/*.test.ts`:

- **Round-trip:** `parse(serialize(state))` deep-equals `state` for:
  - an empty state
  - a query only
  - all filters set
  - multi-value fields, if any
- **Canonical output:**
  - Empty state serializes to `""`.
  - Param order is stable.
  - Defaults and empty values are omitted.
- **Invalid values:**
  - `?difficulty=expertish` and `?automation=9` are dropped.
  - For multi-value fields, invalid entries are dropped and valid ones kept.
  - Unknown params such as `?foo=bar` are ignored.
  - `?installable=0` and `?installable=yes` both parse as off; `?installable=1` parses as on.
- **Encoding:** a query with spaces, `&`, `#` and non-ASCII characters (e.g. Korean) round-trips correctly.
- **Duplicates:** for a single-value field, the first valid value wins.

## Acceptance criteria

- [ ] Selecting filters updates the URL, e.g. `/en/agents?role=developer&difficulty=advanced&installable=1`.
- [ ] Loading that URL directly shows the same filtered results and highlighted chips, in both `/en` and `/ko`.
- [ ] Reload keeps the filtered view.
- [ ] Browser Back doesn't step through individual filter clicks.
- [ ] Changing a filter doesn't scroll the page to the top.
- [ ] "Clear all" removes all params. "Clear filters only" keeps `?query=`.
- [ ] Invalid params (`?difficulty=expertish&automation=9`) load the page normally with those filters unset.
- [ ] Top-nav search from another page lands on `/agents?query=...`. From `/agents` with active filters, it updates `query` and keeps the filters.
- [ ] Unit tests cover parse/serialize, including invalid values.
- [ ] These all pass:
  - `npm run check:data`
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`

## Non-goals

- Saving filters to localStorage.
- Changing search ranking or `searchAgents` / `filterAgents` behavior.
- Adding new filter types or changing the `AgentFilters` shape.

## Deliverable

A single PR with:

- the helper module
- the panel and top-nav changes
- tests
- any dictionary additions

In the PR description:

- list the param names and the multi-value format you chose
- include one example shareable URL
- confirm that all five commands pass
