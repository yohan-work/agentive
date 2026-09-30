Overall this looks mergeable. Moving strings into dictionaries, typing the badge props, and replacing the "Showing X of Y" markup with a template all go the right way. I found a few things to confirm before merging. The first one is the most likely to leave English on /ko.

## Findings (highest priority first)

### 1. Medium-High: `locale` is optional and falls back silently, so a caller that forgets it still renders English on /ko
**Files:** `src/components/common/badge.tsx` (`DifficultyBadge`, `StatusBadge`), `src/components/agents/agent-search-panel.tsx`

`locale = defaultLocale` means that if any call site doesn't pass `locale`, the badge renders English, and typecheck, lint, and build all still pass. That's the same bug this PR is fixing, and the tooling can't catch it.

The call sites I'd check most closely:
- **`agent-grid.tsx` is not in the list of changed files.** `AgentSearchPanel` renders `<AgentGrid … />`, and `AgentGrid` renders `AgentCard`, which now has translated badges. If `AgentGrid` didn't already accept `locale` and pass it through to `AgentCard`, then the cards in the search panel on `/ko/agents` will still show English badges and card text. The panel's own chrome will be Korean, so the page will look fixed at a glance. Please confirm `AgentGrid` receives `locale` and passes it on.
- Any other place that renders `DifficultyBadge`, `StatusBadge`, `AgentCard`, or `WorkflowCard` outside the two pages in this PR, such as home, starter packs, workflow detail, or related-agents lists.

**Suggestion:** make `locale` required on `DifficultyBadge`, `StatusBadge`, and ideally on `AgentCard`, `WorkflowCard`, and `AgentGrid` too. Then `tsc` lists every call site you missed. Because these components are only ever rendered under `[locale]`, a default doesn't save anything.

### 2. Medium: a lookup miss renders `"undefined"` where it used to fall back to `titleCase`
**Files:** `agent-search-panel.tsx` (`difficultyLabel`, `statusLabel`), `badge.tsx`

```ts
const difficultyLabel = (value: string) => meta.difficulty[value as Difficulty];
```
The `as` cast hides the fact that `value` can be any string. If `filters.difficulty` or `filters.verifiedStatus` ever holds a value outside the union, the active-filter chip reads `Difficulty: undefined` and the filter button has an empty label. Before this PR it would have shown `titleCase(value)`. That can happen if the filters are seeded from the URL (for example `?difficulty=expert` or an old link), or if a YAML file has a status the dictionary doesn't cover. The badges have the same risk: the typed props only protect you at compile time, and agent data comes from YAML at runtime.

**Suggestion:** add a fallback such as `meta.difficulty[value as Difficulty] ?? titleCase(value)`, or a small type guard. Also confirm that the loader or `check:data` rejects difficulty or status values outside the union.

### 3. Low-Medium: the order of the "Verified" filter changed without being mentioned
**File:** `agent-search-panel.tsx`
```diff
-const statuses = ["unverified", "tested", "community", "expert"];
+const statuses: VerifiedStatus[] = ["unverified", "community", "tested", "expert"];
```
This changes the visible order of the filter chips. It may be on purpose, for example to match the order of verification levels in the contributing docs. It isn't in the PR description, though, and it has nothing to do with translation. Either say in the PR that it's intentional or revert it so the diff stays focused.

### 4. Low: the client component now bundles the whole dictionary for both locales
**File:** `agent-search-panel.tsx` (`import { getDictionary } from "@/i18n/dictionaries"`)

This component uses `useState`, so it's a client component. Importing `getDictionary` there most likely puts every UI string for both `en` and `ko` into the client JS. At today's size that's probably a few KB, so it's fine. It will grow as more pages get translated. A cleaner pattern is for the server page to call `getDictionary(locale)` and pass `labels={dictionary.agentSearch}` and `meta={dictionary.agentMeta}` as props. The badges are probably server-rendered, so this matters less there, unless they're also imported from a client component such as `AgentCard` inside the client grid, which they might be.

Not a blocker. Just decide on it deliberately.

### 5. Low: small robustness issues in `formatCount`
**File:** `agent-search-panel.tsx`
- `key in values` also matches inherited keys. For example, `{constructor}` in a template would make it try to render a function. Use `Object.hasOwn(values, key)`.
- The only thing that styles `{shown}` is the hard-coded `key === "shown"`, so the helper is tied to one template. That's fine for now. If you reuse it, add a `highlight` parameter.
- If a translator leaves out a placeholder, or renames it (for example `{total}` → `{전체}`), nothing will warn you. See the test gaps below.

Otherwise it's correct. The strings in the returned array don't need keys, and the spans are keyed by index, which is fine for a static split.

### 6. Info: known leftovers (in scope as agreed, but worth writing down)
- Role and category chips and the active-filter chips still use `titleCase(slug)`, which is intentional according to the constraints. The result on /ko is a mixed-language chip like `역할: Product Manager`. Link the taxonomy issue in the PR so this doesn't read as a regression.
- Searching still matches English metadata. A Korean user typing "초급" or "검증됨" won't match on difficulty or status, even though those words now appear in the UI. Out of scope, but maybe worth a follow-up issue.

## Test gaps
1. **No check that `en` and `ko` have the same keys** (unless `ko` is typed as `typeof en` or checked by a test already). Add a unit test that deep-compares the key sets of the two locales. At minimum, compare `agentMeta.difficulty` and `agentMeta.status` against every member of `Difficulty` and `VerifiedStatus`.
2. **No placeholder-parity test**: for templated strings (`showing`, `resultCount`), check that every `{placeholder}` in `en` also appears in `ko`.
3. **No test for `formatCount`**: cover a template with placeholders in both Korean and English order, an unknown placeholder left in place, and a template with no placeholders.
4. **No check that /ko pages are actually Korean.** Build passing doesn't prove it. A cheap test is to grep the static export after build (`out/ko/agents/index.html`, a /ko agent detail page, a /ko workflow page) for known English strings such as `Beginner`, `Unverified`, `Installable only`, `Clear all`, `Showing`. That would catch finding 1 automatically.
5. **The fallback path has no test**: an agent or filter value outside the union should render something readable, not `undefined`.

## Open questions
1. Does `AgentGrid` already accept and forward `locale` to `AgentCard`? If not, the search panel's cards on /ko are still English (finding 1).
2. Are filters, or anything besides `initialQuery`, ever initialized from `useSearchParams`? If so, an invalid difficulty or status value in the URL hits finding 2.
3. Was the change to the `statuses` order intentional?
4. Is `ko` in `dictionaries.ts` typed against `en` (for example `const ko: Dictionary = …`) so a missing key fails typecheck? If it is, several of the test gaps shrink.
5. Were `formatStatus` or `titleCase` exported for use anywhere outside `src/`, such as scripts or tests? The typecheck passing suggests no, but `scripts/*.mjs` are not typechecked.
6. Do any other surfaces render these badges or cards without a `locale` prop, such as home, starter packs, or related agents? Did you visually check them on /ko?

**Recommendation:** confirm findings 1 and 2 (it's quick with a grep for `<AgentGrid`, `<AgentCard`, `<WorkflowCard`, `<DifficultyBadge`, `<StatusBadge`), make `locale` required, and add the fallback. After that I'd be comfortable merging. Findings 3–5 and the tests can go in this PR or a follow-up.
