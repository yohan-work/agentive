I reviewed the two files you pasted: `agent-search-panel.tsx` and `badge.tsx`. I did not see the other seven files (the two pages, `agent-card.tsx`, `agent-detail-header.tsx`, `workflow-card.tsx`, `dictionaries.ts`, `utils.ts`). Where a finding depends on those files, I say what to check rather than guess.

## 1. Findings

### Major

**M1. `src/components/common/badge.tsx`, `DifficultyBadge` / `StatusBadge` (new lines ~29–37): `locale = defaultLocale` lets a missed call site fall back to English without any error.**

```tsx
export function DifficultyBadge({ difficulty, locale = defaultLocale }: { difficulty: Difficulty; locale?: Locale }) {
...
export function StatusBadge({ status, locale = defaultLocale }: { status: VerifiedStatus; locale?: Locale }) {
```

The bug was "badges render English on /ko". With `locale` optional, any badge call site that doesn't pass `locale` will still compile, lint, and build, and it will render English on `/ko`. That's the same bug this PR is fixing. So the green typecheck and build don't show that every call site was updated. The call sites are in five files I haven't seen (two pages, `agent-card.tsx`, `agent-detail-header.tsx`, `workflow-card.tsx`), and any of them might have been missed.

Fix: make `locale` required so the compiler checks every call site.

```tsx
export function DifficultyBadge({ difficulty, locale }: { difficulty: Difficulty; locale: Locale }) {
  const tone = difficulty === "advanced" ? "warning" : difficulty === "intermediate" ? "accent" : "default";
  return <Badge tone={tone}>{getDictionary(locale).agentMeta.difficulty[difficulty]}</Badge>;
}

export function StatusBadge({ status, locale }: { status: VerifiedStatus; locale: Locale }) {
  const tone = status === "expert" || status === "tested" ? "success" : status === "community" ? "accent" : "default";
  return <Badge tone={tone}>{getDictionary(locale).agentMeta.status[status]}</Badge>;
}
```

Then drop the now-unused `defaultLocale` import and re-run `npm run typecheck`. Any errors it reports are the call sites that were rendering English on `/ko`. Also run `grep -rn "DifficultyBadge\|StatusBadge" src/` and check that each hit passes the page's resolved locale, not a hard-coded `"en"`.

**M2. `src/components/agents/agent-search-panel.tsx`, `locale?: Locale` (context line 28) and `getDictionary(locale)` (new line 30): the panel has the same English fallback risk, and I can't see whether `locale` is always defined.**

The hunk shows `locale?: Locale` in the props type. The destructuring line isn't in the diff, so I can't tell whether it defaults to `defaultLocale` (the unchanged `defaultLocale` import suggests it does). Either way, there's a problem:
- If it defaults: the agents page must pass `locale={locale}`, or `/ko` gets an English search panel with no error. Is the agents listing page one of the "two pages that render badges" in this PR? If it isn't in the PR, it didn't change, so check whether it already passes `locale`.
- If it doesn't default: `getDictionary(undefined)` depends on how `getDictionary` handles bad input (check `src/i18n/dictionaries.ts`). `dictionary.agentSearch` could throw during prerender.

Fix: make it required, like in M1.

```tsx
  locale: Locale;
```

and confirm that `src/app/[locale]/agents/page.tsx` (or wherever `<AgentSearchPanel` is rendered) passes the `locale` it got from `resolveLocale(params)`.

**M3. `agent-search-panel.tsx` new lines 33–34, used at new lines 49 and 52: the `as Difficulty` / `as VerifiedStatus` casts hide unknown values. An unrecognized filter value renders as the literal "undefined".**

```tsx
const difficultyLabel = (value: string) => meta.difficulty[value as Difficulty];
const statusLabel = (value: string) => meta.status[value as VerifiedStatus];
...
filters.difficulty ? `${labels.difficulty}: ${difficultyLabel(filters.difficulty)}` : undefined,
...
filters.verifiedStatus ? `${labels.verified}: ${statusLabel(filters.verifiedStatus)}` : undefined,
```

