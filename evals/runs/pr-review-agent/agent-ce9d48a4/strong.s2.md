## Verdict

**Approve after small changes.** The two files you pasted do what PR #19 asks for, and I found no blocking bug in them. Two things are worth fixing before merge. First, the optional `locale` prop falls back to English without any warning, which is the same kind of bug this PR is fixing. Second, the chip order changed without being mentioned. I can't vouch for the 7 files I haven't seen, so the test gaps below matter more than usual.

## Assumptions

- `agent-search-panel.tsx` starts with `"use client"`, and `getDictionary` is synchronous with no `server-only` import. A passing typecheck and build support both.
- `filters` only changes through the UI (`setFilter`, `setFilters`). It is never seeded from `useSearchParams`. Only `query` comes from the URL, which matches the "adopt it without resetting the other filters" comment.
- The dictionaries are typed so that `agentMeta.difficulty` and `agentMeta.status` are `Record<Difficulty, string>` / `Record<VerifiedStatus, string>` in **both** `en` and `ko` (for example, `ko` is typed against the `en` shape). If `ko` is just an untyped object literal, typecheck doesn't prove that a key exists in both locales.

## Findings (highest priority first)

### 1. Medium: `locale` defaults to English without warning, so a missed call site brings the bug back and no check catches it
`src/components/common/badge.tsx`: `DifficultyBadge` / `StatusBadge` use `locale = defaultLocale`.
`src/components/agents/agent-search-panel.tsx`: `locale?: Locale`, which already existed.

Any caller that forgets `locale` still compiles, still passes lint and tests, and shows English on `/ko`. That's exactly the bug in the issue. You list five badge call sites (two pages, agent-card, agent-detail-header, workflow-card). Nothing in your test output shows that all five pass `locale`.
**Fix:** make `locale` required on both badges, and on `AgentSearchPanel` if its callers allow it. Then the compiler lists every call site for you, and you can drop the `defaultLocale` imports.

### 2. Low-Medium: the "Verified" chip order changed without being mentioned
`agent-search-panel.tsx` line 37: `["unverified", "tested", "community", "expert"]` became `["unverified", "community", "tested", "expert"]`.
This changes the UI order, and the requirement doesn't ask for it. The new order (rising trust) is probably better, but mention it in the PR description or revert it. Unmentioned reorders like this make later bisecting and review harder.

### 3. Low: the label lookups use casts that hide `undefined`
`agent-search-panel.tsx` lines 48–49:
```ts
const difficultyLabel = (value: string) => meta.difficulty[value as Difficulty];
```
The cast tells TypeScript that the value is always a valid key. It is safe **today**, because values only come from the fixed arrays. But if `filters` is ever seeded from the URL (which is how the query already works), `?difficulty=foo` would render the chip as `Difficulty: undefined`. The old `titleCase` degraded gracefully in that case.
**Fix (one line each):** `meta.difficulty[value as Difficulty] ?? titleCase(value)`. Even better, type `AgentFilters.difficulty` / `verifiedStatus` as the unions, so no casts are needed.

### 4. Low: `formatCount` works, but it's a small untested template engine inside a component
`agent-search-panel.tsx` lines 153–164.
- It's correct for both templates: the split keeps the placeholders, and the Korean order `{total}…{shown}` works because the lookup is by name.
- Two edge cases:
  - An unknown placeholder or a typo in either dictionary (for example `{shwon}`) shows up as literal `{shwon}` text with no error.
  - `resultCount` puts `{count}` in an unstyled `<span>`. That's harmless.
- The name says "count", and the highlight rule `key === "shown"` is hard-coded, so the helper can't be reused elsewhere.
**Suggestion:** fine to merge as is. Move it to `src/lib/` (as an `i18n` helper or similar) and add a unit test the next time you need it, or right away if it's cheap (see test gaps).

### 5. Low / nit: the whole dictionary ships in the client bundle
Importing `getDictionary` into a client component bundles both locales' strings into the agents page JS. That's acceptable for a static site of this size, but be aware of it. If the dictionary grows, pass `dictionary.agentSearch` / `agentMeta` down as props from the server page.

### 6. Nit: plural and mixed-language output
- `"{count} agents"` renders as "1 agents". This existed before and doesn't affect Korean.
- On `/ko` the active-filter chips will read like `역할: Frontend Developer`. That's expected, since taxonomy translation is intentionally out of scope. Link the follow-up issue in the PR so reviewers don't report it again.

### Checked, no issue found
- `formatStatus` removal: typecheck and tests pass, so there are no remaining TS importers. A quick `grep -r formatStatus` would also cover `.mjs` scripts and tests that typecheck doesn't see.
- Server and client render the same locale, because it comes from route `params` in both. That means no hydration mismatch.
- `Difficulty[]` is assignable to `FilterRow`'s `values: string[]`, and the `label` callbacks match the existing signature.

## Test gaps

1. **No proof that `/ko` is free of English.** The five checks all pass on the original bug too. Add a cheap check after build, for example grep `out/ko/agents/index.html` and one `out/ko/agents/<slug>/index.html` for `Showing`, `Installable only`, `Clear all`, `Beginner`, `Unverified`. Even better, add a test that renders `AgentSearchPanel` / the badges with `locale="ko"` and asserts no known English label appears.
2. **Dictionary parity:** add a unit test that `Object.keys` of `en.agentMeta.*` and `en.agentSearch` exactly match `ko`, and that every `VerifiedStatus` / `Difficulty` value has a non-empty label in both. That's only needed if the types don't already enforce it (see Assumptions).
3. **Placeholder parity:** assert that `showing` and `resultCount` contain the same `{placeholders}` in both locales. This catches the typo case from finding #4.
4. **`formatCount` unit test:** cover English and Korean placeholder order, a missing key, and a template with no placeholders.
5. Manual step: click every difficulty and verified chip on `/ko/agents` and check that the active-filter pill text is Korean.

## Open questions

1. Is the chip reorder in finding #2 intentional?
2. Are there English strings left in the parts of `agent-search-panel.tsx` the diff doesn't show? Examples: an "All"/"Any" chip inside `FilterRow`, `aria-label`s, or the empty-results message in `AgentGrid`. The same question applies to agent-card and workflow-card, for things like "View agent", "steps", or automation labels.
3. Do the Korean labels for `tested` / `community` / `expert` match the verification-level wording in CONTRIBUTING, or is that wording English-only? They should say the same thing the policy means.
4. Is `ko` typed against `en` in `dictionaries.ts`? The answer decides whether test gap #2 is needed.

## Next actions

1. Make `locale` required on `DifficultyBadge`, `StatusBadge` (and `AgentSearchPanel` if feasible), and fix whatever the compiler flags. Blocking-ish, about 10 minutes.
2. Explain or revert the status reorder.
3. Add the `?? titleCase(value)` fallbacks.
4. Add the build-output grep for English strings on `/ko`, plus the dictionary parity test.
5. Merge, and link the taxonomy-translation follow-up in the PR description.
