# Task brief: persist /agents filters in the URL

## Context
Agent Archive is a Next.js 16 App Router + TypeScript + Tailwind site built with `output: "export"` and deployed to GitHub Pages. There is no server runtime: no middleware, no server-side `searchParams`. Query strings must be read on the client with `useSearchParams`. Pages live under `src/app/[locale]/` (`en`, `ko`).

Today `/agents` reads only `?query=`, and only once, to seed the search box. Every other filter (role, category, difficulty, automation level, tool, verified status, installable only) lives in React state and is lost on reload.

## Goal
Make the URL the source of truth for the `/agents` search and filter state, so a filtered view can be shared, bookmarked, and survives a reload.

## Files in scope
| File | Change |
|---|---|
| `src/lib/search.ts` | Add pure `parseAgentFilters` / `serializeAgentFilters` helpers next to `AgentFilters` |
| `src/components/agents/agent-search-panel.tsx` | Read state from the URL, write changes with `router.replace` |
| `src/app/[locale]/agents/page.tsx` | Probably no change; confirm the `<Suspense>` fallback still renders |
| `src/components/layout/top-nav.tsx` | Keep other filter params when the header search navigates |
| `tests/search.test.ts` (or new `tests/agent-filters-url.test.ts`) | Parse/serialize unit tests |
| `src/i18n/dictionaries.ts` | Only if a new UI string is needed (add to both `en` and `ko`) |

## URL contract
Proposed param names. Keep them short and stable, because they become public links:

| Filter | Param | Value format | Example |
|---|---|---|---|
| Search text | `query` | free text (existing, unchanged) | `?query=review` |
| Role | `role` | one allowed role id | `role=developer` |
| Category | `category` | one allowed category id | `category=qa` |
| Difficulty | `difficulty` | one allowed difficulty id | `difficulty=advanced` |
| Automation level | `automation` | one allowed level | `automation=3` |
| Tool | `tool` | tool name from `getUniqueTools` | `tool=codex` |
| Verified status | `verified` | one allowed status id | `verified=tested` |
| Installable only | `installable` | `1` when on, omitted when off | `installable=1` |

Rules:
- Use the exact value spaces already in `AgentFilters`. Do not invent new ids. If a field is multi-select in `AgentFilters`, encode it as repeated params (`?tool=a&tool=b`) and parse it with `getAll`.
- Omit any param at its default/empty value, so the clean state is `/en/agents` with no query string.
- Serialize in a fixed key order so the same state always produces the same URL (stable links, easy test assertions).
- Unknown params are left alone when reading. When writing, keep any param this feature does not own (for example a future `?utm=`).

## Implementation plan
1. **Pure helpers in `src/lib/search.ts`**
   - `parseAgentFilters(params: URLSearchParams | ReadonlyURLSearchParams, options?: { tools?: string[] }): AgentFilters`: validate each value against its allowed set. Drop invalid values silently (`?difficulty=expertish` → no difficulty filter; `?automation=9` → no automation filter). Never throw.
   - `serializeAgentFilters(filters: AgentFilters, query: string, base?: URLSearchParams): URLSearchParams`: writes the owned keys, deletes the ones at default, and keeps the non-owned keys from `base`.
   - Export the allowed-value lists as constants if they are not already, so the parser and the UI share one source.
   - No React or Next imports in these helpers, so `node:test` can test them directly.
2. **Panel reads from the URL** (`AgentSearchPanelFromUrl`)
   - Derive `filters` and `query` from `useSearchParams()` with `parseAgentFilters` on every render (via `useMemo`). Do not seed a `useState` once. Seeding once is the current bug, and it also breaks back/forward and the top-nav search landing on the same page.
   - Keep the plain `AgentSearchPanel` (the Suspense fallback) working with empty/default state and no URL access.
3. **Panel writes to the URL**
   - On each filter change: `router.replace(\`${pathname}?${serialized}\`, { scroll: false })`, or `pathname` alone when the serialized string is empty. Get `pathname` from `usePathname()` so the `/en` vs `/ko` locale prefix is kept.
   - Text query: keep a local input state for responsiveness and debounce URL writes (about 250–300 ms). Sync the local input from the URL when the URL's `query` changes from outside (for example the top-nav search).
   - "Clear all" → replace with bare `pathname`. "Clear filters only" → replace with only `query` kept.
