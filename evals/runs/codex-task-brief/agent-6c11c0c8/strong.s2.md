# Task brief: persist /agents filters in the URL

## 1. Goal

Make the `/[locale]/agents` search query and every filter (role, category, difficulty, automation level, tool, verified status, installable only) round-trip through the URL query string. A filtered view can then be shared, and it survives a reload. The site must stay a fully static export.

## 2. Context

- Next.js 16 App Router + TypeScript + Tailwind, `output: "export"`, deployed to GitHub Pages. There is no middleware and no server-side `searchParams`. Query strings are read on the client with `useSearchParams`.
- Pages live under `src/app/[locale]/` (`en`, `ko`).
- `src/components/agents/agent-search-panel.tsx` is a client component. It holds `query` and `filters: AgentFilters` in `useState` and exports two components:
  - `AgentSearchPanel`
  - `AgentSearchPanelFromUrl`, which reads `?query=` with `useSearchParams` and passes it as `initialQuery`. The value is used once, as a seed.
- `src/lib/search.ts` holds the `AgentFilters` type, `searchAgents`, `filterAgents` and `getUniqueTools`.
- `src/app/[locale]/agents/page.tsx` renders `<Suspense fallback={<AgentSearchPanel .../>}><AgentSearchPanelFromUrl .../></Suspense>`.
- `src/components/layout/top-nav.tsx`: the header search navigates to `/agents?query=...`.
- `tests/search.test.ts` is a `node:test` suite, run with `npm test` (tsx loader).
- `src/i18n/dictionaries.ts`: any new UI string needs both an `en` and a `ko` entry.

**[ASSUMPTION] Parameter names.** The request fixes `query`, `role`, `difficulty`, `automation` and `installable`. For the rest, use `category`, `tool` and `verified`. The complete set is: `query`, `role`, `category`, `difficulty`, `automation`, `tool`, `verified`, `installable`.

**[ASSUMPTION] Parameter values.** Values are the same raw values `AgentFilters` already stores, such as `developer` or `advanced`. They are not localized labels, so `/en/...` and `/ko/...` share the same parameter values.

**[ASSUMPTION] Single values.** Each `AgentFilters` field holds a single value. Read `AgentFilters` before you start. If a field is an array (multi-select), serialize it as repeated keys (`?tool=a&tool=b`), drop invalid entries one by one, and note this in the PR.

## 3. Requirements

### Parse and serialize (pure functions in `src/lib/search.ts`)

1. **Add `parseAgentSearchParams(params: URLSearchParams, options)`.** It returns `{ query: string, filters: AgentFilters }`.
   - **Allowed values:** the options argument carries the allowed values for each filter.
     - For enumerated filters, use the same source the filter chips render from.
     - For `tool`, use the list returned by `getUniqueTools`.
   - **Validity rule (stated once, applies to every filter key):**
     - A value is accepted only if it exactly matches an allowed value. The match is case-sensitive.
     - Anything else leaves that filter at its default: unknown values, empty strings, the wrong case, or a value on the wrong key.
     - It never throws.
     - Examples that are ignored: `?difficulty=expertish`, `?automation=9`, `?difficulty=`.
   - **`installable`:** only the exact string `1` means true. Every other value, or a missing value, means false.
   - **Duplicate keys** (single-value fields): use the first occurrence, which is what `URLSearchParams.get` returns. If that first value is invalid, ignore the filter.
   - **`query`:** taken as-is after trimming. An empty value means no query.
   - **Unknown keys** (e.g. `utm_source`) are ignored.
2. **Add `serializeAgentSearchParams({ query, filters }): string`.** It returns a query string without the leading `?`.
   - **Omitted:** any filter at its default, an empty or whitespace-only query, and `installable` when false.
   - **`installable`:** when true, it is written as `installable=1`.
   - **Fixed key order:** `query, role, category, difficulty, automation, tool, verified, installable`. The same state therefore always produces the same URL.
   - **Round trip:** for any valid state, `parse(serialize(state))` equals `state`.

### Panel behavior (`agent-search-panel.tsx`)

3. **Reading the URL.** `AgentSearchPanelFromUrl` derives both the query and the filters from `useSearchParams()` through `parseAgentSearchParams`.
   - The result list and the highlighted chips reflect those values on first client render.
   - They also update when the URL changes from outside the panel: top-nav search, or browser back and forward.
4. **Writing the URL.** Every filter change, "Clear all" and "Clear filters only" writes the URL with `router.replace(`${pathname}?${qs}`, { scroll: false })`.
   - `pathname` comes from `usePathname()`, so the locale segment and any basePath are preserved.
   - When `qs` is empty, replace with `pathname` alone, with no trailing `?`.
   - Use `router.replace` only. Never `router.push`: a filter click must not add a history entry.
   - Pass `scroll: false` so the page does not jump to the top.
5. **Query box.** Editing the query in the panel's own search box also writes `?query=` through the same `router.replace` path. Clearing the box removes the key.
   - Why: otherwise a stale `?query=` would stay in the URL and come back on reload.
   - Keep a local input state so typing stays responsive. It must re-sync when the URL's `query` changes from outside the panel.
