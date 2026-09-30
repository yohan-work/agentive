I reviewed only the two files you pasted: `agent-search-panel.tsx` and `badge.tsx`. I have not seen the other 7 files (the two pages, `agent-card.tsx`, `agent-detail-header.tsx`, `workflow-card.tsx`, `dictionaries.ts`, `utils.ts`). Wherever a conclusion depends on them, I say what to check. I'm not guessing at their contents.

## 1. Findings

### Major

**M1. `badge.tsx`: `locale` is optional and defaults to English, so a call site that doesn't pass it still shows English on /ko, and nothing catches it**

```tsx
export function DifficultyBadge({ difficulty, locale = defaultLocale }: { difficulty: Difficulty; locale?: Locale }) {
export function StatusBadge({ status, locale = defaultLocale }: { status: VerifiedStatus; locale?: Locale }) {
```

The requirement is specifically that badges stop showing English on /ko. With this signature, any `<StatusBadge status={...} />` that doesn't pass `locale` still type-checks, lints, builds, and shows "Expert" / "Advanced" on /ko. So your passing typecheck and build don't show that every badge was updated. I also can't confirm it from the diff, because the call sites are in files you didn't paste (the two pages, `agent-card.tsx`, `agent-detail-header.tsx`, `workflow-card.tsx`).

Fix: make the prop required so the compiler finds every call site that's missing it.

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

Then drop the `defaultLocale` import and run `npm run typecheck`. Every error it reports is a place that still renders English on /ko. To see them now: `grep -rn "StatusBadge\|DifficultyBadge" src`.

**M2. `agent-search-panel.tsx`: the agent cards in the search results may still get no locale. `agent-grid.tsx` is not in the PR**

The panel renders `<AgentGrid ... />` (the import is on the unchanged `import { AgentGrid } from "./agent-grid";` line). That call isn't in the hunks you pasted, and `agent-grid.tsx` isn't one of the 9 changed files. The requirement includes "the agent … cards", and on /ko/agents those cards are rendered through this grid. Check two things:
- that the panel passes `locale={locale}` to `AgentGrid`, and that `AgentGrid` passes it to `AgentCard` (and then to the badges). If any link in that chain is missing, the cards on the search page stay English. With M1 applied, the compiler would only catch the last link (`AgentCard` → badge), and only if `AgentCard`'s own `locale` prop is required too;
- that `agent-grid.tsx` has no hard-coded English of its own. An empty state such as "No agents match…" would be the usual one. If it does, it's part of "the agent search panel" as the user sees it, and it stays English on /ko.

I'm rating this major because it directly decides whether the requirement is met. It could turn out to be fine; I can't tell without seeing that file.

### Minor

**m1. `agent-search-panel.tsx`: `difficultyLabel` / `statusLabel` cast any string to a key, so an unknown value renders "undefined"**

```tsx
const difficultyLabel = (value: string) => meta.difficulty[value as Difficulty];
const statusLabel = (value: string) => meta.status[value as VerifiedStatus];
```

The `as` casts turn off the check. If `filters.difficulty` or `filters.verifiedStatus` ever holds a value that isn't in the dictionary, the active-filter chip reads `Difficulty: undefined`. That could come from state restored from the URL, a stale link, or a status added to the type later but not to `agentMeta`. The old `titleCase(...)` couldn't fail this way. In the code shown, filters are only set from the typed `difficulties` / `statuses` arrays, so this can't happen today, unless filter state is also seeded from `useSearchParams` somewhere outside the hunks. Please check that. Fix: fall back to the raw value.

```tsx
const difficultyLabel = (value: string) => meta.difficulty[value as Difficulty] ?? titleCase(value);
const statusLabel = (value: string) => meta.status[value as VerifiedStatus] ?? titleCase(value);
```

**m2. `agent-search-panel.tsx`: the order of the Verified filter chips changed, which the requirement didn't ask for**

```diff
-const statuses = ["unverified", "tested", "community", "expert"];
+const statuses: VerifiedStatus[] = ["unverified", "community", "tested", "expert"];
```

This changes the visible order of the Verified chips on both locales. It may be deliberate (ascending trust), but it isn't a translation change and the PR description doesn't mention it. Either keep the original order or say so in the PR description.

**m3. `agent-search-panel.tsx`: the client component now imports the whole dictionary module**

`getDictionary` is now imported in a component that uses `useSearchParams`, so it must be a client component. That puts both the `en` and `ko` dictionaries, every group and not just `agentSearch`/`agentMeta`, into the client JS for the agents page. It's harmless if `dictionaries.ts` is small and has no server-only imports. The build passing suggests there are no server-only imports. If the file grows, pass `labels={dictionary.agentSearch}` and `meta={dictionary.agentMeta}` from the server page as props instead of calling `getDictionary` in the client. The same applies to `badge.tsx` wherever it ends up inside a client tree (through `AgentGrid` → `AgentCard`).

### Checked and holds (the two files you were unsure about)

