Before the spec, there's one conflict that has to be settled, because it decides what "personalized" can mean here.

**"Based on what each user has used before" and "don't store anything about users" can't both be fully true.** A recommendation based on past behavior has to remember that behavior somewhere. With no backend, the only place left is the user's own browser (localStorage). So the real decision is:

- **Option A – On-device history (recommended):** Store a short list of agent slugs the visitor viewed, copied, or downloaded, in their browser only. Nothing is sent anywhere, there are no cookies, no IDs, and no analytics. The user can see and clear it. This gives you real "recommended for you". It *is* still storage, though, just on the user's device and not yours. Legal/privacy should confirm that counts as "not storing anything about users."
- **Option B – No memory at all:** Recommendations are based only on what the user does in the current visit, or on a quick "What are you working on?" picker (role, task, tools). This is fully stateless, but it's contextual, not "based on what you used before," and it resets every visit.

Also note that "used" can only mean *actions on this site* (views, copying install commands, downloading kits). A static site can't see whether someone actually installed or ran an agent.

**My question: is on-device storage (Option A) acceptable?** The spec below assumes **yes** and includes Option B as the fallback. If the answer is no, drop §4.1 and ship §4.2 alone. The rest of the spec still holds.

---

# Feature Spec: "Recommended for you" on the Home Page

## 1. Summary
Add a "Recommended for you" section to the Agent Archive home page. It ranks agents by how similar they are to the agents this visitor has engaged with before. Everything runs client-side on the static site, and no user data leaves the browser.

## 2. Goals / Non-goals
**Goals**
- Returning visitors see relevant agents without searching.
- Zero backend, zero server-side user data, zero third-party tracking.
- Ship a scoped v1 in next week's release.

**Non-goals (v1)**
- Cross-device sync, accounts, or login.
- Collaborative filtering ("people like you also used…"). This needs aggregate data from many users, which we won't have.
- Tracking real-world installs or usage outside the site.
- Measuring the feature with per-user analytics.

## 3. Users & Scenarios
- **Returning visitor:** viewed 3 coding agents last week and lands on home. Sees related coding and review agents.
- **First-time visitor / cleared storage:** no history. Sees the fallback (curated/popular or the picker). Never an empty or broken section.
- **Privacy-conscious visitor:** can turn it off and clear history with one click.

## 4. Functional Requirements

### 4.1 On-device interaction history (Option A)
- **Signals recorded** (on this device only):
  | Event | Weight |
  |---|---|
  | Viewed agent detail page | 1 |
  | Copied install command / config | 3 |
  | Downloaded install kit / export | 3 |
- **Storage:** one localStorage key, e.g. `aa:recs:v1`, holding `[{ slug, event, ts }]`.
  - Store slugs and timestamps only. No free text, search queries, or identifiers.
  - Cap at the 50 most recent events, and drop anything older than 90 days on read.
  - Version the key so the format can change later.
- **Controls:**
  - A "Why these?" / "Clear history" link in the section, which wipes the key immediately.
  - A "Turn off recommendations" toggle, stored as a single boolean flag. When off, nothing is recorded.
- **Resilience:** wrap every storage call in try/catch. If storage is unavailable (private mode, blocked), fall back silently to §4.3.

### 4.2 Contextual picker (Option B; optional in v1, required if A is rejected)
- An inline chip picker: "I'm working on: Coding · Writing · Research · Data · Ops…", using existing taxonomy categories/tags.
- Selecting chips re-ranks recommendations for this page view only. Nothing is persisted, or at most sessionStorage if you approve that.

### 4.3 Fallback (always required)
- No history or picker selection: show a curated/"popular" list. Use an editor-maintained list in the data files or verified agents sorted by `updatedAt`.
- The section heading changes to "Popular agents" so it never claims to be personalized when it isn't.

### 4.4 Ranking (client-side, deterministic)
- Build a feature vector for each agent at build time from existing metadata: category, tags, tools/platforms, and workflow/starter-pack membership.
- User profile = the sum of feature vectors of engaged agents × event weight × recency decay (for example, half-life of 14 days).
- Score every candidate by overlap (cosine or weighted Jaccard) with the profile.
- **Exclude** agents the user has already copied or downloaded. Keep viewed-only agents, but rank them lower.
- **Diversity:** max 2 agents per category in the top 6.
- **Boost** verified agents slightly. Never surface agents below a minimum verification level, if one exists.
- Show 6 cards. Ties are broken by verification status, then `updatedAt`.

