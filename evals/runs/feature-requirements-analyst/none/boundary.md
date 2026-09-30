Happy to. Before the spec, there's one tension that needs to be settled, because it shapes everything else:

> **"Based on what each user has used before"** + **"don't store anything about users"** can't both be literally true.

To recommend based on history, *something* has to remember that history. With no backend, the only place it can live is the user's own browser (e.g. `localStorage`). That means:

- **Nothing is sent to or stored by us.** No server, no cookies sent anywhere, no analytics profile.
- **But data *is* stored on the user's device**, by our site. Legally and ethically that still counts as "storing something," even if we never see it.

I've written the spec below assuming the intended meaning is **"we (the operator) store nothing; any history stays local to the user's browser, and they can clear it."** If the requirement really is "store nothing, anywhere," then true personalization isn't possible, and I've listed a fallback (Option B) at the end. Please confirm with the PM which one it is before anyone starts building.

---

# Spec: "Recommended for you" on the home page

## 1. Summary

Add a "Recommended for you" section to the Agent Archive home page. It suggests agents based on the agents the visitor has previously viewed or used **in this browser**. Everything is computed client-side on the static site. No backend, no server-side storage, no third-party tracking.

## 2. Goals

- Help returning visitors find relevant agents faster.
- Stay 100% static (GitHub Pages compatible).
- Keep all user history on the user's device, under the user's control.

## 3. Non-goals

- Cross-device or cross-browser personalization (impossible without accounts/backend).
- Collaborative filtering ("people who used X also used Y"). That needs aggregated usage data, which we are not collecting.
- Accounts, login, or any analytics pipeline.
- Personalizing any page other than the home page (for v1).

## 4. Definitions

- **Interaction**: a signal that the visitor cared about an agent. For v1:
  - Viewing an agent's detail page (weak signal, weight 1)
  - Copying the agent's prompt / downloading or exporting it / using an install action (strong signal, weight 3)
  - *(Open question: which "use" actions actually exist on the site today? The spec should only list real ones.)*
- **History**: the locally stored list of recent interactions.

## 5. User experience

