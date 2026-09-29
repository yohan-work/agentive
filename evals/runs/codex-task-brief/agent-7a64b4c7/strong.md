You gave me enough to write this without questions. Where I had to guess, I wrote the guess down under **Assumptions** so Codex checks it first. Everything from here down is the brief, ready to paste.

---

# Task: Keep /agents filters in the URL

## 1. Objective
Store every filter on the `/[locale]/agents` page in the URL query string. That way a filtered view can be shared as a link and still shows up after a reload. Today only `?query=` is read, and only once. Role, category, difficulty, automation level, tool, verified status and "installable only" live in React state and are lost on reload.

## 2. Context (read these first)
- **Stack:** Next.js 16 App Router, TypeScript and Tailwind. `output: "export"` produces a static build that is deployed to GitHub Pages.
- **Static-export rules:** there is no middleware, no `headers()` and no server-side `searchParams`. Read query strings only on the client with `useSearchParams`, and keep it inside a `<Suspense>` boundary.
- **Locales:** pages live under `src/app/[locale]/` (`en`, `ko`).
- **Files:**
  - `src/components/agents/agent-search-panel.tsx`: a client component that holds `query` and `filters: AgentFilters` in `useState`. It exports `AgentSearchPanel` and `AgentSearchPanelFromUrl`. Today `AgentSearchPanelFromUrl` reads `?query=` and passes it in as `initialQuery`.
  - `src/lib/search.ts`: `AgentFilters`, `searchAgents`, `filterAgents`, `getUniqueTools`.
  - `src/app/[locale]/agents/page.tsx`: renders `<Suspense fallback={<AgentSearchPanel/>}><AgentSearchPanelFromUrl/></Suspense>`.
  - `src/components/layout/top-nav.tsx`: the header search, which navigates to `/agents?query=...`.
  - `tests/search.test.ts`: the `node:test` suite, run by `npm test` through the tsx loader.
  - `src/i18n/dictionaries.ts`: every new UI string needs both `en` and `ko`.

## 3. Scope

**In scope**
- A pure, unit-tested module that parses URL params into `{ query, filters }` and turns them back into a query string.
- Two-way sync between the panel state and the URL, using `router.replace` without scrolling.
- Making the top-nav search keep any filters that are already active.
- Unit tests for parsing and serializing.

**Non-goals (do not do these)**
- Saving filters to localStorage.
- Any change to search ranking or to `searchAgents` / `filterAgents` behavior.
- New filter types.
- New dependencies.

## 4. URL contract

| Filter | Param | Example | Valid values |
|---|---|---|---|
| free-text search | `query` | `query=review` | any non-empty trimmed string |
| role | `role` | `role=developer` | known role ids |
| category | `category` | `category=testing` | known category ids |
| difficulty | `difficulty` | `difficulty=advanced` | members of the difficulty union |
| automation level | `automation` | `automation=2` | members of the automation union |
| tool | `tool` | `tool=github` | tools returned by `getUniqueTools(agents)` |
| verified status | `verified` | `verified=tested` | members of the verified-status union |
| installable only | `installable` | `installable=1` | `1` (also accept `true` when reading, always write `1`) |

**Rules**
- Use the same field names and value types as `AgentFilters`. Do not invent a second vocabulary. If a field in `AgentFilters` is an array (multi-select), write it as a comma-separated list (`role=developer,designer`) and drop any unknown entries one by one.
- Leave out empty, default and `false` values. An unfiltered page has a bare URL with no `?`.
- Write params in a fixed order: `query, role, category, difficulty, automation, tool, verified, installable`. This keeps URLs stable and makes them easy to compare in tests.
- **Invalid values are ignored silently.** For example, `?difficulty=expertish`, `?automation=9`, repeated keys and garbage strings all resolve to "no filter" for that field. They never throw, and the other valid params still apply.
- Keep unrelated params when writing (for example `utm_*`). Only rewrite the keys listed above.

## 5. Implementation plan

**Step 1: pure helpers, with no React and no Next imports**

Create `src/lib/agent-filter-params.ts`. Putting it in `search.ts` is also fine if that fits the file better.

```ts
export interface FilterParamOptions {
  roles: readonly string[];
  categories: readonly string[];
  tools: readonly string[];
  // difficulty / automation / verified come from the type-level unions (export const arrays if they don't exist)
}

export function parseAgentFilterParams(
  params: URLSearchParams | string,
  options: FilterParamOptions,
): { query: string; filters: AgentFilters };

export function serializeAgentFilterParams(
  state: { query: string; filters: AgentFilters },
  base?: URLSearchParams, // preserved unrelated keys
): string; // "" or "a=b&c=d" (no leading "?")
```

- If the allowed-value lists for difficulty, automation level and verified status exist only as TypeScript types, export them as `as const` arrays next to the types. Derive the type from the array so there is one source of truth.
- Take the role and category ids from the existing taxonomy in `src/data/`. Take tools from `getUniqueTools(agents)`.
- The property you must keep is the round trip: `parse(serialize(x))` must equal `x` for every valid `x`.

**Step 2: sync the panel with the URL** (`agent-search-panel.tsx`)
- Replace the `initialQuery` prop with a full initial state. `AgentSearchPanelFromUrl` should build it with `parseAgentFilterParams(useSearchParams(), options)` and pass it down as `initialState`. `AgentSearchPanel` (the Suspense fallback) keeps working with no URL, meaning empty filters.
- When `query` or `filters` changes:
  1. Compute `next = serializeAgentFilterParams(...)`.
  2. If `next` differs from the current `searchParams.toString()`, call `router.replace(next ? \`${pathname}?${next}\` : pathname, { scroll: false })`.