- **Every visible string in the search panel diff is replaced.** That covers the placeholder, "Installable only" (both the checkbox label and the chip), the six filter row titles, the six chip prefixes, "Showing … of … agents", "Clear all", the search-scope note, "{n} agents", and "Clear filters only". Lines outside the hunks (roughly 58–68 and 114–134 of the new file, plus the body of `FilterRow`) weren't shown. Check them for leftover English, e.g. a `sr-only` label on the search input, an "All" chip, or an `aria-label` in `FilterRow`.
- **Role/Category constraint holds.** `titleCase(filters.role)` / `titleCase(filters.category)` are kept, and the Role/Category `FilterRow`s pass no `label`, so they keep whatever default `FilterRow` uses. That matches your "taxonomy is a separate issue" note.
- **`formatCount` handles the Korean word order.** `"{total}개 중 {shown}개 표시".split(/(\{\w+\})/)` gives `["", "{total}", "개 중 ", "{shown}", "개 표시"]`. `{total}` becomes an unstyled span and `{shown}` becomes the bold span, so the emphasis stays on the right number even though the order is reversed. The leading `""` renders nothing. Unknown placeholders are left as literal text, not dropped. Index keys are fine here because the list is static for a given template.
- **The no-server-searchParams constraint holds.** Nothing new reads the URL. `locale` arrives as a prop, so the server-rendered HTML and the client render use the same locale, with no hydration mismatch from this change.
- **Removing `formatStatus` looks safe from what you reported.** `typecheck` passing means no `.ts`/`.tsx` file under the tsconfig still imports it. It doesn't cover `.mjs` scripts. Run `grep -rn formatStatus scripts tests src` to confirm nothing else uses it.

## 2. Test gaps

Your five checks passing doesn't cover this requirement. Lint, typecheck, and build all pass on a page that still renders English on /ko (see M1), and nothing you listed renders a component in the `ko` locale. The 20 tests are presumably node-level tests of data and lib code. Tests to add under `tests/`, using `node:test` via tsx:

1. **`dictionaries: ko has every en key`**. Setup: walk `getDictionary("en")` and `getDictionary("ko")` recursively. Assert the two key sets are equal and every `ko` value is a non-empty string. This enforces the "every key in both locales" rule even if `ko` isn't typed against `en`'s shape.
2. **`agentMeta covers every VerifiedStatus and Difficulty`**. Setup: a `const` list of every union member, exported from `src/types/agent.ts` or built from the schema. Assert `agentMeta.status[s]` and `agentMeta.difficulty[d]` are defined for both locales. This catches the case in m1 when a new status is added.
3. **`StatusBadge renders Korean for locale ko`**. Setup: `renderToStaticMarkup(<StatusBadge status="expert" locale="ko" />)` from `react-dom/server`. Assert the output contains `getDictionary("ko").agentMeta.status.expert` and doesn't contain `"Expert"`. Do the same for `DifficultyBadge`.
4. **`formatCount keeps emphasis on {shown} in Korean word order`**. Setup: move `formatCount` into `src/lib/` and export it so it can be tested. Render `<span>{formatCount("{total}개 중 {shown}개 표시", { shown: 3, total: 12 })}</span>` with `renderToStaticMarkup`. Assert the text is `12개 중 3개 표시` and the `font-semibold` span wraps `3`, not `12`. Add a case with an unknown `{foo}` placeholder and assert it's left as literal text.
5. **(Optional) built output check for badges**: after `npm run build`, assert that `out/ko/agents/<some-slug>/index.html` contains no English status or difficulty label. This doesn't work for the search panel: a component that uses `useSearchParams` falls back to its nearest Suspense boundary during static export, so its content isn't in the prerendered HTML. Test 4 and a component render test are the right way to cover the panel.

## 3. Verdict

**Merge after fixes.** What decides it:
- **M1** needs the one-line signature change and a typecheck. As it stands, the PR can't show that every badge on /ko is translated.
- **M2** is a check: confirm `locale` reaches `AgentGrid` → `AgentCard`, and that `agent-grid.tsx` has no English strings. If either is missing, the requirement isn't met for the cards on the search page, and the verdict becomes **do not merge** until it's fixed.
- m1–m3 are optional. m1 is a one-line hardening worth taking.

This is based on the two files I saw and the check results you reported. The merge decision is yours.

## 4. Questions

1. Does `agent-search-panel.tsx` pass `locale` to `<AgentGrid>`, and does `agent-grid.tsx` pass it to `AgentCard` and contain no strings of its own (for example an empty state)? This decides M2.
2. Is filter state (`difficulty`, `verifiedStatus`) ever initialized from `useSearchParams`, or only from chip clicks? This decides whether m1 can happen today.
3. Was the Verified chip reorder (m2) intentional?

## Nits (optional)

- `"{count} agents"` / `"Showing {shown} of {total} agents"` read as "1 agents" when the count is one. This predates the PR; `Intl.PluralRules` or a `one`/`other` pair in `en` would fix it.
- `difficulties` / `statuses` repeat the union types. Exporting `const` arrays from `src/types/agent.ts` would give one source of truth, and test 2 could reuse them.