When it breaks: if `filters.difficulty` or `filters.verifiedStatus` can hold a value outside the union, the lookup returns `undefined`. The template literal then renders the chip as `Difficulty: undefined` / `난이도: undefined`. The old `titleCase(...)` code never produced that. The panel reads the URL via `useSearchParams`, so the likely source is a URL like `/ko/agents/?difficulty=expert` or an old link using a renamed status. I can't see how `filters` is initialized, so check whether the initial `filters` state is built from `searchParams` and whether it validates values first. If it only comes from clicking `FilterRow` chips, the values come from the typed arrays and this doesn't happen, so it drops to minor.

Fix: validate before looking up, and fall back to the raw value.

```tsx
const difficultyLabel = (value: string) =>
  (meta.difficulty as Record<string, string>)[value] ?? titleCase(value);
const statusLabel = (value: string) =>
  (meta.status as Record<string, string>)[value] ?? titleCase(value);
```

A better option is to reject unknown values where the URL is parsed into `filters`, so an invalid filter never reaches state.

### Minor

**m1. `agent-search-panel.tsx` new line 31 (`statuses` array): the order of the Verified chips changed, but the PR description doesn't mention it.**

```diff
-const statuses = ["unverified", "tested", "community", "expert"];
+const statuses: VerifiedStatus[] = ["unverified", "community", "tested", "expert"];
```

This swaps `tested` and `community` in the Verified filter row, which is a visible UI change the requirement didn't ask for. If it's intentional (ordering by trust level), say so in the PR description. If not, restore the original order.

**m2. `agent-search-panel.tsx` new line 30: `getDictionary` is imported into a client component.** `getDictionary` probably pulls both full `en` and `ko` dictionaries into the client JS bundle for the agents page. Check `dictionaries.ts`: if it's one object literal holding both locales, it all gets bundled. This works, but it's heavier than it needs to be. A lighter option is to resolve `labels` and `meta` in the server page and pass them as props (`labels={dictionary.agentSearch} meta={dictionary.agentMeta}`), so the panel doesn't import the dictionary module. It's fine to defer, but it's worth knowing.

**m3. `agent-search-panel.tsx` new lines 138–150 (`formatCount`): the `shown` highlight depends on the placeholder's name.** This is correct for the two `showing` strings you described: `"Showing {shown} of {total} agents"` and `"{total}개 중 {shown}개 표시"` both split into the right parts, and the Korean word order works. However:
- If a translation ever misspells a placeholder (`{Shown}`), it renders literally with no warning. The `!(key in values)` branch returns the raw text.
- `resultCount` for `en` is presumably `"{count} agents"`, which gives "1 agents". The old code had the same issue, so this isn't a regression.
No change needed now. A parity test is listed under Test gaps.

### Requirement / constraint check

| Item | Holds? | Evidence |
|---|---|---|
| Status/difficulty badges translated | Yes in `badge.tsx`; **not verified at call sites** | `badge.tsx` new lines 32 and 37 read `agentMeta`. I can't see whether callers pass `locale` (M1). |
| Agent and workflow cards translated | **Not reviewed** | `agent-card.tsx` and `workflow-card.tsx` weren't pasted. |
| Agent search panel translated | Mostly | Every visible literal in the old code was replaced: placeholder, "Installable only", the six filter titles, active-filter prefixes, "Showing…", "Clear all", scope note, count, "Clear filters only". The difficulty/status chip labels are now translated through `label=` (new lines 89–95, 98–104). Open issues are M2 (is locale passed) and M3 (undefined label). |
| Badge props typed as `VerifiedStatus` / `Difficulty` | Yes | `badge.tsx` new lines 29 and 35. The typecheck passing means callers already pass union-typed values. |
| `formatStatus` removed | Yes, import removed | `badge.tsx` line 1. Typecheck passing means no other TS import remains. Check that the new `en` `agentMeta.status` strings match what `formatStatus` produced, so English copy doesn't change without notice. |
| No server-side `searchParams`; client reads URL via `useSearchParams` | Holds in this diff | `useSearchParams` import unchanged, and no `searchParams` prop was added. |
| Role/category chips stay `titleCase(slug)` | Holds | New lines 47–48 still use `titleCase(filters.role)` / `titleCase(filters.category)`. `FilterRow` for role/category (new lines 87–88) doesn't pass `label`, so it keeps its default. |
| Every key in both `en` and `ko` | **Not verified** | `dictionaries.ts` wasn't pasted. The typecheck only enforces this if `ko` is typed against `en`'s shape (e.g. `const ko: Dictionary = …`) and `agentMeta.difficulty` / `.status` are `Record<Difficulty, string>` / `Record<VerifiedStatus, string>`. Check both. |