6. **Writes only from user actions.** URL writes happen only inside user event handlers.
   - No effect may call `router.replace` on mount or in response to a `searchParams` change. This prevents replace loops.
   - Loading a URL that contains invalid values does not rewrite it on load. Those values are dropped the next time the user changes a filter, because serialization only emits valid state.
7. **"Clear all"** results in `pathname` with no query string.
8. **"Clear filters only"** results in `pathname?query=<current query>`, or bare `pathname` if the query is empty.
9. **Fallback.** `AgentSearchPanel`, used as the Suspense fallback, keeps working with no URL input. `page.tsx` keeps the `<Suspense>` wrapper so that `useSearchParams` does not break the static export.

### Top-nav search (`top-nav.tsx`)

10. **When the current path is the agents page for the current locale:**
    - Read the current query string from `window.location.search` inside the submit handler.
    - Set only `query` (or delete it if empty) and keep every other parameter.
    - Navigate to `pathname?<result>`.
11. **Elsewhere:** keep today's behavior, which navigates to `/agents?query=...`.
12. **No `useSearchParams` in `top-nav.tsx`.** The header renders on every page, so adding it would force a Suspense boundary around the nav. Read `window.location` only inside the event handler, never during render.

### Tests (`tests/search.test.ts`)

13. **Add `node:test` cases for:**
    - Every filter key parsed from a valid value.
    - Each invalid form from requirement 1 is ignored and does not throw:
      - `?difficulty=expertish` and `?automation=9`
      - an empty value
      - wrong case
      - a duplicate key whose first value is invalid
      - `installable=true` and `installable=0` (both read as false)
      - a tool not in `getUniqueTools`
      - unknown keys
    - `serialize` omits defaults and emits the fixed key order. The default state serializes to `""`.
    - The round trip `parse(serialize(state))` deep-equals `state` for at least one state with every filter set.
    - `/en/agents?role=developer&difficulty=advanced&installable=1`: parsing its search part gives exactly those three filters.

### Suggested (not required)

- Debounce the query-box URL write (~250 ms).
- Extract the top-nav merge logic into a small pure helper so it can be unit tested.

## 4. Non-goals

- Saving filters to localStorage or sessionStorage.
- Any change to search ranking or `searchAgents` scoring.
- New filter types, or new values for existing filters.
- Localized parameter names or values.
- Server-side rendering of the filtered state. The static fallback may briefly show the unfiltered list before hydration, and that is acceptable.
- New dependencies of any kind.
- Changes to other pages, to `content/agents/`, or to `src/data/generated/`.

## 5. Acceptance checks

**Automated.** All five must pass:

```bash
npm run check:data
npm run lint
npm run typecheck
npm test        # includes the new parse/serialize tests from requirement 13
npm run build   # must succeed and produce out/
```

**Build output checks:**

- `npm run build` finishes with no "useSearchParams() should be wrapped in a suspense boundary" error and no dynamic-server-usage error.
- `out/en/agents` and `out/ko/agents` are emitted as static HTML (either `index.html` or `.html`, depending on the trailingSlash config).

**Manual checks.** Run `npm run dev`, or serve `out/` with `python3 -m http.server -d out`, which adds no dependency. If a basePath is configured, adjust the URLs.

1. **Filters write the URL.** On `/en/agents`, pick Role = developer, Difficulty = advanced, and Installable only. The URL becomes exactly `/en/agents?role=developer&difficulty=advanced&installable=1`. Pressing Back once leaves `/en/agents` entirely, which shows no history entries were added. The scroll position does not jump.
2. **Reload.** Reloading that URL shows the same result count and the same highlighted chips. Opening it in a new tab gives the same result, and so does opening the same parameters on `/ko/agents`.
3. **Invalid values.** `/en/agents?difficulty=expertish&automation=9&role=developer` loads without an error in the console or the page. Only the role filter is applied. The URL is not rewritten until the user changes a filter; after that it contains only valid keys.
4. **Clear actions.** With `?query=review&role=developer&installable=1`:
   - "Clear filters only" gives `/en/agents?query=review`.
   - "Clear all" gives `/en/agents`.
5. **Top-nav on the agents page.** On `/en/agents?role=developer&installable=1`, search "review" in the header. The URL becomes `/en/agents?query=review&role=developer&installable=1`. The role and installable filters stay active, and the panel's search box shows "review".
6. **Top-nav elsewhere.** From another page, search "review" in the header. You land on `/en/agents?query=review` with no filters.
7. **Clearing the query box.** Typing in the panel's search box updates `?query=`. Clearing the box removes the `query` key.

**Diff check:** `git diff --stat` shows no change to `package.json` or `package-lock.json`.

## 6. Open questions

None block implementation. Confirm or correct the three [ASSUMPTION] items in section 2: the parameter names `category`, `tool` and `verified`, raw values rather than labels, and single-value filters.