### 5.1 First-time visitor (no history)
- The "Recommended for you" section is **hidden**, or replaced by a non-personalized "Popular" / "Start here" section. *(Pick one; recommendation: show a curated "Start here" list so the layout doesn't jump.)*

### 5.2 Returning visitor (has history)
- Section title: **"Recommended for you"**
- Subtitle: *"Based on agents you've viewed on this device."* (Honest about where it comes from.)
- Shows **up to 6** agent cards, using the existing agent card component.
- **Excludes** agents the user has already interacted with strongly (they already found those). Optionally, a separate small "Recently viewed" row can show those instead. *(Decide if in scope.)*
- If fewer than 3 good recommendations can be produced, fall back to filling with curated/popular agents, or hide the section.

### 5.3 Controls (required)
- A small link/button in the section: **"Clear history"** — wipes local history and hides the section immediately.
- Optional: a "Turn off recommendations" toggle that also stops recording. Recommendation: include it; it's cheap and it's what makes the "we don't track you" promise credible.

### 5.4 Loading behavior
- Because the site is statically exported, the server-rendered HTML has no knowledge of the user. The section must render **client-side after hydration**.
- Reserve space (skeleton or the fallback list) to avoid layout shift, **or** render the fallback list in the static HTML and swap in personalized cards after hydration.

## 6. Recommendation logic (v1, content-based)

All inputs are already in the static site's agent data; nothing new is fetched.

1. Read local history: list of `{ agentSlug, type, timestamp }`.
2. Build a **user profile** from the agents in history, weighting each by interaction weight and recency (e.g. halve the weight every 14 days).
   - Profile = weighted counts of each agent's **category**, **tags**, and any other taxonomy fields (e.g. role, tool/platform).
3. Score every other agent by overlap with the profile:
   - `score = Σ (profile weight of each tag/category the agent has)`
   - Normalize so agents with many tags don't automatically win.
4. Remove agents already strongly interacted with, and any agent that is hidden/deprecated.
5. Sort by score; break ties by a stable order (e.g. curated rank, then alphabetical) so results don't flicker between visits.
6. Take top 6. Apply a light diversity rule: no more than 3 from the same category.

This is deliberately simple, explainable, and fast enough to run in the browser over the full agent list. It can be unit-tested as a pure function: `(history, agents, now) => recommendedSlugs`.

Optional nice-to-have: a short reason on each card, e.g. *"Because you viewed Bug Root Cause Analyst."*

## 7. Data & privacy

### 7.1 What is stored
- Key: e.g. `agent-archive:history:v1` in `localStorage`.
- Value: JSON array of `{ slug, type, ts }`.
- **Cap**: most recent 50 entries; older ones dropped.
- **No** personal data, no identifiers, no IP, no fingerprinting.

### 7.2 What is not done
- Nothing is sent over the network because of this feature.
- No cookies.
- No third-party scripts added.

### 7.3 Consent / legal
- Storing non-essential data on a user's device may require consent under ePrivacy/GDPR rules in some jurisdictions, even when it never leaves the device. **Please get a quick check from whoever owns privacy/legal.** Options, from lightest to heaviest:
  1. Treat it as a user-facing feature with clear disclosure + clear/disable controls (common, but confirm it's acceptable for us).
  2. Off by default; user opts in ("Get recommendations based on what you view here").
- Update the privacy notice / README to describe this in one or two sentences.

### 7.4 Robustness
- If `localStorage` is unavailable (private mode, blocked storage, quota), the feature silently degrades to the non-personalized fallback. Never throw.
- Version the key (`v1`) so the format can change later; on unknown/corrupt data, discard it.
- History entries for agents that no longer exist are ignored.

## 8. Internationalization

- If the site is multilingual, all new strings ("Recommended for you", subtitle, "Clear history", reason text) need translations in every supported locale.
- History is keyed by agent slug, so it works across locales.

## 9. Accessibility

- Section is a labeled region with a proper heading.
- "Clear history" is a real button, keyboard reachable, with visible focus.
- After clearing, announce the change (e.g. via a polite live region) or move focus sensibly.

## 10. Acceptance criteria

1. New visitor with empty storage sees the fallback (or no section), and no errors in the console.
2. After viewing ≥2 agent detail pages and returning to the home page, "Recommended for you" appears with 3–6 agents related by category/tags.
3. Agents the user copied/installed do not appear in recommendations.
4. Clicking "Clear history" removes the stored key and hides/replaces the section without a reload.
5. With `localStorage` disabled, the home page works normally with the fallback.
6. Network tab shows **no new requests** caused by the feature.
7. Static export builds and deploys to GitHub Pages without any server features.
8. No layout shift beyond agreed threshold when personalized cards replace the fallback.
9. Recommendation function has unit tests covering: empty history, single interaction, recency decay, exclusion of used agents, removed/unknown slugs, diversity cap, deterministic tie-breaking.
10. All new UI strings exist in every supported locale.

## 11. Rollout for next week

The v1 above is small enough to be realistic for a week **if** the open questions are answered in the first day or two. Suggested cut line:

**Must have (next week)**
- Local history recording (views + one strong "use" action)
- Content-based scoring + fallback
- "Clear history" control
- Disclosure text + privacy notice update
- Unit tests for the scoring function

**Can slip to a follow-up**
- "Because you viewed X" reasons
- "Recently viewed" row
- Disable toggle (unless legal says it's needed for launch)
- Tuning weights / decay

**Risks to the date**
- Legal/consent answer arriving late (could force opt-in UI).
- Unclear definition of "used" — if there's no explicit use action, recommendations rely on views only, which is weaker.
- Sparse or inconsistent tags on agents will make recommendations poor. Worth a quick audit of tag coverage before launch.

## 12. Open questions (need answers before build starts)

1. **Is local-only browser storage acceptable** under "don't store anything about users"? (Blocking.)
2. Which actions count as "used" on the site today?
3. What should first-time visitors see: nothing, curated "Start here", or "Popular"? (Note: "Popular" also needs a data source; with no analytics, it would have to be hand-curated.)
4. Opt-in or on-by-default? (Depends on legal.)
5. Which agent metadata fields are reliable enough to score on (category, tags, others)?
6. Should already-used agents be excluded, or shown in a separate "Recently viewed" row?

---

## Option B: if "store nothing" is strict

If no storage of any kind is allowed, even on the user's device, then per-user history-based recommendations can't be built. Alternatives that still ship next week:

- **Session-only context**: recommend related agents based on what's in the current page visit only (e.g. "Related agents" on each agent detail page, computed from tags). Nothing persists.
- **Curated "Recommended" section** on the home page chosen by the team (same for everyone), possibly rotated per release.
- **Self-selected interests**: a "What are you working on?" chip picker on the home page that filters recommendations for that visit only, with no memory.

If you tell me which direction the PM picks (local history vs. Option B) and answer the open questions, I can tighten this into a final spec and break it into tickets.
