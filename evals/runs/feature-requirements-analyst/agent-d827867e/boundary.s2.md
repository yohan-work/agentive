Before writing a full spec, there's a conflict in the request that has to be resolved first: **"based on what each user has used before"** requires remembering past usage somewhere, while **"fully static, no backend"** and **"don't store anything about users"** remove every place to remember it. They can't all hold at once in their strictest form.

## Questions (most important first)

1. **What does "don't store anything about users" mean?** Specifically: is data kept only in the user's own browser (e.g. `localStorage`), never sent anywhere, acceptable? Or does "nothing" include the user's own device? This decides whether personalization is possible at all.
2. **What counts as "used before"?** Viewing an agent's page, copying its prompt, downloading an install kit, searching? Which of these does the site actually expose as events today? (I can't assume any tracking exists; please verify.)
3. **What should a first-time visitor (or someone with no history) see in the "Recommended for you" slot?** Hidden section, generic/popular picks, or something else?

## The conflict and the options

| Option | How it works | Meets "static" | Meets "store nothing" | Personalized from past use | Trade-offs |
|---|---|---|---|---|---|
| A. On-device history | Browser keeps a short list of agent slugs the user interacted with in `localStorage`; recommendations computed in the browser from static agent metadata (category, tags). Nothing leaves the device. | Yes | Only if on-device storage is acceptable under Q1 | Yes, across visits on the same browser/device | Lost on clearing site data, other devices, private windows. Still "stores" something, on the user's side; whether that needs a notice or consent is a privacy/legal call, not mine to make. |
| B. Session-only | Same as A but in memory or `sessionStorage`; cleared when the tab/session ends. | Yes | Closer (nothing persists) | Only within the current visit; the home page on a fresh visit has no history | Weak value for "used before": most users land on the home page first, with nothing yet to base it on. |
| C. Non-personalized recommendations | "Recommended" / "Popular" / "Start here" picks chosen by the team or from static metadata, same for everyone. | Yes | Yes, fully | No | Drops the core ask; label must not say "for you." |
| D. Backend or third-party analytics | Server-side profile or tracking. | No | No | Yes | Violates both stated constraints; listed only for completeness. |

My recommendation to discuss: **A if Q1 allows on-device storage, otherwise C**. But this is a product and privacy decision for the PM and whoever owns privacy, not something I'll pick silently. The provisional spec below is written for **Option A** and marks everything that depends on that choice.

On **"next week's release"**: I can't commit to that date. Whether it fits depends on the answers above and on engineering's estimate; the PM and engineering lead should confirm after the option is chosen.

---

## Provisional spec (Option A, pending answers)

### 1. Goal and user

Returning visitors to the Agent Archive home page see a short list of agents related to ones they've interacted with before, so they can find relevant agents faster, without any user data leaving their browser or the site needing a backend.

### 2. Requirements

