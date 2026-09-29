# Task: Persist `/agents` filters in the URL

## Context

Repo: **Agent Archive** (`github.com/yohan-work/agentive`), a Next.js 16 App Router + TypeScript + Tailwind site built with `output: "export"` and deployed to GitHub Pages as static HTML.

Hard platform rules. Don't break these:
- No middleware, no `headers()`, and no server-side `searchParams` in pages. The page is prerendered once, with no query string.
- Query strings are read **only on the client**, with `useSearchParams` / `useRouter` / `usePathname` from `next/navigation`.
- Pages live under `src/app/[locale]/` (`en`, `ko`).
- No new dependencies.

## Problem

On `/[locale]/agents`, the only thing read from the URL is `?query=`, and it only seeds the search box once. All other filters live in React state and are lost on reload or when the link is shared: role, category, difficulty, automation level, tool, verified status, and "installable only".

## Goal

The URL becomes the shareable, reload-safe source of truth for the search box and every filter on `/agents`.

## Files to read first

| File | Role |
|---|---|
| `src/lib/search.ts` | `AgentFilters` type, `searchAgents`, `filterAgents`, `getUniqueTools` |
| `src/components/agents/agent-search-panel.tsx` | Client component. Holds `query` and `filters` in `useState`. Exports `AgentSearchPanel` and `AgentSearchPanelFromUrl` (reads `?query=` and passes `initialQuery`). |
| `src/app/[locale]/agents/page.tsx` | Renders `<Suspense fallback={<AgentSearchPanel …/>}><AgentSearchPanelFromUrl …/></Suspense>` |
| `src/components/layout/top-nav.tsx` | Header search navigates to `/agents?query=…` |
| `tests/search.test.ts` | `node:test` suite, run with `npm test` (tsx loader) |
| `src/i18n/dictionaries.ts` | UI strings. Every new key goes in **both** `en` and `ko`. |

Read `AgentFilters` before you design anything. Match the parsed shape to it exactly. If a field is single-value, parse it as single-value. If it's an array or set, support multiple values. Don't change the `AgentFilters` shape unless you have to, and if you do, say why in the PR.

## Implementation plan

### 1. Pure parse/serialize helpers (no React)

Put them in `src/lib/search.ts` or a new `src/lib/agent-filter-params.ts`, whichever fits the code better.

```ts
parseAgentSearchParams(
  params: URLSearchParams | ReadonlyURLSearchParams,
  allowed: { tools: readonly string[] /* + any other data-derived value sets */ }
): { query: string; filters: AgentFilters }

serializeAgentSearchParams(
  state: { query: string; filters: AgentFilters },
  base?: URLSearchParams   // optional: carry over unrelated params
): URLSearchParams
```

Param names (short, stable, lowercase):

| Param | Filter | Example |
|---|---|---|
| `query` | search text (keep this name; the top nav already uses it) | `?query=review` |
| `role` | role | `?role=developer` |
| `category` | category | `?category=…` |
| `difficulty` | difficulty | `?difficulty=advanced` |
| `automation` | automation level | `?automation=…` |
| `tool` | tool | `?tool=…` |
| `verified` | verified status | `?verified=…` |
| `installable` | installable only | `?installable=1` |

Rules:
- **Validate every value against its allowed set.** Take enum-like fields (role, category, difficulty, automation, verified) from the same union types or constants the chips use. Take tools from `getUniqueTools(agents)`. Drop anything unknown without throwing, e.g. `?difficulty=expertish` or `?automation=9`. Invalid values must never throw or leave the UI in a broken state.
- `installable`: only `1` (and optionally `true`) turns it on. Anything else means off. Serialize it only as `installable=1`.
- Multi-value fields, if any: use repeated keys (`?tool=a&tool=b`), and on read also accept comma-separated values. Dedupe values and drop the invalid ones.
- Trim `query`. An empty query means the param is absent.
- **Omit defaults.** Empty, unset, and false values produce no param, so a clean page has a clean URL (`/en/agents`).
- **Deterministic output.** Emit keys in the fixed order of the table above, and sort multi-values in a stable order. The same state always serializes to the same string, which avoids no-op `replace` calls and flaky tests.
- Round-trip: `parse(serialize(state))` must deep-equal `state` for every valid state.

### 2. Wire the URL into `AgentSearchPanel`

- In the URL-aware component (`AgentSearchPanelFromUrl`, or a hook such as `useAgentFiltersUrlState`), derive initial `query` and `filters` from `useSearchParams()` through the parser. Replace the one-shot `initialQuery` seeding.
- On any filter or chip change, compute the new params with the serializer and call:
  ```ts
  router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  ```
  - Use `replace`, never `push`, so a click doesn't add a history entry.
  - Pass `scroll: false` so a filter change doesn't jump to the top.
  - Use `usePathname()` so the locale prefix and any trailing-slash config stay intact. Don't hardcode `/agents`.
  - Skip the call when the serialized string equals the current `searchParams.toString()`.
