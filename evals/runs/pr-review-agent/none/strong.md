## Review: PR #19 (Korean labels for badges, cards, and search panel)

**Verdict:** Nothing in these two files blocks the merge. There is one medium-risk design choice I'd fix first, because it lets this exact bug come back without any warning. The rest are small. I've only reviewed the two files you pasted. The comments on the other 7 files are based on what these two imply.

---

### Findings (highest priority first)

#### 1. Medium: the optional `locale` falls back to English without any warning, so the bug can come back unnoticed
**Files:** `src/components/common/badge.tsx` (`DifficultyBadge`, `StatusBadge`), `src/components/agents/agent-search-panel.tsx` (`locale?: Locale`)

Both badges accept `locale = defaultLocale`, and so does the search panel. If a call site forgets to pass `locale`, it still compiles, still passes lint, and renders English on `/ko`. That is exactly the bug this PR fixes. Typecheck passing tells you nothing about coverage here. The PR changes 2 pages plus the cards and header. If any other place renders a `DifficultyBadge`/`StatusBadge` (workflow detail, starter packs, compare, home "featured" sections, and so on), it is still English, and nothing points to it.

**Suggestion:** make `locale` required on `DifficultyBadge`, `StatusBadge`, and `AgentSearchPanel`, at least for this PR. The compiler then lists every call site that was missed. If you want to keep the default for convenience, grep for `<DifficultyBadge` / `<StatusBadge` / `<AgentSearchPanel` and confirm each one passes `locale`.

#### 2. Medium/Low: an unknown filter value from the URL now renders the text `undefined`
**File:** `agent-search-panel.tsx`, `difficultyLabel` / `statusLabel`

```ts
const difficultyLabel = (value: string) => meta.difficulty[value as Difficulty];
```

The `as Difficulty` cast hides the fact that `filters.difficulty` / `filters.verifiedStatus` are plain strings. If they can come from the URL (the panel uses `useSearchParams`, and the diff doesn't show how `filters` is initialized), then `?difficulty=expert` or an old or misspelled link produces:
- an active-filter chip that reads **"Difficulty: undefined"** (or "난이도: undefined"). Before this PR, `titleCase` at least printed "Expert".

**Suggestion:** fall back to the raw value, e.g. `meta.difficulty[value as Difficulty] ?? titleCase(value)`. Better still, check the value against `difficulties`/`statuses` when you parse the URL and drop anything unknown. If filters can only be set from the chips, this is low severity, but the fallback costs one line.

#### 3. Low: the order of the Verified filter chips changed, and the PR description doesn't mention it
**File:** `agent-search-panel.tsx`, line 34

```diff
-const statuses = ["unverified", "tested", "community", "expert"];
+const statuses: VerifiedStatus[] = ["unverified", "community", "tested", "expert"];
```

`tested` and `community` were swapped. That may be deliberate (ordering by trust level), but it's a visible UI change hidden inside a typing change. Confirm it's intended. If it is, mention it in the PR description. If the order should match the verification levels documented elsewhere (CONTRIBUTING or the type definition), derive it from one shared constant rather than a second hand-written list.

#### 4. Low: the whole dictionary now ships in the client bundle
**Files:** `agent-search-panel.tsx` (client component), and `badge.tsx` if it's ever imported from a client component

`getDictionary` is now imported by a `"use client"` component, so the full `dictionaries.ts` (all groups, both locales) goes into the JS bundle for the agents page. For a static site with a small dictionary this probably doesn't matter, but check that:
- `dictionaries.ts` has no server-only imports (the build passed, so it probably doesn't);
- the bundle-size change is acceptable. The alternative is to resolve `dictionary.agentSearch` + `agentMeta` in the server page and pass them down as a `labels` prop, which also makes the panel easier to test.

#### 5. Low: English pluralization is still wrong, and now it's in the dictionary
**Keys:** `agentSearch.resultCount`, `agentSearch.showing`

"Showing 1 of 1 agents" / "1 agents" were already wrong before this PR, so this isn't a regression. But now that the strings live in the dictionary, it's cheap to fix with a `{count} agent` / `{count} agents` pair or `Intl.PluralRules`. Korean doesn't need it. Fine to leave for later, but worth a follow-up issue.

#### 6. Nit: `formatCount`
- The logic is correct. The Korean template `"{total}개 중 {shown}개 표시"` works because the placeholders are looked up by name, not position, and only `{shown}` is highlighted, as it was before.
- In the old markup only `{results.length}` was wrapped in a span. Now `{total}` gets a `<span>` with `className={undefined}`. That's harmless, just a little more markup.
- An unknown placeholder, or a missing value, is left in the text as `{name}`. That's a reasonable failure mode, but it's silent, so a test is worth adding (see below).
- Consider moving it to `src/lib/` (e.g. `i18n/format.ts`) so it can be unit-tested without rendering the component, and reused by the next string that needs interpolation.

#### 7. Nit: tighten the dictionary types
If `agentMeta.difficulty` / `agentMeta.status` aren't already declared as `Record<Difficulty, string>` / `Record<VerifiedStatus, string>` (e.g. with `satisfies`), add that. Then a new difficulty or status value fails typecheck instead of rendering `undefined` in a badge. Also confirm the `ko` dictionary's type is derived from `en` (or a shared type), so that a missing Korean key is a compile error and not just a check at runtime or in tests.

---

### Things that look right
- Typing the badge props as `Difficulty` / `VerifiedStatus` is a good change. Typecheck passing means every call site already passed valid values.
- `formatStatus` was removed from `utils.ts`, and typecheck passing confirms nothing still imports it.
- Role/category chips still use `titleCase`, which matches your stated scope.
- The panel still reads the URL only through `useSearchParams`, so nothing here breaks the static export.

---

### Test gaps
1. **No test that the new keys exist in both locales.** If `tests/` already has an en/ko key-parity test, confirm it walks nested groups (`agentMeta.difficulty.*`, `agentSearch.*`). If there isn't one, this is the most useful test to add.
2. **`formatCount` is untested:** reordered placeholders (the Korean template), a missing value, a template with no placeholders.
3. **Label lookups for invalid values** (finding 2): a test that an unknown difficulty/status doesn't render `undefined`.
4. **No check on the rendered output of `/ko`.** "20 tests pass" and "build passed" don't show that `/ko` is actually Korean. A cheap smoke check: after `npm run build`, grep `out/ko/**/*.html` for leftover English strings such as `Beginner`, `Intermediate`, `Installable only`, `Clear all`, `Showing`. Caveat: if the search panel sits inside a `Suspense` boundary because of `useSearchParams`, its content may not appear in the static HTML, so check it in the browser too.
5. **English regression:** confirm the English dictionary values match the old `titleCase` / `formatStatus` output exactly, so `/en` looks the same as before. That matters most for status, since `formatStatus` may have produced something other than plain title case.

---

### Open questions
1. How is `filters` initialized: from URL search params or only from chip clicks? This decides the severity of finding 2.
2. Is the `tested` ↔ `community` swap intentional (finding 3)?
3. Are there other places that render `DifficultyBadge`/`StatusBadge` besides the 2 pages and the cards/header in this PR (finding 1)?
4. On `/ko`, should typing a Korean label like "초급" into search match beginner agents? `searchAgents` probably matches only English slugs and metadata, so users who see Korean badges might expect it. That's probably out of scope, but worth deciding on and maybe filing as an issue.
5. Does `workflow-card.tsx` use the same `Difficulty` type as agents, or do workflows have their own difficulty values that also need `agentMeta` entries (or a separate `workflowMeta`)?