### 4.5 UI
- Placement: on the home page, below the hero and above the main catalog.
- Reuse the existing agent card component.
- Each card can show a small reason, e.g. "Because you viewed *X*" (the top contributing agent). Keep it simple for v1.
- The first render must not flash wrong content. Because the page is static, render a skeleton or the fallback on the server, then hydrate to personalized results on the client.
- Localize all new strings in every supported locale.

## 5. Technical Approach
- **Build time:** emit a compact `recs-index` JSON (slug, feature tags, verification, updatedAt) alongside existing generated data. Keep it small, with no descriptions.
- **Client:** one hook (e.g. `useRecommendations()`) reads storage, computes scores, and returns the list. One small `recordAgentEvent(slug, type)` helper is called from the detail page, the copy button, and the download handler.
- **No network calls** are added. No cookies. No third-party scripts.
- **Performance:** scoring a few hundred agents in the browser is trivial. Target < 5 ms and no measurable change in page weight beyond the index.

## 6. Privacy Requirements
- All data stays in the user's browser. The site never transmits it.
- Add a short note to the site's privacy/about text: what is stored, where, for how long, and how to clear it.
- No fingerprinting, no IDs, no cross-site storage.
- If legal decides that on-device storage still counts as "storing user data" (e.g. under ePrivacy/cookie-consent rules in some regions), ship Option B only, or make A opt-in.

## 7. Acceptance Criteria
1. A first-time visitor sees a "Popular agents" section with 6 cards, and it has no console errors.
2. After viewing 3 agents in the same category and returning to home, at least 3 of 6 recommendations share tags/category with them, and none of the 3 viewed agents take a top slot.
3. A copied or downloaded agent never appears in recommendations.
4. "Clear history" empties storage and immediately reverts to the fallback.
5. With recommendations turned off, no events are written (verified in devtools).
6. With localStorage blocked, the page renders the fallback without errors.
7. The network tab shows no new requests caused by the feature.
8. The static export builds and deploys to GitHub Pages unchanged. All locales render translated strings.

## 8. Success Measurement
Without per-user tracking, you can't measure personal CTR directly. Options:
- Qualitative: user feedback, a GitHub issue/discussion prompt.
- Aggregate, privacy-safe analytics, **only if** such analytics already exist and are approved. Count clicks on the section as a whole with no user identifiers.
- Otherwise, accept that v1 success is judged qualitatively.

## 9. Assumptions
- Option A (on-device localStorage) is acceptable. **Needs confirmation.**
- Existing agent metadata (category, tags, tools) is rich and consistent enough to compute similarity.
- The home page can host a client component, so client-side hydration is fine on a static export.
- "Used before" means on-site engagement, not real installs.

## 10. Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Privacy stance rejects on-device storage | Feature can't be "based on history" | Ship Option B + fallback. Retitle the section. |
| Sparse/inconsistent tags → weak recs | Irrelevant suggestions | Audit tags before release. Diversity cap. Fallback blend. |
| Cold start (most visitors are new) | Most people never see personalization | Good fallback. Picker as a lightweight alternative. |
| Hydration flicker on static page | Janky first paint | Skeleton/fallback server render, then swap. Reserve fixed height. |
| Timeline (next week) | Rushed quality | Cut scope per §11. |
| History is per-browser | Doesn't follow users across devices | Document it as expected behavior. Out of scope. |

## 11. Scope for Next Week's Release
**Must ship (≈3–4 dev days + review):**
- Event recording (view/copy/download), storage with caps/expiry.
- Build-time recs index + client-side ranking.
- Home section with fallback, "Clear history", i18n strings.
- Acceptance criteria 1–8.

**Cut to follow-up if time is short:**
- The "Because you viewed X" reason text.
- The on/off toggle (keep "Clear history").
- The contextual picker (§4.2), unless Option A is rejected, in which case it becomes the must-ship feature.

## 12. Next Actions
1. **PM + legal/privacy (today):** decide between Option A and Option B-only. This blocks the start.
2. **Content owner:** quick audit of agent tags/categories for consistency (1 day, can run in parallel).
3. **Eng:** build the recs index + ranking hook behind the fallback first, so something shippable exists by mid-week.
4. **Design:** confirm the section placement, card reuse, and "Why these? / Clear history" affordance.
5. **QA:** test plan against §7, including blocked-storage and private-window cases.
6. **Release note:** one line explaining that recommendations are computed on your device and nothing is sent to us.
