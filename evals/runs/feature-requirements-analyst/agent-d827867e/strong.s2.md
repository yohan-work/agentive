Three questions first. The spec below works without the answers, but each one changes a requirement.

1. **What does "Download all kits" deliver?** GitHub Pages rules out a server-side zip. Three options fit the constraint, and each has a cost (see D1 below): a zip built in the browser, a zip **generated at build time** and served as a static file, or a copy-paste shell command. Do you count a zip generated at build time as allowed? It is a static file, but it may be the thing you meant to exclude.
2. **Do the four roles map one-to-one to the four existing starter packs** (Developer→engineering, PM→product planning, Designer→design QA, Operations→operations)? If so, what happens when a pack contains a "community" agent or has fewer than 3 or more than 5 agents? The success criterion says role packs are "tested"/"expert" only, and I don't know the current contents of `src/data/starter-packs.ts`.
3. **Should the existing starter-pack section and the 20-agent grid stay unchanged below the new step?** The request says "add … at the top," so I've assumed yes.

---

## Provisional spec (paste-ready)

### 1. Goal and user

A first-time visitor to `/install` picks one of four roles (Developer, PM, Designer, Operations). They see 3–5 project-ready agents with verifiedStatus `tested` or `expert` for that role, and they can get every kit file for that set with one action in under 60 seconds, with no server, login, or analytics.

### 2. Requirements

**R1. Role picker at the top of /install**
- A "Pick your role" step renders above all existing `/install` content on both `/en/install` and `/ko/install`.
- It offers exactly four options, in this order: Developer, PM, Designer, Operations.
- Only one role can be selected at a time. [ASSUMPTION] No role is selected on first load, and no pack is shown until the visitor picks one.
- The control is keyboard-operable and exposes the selected state to assistive tech (e.g. a radio group or `aria-pressed` buttons).

**R2. Role → pack mapping comes from existing starter-pack data**
- Each role maps to exactly one existing starter pack in `src/data/starter-packs.ts`. [ASSUMPTION] Developer→engineering, PM→product planning, Designer→design QA, Operations→operations.
- The mapping lives in the starter-pack data, or in a small typed map next to it. No new field is added to the agent schema (`AgentSource`/YAML). If a new field turns out to be necessary, the PR must say why the pack data couldn't hold it (constraint: "don't invent a new agent schema field unless it's justified").

**R3. Role packs contain only tested/expert project-ready agents, 3–5 of them**
- The agents shown for a role are that pack's agents, filtered to agents that are (a) project-ready, i.e. have an install kit, and (b) `verifiedStatus` ∈ {`tested`, `expert`}.
- The filter uses each agent's current `verifiedStatus` at build time. It is never hard-coded per agent, so a later downgrade removes the agent automatically.
- After filtering, every role shows at least 3 and at most 5 agents.
- **Build-time guard:** the data check (`check:data` or equivalent) fails the build if any role's filtered pack has fewer than 3 or more than 5 agents, or references a slug that doesn't exist or isn't project-ready. A pack can't silently shrink to 1 agent or grow past 5.
- ⚠ **Conflict to resolve (see D2):** if an existing pack includes `community` agents, then "reuse existing starter-pack data" and "tested/expert only" can both hold only if the filter leaves 3+ agents. If it doesn't, you have to change the pack contents, keep a separate role list, or show fewer than 3.

**R4. Role pack display reuses AgentCard**
- Each agent in the selected pack renders with the existing `AgentCard` component. No new card component is created.
- [ASSUMPTION] The pack shows a heading with the role name and a count, e.g. "Developer starter pack · 4 agents".

**R5. "Download all kits for this role" action**
- One control labeled "Download all kits for this role" (plus its ko equivalent) appears with the selected pack. It is disabled or hidden while no role is selected.
- It delivers every kit file for every agent in the selected pack: 7 files × N agents (N = 3–5, so 21–35 files).
- Files are grouped by agent so that same-named files (`AGENTS.md`, `CLAUDE.md`, `README`, …) from different agents never overwrite each other. [ASSUMPTION] The layout is `<slug>/<file>`.
- No server-side processing is involved. The mechanism is decision D1. Whatever is chosen:
  - it must not fire 21–35 separate browser downloads, because browsers block or prompt on multiple automatic downloads;
  - the files delivered must be byte-identical to what the per-agent "Download Kit" button and `/kits/<slug>/<file>` serve today.

**R6. Under 60 seconds from landing to having files**
- From a first load of `/install`, a visitor reaches downloaded kit files for their role in **≤ 3 interactions**: pick role → (optional scroll) → download.
- The role picker and the download action are both reachable without scrolling past the 20-agent grid.
- There is no analytics SDK, so this is verified by a manual timed check (see AC6), not by a metric.

