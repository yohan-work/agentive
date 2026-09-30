Before the spec, one thing needs saying plainly: **two of your constraints conflict.** Recommendations "based on what each user has used before" need that history to be kept somewhere. "Fully static, no backend" rules out keeping it on a server. "Don't store anything about users" rules out keeping it in the browser too, if you read it strictly. You can't have all three, so someone has to pick which one gives way. The options are below, and I've written the provisional spec so it works for whichever you choose.

## Questions (most important first)

1. **Which constraint gives way?** Does "don't store anything about users" mean (a) *we* never collect or transmit anything (so data kept only in the user's own browser, like `localStorage`, is acceptable), or (b) nothing is persisted anywhere, including on the user's device? The answer decides which option below is possible.
2. **What counts as "used"?** Viewing an agent's detail page, copying its prompt, downloading or exporting it, or something else? I can't tell from the request which of these actions the site tracks or even offers, so each one needs checking.
3. **What should first-time or history-less visitors see?** Hide the section, or show a non-personalized fallback (for example, a curated list)?

## Options for the constraint conflict

| Option | How it works | Meets "personalized from past use" | Meets "store nothing about users" | Trade-offs |
|---|---|---|---|---|
| A. On-device history | Browser `localStorage` keeps a small list of agent IDs the user used. Recommendations are computed client-side. Nothing leaves the device. | Yes, across visits on the same browser | Only under reading (a) of Q1 | Lost when storage is cleared, in private mode, or on another device. May still need a privacy/consent review. |
| B. Session-only memory | History lives in memory for the current tab/session only. Nothing is persisted. | Partly: only within the current visit | Yes, under both readings | "Used before" means "earlier in this visit". The home page is usually the first page, so the section will often be empty. |
| C. Contextual, not personal | Recommendations based on what is on screen right now (e.g. "related agents" on a detail page), or a curated list on home. | No | Yes | Doesn't meet the "for you" goal. Simplest to build. |

Whether option A counts as "storing data about users", and whether it needs a consent notice, is **not a call I can make**. The product owner and whoever handles privacy for the site need to decide that.

The provisional spec below assumes **Option A**, because it's the only option that meets the stated goal. Everything marked [ASSUMPTION] depends on your answers.

---

## 1. Goal and user

A returning visitor to the Agent Archive home page sees a "Recommended for you" section listing agents related to ones they used before. Nothing about them is sent to or stored by the site operator, and the site stays fully static on GitHub Pages.

## 2. Requirements

**R1. Recording usage on the device only.** When a user performs a "use" action [ASSUMPTION: opening an agent's detail page; to be confirmed per Q2], the agent's identifier is recorded in browser-local storage on that device only.
- Rule from "don't store anything about users": no usage data is sent over the network, written to cookies, or included in any analytics payload.
- Rule: only agent identifiers (and optionally a timestamp or count) are stored. No names, emails, IPs, or free text.
- [ASSUMPTION] The stored history is capped (e.g. the most recent 20 agent IDs), and the oldest entry is dropped when the cap is reached.

**R2. Recommendations computed in the browser.** The "Recommended for you" list is computed in the browser from (a) the local history and (b) agent metadata already published in the static build.
- Rule from "fully static": no server, API, serverless function, or build-time per-user step is added. The site must still deploy as plain static files to GitHub Pages.
- Similarity basis [ASSUMPTION]: shared category or tags between used agents and candidates. Which metadata fields exist and are reliable enough needs **verifying** against the actual agent data.
- Agents already in the user's history are excluded from recommendations.
- [ASSUMPTION] The section shows up to 6 agents, most relevant first, with a deterministic tie-break (e.g. alphabetical by name) so results are stable and testable.

**R3. Home page section.** The home page shows a "Recommended for you" section when the user has at least one history entry and at least one recommendation can be computed.

**R4. Behavior without history.** When there is no history, or storage is unavailable, the section follows the Q3 decision. [ASSUMPTION: the section is hidden entirely.] The rest of the home page renders unchanged.

**R5. User control.** The user can clear their recommendation history from the section (e.g. a "Clear history" control). Clearing removes the stored data and hides the section.
- Rule from "don't store anything about users": if Option A is accepted, the user must be able to delete what's on their device without using browser settings. [ASSUMPTION; confirm with the privacy owner.]

**R6. Static-rendering compatibility.** The page's statically generated HTML does not include the recommendations. They render client-side after load, and this causes no layout shift that moves content the user is already reading. [ASSUMPTION: reserve no space when hidden, and insert the section above/below a fixed anchor; exact placement is a design decision.]

**Suggested (not required)**
- A short line under the heading explaining that recommendations are based on history kept only in this browser.
- Opt-out toggle to stop recording entirely.
- Localized heading/strings if the site is multilingual.

## 3. Acceptance criteria

**R1**
- Given a user with empty local history, when they open agent X's detail page, then local storage contains X's identifier and **no network request** made on that page contains X's identifier or any usage data (verified in browser dev tools' Network tab).
- Given local history with 20 entries, when the user uses a 21st agent, then history holds 20 entries and the oldest one is gone.
- Given any usage, when local storage is inspected, then it contains only agent identifiers (and timestamps/counts if used), no other fields.

**R2**
- Given history = [agent A] and agents B and C share A's category while D does not, when the home page loads, then B and C are recommended, D is not, and A is not.
- Given the production build, when deployed to GitHub Pages, then it consists only of static files and no new server endpoint is requested at runtime (check the Network tab: only static asset requests).
- Given identical history on two page loads, when the home page renders, then the recommended list and its order are identical.
- Given more than 6 candidates, when the home page renders, then exactly 6 are shown.

**R3**
- Given history with at least one entry and at least one computable recommendation, when the user opens the home page, then a section titled "Recommended for you" appears with 1–6 agent cards linking to their detail pages.

**R4**
- Given empty history, when the home page loads, then no "Recommended for you" section is shown and the rest of the page matches the current home page.
- Given local storage is blocked (e.g. a browser setting that disables site storage), when the home page loads, then no error is shown, no console error is thrown, and the section is hidden.

**R5**
- Given a visible section, when the user clicks "Clear history", then local storage no longer holds the usage key and the section disappears without a page reload.
- Given history was cleared, when the home page is reloaded, then the section stays hidden.

**R6**
- Given JavaScript is disabled, when the home page loads, then the page renders as it does today without the section.
- Given the page's HTML source as served, when inspected, then it contains no user-specific recommendation content.

## 4. Edge cases

- **History references an agent that was removed or renamed:** skip unknown IDs silently. They're not shown and not used for similarity; optionally pruned from storage.
- **Every candidate is already in history (user used everything related):** show no recommendations. The section follows R4 (hidden). [ASSUMPTION: no fallback to unrelated agents.]
- **Corrupted or unexpected data in storage** (manual edits, old format): discard it, reset to empty history, and don't throw.
- **Private browsing / storage cleared:** behaves as a first-time visitor. This is expected, not a bug.
- **Multiple tabs:** a use in one tab counts once the other tab's home page is reloaded. Live cross-tab sync isn't required.
- **Same agent used repeatedly:** stored once (move to most recent), not duplicated.
- **Very large catalog:** computation must not noticeably delay first paint. Measure against the real catalog size; I don't know the current size, so it needs verifying.

## 5. Out of scope (must not change)

- The existing home page content, order, and behavior for users without history.
- Static export and GitHub Pages deployment. No backend, database, serverless function, or third-party personalization service.
- Existing analytics, if any. This feature adds nothing to them. (Whether analytics exist today needs checking.)
- Agent detail pages, other than the hook that records the "use" action.
- Accounts, login, or cross-device sync.

## 6. Dependencies and open decisions

| Item | Blocks | Who decides |
|---|---|---|
| Which constraint gives way (Option A / B / C); whether on-device storage counts as "storing data about users" | Everything. Option C changes the feature entirely. | Product owner + privacy owner |
| Whether on-device history needs a consent notice or privacy policy update | Release of Option A | Privacy/legal owner (not a conclusion I can give) |
| Definition of "used" (view / copy / download / other) | R1 | Product owner. Engineering to verify which of these actions exist on the site. |
| Similarity basis: which agent metadata fields exist and are consistent enough | R2 | Engineering to verify against the actual agent data. Product to approve the ranking rule. |
| Fallback for users without history (hide vs. curated list) | R4 | Product owner |
| Section placement and card design | R3, R6 | Design |
| Release timing: PM's "next week" target | Scheduling | PM, once the decisions above are made. I can't commit to a date. The first two rows are blocking, and the timeline depends on when they're resolved and on engineering's estimate. |

If you can answer Q1 (which constraint gives way), I'll remove the options that no longer apply and turn the [ASSUMPTION] items into firm requirements.
