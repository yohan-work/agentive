Three questions first, most important first. The spec below is provisional and marks my guesses as [ASSUMPTION].

1. **Does each role map 1:1 to an existing starter pack?** (Developer → engineering, PM → product planning, Designer → design QA, Operations → operations.) If yes, do the existing packs already contain only "tested"/"expert" agents, and 3–5 of them each? If they don't, one of your constraints has to give (see Conflict A).
2. **What should "Download all kits" deliver?** A single .zip built client-side, a .zip pre-built at build time as a static file, or a copy-paste shell command? Each works on GitHub Pages but they cost different things (see Conflict B).
3. **What happens to the current 4 starter-pack cards and the 20-agent grid?** Should they stay unchanged below the new step, or does the role step replace the pack cards?

---

## Feature: "Pick your role" step on /install

### 1. Goal and user

A first-time visitor to /install (Developer, PM, Designer, or Operations) picks their role and gets a short, trusted set of 3–5 project-ready agents with one action that downloads all their kits. This saves them reading 20 agent pages.

### 2. Requirements

**R1. Role picker at the top of /install**
The first content section on /install (under the page header, above the existing starter packs) shows a "Pick your role" step with exactly four options: Developer, PM, Designer, Operations. It appears on both /en/install and /ko/install.

**R2. Single selection**
Only one role can be selected at a time. Picking a different role replaces the current selection and its pack.
- [ASSUMPTION] No role is selected on first load, and no pack is shown until the visitor picks one.
- [ASSUMPTION] The selection is not persisted: localStorage currently holds only bookmarks, and the request doesn't ask to persist anything else.

**R3. Role pack sourced from existing starter-pack data**
Each role's pack comes from `src/data/starter-packs.ts`, not from a new agent schema field.
- [ASSUMPTION] Mapping: Developer → engineering, PM → product planning, Designer → design QA, Operations → operations.
- The mapping lives either in the starter-pack data (e.g., a `role` key on the pack) or in a small role → pack-id map. Either way it's data on the pack, not on the agent, so the agent schema stays as it is.

**R4. Verification filter: tested or expert only**
A role pack shows only agents that are project-ready **and** have `verifiedStatus` of `tested` or `expert`. Agents with `community` or `unverified` status never appear in a role pack, even if the source starter pack lists them.
- Rule: filter = `projectReady && verifiedStatus ∈ {tested, expert}`.
- Where to enforce it: at build/data time (see R11) and again at render time, so a later status downgrade can't leak into a pack.

**R5. Pack size is 3 to 5 agents**
Every role pack shows at least 3 and at most 5 agents after the R4 filter. If a role has fewer than 3 eligible agents, the build fails (see R11). A smaller pack is never shown silently. See Conflict A.

**R6. Pack display reuses AgentCard**
Each agent in the pack is rendered with the existing `AgentCard` component. No new card component.
- [ASSUMPTION] Agents appear in the order listed in the starter-pack data.

**R7. "Download all kits for this role" action**
Once a role is selected, one primary button labeled "Download all kits for this role" (plus a ko equivalent) appears with the pack. Activating it delivers the kit files of every agent in that pack, using only static files served by GitHub Pages. No server-side zip, no API route. The delivery mechanism is an open decision (Conflict B).

**R8. No filename collisions in the download**
Every kit contains files with the same names (AGENTS.md, CLAUDE.md, README, …), so the combined download keeps each agent's files in their own folder, e.g. `<slug>/AGENTS.md`. Every file of every kit is present once, and no file overwrites another.

**R9. Kit contents identical to the per-agent download**
For each agent, the files in the role download are byte-identical to what that agent's existing "Download Kit" button delivers (the same 7 files served from `/kits/<slug>/<file>`).

**R10. Every new UI string exists in en and ko**
Every new string (step heading, four role labels, button label, any helper, empty-state, or error text) is added to both the `en` and `ko` dictionaries. No hard-coded strings in the component.

**R11. Build-time data check**
The data validation step (`check:data` or equivalent) fails the build if any role pack:
- has fewer than 3 or more than 5 agents after the R4 filter,
- references an agent slug that doesn't exist or isn't project-ready,
- includes an agent whose `verifiedStatus` is not `tested` or `expert`,
- is missing a role mapping for any of the four roles.

**R12. Works at 375px width**
At a 375px viewport, the role picker, the pack's cards, and the download button are fully visible and usable: no horizontal scrolling, no truncated role labels, tap targets at least 44×44px [ASSUMPTION on 44px; use your existing standard if you have one].

**R13. Keyboard and screen-reader operable**
The role picker is operable by keyboard and exposes the selected state (e.g., a radio group or `aria-pressed` buttons). Keyboard access isn't named in the request, but a picker that can't be operated without a mouse would fail R1 for some visitors. Cut this if you treat accessibility as a separate issue.