- **Search box typing:** keep the input responsive with local state, and debounce the URL write (~250–300 ms). Also flush on Enter and blur if that's easy. Don't let a URL update steal the caret or overwrite what the user is typing.
- **External URL changes:** if the URL changes while the page is mounted (header search, back/forward), sync state from the URL. Avoid a feedback loop by comparing serialized strings rather than object identity. A pattern that works: treat the URL as the source of truth for filters, and keep only the in-progress query text as local state.
- Keep the `<Suspense fallback={<AgentSearchPanel …/>}>` structure in `page.tsx`. The static HTML renders the unfiltered fallback, and the client hydrates to the URL state. That's expected. Don't try to read params on the server.
- The non-URL `AgentSearchPanel` (the fallback) must keep working with no router usage that would break prerender.

### 3. Clear actions

- **"Clear all"** resets query and filters, so the URL becomes the bare pathname.
- **"Clear filters only"** resets filters but keeps `?query=`.
- If one of these buttons doesn't exist yet, add it next to the existing clear control. Match the existing button styles (`cn()`, theme tokens such as `panel`, `line`, `primary`). Add its label to `src/i18n/dictionaries.ts` in **both** `en` and `ko`.

### 4. Top-nav search (`top-nav.tsx`)

- If the user is already on `/[locale]/agents`, the header search must **only set or replace `query`** and keep every other active param. Build the next URL from the current `useSearchParams()` plus the new `query` (through the serializer or a direct `set("query", …)`). Use `replace` there.
- From any other page, keep the current behavior: navigate to `/[locale]/agents?query=…`.
- An empty header search shouldn't produce `?query=`.
- Note: `useSearchParams` in `top-nav` may need its own `<Suspense>` boundary to satisfy the static export. If the build complains about a missing Suspense boundary, wrap only the smallest part that needs it, or read `window.location.search` inside the submit handler instead.

## Constraints (recap)

- `npm run build` must still produce `out/` with no dynamic server usage and no "useSearchParams should be wrapped in a suspense boundary" errors.
- Navigation uses `router.replace` with `{ scroll: false }` for filter changes.
- Invalid params are ignored and never crash anything.
- The top-nav search keeps working and doesn't wipe filters.
- No new dependencies. Don't add `localStorage` persistence, change search ranking, or add filter types. Those are non-goals.

## Tests (`tests/search.test.ts`, or a new `tests/agent-filter-params.test.ts` in the same style)

Cover at minimum:
1. **Parse valid:** `role=developer&difficulty=advanced&installable=1` gives the expected `AgentFilters`.
2. **Parse invalid:** `difficulty=expertish`, `automation=9`, unknown `tool`, `installable=yes`/`0`, and empty values are all dropped or false, and nothing throws.
3. **Unknown keys** such as `utm_source=x` are ignored by parse. Decide and test whether serialize keeps them when a `base` is passed.
4. **Serialize** omits defaults, uses the stable key order, and turns an empty state into an empty string.
5. **Round-trip:** `parse(serialize(s))` deep-equals `s` for a few representative states, including multi-value fields if any exist.
6. **Clear-filters-only** semantics: the serialized result keeps only `query`.
7. **Query trimming** and URL encoding of special characters (spaces, `&`, Korean text such as `?query=리뷰`).

Keep the helpers pure so the tests need no React or DOM.

## Acceptance criteria

- [ ] Selecting filters updates the URL, e.g. `/en/agents?role=developer&difficulty=advanced&installable=1`.
- [ ] Loading that URL directly (fresh tab or reload) shows the same filtered results **and** highlights the same chips.
- [ ] Filter changes don't add history entries and don't scroll to the top.
- [ ] "Clear all" removes all params. "Clear filters only" keeps `?query=`.
- [ ] Invalid values in the URL are ignored and the page renders normally.
- [ ] The header search from any page lands on `/agents?query=…`. On `/agents` with active filters, it updates only `query`.
- [ ] Works under both `/en/agents` and `/ko/agents`, and every new string exists in `en` and `ko`.
- [ ] Unit tests cover parse and serialize, including invalid values.
- [ ] These all pass: `npm run check:data`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Manual check before finishing

1. Run `npm run build`, then serve `out/` statically (e.g. `npx serve out`) and open `/en/agents?role=developer&installable=1`. Confirm that filters and chips apply after hydration.
2. Toggle a few chips. The URL updates, the back button leaves the page instead of undoing each click, and the scroll position holds.
3. Open `/en/agents?difficulty=expertish&automation=9`. The page renders normally with no filters applied.
4. With filters active, run a search from the header. The filters stay.

## Deliverable

A single PR with a Conventional Commit title (e.g. `feat: persist agent filters in the URL`). The description should summarize the param scheme, note any change to `AgentFilters`, and list the commands you ran with their results.