1. **R1 – Record interactions on-device only.** When a user performs a qualifying interaction with an agent, the site records that agent's slug in browser storage on the user's device. [ASSUMPTION: qualifying interaction = opening an agent's detail page; confirm per Q2.]
2. **R2 – No transmission.** Interaction history is never sent over the network: no requests, analytics calls, query strings, or third-party scripts carry it.
3. **R3 – Bounded history.** At most N most-recent distinct agent slugs are kept; older entries are dropped first. [ASSUMPTION: N = 20.]
4. **R4 – Recommendation section.** On the home page, when history contains at least one valid agent, show a "Recommended for you" section with up to K agents. [ASSUMPTION: K = 6.]
5. **R5 – Recommendation rule.** Recommended agents are computed in the browser from the site's static agent metadata, ranked by overlap with the history (e.g. shared category/tags), and exclude agents already in the history. [ASSUMPTION: exact scoring rule to be agreed; see open decisions.]
6. **R6 – Static build.** The feature works in the static export deployed to GitHub Pages: no server, middleware, or runtime API is added.
7. **R7 – No-history state.** When there is no history (first visit, cleared storage, storage unavailable), the section follows the answer to Q3. [ASSUMPTION: the section is hidden.]
8. **R8 – User can clear history.** The section offers a control that deletes the stored history and hides the section. [ASSUMPTION: included because "store nothing" suggests users should be able to remove what is kept; confirm.]
9. **R9 – Resilience.** If browser storage is unavailable or its contents are invalid, the home page renders normally without the section and without errors.

**Suggested (not required)**
- A short line under the heading such as "Based on agents you viewed on this device" to make the on-device behavior clear.
- Localized heading and copy for every supported UI language.

### 3. Acceptance criteria

- **R1:** Given empty history, when the user opens agent A's detail page, then browser storage contains A's slug and nothing else about the user (no IDs, timestamps beyond ordering if needed, no IP, no device info).
- **R2:** Given a populated history, when the home page and an agent page are loaded with the browser network inspector open, then no request contains any stored slug list or history-derived value.
- **R3:** Given 20 slugs already stored, when the user opens a 21st distinct agent, then storage holds 20 slugs and the oldest is gone. Given A is already stored, when the user opens A again, then A appears once, as most recent.
- **R4:** Given history contains 1 valid agent, when the user loads the home page, then a "Recommended for you" section shows between 1 and 6 agents. Given enough related agents exist, then exactly 6 are shown.
- **R5:** Given history = [A] and agents B and C share A's category while D doesn't, when the home page loads, then B and C rank above D, and A is not shown. The same history always produces the same list (deterministic).
- **R6:** Given the production static build, when served from GitHub Pages (or an equivalent static file server), then the section works with no server component.
- **R7:** Given empty storage, when the user loads the home page, then no "Recommended for you" section appears and the rest of the page is unchanged.
- **R8:** Given a populated history, when the user activates the clear control, then storage for this feature is empty and the section disappears without a page reload.
- **R9:** Given storage access throws (e.g. blocked) or holds malformed data, when the home page loads, then it renders without the section and with no console errors from this feature.

### 4. Edge cases

- **Stored slug no longer exists** (agent renamed or removed): ignore it silently; if nothing valid remains, treat as no history.
- **Every related agent is already in history:** show fewer than K; if zero remain, hide the section (or apply the Q3 fallback).
- **Private/incognito window:** history lasts only for that window; no special handling.
- **Multiple tabs:** last write wins; no locking required.
- **Server-rendered HTML vs. browser storage:** the static HTML can't know the history, so the section must render client-side only and must not cause a visible layout jump or hydration mismatch. [Verify with engineering how the home page currently renders.]
- **Different language versions of the site:** history is shared across languages (same slug) unless decided otherwise.

### 5. Out of scope (must not change)

- Existing home page sections, their order, and content for users with no history.
- Agent detail pages, search, and install-kit behavior, other than recording the interaction in R1.
- The static-export deployment model and the absence of a backend.
- No analytics, cookies, or third-party scripts are added.

### 6. Dependencies and open decisions

| Item | Blocks | Who decides |
|---|---|---|
| Which option (A/B/C) is acceptable given "store nothing" | Everything | PM, with privacy owner |
| Whether on-device storage needs a notice, consent, or policy update | Release of A or B | Privacy/legal owner (not concluded here) |
| What counts as "used" (Q2) and whether those events are observable today | R1 | PM; engineering to verify |
| No-history behavior (Q3) | R7 | PM |
| Scoring rule, N and K | R3–R5 | PM with engineering |
| Whether agent metadata (categories/tags) is rich enough to produce useful related picks | R5 quality | Engineering to verify against current data |
| Release target (next week) | Scheduling | PM and engineering lead, after the option and estimate are settled |

If you answer the three questions, I'll tighten this into a final spec, or rewrite it for Option C if on-device storage is ruled out.