**R14. Existing /install content unchanged**
The 4 existing starter-pack cards and the grid of all 20 project-ready agents stay below the new step with the same content and behavior (pending Question 3).

**R15. Static-export compatible**
The feature works in the static export. If any URL state is used (see Suggested), it's read on the client with `useSearchParams`. No middleware, `headers()`, or server-side `searchParams`.

#### Suggested (not required)
- Put the selected role in the URL (`/install?role=developer`) so the pack can be linked and shared.
- Show a copy-paste curl command for the whole role, next to the download button.
- Show each agent's verification badge on the card within the role pack (only if AgentCard already shows it).

### 3. Acceptance criteria

**R1**
- Given a visitor opens /en/install, when the page loads, then the first section under the header is "Pick your role" with four options: Developer, PM, Designer, Operations, and it appears above the existing starter packs.
- Given a visitor opens /ko/install, when the page loads, then the same step appears with Korean labels.

**R2**
- Given no role is selected, when the page loads, then no role pack and no "Download all" button are shown [ASSUMPTION].
- Given "Developer" is selected, when the visitor picks "PM", then only "PM" is marked selected and only the PM pack is shown.
- Given a role was selected, when the visitor reloads the page, then no role is selected and localStorage contains no new keys (only the existing bookmark key).

**R3**
- Given the mapping Developer → engineering, when "Developer" is selected, then every agent shown is listed in the engineering pack in `starter-packs.ts`.
- Given the change is merged, when the agent schema (`AgentSource` / `agent.schema.json`) is diffed against main, then it has no new fields.

**R4**
- Given the engineering pack lists an agent whose `verifiedStatus` is `community`, when "Developer" is selected, then that agent is not shown.
- Given all 4 roles, when each is selected in turn, then every agent shown has `verifiedStatus` `tested` or `expert`, which you can check against each agent's page badge.
- Given the 5 current `community` project-ready agents, when all 4 packs are rendered, then none of those 5 appears in any pack.

**R5**
- Given each of the 4 roles, when selected, then the pack shows at least 3 and at most 5 AgentCards.

**R6**
- Given a role pack is shown, when its cards are inspected, then each is an `AgentCard` instance and matches the card for the same agent in the 20-agent grid (same title, summary, link).

**R7**
- Given "Operations" is selected, when the visitor activates "Download all kits for this role", then they receive the kit files for every agent in the Operations pack. With DevTools' network panel open, no request goes to any origin other than the site's own static files (plus a CDN script only if Option B1 uses one).
- Given the site is deployed to GitHub Pages, when the button is used, then it works: no 404 and no request to a server endpoint.

**R8**
- Given a pack of N agents, when the download finishes and is extracted, then there are N folders named by slug, each holding 7 files, 7×N files in total, with no duplicates or overwrites.

**R9**
- Given agent X is in a role pack, when X's files from the role download are compared with those from X's own "Download Kit" button, then all 7 are byte-identical (checksum).

**R10**
- Given the change, when the `en` and `ko` dictionaries are compared, then every new key exists in both and neither value is empty.
- Given /ko/install with a role selected, when the page is scanned, then no new English UI string is visible.

**R11**
- Given a role pack edited to include a `community` agent, when `npm run check:data` runs, then it fails and names the pack and the agent.
- Given a role pack edited so only 2 eligible agents remain, when `npm run check:data` runs, then it fails with a pack-size error.
- Given a role pack that references a nonexistent slug, when `npm run check:data` runs, then it fails.

**R12**
- Given a 375×667 viewport, when a visitor picks each role and scrolls through the pack, then there's no horizontal scrollbar, all four role labels are fully readable in both en and ko, and the download button is fully visible and tappable.

**R13**
- Given keyboard-only navigation, when the visitor tabs to the picker, then they can move between roles and select one without a mouse, and a screen reader announces which role is selected.

**R14**
- Given the change, when /install is compared with main below the new step, then the 4 starter-pack cards and the 20-agent grid show the same items in the same order.

**R15**
- Given `npm run build` with `output: "export"`, when the build runs, then it succeeds and the exported /en/install and /ko/install pages contain the role step.

**Success criterion: under 60 seconds (overall check)**
- Given a first-time visitor on a fresh browser profile at /en/install, on desktop and at 375px, when a tester starts a timer on page load, picks "Developer", and activates "Download all kits for this role", then the kit files for every Developer agent are saved locally in under 60 seconds. Run this 3 times per viewport; every run passes.
- There's no analytics SDK, so this is checked by a manual timed test, not measured in production. Say so in the issue.