**R7. Works at 375px**
- At 375px viewport width, the role picker, the pack cards, and the download action cause no horizontal scrolling, no text truncation that hides a role name or button label, and no overlap.
- Tap targets for the role options and the download control are at least 44×44 CSS px. [ASSUMPTION] Use this threshold unless the project already uses another.

**R8. Localization**
- Every new UI string (step title, four role names, pack heading, download label, any helper, error or loading text) exists in both the `en` and `ko` dictionaries.
- `/ko/install` shows no English fallback strings from this feature. Role names may stay in English on `/ko` only if that's a deliberate product decision (D5).

**R9. Existing behavior unchanged** (see Out of scope)
- The existing starter-pack section, the 20-agent grid, per-agent "Download Kit", curl one-liners, and bookmarks behave exactly as before.

**R10. No new persistence**
- The feature adds no new storage: no localStorage, cookies, or server calls. Only bookmarks are persisted today, and this feature doesn't change that. (Remembering the role is under Suggested.)

**Suggested (not required)**
- S1. Reflect the role in the URL (`/install?role=developer`) using client-side `useSearchParams`, so a pack is shareable. Unknown values are ignored.
- S2. Show a copy-paste shell command next to the button (curl for each `<slug>/<file>`) for people working in a terminal. It reuses the existing curl pattern.
- S3. Remember the last role in localStorage.
- S4. Add a short "what's in each kit" line under the download button (7 files per agent, total count).

### 3. Acceptance criteria

