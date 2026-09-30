# Spec: "Recommended for you" on the Agent Archive home page

## 0. The constraint conflict to settle first

The request has three requirements that pull against each other:

1. **Personalized** by "what each user has used before"
2. **Fully static**: GitHub Pages, no backend
3. **Store nothing about users**

A static site has no server that could see or remember a user, so any history has to live **in the user's own browser**. That is only compatible with #3 if "we don't store anything about users" means *we (the project) don't collect, transmit, or keep user data*. It is not compatible if it means *nothing may be written anywhere, including the visitor's own browser*.

This spec assumes the first reading:

> **Assumption A1:** History is kept only in the visitor's browser (`localStorage`). It never leaves the device. There are no cookies, analytics events, network calls, or server logs tied to it. The user can see and clear it.

If the PM or legal reads "store nothing" strictly (no browser storage either), cross-visit personalization is impossible. The fallback is **session-only** personalization (in memory, gone on reload) or **non-personal recommendations** ("popular", "related to what you're viewing"). See section 9. **Please confirm A1 before build starts.** It is the one decision that changes the design.

---

## 1. Summary

Add a "Recommended for you" row to the home page. It shows 3–6 agents chosen from agents the visitor has already viewed, copied, or downloaded on this device. All tracking and ranking runs client-side against static data generated at build time. Nothing is sent anywhere.

## 2. Goals and non-goals

**Goals**
- Returning visitors find relevant agents faster from the home page.
- No backend, no accounts, no third-party scripts, no data leaving the browser.
- Ships in next week's release with low risk.

**Non-goals (this release)**
- Cross-device sync or accounts
- Collaborative filtering ("people who used X also used Y"): there is no aggregate data without collection
- ML models, embeddings computed at runtime, or A/B testing infrastructure
- Personalizing any page other than the home page

## 3. Users and scenarios

| Scenario | Expected behavior |
|---|---|
| First-time visitor (no history) | Row is hidden, or shows a clearly non-personal "Popular / Start here" row (see F6). It is never labeled "for you". |
| Returning visitor who viewed 2+ agents | Row shows agents related to those they used, excluding ones already used |
| Visitor with history who clears it | Row returns to the first-time state immediately |
| Visitor with storage blocked (private mode, disabled storage) | Fails silently to the first-time state, with no errors |
| JS disabled / static HTML render | Row absent. The page is fully usable. |

## 4. Functional requirements

**F1. Usage signals (client-side only)**
Record these events in `localStorage` under one namespaced key (e.g. `aa:history:v1`):
- `view`: agent detail page opened
- `copy`: prompt/install text copied
- `download`: install kit or export downloaded

Each entry: `{ slug, type, ts }`. Cap at the **50 most recent** entries (FIFO) and drop entries older than **90 days**. Store no free text, search queries, IP, user agent, or identifiers.

**F2. Recommendation data (build time)**
At build time, generate a static related-agents map, `slug -> [{slug, score}]` with the top ~10 per agent, from existing metadata:
- shared category / taxonomy tags (highest weight)
- shared workflows or starter packs the agents appear in together
- same target tool/platform, if that field exists

This is a deterministic function of repo content. No user data is involved. Ship it as a static JSON/TS module.

**F3. Ranking (client-side)**
For each agent in history, weight the signal as `copy`/`download` = 3, `view` = 1, with recency decay (for example, halve the weight every 14 days). Sum `signal weight × related score` across all candidates. Then:
- exclude agents already in history (configurable, default on)
- exclude deprecated/hidden agents
- break ties by a stable order (e.g. featured, then alphabetical) so output doesn't flicker
- return the top 6. If fewer than 3 qualify, fill with the non-personal fallback, labeled as such, or hide the row.

**F4. Home page UI**
- Section title: "Recommended for you". Subtitle: "Based on agents you've viewed on this device."
- Reuses the existing agent card component.
- Each card may show a short reason: "Because you viewed *{Agent name}*".
- Renders client-side after hydration. Reserve its space or place it below the fold so there is no layout shift.

**F5. Transparency and control**
- A "Clear history" control in the section and in a footer/privacy location.
- An "Turn off recommendations" toggle stored in `localStorage` (`aa:recs:off`). When off, stop recording new history and clear existing history.
- One line in the privacy/about text: history stays in your browser and is never sent to us.

**F6. Empty state**
With no usable history, either hide the section (simplest) or show "Popular starting points", drawn from existing featured agents or starter packs. Never label non-personal content "for you".

**F7. i18n**
Every new string goes in both `en` and `ko`. Agent names in reasons use the localized name if one exists.