- Get `pathname` from `usePathname()` so the locale prefix and the GitHub Pages `basePath` are handled for you. Do not hard-code `/en/agents`.
- Debounce URL writes caused by typing in the search box (about 250–300 ms). Chip clicks can write immediately. Filtering itself stays instant because it runs off React state.
- **External URL changes:** examples are the top-nav search submitted while already on `/agents`, and browser back/forward. When `useSearchParams().toString()` changes to a value that is not the last one this component wrote, re-parse it and reset state. Track the last written string in a ref so the component does not loop.
- **"Clear all"** resets `query` and `filters`, which gives a bare pathname. **"Clear filters only"** resets `filters` and keeps `query`, which leaves only `?query=...`. If either button does not exist yet, add it and put its label in `dictionaries.ts` for both `en` and `ko`.

**Step 3: top-nav search** (`top-nav.tsx`)
- When the user is already on the agents page, build the target by setting `query` on the current params (`new URLSearchParams(window.location.search)`, read at submit time) and keep every other key. When the user is on any other page, navigate to `/[locale]/agents?query=...` as today.
- Read `window.location.search` inside the submit handler rather than calling `useSearchParams()` in the nav. The nav appears on every page, and `useSearchParams` there would need a Suspense boundary on every page or the static build fails.
- An empty submit removes `query` and leaves the filters as they are.

**Step 4: tests** (`tests/agent-filter-params.test.ts`, or extend `tests/search.test.ts`)

The cases below need a fixed set of options. Make sure `npm test` picks up the new file. If the test glob only covers `search.test.ts`, either widen the glob or put the tests there.
- An empty string gives an empty query and default filters. Serializing defaults gives `""`.
- `role=developer&difficulty=advanced&installable=1` parses to the expected filters.
- Round trip: `parse(serialize(x))` deep-equals `x` for a fully populated state.
- Serializing uses the fixed param order no matter the order in which keys were set.
- Invalid values are ignored and the valid ones still apply. Cases: `difficulty=expertish`, `automation=9`, `verified=nope`, `role=` (empty), `tool=unknown-tool`, `installable=yes`.
- Repeated keys such as `difficulty=a&difficulty=b` behave predictably (document it: first valid value wins).
- Unrelated params are kept by `serialize` when `base` is given.
- `query` is trimmed. Special characters (`&`, `#`, spaces and Korean text) survive the round trip.

## 6. Acceptance criteria
- [ ] Selecting filters updates the URL, for example `/en/agents?role=developer&difficulty=advanced&installable=1`, with no new history entry per click and no scroll jump.
- [ ] Loading that URL directly (including after a hard reload) shows the same result list and highlights the same chips. Check this on `/en/` and `/ko/`.
- [ ] Invalid params such as `?difficulty=expertish&automation=9` load without errors. They are ignored, and any valid params next to them still apply.
- [ ] "Clear all" removes every filter param. "Clear filters only" keeps `?query=`.
- [ ] The top-nav search from another page lands on `/agents?query=...`. Run from `/agents` with filters active, it updates `query` and keeps the filters.
- [ ] Browser back/forward from a filtered view restores the right state.
- [ ] The new unit tests cover parsing and serializing, including invalid values.
- [ ] `npm run check:data`, `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` all pass, and `out/` contains the static `agents` pages for both locales.

## 7. Assumptions (check these first and adjust if one is wrong)
1. Each field in `AgentFilters` is either a single value or an array. Match whichever it is and use the comma-separated form for arrays.
2. The allowed difficulty, automation and verified values are defined somewhere in the types or the taxonomy. If they are not, export them as `as const` arrays.
3. The "Clear all" and "Clear filters only" controls already exist. If they do not, add them with en/ko strings.
4. The agents list can be imported on the client (it already is, because `getUniqueTools` feeds the panel), so tool validation can use it.
5. `npm test` runs every file in `tests/*.test.ts`.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| `useSearchParams` outside Suspense breaks `next build` under `output: "export"` | Call it only inside `AgentSearchPanelFromUrl`, which is already wrapped. Use `window.location` in top-nav at submit time. |
| Infinite loop between state and URL | Compare the serialized strings before calling `replace`, and use a ref for the last written value. |
| The static HTML (the Suspense fallback) renders unfiltered, then flashes to the filtered view when it hydrates | This comes with static export and is acceptable. Keep the fallback's layout stable so there is no layout shift. |
| Hard-coded paths break the GitHub Pages `basePath` or locale | Always build URLs from `usePathname()`. |
| Keystroke-rate `router.replace` causes jank | Debounce query writes only. |
| Too-strict validation drops a legitimate value (for example, a tool name with different casing) | Validate against the real data sets. Compare tools case-insensitively if the data is mixed-case, but always write the canonical value. |

## 9. Next actions for Codex
1. Read the five files listed in §2 and confirm or correct the assumptions in §7.
2. Build the pure parse and serialize helpers and their tests (§5 steps 1 and 4). Get `npm test` passing before touching any UI.
3. Wire up the panel sync (step 2), then the top-nav change (step 3).
4. Go through the §6 checklist by hand in `npm run dev`, including hard reloads, back/forward, invalid params and `/ko/`.
5. Run all five commands. Commit as `feat: persist agent filters in the URL` and list any assumption that turned out wrong in the PR description.