**AC1 (R1)**
- Given a visitor opens `/en/install` in a fresh browser, when the page loads, then the first content section is "Pick your role" with four options in order Developer, PM, Designer, Operations, and no pack is shown yet.
- Given the Developer role is selected, when the visitor selects PM, then only PM is marked selected and the PM pack replaces the Developer pack.
- Given a keyboard-only visitor, when they Tab to the picker and use Enter/Space (or arrow keys, if it's a radio group), then they can select any role, and the selected state is announced.

**AC2 (R2)**
- Given the PR diff, when a reviewer inspects `AgentSource`/the agent YAML schema, then there is no new agent field, or the PR description justifies the one that was added.
- Given `src/data/starter-packs.ts`, when a reviewer looks for the role mapping, then each of the four roles resolves to exactly one existing pack ID.

**AC3 (R3)**
- Given the current data (20 project-ready agents: 15 tested/expert, 5 community), when any role is selected, then no agent with verifiedStatus `community` or `unverified` appears in the pack.
- Given any role is selected, when the pack renders, then it shows between 3 and 5 agents inclusive.
- Given a data change sets one of a role pack's agents to `community`, when `check:data`/build runs, then either that agent drops out and the pack still has ≥ 3, or the check fails with a message naming the role and the count.
- Given a pack references a slug that isn't project-ready, when `check:data` runs, then it fails and names the slug.

**AC4 (R4)**
- Given a role is selected, when the pack renders, then each agent is an `AgentCard` instance with the same markup and styling as the cards in the existing 20-agent grid.

**AC5 (R5)**
- Given the Developer role is selected with N agents, when the visitor activates "Download all kits for this role", then they receive 7 × N files arranged as `<slug>/<file>`, and every slug in the pack is present.
- Given the downloaded files, when each is compared with `/kits/<slug>/<file>` for the same agent, then they are byte-identical.
- Given Chrome, Firefox, and Safari (desktop and iOS Safari at 375px), when the action runs, then the browser shows no "allow multiple downloads" prompt and no file is missing.
- Given the network panel, when the action runs, then no request goes to a non-static endpoint.

**AC6 (R6)**
- Given a tester who hasn't seen the page, on a fresh browser at 375px and at desktop width, when they are told "get the kit files for your role" and timed from page load, then they have the files on disk in ≤ 60 seconds, using ≤ 3 interactions. Run the check at least 3 times (e.g. 3 testers or 3 roles) and record the times in the PR.

**AC7 (R7)**
- Given a 375px-wide viewport, when each of the four roles is selected in turn, then `document.documentElement.scrollWidth` ≤ 375, all four role labels and the download label are fully visible, and each tap target is ≥ 44×44 px.

**AC8 (R8)**
- Given the `en` and `ko` dictionaries, when a reviewer diffs the keys added by this PR, then every new key exists in both, and the `ko` values are Korean (or explicitly approved English per D5).
- Given `/ko/install`, when any role is selected and the download is triggered, then all visible strings added by this feature come from the `ko` dictionary.

**AC9 (R9)**
- Given the PR is merged, when a visitor uses per-agent "Download Kit", a curl one-liner, a bookmark, the existing starter-pack section, or the 20-agent grid, then each behaves the same as on `main` before the change.

**AC10 (R10)**
- Given a fresh browser, when a visitor selects a role and downloads, then localStorage, sessionStorage, and cookies contain no new keys (bookmark keys are unchanged).

### 4. Edge cases

| Case | Expected behavior |
|---|---|
| A role's filtered pack has < 3 agents (e.g. a community-heavy pack) | The build fails via the data check (R3). The page never ships a 0-, 1-, or 2-agent role pack. |
| A pack has > 5 tested/expert agents | The build fails, or the pack defines an explicit order and the first 5 are shown. Decide in D2; don't truncate silently. |
| An agent in a pack is later downgraded to `community` | It disappears from the role pack on the next build. The guard in R3 catches a pack dropping below 3. |
| Two agents' kits contain same-named files | Files sit in separate `<slug>/` folders and nothing is overwritten. |
| JavaScript disabled or failed to load | Verify how `/install` behaves without JS today. [ASSUMPTION] The existing starter packs and 20-agent grid (static HTML) still render, and per-agent download links still work. The role step may not work. |
| The download fails midway (network drop) or a `/kits/...` file 404s | The visitor sees a localized error saying the download didn't complete, and no partial archive that looks complete. Applies only if a client-side fetch is used (D1 option A). |
| iOS Safari | Verify that the chosen mechanism actually saves the file. Some mechanisms open a preview instead; AC5 covers this. |
| The visitor switches roles after downloading | The new pack shows and the download action targets the new role. Nothing from the previous role is kept. |
| Visitor on `/ko` | Role names, button, and errors are in Korean. The kit file contents stay as they are (not translated). Kit translation is out of scope. |
| The same agent appears in two role packs | Allowed. It shows in both. |
| A slow connection, where downloading 35 files or a zip takes a while | The button shows a localized in-progress state and can't be double-triggered. |
| `?role=` has an unknown value (only if S1 is adopted) | It's ignored and no role is selected. |

### 5. Out of scope (must not change)

- The per-agent "Download Kit" button, its 7 files, and the `/kits/<slug>/<file>` URLs and curl one-liners.
- The contents of the kit files themselves.
- The existing 4-starter-pack section and the 20-agent grid on `/install`, other than moving below the new step.
- The `AgentCard` component's props and appearance, unless the change is additive and non-breaking.
- The agent schema: no new field without justification (R2).
- `verifiedStatus` values of any agent. The feature filters on them and never changes them.
- Bookmarks and their localStorage format.
- Any server, analytics SDK, login, or tracking.
- Pages other than `/install`.

### 6. Dependencies and open decisions

| # | Decision | Options and trade-offs | Who decides |
|---|---|---|---|
| D1 | **How "Download all" delivers files without a server zip** | **A. Client-side zip** (e.g. JSZip): fetch the 7×N static files and zip them in the browser. One click, one file, no build change. Costs: a new dependency and bundle weight (load it lazily on click), extra failure handling, and iOS Safari to verify. **B. Build-time zip per role** (e.g. `/kits/roles/<role>.zip` generated during build). One click, one plain static file, fastest, no runtime dependency. Costs: build-step work, 4 more artifacts to keep in sync, and possibly against the intent of "no server-side zip". **C. Shell command only** (curl loop). Zero code risk, but it isn't a single "download" action, it fails the 60-second goal for non-terminal users, and it doesn't work on Windows without WSL. **Not viable:** firing 21–35 separate downloads (blocked by browsers). | Product owner (you). Maintainer for the dependency or build change |
| D2 | **Pack contents vs. the tested/expert rule** | Verify the current contents of the 4 packs against verifiedStatus first. If any pack fails 3–5 after filtering: (a) edit that pack's contents, which also changes the existing starter-pack section; (b) add a separate role-pack list in the same data file, which keeps existing packs intact but creates a second list to maintain; (c) allow < 3 for that role, which breaks the "3–5" goal. Also decide the rule when > 5 qualify. | Product owner |
| D3 | **Role ↔ pack mapping**, especially whether "design QA" is right for "Designer" | Confirm or adjust the assumed one-to-one mapping. | Product owner |
| D4 | **Keep, move, or merge the existing starter-pack section** | Keeping both shows each pack twice, in two forms. Merging reduces duplication but changes existing behavior, which this spec currently lists as out of scope. | Product owner |
| D5 | **Korean role names** | Translate (e.g. 개발자 / PM / 디자이너 / 운영) or keep the English terms. | Product owner / ko reviewer |
| D6 | **How the downloaded kits land in a repo** | Five `AGENTS.md`/`CLAUDE.md` files in `<slug>/` folders aren't auto-loaded by tools that expect a single root file. Should the pack include a merged file or README instructions? This affects whether the visitor really has kits "for their repo" in 60 seconds. | Product owner |
| Dep | Verify that all 7 files per project-ready agent exist under `/kits/<slug>/` in the static export and are fetchable same-origin. This is required for D1 option A and to confirm byte-identity (AC5). | Implementer, before build |