4. **Top-nav search** (`top-nav.tsx`)
   - When the user is already on `/[locale]/agents`, read the current `useSearchParams()`, set or delete `query`, and keep every other param.
   - From any other page, keep today's behavior (`/[locale]/agents?query=...`).
   - Check whether top-nav is inside a Suspense boundary. `useSearchParams` in a client component without Suspense can bail out of static rendering for the whole layout at build time. If needed, wrap only the part that reads the params in its own `<Suspense>`, or read `window.location.search` inside the submit handler instead, which avoids the hook altogether.
5. **Tests**
   - Round trip: `parse(serialize(x)) deepEquals x` for a fully populated filter set and for the empty set.
   - Invalid values ignored: `difficulty=expertish`, `automation=9`, `automation=abc`, `installable=yes` (only `1` counts), unknown `role`, empty strings.
   - Valid and invalid mixed: valid keys survive while invalid ones are dropped.
   - Empty/default state serializes to an empty string.
   - Non-owned params are kept by `serialize` when a `base` is passed.
   - Stable key order.
   - Clear-filters-only behavior (the helper, or a small `clearFilters(params)` function): only `query` remains.

## Constraints (must hold)
- `npm run build` still produces `out/` with no dynamic server usage. Do not use `headers()`, `cookies()`, middleware, or server-side `searchParams`.
- `router.replace` only, never `push`, with `{ scroll: false }`.
- Invalid or unknown param values are ignored and never crash.
- The top-nav search does not wipe active filters.
- No new dependencies.
- Non-goals: localStorage persistence, ranking changes, new filter types.

## Assumptions
- `AgentFilters` fields map one-to-one to the seven filters listed. If a field is an array (multi-select), use repeated params as described above.
- The allowed values for role, category, difficulty, automation, and verified status come from a finite typed set (union type or taxonomy constant). `tool` is open-ended, so validate it against `getUniqueTools(agents)` when that list is available to the parser, and otherwise accept any non-empty string (it will simply match nothing).
- Filter chips are already highlighted from `filters` state, so deriving `filters` from the URL makes them highlight correctly with no extra work.
- GitHub Pages serves `/en/agents/` with a trailing slash. `usePathname()` returns the right path either way, so build URLs from it rather than hard-coding them.

## Risks and mitigations
| Risk | Mitigation |
|---|---|
| `useSearchParams` in top-nav forces a client-side bailout or build error across all pages | Suspense-wrap the reading part, or read `window.location.search` inside the submit handler |
| Typing in the search box rewrites the URL on every keystroke, causing jank or a loop between URL and input | Debounce the writes; sync the input from the URL only when the value really differs |
| Hydration flash: the fallback renders unfiltered, then the filtered view appears | Accepted for a static export. Keep the fallback layout identical so nothing shifts. |
| Trailing slash or `basePath` lost when building the URL | Always use `usePathname()` output as the base |
| Param names become a public contract | Keep them short, and document them in a comment next to the helpers |

## Acceptance criteria
- [ ] Selecting filters updates the URL, e.g. `/en/agents?role=developer&difficulty=advanced&installable=1`.
- [ ] Loading that URL directly shows the same filtered results and highlighted chips (check both `/en` and `/ko`).
- [ ] "Clear all" removes all params. "Clear filters only" keeps `?query=`.
- [ ] Top-nav search on `/agents` with active filters keeps them and updates only `query`.
- [ ] Invalid values (`?difficulty=expertish`, `?automation=9`) load without errors and are ignored.
- [ ] Back/forward does not step through each filter click (replace semantics). The page does not scroll to the top on a filter change.
- [ ] Unit tests cover parse/serialize, including invalid values.
- [ ] `npm run check:data`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass.

## Manual verification
1. `npm run build`, then serve `out/` statically and open `/en/agents?role=developer&installable=1` directly.
2. Toggle filters. Watch the URL change, and confirm the history length does not grow and the scroll position holds.
3. With filters active, search from the header. The filters should still be there.
4. Open `/ko/agents?difficulty=expertish&automation=9`. There should be no crash and no filter applied.

## Next actions for Codex
1. Read `AgentFilters` and the chip rendering in `agent-search-panel.tsx` to confirm field names, value sets, and single- vs multi-select.
2. Add the parse/serialize helpers and tests first (`npm test` green).
3. Wire the panel to the URL, then update top-nav.
4. Run all five checks, then do the manual verification above.
5. In the PR description, list the final param names and any assumption that turned out different from this brief.
