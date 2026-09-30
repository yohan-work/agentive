# Feature: "Pick your role" starter step on /install

## Summary

Add a role picker at the top of `/install`. The visitor chooses **Developer, PM, Designer, or Operations** and sees a pack of 3–5 project-ready agents for that role, all `tested` or `expert`, with one **Download all kits for this role** action. It stays fully static: role packs come from the existing starter-pack data, and the "download all" archive is a zip made at build time and served from GitHub Pages as a plain file.

## Design decisions

1. **Roles map onto the existing starter packs. No new agent schema field.**
   | Role | Existing starter pack |
   |---|---|
   | Developer | engineering |
   | PM | product planning |
   | Designer | design QA |
   | Operations | operations |

   Add a `role` key (`"developer" | "pm" | "designer" | "operations"`) to the matching entries in `src/data/starter-packs.ts`. This changes starter-pack data, not the agent schema, which fits the "don't invent a new agent field" constraint. Who belongs in a pack stays a curation decision in one place.

2. **The eligibility filter is a build-time rule, not only a UI filter.** A role pack's agents must be project-ready and have `verifiedStatus` of `tested` or `expert`. The build fails if any role pack breaks this rule or ends up with fewer than 3 or more than 5 agents. The rule lives in `scripts/check-data.mjs`, so a later downgrade of an agent can't quietly ship a pack with an unverified agent in it.

3. **"Download all" is a zip made at build time.** A build step writes `/kits/roles/<role>.zip` from the same files already served at `/kits/<slug>/<file>`. The browser then downloads one ordinary static file.
   - Why not a zip built in the browser (e.g. JSZip)? It adds a dependency and runtime work on mobile. The pack contents are fixed at build time, so there's nothing to compute on the client.
   - Why not trigger 3–5 × 7 separate downloads? Browsers block or prompt on multiple downloads (iOS Safari especially), which would break the 60-second goal.
   - Also show a copyable **curl one-liner** for the role zip, matching the per-agent pattern.

4. **Store the selected role in the URL (`/install?role=developer`), read on the client.** The site is a static export, so the page reads the value with `useSearchParams` inside a `<Suspense>` boundary. That makes packs linkable ("send this to your PM") without adding persisted state. localStorage is not used for the role (see Out of scope).

## Requirements

### Functional