## 5. Non-functional requirements

- **Privacy:** no network requests triggered by this feature. Verify in DevTools during QA.
- **Performance:** the related-agents map adds < 30 KB gzipped to the home bundle, or is lazy-loaded. Ranking runs in < 5 ms for the history cap.
- **Robustness:** all storage access is wrapped in try/catch. Corrupt or unknown-version data is discarded, not crashed on.
- **Static export compatible:** no server components that read per-user data, no middleware, no `headers()`.
- **Accessibility:** a section heading with correct hierarchy, keyboard-reachable controls, and a clear-history action announced to screen readers.

## 6. Technical design (outline)

```
build:  content/agents/*.yaml ──> script ──> related-agents map (static module)
client: detail page ──record(slug,type)──> localStorage[aa:history:v1]
        home page (client component) ──read history + map──> rank() ──> cards
```

- `lib/recommendations/history.ts`: `record()`, `read()`, `clear()`, `isEnabled()`, with versioned schema and caps
- `lib/recommendations/rank.ts`: a pure function, `(history, relatedMap, catalog, now) => Recommendation[]`, that is unit-testable
- build script extension: generates the related map, with a data check that every slug in the map exists
- `components/home/RecommendedForYou.tsx`: a client component rendering nothing until mounted

## 7. Acceptance criteria

- [ ] With no history, no "for you" row appears (or the fallback appears with a non-personal label).
- [ ] After viewing 2 agents in category X, the home page shows ≥3 unseen agents from X or related categories.
- [ ] A copied or downloaded agent influences results more than a viewed one.
- [ ] Already-used agents are not recommended.
- [ ] "Clear history" empties storage and the row updates without a reload.
- [ ] Turning recommendations off stops recording. Verify storage stays empty after further browsing.
- [ ] With `localStorage` unavailable, there are no console errors and the page renders normally.
- [ ] The Network tab shows zero requests caused by this feature.
- [ ] EN and KO strings are present. Lint, typecheck, tests, data checks, and the static build all pass.
- [ ] Unit tests for `rank()` cover empty, single, decay, exclusion, tie-break, and fill cases.

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| "Store nothing" is read strictly, so localStorage isn't allowed | Feature as specced can't ship | Confirm A1 now. Fall back to section 9 option B or C. |
| Recommendations feel weak because metadata-based similarity is coarse | Low engagement, row ignored | Show reasons, limit to 6, and tune weights after release |
| "For you" wording implies tracking and makes users uneasy | Trust hit | On-device copy, a visible clear control, and a privacy line |
| Hydration flash / layout shift on the home page | Visual polish issue | Place below the fold or reserve height, and render only after mount |
| One-week deadline | Rushed ranking, gaps in testing | Cut scope (see below) and keep ranking a small pure function with tests |
| Home bundle grows | Slower first load | Precompute top-N only, and lazy-load the map |

**Scope cut if the week gets tight:** ship F1, F2 (tags only), F3 without decay, F4 without per-card reasons, F5 clear-history only, and F6 hidden. Add the reasons, decay, toggle, and workflow co-occurrence in the following release.

## 9. Alternatives if A1 is rejected

- **B. Session-only:** the same algorithm, with history kept in memory or `sessionStorage` only. Personalization lasts one visit. The label changes to "Related to what you've looked at".
- **C. Non-personal:** "Popular starting points" plus "Related agents" on detail pages. No history at all. This is the lowest risk, but it doesn't meet the "used before" goal.
- **D. Opt-in:** off by default, and a user turns on "Remember agents I view on this device". This is the most conservative option that still gives cross-visit personalization.

## 10. Open questions

1. **(Blocking)** Does on-device `localStorage`, never transmitted, satisfy "don't store anything about users"? Is opt-in (D) required?
2. What counts as "used": views only, or copy/download as well? The spec includes all three.
3. Should already-used agents be excluded, or can they appear as "Continue with…"?
4. Empty state: hide the section, or show popular/starter content?

## 11. Next actions

1. **Today:** PM (and whoever owns privacy) confirms A1 and open questions 1–4.
2. **Day 1–2:** Build-time related-agents map, `history.ts`, and `rank.ts` with unit tests.
3. **Day 3:** Home section component, recording hooks on detail/copy/download, and EN/KO strings.
4. **Day 4:** QA against the acceptance criteria (including the Network-tab and storage-blocked checks) and the privacy copy.
5. **Day 5:** Buffer and release. Note weight-tuning follow-ups for the next cycle.
