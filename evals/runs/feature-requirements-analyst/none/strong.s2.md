# Feature: "Pick your role" starter step on /install

## Summary

Add a role picker at the top of `/install`. A visitor chooses **Developer, PM, Designer, or Operations** and immediately sees a recommended pack of 3–5 project-ready agents for that role (only `tested` or `expert`), rendered with the existing `AgentCard`, plus one **"Download all kits for this role"** action that works on GitHub Pages without a server.

**User story:** As a developer landing on /install for the first time, I want to pick my role and get a small, trusted set of agents to drop into my repo, so I don't have to read 20 agent pages to decide.

**Success metric (manual, since there's no analytics):** A first-time visitor can go from landing on `/install` to having every kit file for their role on disk in under 60 seconds, with at most 2 interactions (pick role, click download).

---

## Design decisions (read first)

These choices shape the requirements below. Challenge them in the issue if you disagree.

1. **Roles map 1:1 onto the existing starter packs. No new agent schema field.**
   - Developer → engineering pack
   - PM → product planning pack
   - Designer → design QA pack
   - Operations → operations pack

   Add a `role` key (e.g. `"developer" | "pm" | "designer" | "operations"`) to the starter-pack entries in `src/data/starter-packs.ts`. That changes the starter-pack data, not the agent schema, so the "no new agent field" constraint holds. The role pack is **derived** as: the starter pack's agents → filtered to project-ready → filtered to `verifiedStatus ∈ {tested, expert}` → first 5 in pack order.

2. **"Download all" is a pre-built static zip per role, generated at build time.**
   GitHub Pages can't zip on request, but it can serve a zip that was built ahead of time. The build step that already writes `/kits/<slug>/<file>` also writes `/kits/roles/<role>.zip`. The button is a plain `<a href download>`, so it needs no JS, adds nothing to the bundle, and survives slow devices.
   - *Rejected alternative:* triggering 7 × N separate file downloads. Browsers block or prompt on multiple automatic downloads, and 20–35 files would miss the 60-second target.
   - *Acceptable fallback:* client-side zipping (e.g. `fflate`, lazy-loaded only on click) if a build-time zip turns out to be hard to wire into the export. Pick one; don't ship both.

3. **Files are namespaced per agent inside the zip.** Each kit contains `AGENTS.md`, `CLAUDE.md`, etc., so merging several kits flat would overwrite files. See R6.

4. **Role selection lives in the URL (`/en/install?role=developer`) and is read on the client** with `useSearchParams`, because the site is a static export and has no server-side `searchParams`. That makes a role pack linkable and shareable. Persisting the role in localStorage is optional (see Out of scope).

---

## Requirements

### R1. Role picker
- R1.1 Render a "Pick your role" section as the first content block on `/[locale]/install`, above the existing starter packs and the agent grid.
- R1.2 Show exactly four options: Developer, PM, Designer, Operations. Each has a label and a one-line description (e.g. "Code review, bug triage, task briefs").
- R1.3 Build it as a single-select control with radio-group semantics (`role="radiogroup"` / `role="radio"` with `aria-checked`, or native radio inputs styled as cards). It must be keyboard operable: Tab moves into the group and the arrow keys change the selection.
- R1.4 No role is selected on first load unless `?role=` is present and valid.
- R1.5 Selecting a role updates the URL to `?role=<key>` with `router.replace`, not push, so it doesn't pollute history. It does not scroll the page away from the picker.

### R2. Recommended pack display
- R2.1 When a role is selected, show a panel directly below the picker with:
  - the pack title and a one-sentence "why these agents" description (from the starter-pack data),
  - 3–5 agents rendered with the existing `AgentCard` component, unmodified or using only existing props,
  - the "Download all kits for this role" button (R3),
  - a count line such as "4 agents · 28 files".
- R2.2 Pack membership is computed from the data in the Design decisions section (§1) and never hard-coded in the component.
- R2.3 Only agents whose `verifiedStatus` is `tested` or `expert` **and** that are project-ready (i.e. have a kit) may appear.
- R2.4 Keep the starter-pack order, and cap the pack at 5 agents.
- R2.5 The existing starter packs section and the full 20-agent grid stay on the page below the new section, unchanged in behavior.

### R3. "Download all kits for this role"
- R3.1 One primary button per role pack. Clicking it downloads a single file, `agent-archive-<role>-kits.zip`.
- R3.2 The zip is a static asset at `/kits/roles/<role>.zip` (respecting the site's `basePath`, `/agentive`), generated at build time from the same source as the per-agent kits.
- R3.3 The zip contents must be byte-identical to the per-agent kit files that the per-agent "Download Kit" button serves for the same build. No separate content path.
- R3.4 Next to the button, show a copyable curl one-liner that fetches and unzips the role zip. It should match the style of the existing per-agent curl snippet, for example:
  `curl -L https://yohan-work.github.io/agentive/kits/roles/developer.zip -o agents.zip && unzip agents.zip`
- R3.5 Show the zip file size on or near the button (e.g. "Download all (4 kits, 38 KB)"). The size is computed at build time.

### R4. Build and data integrity
- R4.1 A build/data check fails if any role pack:
  - resolves to fewer than 3 or more than 5 eligible agents,
  - references an agent slug that doesn't exist or isn't project-ready,
  - uses a `role` key outside the four allowed values, or two packs claim the same role.
- R4.2 The check reads `verifiedStatus` from the agent data, so downgrading an agent below `tested` either removes it from the pack automatically or fails the build if that drops the pack under 3. The failure message names the pack and the agent.
- R4.3 Role zips are regenerated on every build. A stale zip must be impossible: zips are build output and are never committed.

### R5. Internationalization
- R5.1 Every new string (section heading, role labels, role descriptions, button label, count line, curl caption, empty/error text, `aria-label`s) is added to **both** the `en` and `ko` dictionaries.
- R5.2 Role pack titles and descriptions come from the starter-pack data and are localized the same way the existing starter packs are.
- R5.3 Role keys in the URL (`developer`, `pm`, `designer`, `operations`) are **not** localized. `/ko/install?role=pm` works.
- R5.4 Agent names and descriptions on the cards follow whatever `AgentCard` already does for the `ko` locale.

### R6. Zip layout
- R6.1 Structure:
  ```
  agent-archive-developer-kits/
    README.md                  # role-level: what's inside + how to install
    <slug-1>/AGENTS.md
    <slug-1>/CLAUDE.md
    <slug-1>/<slug-1>.mdc
    <slug-1>/agent.json
    <slug-1>/README.md
    <slug-1>/RUNBOOK.md
    <slug-1>/EVALUATION.md
    <slug-2>/...
  ```
- R6.2 The role-level `README.md` lists the included agents with their verified status. It explains that `AGENTS.md`/`CLAUDE.md` are per agent, and says how to combine them: concatenate them into the repo root file, or copy `.mdc` files into `.cursor/rules/`. It is generated, and it is English-only unless kits are already localized.
- R6.3 Nothing in the zip should overwrite files silently when extracted into a repo root. The top-level folder guarantees this.

### R7. Responsive and visual
- R7.1 At 375px wide, the four role options fit without horizontal scroll (2×2 grid or vertical stack). Tap targets are at least 44×44px.
- R7.2 At 375px, the pack's agent cards stack in one column. The download button is full width and visible without horizontal scroll, and the curl snippet wraps or scrolls inside its own container rather than widening the page.
- R7.3 Use the existing theme tokens and `cn()` helper. No new color values.

---

## Acceptance criteria

**Role selection**
- [ ] AC1: On `/en/install` with no query string, the "Pick your role" section is the first section and no role is preselected.
- [ ] AC2: Clicking "Developer" shows the Developer pack below the picker and changes the URL to `/en/install?role=developer` without adding a history entry.
- [ ] AC3: Loading `/en/install?role=designer` directly shows the Designer pack already selected after hydration.
- [ ] AC4: Loading `/en/install?role=unknown` shows the picker with no selection and no error. The query param is ignored (optionally stripped).
- [ ] AC5: The picker is fully operable by keyboard alone, and a screen reader announces it as a group of 4 options with the selected state.

**Pack content**
- [ ] AC6: For every role, the pack shows 3–5 agents, and every one has `verifiedStatus` of `tested` or `expert`. No `community` agent appears in any role pack.
- [ ] AC7: Agents in a role pack are rendered with the existing `AgentCard`, and clicking a card goes to that agent's page as it does in the main grid.
- [ ] AC8: Changing an agent from `tested` to `community` in its YAML and rebuilding removes it from its role pack, or fails `check:data` with a message naming the pack if that leaves fewer than 3 agents.

**Download**
- [ ] AC9: Clicking "Download all kits for this role" downloads exactly one `.zip`, and the browser shows no multiple-download prompt.
- [ ] AC10: The zip extracts to one top-level folder that contains one subfolder per pack agent, each with all 7 kit files, plus a role-level `README.md`.
- [ ] AC11: For each agent, the files in the role zip are identical (same checksum) to the files served at `/kits/<slug>/<file>` in the same build.
- [ ] AC12: The copyable curl command, run in a clean directory, produces the same folder as AC10.
- [ ] AC13: The download works on the deployed GitHub Pages site under the `/agentive` base path, not only on `localhost`.
- [ ] AC14: Timed test: a person who hasn't seen the page goes from opening `/install` to having the extracted files in under 60 seconds on desktop Chrome and on mobile Safari (download only, extraction excluded on mobile).

**i18n and layout**
- [ ] AC15: `/ko/install` shows every new string in Korean, and no English fallback text appears in the new section.
- [ ] AC16: A dictionary check (or typecheck) fails if a new key exists in `en` but not in `ko`, or the reverse.
- [ ] AC17: At 375px width in both locales, there is no horizontal page scroll, the role options and download button are fully visible and tappable, and longer Korean labels don't overflow their cards.

**No regressions**
- [ ] AC18: The existing starter-pack section, the 20-agent grid, per-agent "Download Kit" buttons, curl one-liners, and bookmarks behave exactly as before.
- [ ] AC19: The site still builds with `output: "export"`, with no server-side `searchParams`, `headers()`, or middleware introduced.

---

## Edge cases

| # | Case | Expected behavior |
|---|------|-------------------|
| E1 | A starter pack has fewer than 3 `tested`/`expert` project-ready agents (e.g. the Designer pack leans on `community` agents) | Build fails with a clear message. Fix it by adding a qualifying agent to the pack or raising an agent's verification **through real testing**, never by relaxing the filter. |
| E2 | A starter pack has more than 5 qualifying agents | Take the first 5 in pack order. Optionally warn during the data check. |
| E3 | The same agent qualifies for two roles (e.g. a PR review agent for Developer and Operations) | Allowed. The agent appears in both packs and both zips. |
| E4 | All 5 `community` project-ready agents | They never appear in role packs but still appear in the full grid below. |
| E5 | `?role=` value in the wrong case (`?role=Developer`) | Treat as invalid (AC4), or normalize to lowercase. Pick one and document it. |
| E6 | JavaScript disabled or hydration slow | The picker needs JS. The static HTML should still render the existing starter packs and grid, so the page stays usable. Optionally, render the four role zip links in `<noscript>`. |
| E7 | Mobile Safari/iOS download | iOS saves the zip to Files, which can't be extracted straight into a repo. The curl snippet is the primary path for developers. On narrow screens, show a short hint such as "On mobile? Copy the command and run it on your computer." |
| E8 | Visitor changes role after downloading | Only the selected pack updates. There's no download history to manage. |
| E9 | Kit content changes between deploys | The role zip rebuilds with the site (R4.3), so a user who downloaded earlier just has an older snapshot. No versioning UI is in scope. Consider putting the build date in the role README. |
| E10 | Popup/download blockers, corporate proxies blocking `.zip` | The download is a normal same-origin link click, so there's no popup. If `.zip` is blocked, per-agent kits remain available through the cards and their pages. |
| E11 | Base path mismatch (local dev at `/` vs Pages at `/agentive`) | Build zip URLs with the same base-path helper as the existing `/kits/...` links. Covered by AC13. |
| E12 | Clipboard API unavailable (non-HTTPS or old browser) when copying curl | Fall back to selecting the text. Show the command in full so it can be copied by hand. |
| E13 | Very long Korean role description at 375px | Wrap text and never truncate the role label. Covered by AC17. |
| E14 | Back/forward navigation after changing roles | Because `replace` is used, Back leaves `/install` rather than stepping through roles. This is intentional. |

---

## Out of scope

- **Any server-side zipping or API route.** GitHub Pages is static only.
- **Analytics or tracking** of role selection or downloads, including measuring the 60-second criterion in production. It is checked manually (AC14).
- **Persisting the chosen role** in localStorage or across pages. The URL param is enough for v1. Remembering the role could be a follow-up.
- **New agent schema fields** (e.g. `roles: []` on agents). Role membership lives in the starter-pack data.
- **Personalization beyond four fixed roles**: quizzes, multi-role selection, custom pack building, or "add/remove agents from my pack".
- **Changing any agent's `verifiedStatus`** to fill a pack. Status only goes up through the documented testing process.
- **Merging kits into a single AGENTS.md/CLAUDE.md** automatically. v1 ships per-agent folders plus instructions (R6.2). Auto-merge can be a follow-up.
- **Redesigning `AgentCard`,** the existing starter-pack section, or the agent grid.
- **Localizing the kit files themselves.** Kits stay as they are today.
- **Role packs for non-project-ready agents** (the other 80). Only agents with install kits qualify.

---

## Open questions

1. Do the four existing starter packs each already contain at least 3 agents that are both `tested`/`expert` and project-ready? If one doesn't, E1 blocks the build on day one, and that pack's content needs a decision before implementation.
2. Should the role picker **replace** the existing starter-pack section eventually, since they now overlap? This spec keeps both for v1.
3. Should the role README include install instructions per tool (Claude Code / Codex / Cursor), or link to an existing install guide page?
4. Is adding the role zip generation to the existing kit build step acceptable, or should it be a separate script run before `build`?