- **R1. Role picker.** At the top of `/en/install` and `/ko/install`, above the existing content, show a "Pick your role" step with four options: Developer, PM, Designer, Operations. Each option has a label and a one-line description.
- **R2. Single selection.** Only one role can be selected at a time. Nothing is selected by default.
- **R3. Role pack display.** After a role is selected, show that role's pack right below the picker:
  - a pack title and a one-sentence "why these agents" line (reuse the starter pack's existing title and description where possible)
  - the 3–5 agents, each rendered with the existing `AgentCard` component (no fork or variant copy)
  - the **Download all kits for this role** button
  - a secondary curl one-liner with a copy button
  - a short "what's in the zip / where to put the files" note (see R6)
- **R4. Eligibility.** Role packs show only agents that are project-ready and have `verifiedStatus` of `tested` or `expert`. The build enforces this (R9), and the UI checks it again defensively.
- **R5. Download.** The button is a plain link to `/<basePath>/kits/roles/<role>.zip` with the `download` attribute and a localized filename, e.g. `agent-archive-developer-kits.zip`. The button label or helper text shows the file size.
- **R6. Zip layout.** Files that share a name (`AGENTS.md`, `CLAUDE.md`, and others) must not overwrite each other:
  ```
  agent-archive-<role>-kits/
    README.md              # generated: list of agents, how to install/merge, link back to site
    <slug-1>/AGENTS.md
    <slug-1>/CLAUDE.md
    <slug-1>/<slug-1>.mdc
    <slug-1>/agent.json
    <slug-1>/README.md
    <slug-1>/RUNBOOK.md
    <slug-1>/EVALUATION.md
    <slug-2>/...
  ```
  The root `README.md` must explain how to combine several agents into one repo: append the AGENTS.md / CLAUDE.md sections, and copy `.mdc` files into `.cursor/rules/`. The per-agent files are byte-identical to what `/kits/<slug>/` serves today.
- **R7. URL state.** Selecting a role updates the query string to `?role=<role>` with `router.replace` (no history spam, no scroll jump). Loading `/install?role=<role>` preselects that role. Switching locale keeps the `role` parameter.
- **R8. Existing content stays.** The existing four starter packs and the grid of all 20 project-ready agents stay below the new step, unchanged. Add a small divider or heading such as "Or browse all project-ready agents".
- **R9. Data checks** (`scripts/check-data.mjs`):
  - Every role value is used exactly once across the starter packs.
  - Each role pack has 3–5 agent slugs, each of which exists, is project-ready, and is `tested` or `expert`.
  - Every file a role zip needs exists in the kit output.
- **R10. Build step.** Zip generation runs as part of `npm run build`, after kit files are produced. It must be deterministic: fixed file order and fixed mtimes, so repeated builds produce identical zips and don't create diff noise.

### i18n

- **R11.** Every new string exists in both the `en` and `ko` dictionaries in `src/i18n/dictionaries.ts`:
  - step heading
  - four role labels and four role descriptions
  - pack intro
  - download button label
  - file-size format
  - curl label and "Copied" feedback
  - zip install note
  - "browse all" divider
  - invalid-role message

  Keep role labels in English form where that is the convention (e.g. "PM") and decide the Korean labels explicitly, for example 개발자 / PM / 디자이너 / 운영. The generated zip `README.md` is English only (see Out of scope).

### Layout and accessibility

- **R12. 375px wide.** The four role options sit in a 2×2 grid (or a single column) with no horizontal scroll. Tap targets are at least 44×44px. The download button is full width on mobile. The curl command scrolls inside its own box or wraps without breaking the layout.
- **R13. Speed.** At 375px, the role picker is visible without scrolling. After a role is selected, the download button is visible without further scrolling, or the page scrolls it into view smoothly and respects `prefers-reduced-motion`.
- **R14. Accessibility.**
  - The picker is a `radiogroup` (native radio inputs styled as cards, or proper ARIA) and fully usable by keyboard.
  - A visible focus ring uses the existing theme tokens.
  - The pack region is announced when it changes (`aria-live="polite"` on the pack heading).
  - The download button's accessible name includes the role name.
- **R15. Styling.** Use Tailwind with the existing theme tokens (`canvas`, `panel`, `line`, `primary`, `accent`) and `cn()`. No new design primitives.

## Acceptance criteria

- [ ] **AC1.** On `/en/install` and `/ko/install`, a "Pick your role" step with four roles appears above the existing starter packs, with nothing selected.
- [ ] **AC2.** Selecting a role shows 3–5 `AgentCard`s and a "Download all kits for this role" button. The URL becomes `?role=<role>`.
- [ ] **AC3.** Every agent in every role pack is project-ready and `tested` or `expert`. This is checked by `npm run check:data`.
- [ ] **AC4.** Temporarily setting one pack agent to `community` makes `npm run check:data` fail with a message naming the pack and agent. So does reducing a pack to 2 agents.
- [ ] **AC5.** Clicking Download on the deployed GitHub Pages site (with basePath) downloads one `.zip`. Its structure matches R6, it contains 7 files per agent plus the root README, and each file is byte-identical to `/kits/<slug>/<file>`.
- [ ] **AC6.** The curl one-liner, pasted into a terminal, fetches the same zip.
- [ ] **AC7.** Opening `/en/install?role=designer` directly preselects Designer and shows its pack.
- [ ] **AC8.** Switching `/en` to `/ko` with a role selected keeps that role, and all visible strings are Korean.
- [ ] **AC9.** At 375px (iPhone SE size), there is no horizontal scroll, and picker, pack, and download are usable with touch. Verified in Chrome devtools and on real iOS Safari.
- [ ] **AC10.** Keyboard only: Tab to the picker, arrow keys to change role, Tab to Download, Enter downloads.
- [ ] **AC11.** **60-second test:** 3 people who haven't used the site before, each on a phone and a laptop, starting from a cold load of `/install`, have a zip for their role saved in under 60 seconds. This is measured by hand, since there's no analytics.
- [ ] **AC12.** Two consecutive clean builds produce byte-identical role zips.
- [ ] **AC13.** `check:data`, `lint`, `typecheck`, `test`, and `build` pass. Unit tests cover the role→pack resolution and the eligibility filter.

## Edge cases

| Case | Expected behavior |
|---|---|
| `?role=` has an unknown value (`?role=ceo`) or wrong case | Treat as no selection. Optionally show a quiet "Unknown role, pick one below" note. Never crash or show an empty pack. Accept case-insensitive matches (`?role=PM`). |
| JavaScript disabled, or before hydration | The static HTML shows the picker with no selection, and the existing starter packs and grid still work. Consider making each role option a real `<a href="?role=…">` so it degrades gracefully. |
| An agent is downgraded to `community` later | The build fails (R9). A maintainer must replace the agent in the pack. The UI filter is only a second safety net. |
| A role has fewer than 3 eligible agents | The build fails. This can happen today: see Open questions. |
| An agent is in two role packs | Allowed. Each zip includes its own copy. |
| Kit files change | The zip is rebuilt on every deploy from the same source, so it can't drift from the individual files. |
| iOS Safari download | A single `.zip` link works; Safari saves it to Files. Do not use `window.open` or programmatic multi-click. |
| basePath (`/agentive/`) | The zip URL and curl command must include the basePath. Test on the deployed Pages URL, not only on `localhost`. |
| Name collisions inside the zip | Prevented by per-slug folders (R6). The root README explains merging. |
| Visitor double-clicks Download | Harmless: the browser downloads twice. No special handling. |
| Long Korean role descriptions at 375px | Text wraps, and card heights stay equal within a row. Check that Korean strings don't overflow. |
| Bookmarked agents | No interaction. Bookmarks are unchanged, and a role pack doesn't add bookmarks. |

## Assumptions

1. The four existing starter packs match the four roles one to one, as in the table above. If a current pack includes `community` or non-project-ready agents, it is edited to meet the rule rather than hiding agents only in the UI.
2. Among the 15 `tested` or `expert` project-ready agents, there are enough for every role to reach at least 3. **Not yet verified.**
3. Kit files are already produced as static files under `/kits/<slug>/` during the build, so the zip step can read them.
4. A small zip library as a devDependency for the build script (e.g. `archiver`, or `fflate` in Node) is acceptable. Nothing is added to the client bundle.
5. "Having kit files" in the success criterion means the zip is downloaded, not unzipped and installed in a repo.

## Risks

- **Not enough verified agents for a role.** If, say, Designer has only 2 `tested` or `expert` agents, the "3–5" rule and the "tested/expert only" rule conflict. Mitigation: check the counts before building (see Open questions). Options are to test another agent up to `tested` for real (never raise the status without testing it), or to allow 2 for that role as a documented exception.
- **Confusing merge.** Several AGENTS.md / CLAUDE.md files in one zip can confuse users who expect "drop into repo". Mitigation: the root README (R6) gives exact merge steps. A follow-up could add a merged file (see Out of scope).
- **Stale trust.** Packs are advertised as "trusted". If verification standards change, the build check keeps the packs honest, but only if `verifiedStatus` in the data stays accurate.
- **Page weight and duplication.** The new step plus the existing starter packs repeat similar content. Keep the new step compact, and review later whether the old starter-pack section is still needed.
- **Build time and repo size.** Four small zips are negligible. Make sure the zips are build output (gitignored), not committed.
- **Search-param hydration.** `useSearchParams` in a static export needs a `<Suspense>` boundary. Without one, the build fails or the whole page renders client-side.

## Out of scope

- A server-side or on-demand zip, or custom "build your own pack" selection.
- Merging several agents' AGENTS.md / CLAUDE.md / rules into one combined file (possible follow-up).
- Remembering the selected role across visits with localStorage. The URL is enough for now, and it avoids new persisted state.
- Analytics, event tracking, or A/B testing of the picker. The 60-second criterion is checked by hand.
- Roles beyond the four listed, and role picking on pages other than `/install`.
- Localizing the generated zip README or the kit files into Korean.
- Changing the per-agent Download Kit button or the existing curl one-liner.
- Changing any agent's `verifiedStatus` as part of this work.

## Open questions (answer before implementation)

1. **Counts per role.** List the 15 `tested` or `expert` project-ready agents grouped by role. Does every role reach at least 3? If not, which of the options under Risks do you prefer?
2. **Existing starter packs.** Should the old starter-pack section stay below the new step, or be removed once role packs exist? This spec keeps it.

## Next actions

1. List the eligible agents per role and finalize the 4 packs (3–5 slugs each) in `src/data/starter-packs.ts` with the new `role` key.
2. Extend `scripts/check-data.mjs` with the R9 checks and add unit tests for the eligibility filter.
3. Add a deterministic build script that writes `/kits/roles/<role>.zip` plus the root README. Hook it into `npm run build` after kit generation.
4. Build the `RolePicker` and `RolePack` components (reusing `AgentCard`) on `src/app/[locale]/install`, with URL state and a Suspense boundary.
5. Add the en and ko dictionary strings.
6. Run the 375px, keyboard, iOS Safari, and deployed-basePath checks, then the 60-second test with 3 people.
7. Run `check:data`, `lint`, `typecheck`, `test`, and `build`, then open the PR.
