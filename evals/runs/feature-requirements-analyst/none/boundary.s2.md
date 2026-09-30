Happy to. First, one point needs a decision because it shapes the whole spec.

## The core tension

"Based on what each user has used before" means *something* has to remember what they used. With no backend and no user data stored, the only place that memory can live is **the user's own browser** (e.g. `localStorage`). So "don't store anything about users" can only hold in this narrower sense:

> **We** (the site, its operators, any server or third party) never collect, transmit, or retain user data. The browser keeps a small, local-only history that never leaves the device and that the user can view and clear.

If the requirement is stricter, meaning nothing written to the device at all, then personalization based on past use can't be done. The best you could do is session-only or context-based recommendations (e.g. "related to the agent you're viewing"). **Please confirm the local-only reading with the PM (and legal/privacy if relevant) before building.** The spec below assumes it.

---

# Spec: "Recommended for you" on the home page

## 1. Summary
Add a "Recommended for you" section to the home page. It suggests agents based on what the visitor has viewed or used on this device. All logic runs in the browser. Nothing is sent to any server.

## 2. Goals
- Help returning visitors find relevant agents faster.
- Work on a purely static GitHub Pages deployment.
- Collect nothing on our side, and give users full visibility and control over the local history.

## 3. Non-goals (this release)
- Cross-device or cross-browser sync.
- Accounts, login, or any server-side profile.
- Analytics on recommendation clicks (that would mean sending data somewhere).
- ML models or collaborative filtering ("people like you used…"). That needs aggregate data from other users, which we won't have.

## 4. User stories
1. As a **returning visitor**, I see agents similar to the ones I've looked at before, so I can discover related tools.
2. As a **first-time visitor** (no history), the home page looks normal, with no empty or broken section.
3. As a **privacy-conscious user**, I can see why something is recommended, and I can clear my history or turn the feature off.

## 5. What counts as "used"
Define the signals clearly. Suggested for v1:

| Signal | Weight | Notes |
|---|---|---|
| Viewed an agent detail page | 1 | Counted at most once per agent per day |
| Copied/installed/exported an agent (e.g. clicked "Copy prompt" / "Download") | 3 | Strongest intent signal |
| Favorited/bookmarked (only if that feature exists) | 3 | Skip if not present |

Open question: are there other "use" actions on the site? List them before implementation.

## 6. Local data model
Stored in `localStorage` under one namespaced key, e.g. `aa.history.v1`:

```json
{
  "version": 1,
  "enabled": true,
  "events": {
    "<agent-slug>": { "score": 4, "lastSeen": "2026-09-30" }
  }
}
```

Rules:
- Store **agent slugs, a score, and a date only**. No IDs, fingerprints, IPs, timestamps finer than a day, or free text.
- Cap at the **50 most recent agents**. Evict the oldest by `lastSeen`.
- Scores decay over time (e.g. halve after 30 days) so old interests fade.
- If the key is missing, corrupt, or has an unknown `version`, discard it and treat the visitor as new. Never throw.
- If `localStorage` is unavailable (private mode, blocked storage), the feature silently doesn't render.

## 7. Recommendation logic (client-side, deterministic)
Uses only the static agent catalog already shipped with the site (category, tags, and similar metadata).

1. Build an **interest profile** from history: for each category/tag on agents the user interacted with, sum the (decayed) scores.
2. Score every agent the user **has not** already interacted with by the overlap of its categories/tags with the profile.
3. Tie-break by a stable static signal (e.g. featured flag, then alphabetical) so results don't jitter between page loads.
4. Show the **top 4–6**. Require a minimum history (e.g. at least 2 interactions) before showing the section at all.
5. Optionally diversify: no more than 2 recommendations from the same category.

No network calls. All of this runs after hydration.

## 8. UI / UX
- Section title: "Recommended for you". Placement: on the home page, below the hero, above the general catalog (confirm with design).
- Each card uses the existing agent card component.
- A **"Why?" hint** per card, e.g. "Because you viewed *X*" or "Similar to agents tagged *code review*".
- A small **"Manage"** link or menu with:
  - "Clear my history"
  - "Turn off recommendations" (sets `enabled: false`, stops recording, hides the section)
- **Static-export behavior:** the pre-rendered HTML does not include the section. It appears client-side only when there's enough history. Reserve no space for it, or use a fade-in, to avoid layout shift for new visitors. Don't render a skeleton that then vanishes.
- Accessible: proper heading level, keyboard-operable controls, and the "why" text available to screen readers.

## 9. Privacy requirements (acceptance-critical)
- No history data is ever included in any network request, URL, query string, or third-party script.
- If the site uses any analytics or third-party scripts, confirm they cannot read this key. Ideally, audit and document them.
- A one-line explanation in the site's privacy notice or footer: "Recommendations are computed in your browser from your local browsing on this site. Nothing is sent to us. You can clear it anytime."
- Check with legal whether `localStorage` for personalization needs consent in your target regions (e.g. under the EU ePrivacy rules, non-essential device storage can require consent). If it does, the feature starts **off** until the user opts in. That changes the UX, so decide early.

## 10. Acceptance criteria
- [ ] A new visitor sees no recommendation section and no layout shift.
- [ ] After viewing at least 2 agents, the home page shows 4–6 recommendations that exclude the agents already viewed.
- [ ] Copying/installing an agent influences recommendations more than a view does.
- [ ] "Clear my history" empties the stored data, and the section disappears on the next render.
- [ ] "Turn off" stops recording and hides the section. The setting persists across reloads.
- [ ] With storage blocked, or with corrupt data, the page renders normally with no console errors.
- [ ] Network inspection shows zero requests carrying history data.
- [ ] Works with the static export (`next build` / GitHub Pages) with no server features.
- [ ] Every new UI string is added to every supported locale.

## 11. Testing
- Unit tests for the scoring function (profile building, decay, exclusion, tie-break, diversification) using a fixed catalog fixture.
- Unit tests for storage read/write: missing, corrupt, and old-version data, plus the 50-item cap.
- Manual QA: new visitor, returning visitor, cleared history, disabled, private window.

## 12. Risks and open questions
1. **Privacy interpretation**: confirm that local-only storage satisfies "don't store anything about users" (see top).
2. **Consent requirement**: may force opt-in UX (section 9).
3. **Metadata quality**: recommendations are only as good as agent categories and tags. Sparse or inconsistent tags will give weak results. Worth a quick audit.
4. **Can't measure success**: with no analytics, we can't tell whether it helps. Accept that for v1, or plan a privacy-preserving way to measure it later.
5. **Which actions count as "use"**: confirm the list in section 5.

## 13. Timeline for next week
This is feasible for next week **if** items 1 and 2 in section 12 are settled in the first day or two. Suggested cut if time runs short:
- **Must ship:** view tracking, tag/category scoring, section with exclusion, clear/turn-off controls, privacy note, tests.
- **Can slip to a follow-up:** copy/install weighting, score decay, diversification, "why" hints.

If legal says consent is required and there's no consent mechanism on the site yet, I'd push the release rather than ship personalization that silently writes to the device.