**About the passing tests:** lint, typecheck, and build all pass even if every badge call site omits `locale` (M1) or the panel isn't given `locale` (M2), because both fall back to English without an error. The 20 tests probably don't render `/ko` at all. So they don't cover the one behavior this PR exists to fix. A string check on the built `out/ko/...` HTML would cover it (see T1).

### Nits (optional)
- `badge.tsx`: calls `getDictionary(locale)` once per badge render. It's cheap, but you could pass the resolved label in instead.
- `agent-search-panel.tsx` new lines 33–34: `difficultyLabel`/`statusLabel` are recreated on every render. This is harmless.

## 2. Test gaps

I'm assuming `tests/*.test.ts` are plain Node unit tests without a DOM renderer [ASSUMPTION], so these target data and pure functions plus the built output.

- **T1 `ko build renders Korean badges and search panel`** (covers M1, M2, and the requirement)
  Setup: after `npm run build`, read `out/ko/agents/index.html` and one `out/ko/agents/<slug>/index.html` and `out/ko/workflows/index.html`.
  Assert: they contain the `ko` values of `agentMeta.difficulty.beginner`, `agentMeta.status.<some status>`, and `agentSearch.placeholder`. They don't contain `"Beginner"`, `"Installable only"`, or `"Search by name, role, task, tag, or tool"`.
- **T2 `agentMeta covers every Difficulty and VerifiedStatus in both locales`**
  Setup: import `getDictionary` and the union values (or a runtime list of them).
  Assert: for `en` and `ko`, every `Difficulty` and `VerifiedStatus` has a non-empty string in `agentMeta`.
- **T3 `agentSearch templates keep their placeholders`** (covers m3)
  Assert: `en.agentSearch.showing` and `ko.agentSearch.showing` both contain exactly `{shown}` and `{total}`. Both `resultCount` strings contain `{count}`.
- **T4 `unknown difficulty/status label falls back instead of "undefined"`** (covers M3)
  Setup: move `difficultyLabel`/`statusLabel` into a pure helper in `src/lib/` and call it with `"nonsense"`.
  Assert: the result is a non-empty string not equal to `"undefined"`.
- **T5 `formatCount splits Korean word order correctly`** (optional)
  Setup: move `formatCount`'s splitting logic into a pure function that returns parts.
  Assert: `"{total}개 중 {shown}개 표시"` with `{shown: 3, total: 10}` gives `[10, "개 중 ", 3(highlighted), "개 표시"]`.

## 3. Verdict

**Merge after fixes.** The panel and badge translation work itself is correct in the code I saw. What decides it:
- **M1 and M2:** make `locale` required on `DifficultyBadge`, `StatusBadge`, and `AgentSearchPanel`, then re-run typecheck. That's the only mechanical way to confirm the `/ko` fix reaches every call site, including the five files I didn't see.
- **M3:** add the fallback so an unknown filter value can't render "undefined".

The merge decision stays with you. I haven't seen the other seven files, and I haven't seen the tests run myself.

## 4. Questions
1. How is the initial `filters` state set: from `useSearchParams` (e.g. `?difficulty=…`) or only from chip clicks? This decides whether M3 stays major or drops to minor.
2. Is the `tested` ↔ `community` swap in `statuses` intentional (m1)?
3. In `dictionaries.ts`, is `ko` typed against `en`'s shape, and are `agentMeta.difficulty`/`status` typed as `Record<Difficulty | VerifiedStatus, string>`? If not, the "every key in both locales" rule isn't compiler-enforced for these new groups.