### 4. Edge cases

| Case | Expected behavior |
|---|---|
| A role has fewer than 3 tested/expert agents after filtering | Build fails in R11. The page never ships a pack of 0–2. Fix it in data, per Conflict A. |
| An agent in a pack is later downgraded to `community` | The render-time filter hides it. If the pack drops below 3, the next `check:data` fails. |
| The same agent belongs to two role packs | Allowed. It appears in both packs and downloads with each role. [ASSUMPTION] |
| One kit file is missing at `/kits/<slug>/<file>` (404) during "Download all" | The download does not silently produce a partial set. The visitor sees an error naming the agent (en/ko) and a link to that agent's page. Also add a build check that every `/kits/<slug>/` has all 7 files. |
| Browser blocks multiple downloads (if Option B3 is chosen) | The visitor sees how to allow them. Otherwise Option B3 fails R7. |
| JavaScript disabled | The role step can't work. [ASSUMPTION] Acceptable, but the existing per-agent kits and grid still work. Verify what the current page does without JS. |
| Visitor clicks "Download all" twice quickly | Only one download is produced. The button is disabled while the download is being prepared. |
| Visitor switches role while a download is being prepared | The download that is in progress finishes for the original role, or is cancelled. It never mixes agents from two roles. |
| Long Korean role labels at 375px | Labels wrap or fit. They are never truncated or overflowing (R12). |
| Slow connection (Option B1 fetches 7×N files client-side) | A progress or "preparing…" state is shown. Check whether this can still meet the 60-second target on a throttled "Fast 3G" profile, or agree to test on a normal connection only. |

### 5. Out of scope (must not change)

- The agent schema (`AgentSource`, `agent.schema.json`): no new fields.
- The per-agent "Download Kit" button, its 7 files, and the curl one-liner on agent pages.
- The contents of each kit file.
- The existing 4 starter-pack cards and the 20-agent grid on /install (pending Question 3).
- `verifiedStatus` values of any agent. This feature filters by status; it never changes it.
- Bookmarks and their localStorage key.
- No server, analytics SDK, accounts, or login.
- No new roles beyond the four named.
- Merging several agents' AGENTS.md / CLAUDE.md into one file: not requested. Files ship per agent, in folders.

### 6. Dependencies and open decisions

**Conflict A: "Reuse starter-pack data" vs. "3–5 agents, tested/expert only"**
It isn't known whether each existing pack, once filtered to tested/expert, has 3–5 agents. There are 15 tested/expert agents across 4 roles, but how they spread across the packs is unknown. **Verify:** list each pack's agents with their `verifiedStatus`.
- Option A1: edit the existing starter packs so they satisfy the rule. Keeps one data source, but changes the existing pack cards too, which conflicts with R14.
- Option A2: add a separate, small `rolePacks` list in `src/data/` that references existing agent slugs and is validated by R11. Leaves existing packs untouched, but adds a second curated list to maintain, which departs from the "reuse starter-pack data" constraint.
- Option A3: derive role packs from the existing packs by filtering. No new data, but a role could end up with fewer than 3 agents, and the order and choice aren't curated.
- **Decides:** product owner / maintainer.

**Conflict B: "Download all" on a static host**
- Option B1: zip client-side (fetch the 7×N files from `/kits/…`, zip them in the browser, e.g. with a library like JSZip). One file, works on Pages. Costs a new client dependency and bundle size; slow networks may threaten the 60-second target.
- Option B2: pre-build `/kits/roles/<role>.zip` at build time as static files. Fastest for the visitor and needs no client library. Costs a build step, and the zips must be regenerated whenever a kit or pack changes (add a check that they're current).
- Option B3: trigger N×7 separate browser downloads. No dependency. But browsers often block or prompt on multiple downloads, files land flat in Downloads with colliding names (fails R8), and 60 seconds is unlikely to be met.
- Option B4: a copy-paste shell command that curls every file into `<slug>/` folders. No dependency, fits the existing curl pattern. Not a "download" for non-terminal users (PMs, Designers), and time depends on the user.
- **Decides:** maintainer (build pipeline and dependency budget). B1 or B2 appear to be the only ones that satisfy R7, R8 and the 60-second target together. Verify that before committing to one.

**Other open items**
- Role → pack mapping (Question 1): product owner.
- Whether the role step replaces or sits above the existing packs (Question 3): product owner.
- Korean labels for the four roles and the button: whoever owns the ko copy.
- How the 60-second target is tested (manual timed runs, which devices and network profile): maintainer / QA.
- Whether a new dependency (Option B1) is acceptable, and its license: maintainer.
- Accessibility bar for R13 (which standard, if any): maintainer.
