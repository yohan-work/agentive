# Feature: "Pick your role" starter packs on /install

## Summary

Add a role picker at the top of `/install`. The visitor picks one of four roles (Developer, PM, Designer, Operations). The page then shows 3–5 recommended project-ready agents for that role, all with `verifiedStatus` of `tested` or `expert`, plus one "Download all kits for this role" action. Everything is static: no server, no analytics, no login.

## Background / current state

- `/install` renders 4 static starter packs from `src/data/starter-packs.ts` (engineering, product planning, design QA, operations), then a grid of all 20 project-ready agents using `AgentCard`.
- Each project-ready agent has a 7-file kit served at `/kits/<slug>/<file>` (AGENTS.md, CLAUDE.md, Cursor `.mdc` rule, agent.json, README, RUNBOOK, EVALUATION). Kits can be downloaded per agent from the UI or with curl.
- Only bookmarks are persisted (localStorage).
- 15 of the 20 project-ready agents are `tested`/`expert`. The other 5 are `community`.

## Design decisions (proposed)

1. **Roles map 1:1 onto the existing starter packs. No new agent schema field.**
   Developer → engineering, PM → product planning, Designer → design QA, Operations → operations. Add an optional `role` key (`"developer" | "pm" | "designer" | "operations"`) to each **starter-pack** entry in `src/data/starter-packs.ts`. A role pack is that starter pack's agent list, filtered to `tested`/`expert` and capped at 5. A field on the pack, not on the agent, keeps the agent schema unchanged and puts curation in one file.
2. **"Download all" is a pre-built static zip.**
   At build time, generate `/kits/roles/<role>.zip` next to the existing `/kits/<slug>/` files. The button is a plain `<a href download>`. It needs no client-side zip library, works without JS once the page is rendered, and works on mobile Safari.
   *Alternative considered:* zipping in the browser (e.g. with fflate) from the `/kits/<slug>/<file>` fetches. It avoids new build output but adds a dependency, has 35 network requests as a failure point, and is less reliable on iOS. Use it only if build-time zips are rejected.
3. **Selected role lives in the URL (`/en/install?role=developer`) and is read on the client with `useSearchParams`.** Links are shareable and survive a locale switch, and nothing new goes into localStorage.

## Requirements

### Functional

- **R1. Role picker.** The top of `/install` (en and ko) shows a "Pick your role" section with 4 options: Developer, PM, Designer, Operations. It renders above the existing starter packs and the agent grid.
- **R2. Single selection.** Exactly one role can be selected at a time. Selecting a role updates the URL `?role=<role>` with `router.replace` (no new history entry per click, no scroll jump).
- **R3. Default state.** With no valid `?role=`, no role is selected. The section shows a one-line prompt and the rest of `/install` renders as it does today.
- **R4. Recommended pack.** When a role is selected, show:
  - a short role description (1 sentence),
  - 3–5 agents rendered with the existing `AgentCard`,
  - a primary "Download all kits for this role" button,
  - a secondary copyable curl command for the same zip (matching the existing per-agent curl pattern), e.g. `curl -LO https://yohan-work.github.io/agentive/kits/roles/developer.zip`,
  - a short "What's in the zip" note (one folder per agent, 7 files each, plus a README).
- **R5. Eligibility rule.** A role pack contains only agents that are (a) project-ready (have a kit) and (b) `verifiedStatus` of `tested` or `expert`. Filtering happens in the data layer at build time, not in the component.
- **R6. Pack size.** Every role pack has between 3 and 5 eligible agents. If it doesn't, the build fails (see R12).
- **R7. Zip contents.** `/kits/roles/<role>.zip` contains:
  ```
  agent-archive-<role>/
    README.md                # role, agent list with links, how to install, how to merge files (see R8)
    <slug-1>/AGENTS.md, CLAUDE.md, <slug-1>.mdc, agent.json, README.md, RUNBOOK.md, EVALUATION.md
    <slug-2>/...
  ```
  Files are byte-identical to the per-agent kits at `/kits/<slug>/`. The zip is generated from the same source in the same build step, so it cannot drift.
- **R8. Merge guidance.** Each agent ships its own AGENTS.md and CLAUDE.md, so dropping 3–5 kits into one repo collides at the repo root. The top-level README in the zip must explain this in 5 steps or fewer: copy the `.mdc` files into `.cursor/rules/`, and either paste the relevant sections into a single root AGENTS.md/CLAUDE.md or keep the per-agent folders under a directory such as `agents/`. (A pre-merged combined AGENTS.md is out of scope for v1. See Out of scope.)
- **R9. Order.** Agents in a role pack appear in the order defined in `starter-packs.ts`. The order is the curator's recommendation, not alphabetical.
- **R10. Existing content unchanged.** The 4 existing starter packs and the full grid of 20 project-ready agents stay on the page below the role picker, unchanged. `community` agents still appear in the full grid.
- **R11. i18n.** Every new string exists in both `en` and `ko` in `src/i18n/dictionaries.ts`: section title, prompt, 4 role labels, 4 role descriptions, button label, curl label, copy/copied feedback, the "What's in the zip" note, error text. The zip README is English only in v1.
- **R12. Build-time validation** (extend `scripts/check-data.mjs`):
  - every starter pack with a `role` references existing agent slugs,
  - each of the 4 roles is assigned to exactly one pack,
  - after filtering, each role has 3–5 agents that are project-ready and `tested`/`expert`,
  - every agent in a role pack has all 7 kit files.
  Any failure exits non-zero with a message that names the role and slug.

### Non-functional

- **N1. Static only.** No server routes, middleware, `headers()`, server `searchParams`, analytics, or login. Works with `output: "export"` on GitHub Pages, including the base path (`/agentive/`) in every zip and curl URL.
- **N2. Mobile.** Works at 375px wide: the 4 role options fit without horizontal scroll (2×2 grid or a wrapping segmented control), cards stack in one column, the download button is full width, and the curl command wraps or scrolls inside its own box without widening the page.
- **N3. Accessibility.** The role picker is a `radiogroup` (or buttons with `aria-pressed`), fully keyboard operable, with visible focus. Selecting a role moves or announces focus on the pack heading (`aria-live="polite"`). The download link's accessible name includes the role, e.g. "Download all kits for Developer (zip)".
- **N4. Performance.** No new runtime dependency for zipping. Each role zip is small (expected under 200 KB). Show the file size next to the button, computed at build time.
- **N5. Style.** Use existing theme tokens (`canvas`, `panel`, `line`, `primary`, `accent`), `cn()`, and function components.

## Acceptance criteria

**Role selection**
- [ ] AC1: On `/en/install` and `/ko/install` with no query, the role picker appears above the existing starter packs, no role is selected, and the rest of the page matches today's page.
- [ ] AC2: Clicking "Developer" updates the URL to `?role=developer` without a full reload and shows 3–5 `AgentCard`s plus the download button.
- [ ] AC3: Loading `/en/install?role=pm` directly shows the PM pack preselected.
- [ ] AC4: Switching the locale (en ↔ ko) while a role is selected keeps the same role selected.
- [ ] AC5: With `?role=unknown` or an empty `?role=`, the page renders in the default state with no error.

**Pack content**
- [ ] AC6: For every role, each displayed agent has a kit and `verifiedStatus` of `tested` or `expert`. No `community` or `unverified` agent appears in any role pack.
- [ ] AC7: Every role pack shows at least 3 and at most 5 agents.
- [ ] AC8: Changing an agent in a role pack to `community` makes `npm run check:data` either drop it from that pack or, if the pack falls below 3, fail with a message naming the role.

**Download**
- [ ] AC9: "Download all kits for this role" downloads `agent-archive-<role>.zip` in current Chrome, Firefox, Safari (macOS), and Safari (iOS). The zip unpacks to the structure in R7.
- [ ] AC10: Each file in the zip is byte-identical to the matching `/kits/<slug>/<file>`.
- [ ] AC11: The curl command shown for a role downloads the same zip from the deployed site (base path included), and its copy button shows copied feedback in the current locale.
- [ ] AC12: The zip's README lists the agents in the pack with links to their agent pages and includes the merge guidance from R8.

**Time to value**
- [ ] AC13: Starting on `/en/install` in a new session, a tester can select a role and have the zip on disk in under 60 seconds (in practice 2 clicks: role, download). Verify on desktop and on a 375px mobile viewport.

**Quality gates**
- [ ] AC14: No horizontal page scroll at 375px in any state (default, each role selected).
- [ ] AC15: The role picker can be operated with the keyboard alone, and screen readers announce the selected role and the pack.
- [ ] AC16: Every new UI string resolves in both `en` and `ko` (no missing keys, no English fallback on `/ko`).
- [ ] AC17: `check:data`, `lint`, `typecheck`, `test`, and `build` pass. `out/kits/roles/{developer,pm,designer,operations}.zip` exist after `npm run build`.
- [ ] AC18: Unit tests cover the role-pack selector (filtering, ordering, 3–5 bound) and the new `check-data` validations.

## Edge cases

| Case | Expected behavior |
|---|---|
| A starter pack has fewer than 3 `tested`/`expert` agents (likely for Designer or Operations; see open question 1) | Build fails in `check:data`. Fix by curation: add another eligible agent to the pack, or promote an agent through real testing. Never loosen the rule, and never raise `verifiedStatus` without testing. |
| A starter pack has more than 5 eligible agents | Take the first 5 in pack order and warn in `check:data`, or fail. Pick one; failing is stricter and avoids silent truncation. |
| The same agent belongs to several roles | Allowed. It appears in each role's zip. |
| An agent is downgraded to `community` after release | The next build drops it from role packs automatically (R5). The per-agent page and kit are unaffected. |
| A kit file is missing for an agent in a role pack | `check:data` fails before the zip is built. |
| JS disabled or not yet hydrated | The picker can't switch roles without JS. The default state and existing content still render. Optionally render each role's download link as a plain `<a>` in a `<noscript>` block. |
| Pop-up or download blockers, iOS Safari | A same-origin `<a download>` with a user click is not blocked. On iOS the zip opens in Files or in a preview, which is acceptable. |
| Visitor downloads twice | The browser handles duplicate names (e.g. `developer (1).zip`). No special handling. |
| GitHub Pages cache after a pack changes | The zip URL stays the same. Stale caches clear within Pages' normal cache window. Acceptable for v1. Content-hashed filenames are out of scope. |
| Base path | Zip and curl URLs must include `/agentive/`. Test on the exported build, not only on `next dev`. |
| `?role=Developer` (different case) or extra params | Match the role case-insensitively, and leave other query params alone. |
| Existing starter packs section repeats the same content | Accept the duplication in v1, or add a "Role packs below are the full curated lists" hint. Don't remove existing packs in this issue. |
| Long Korean labels at 375px | Role labels and the button wrap onto 2 lines without truncation or overflow. |

## Out of scope

- A pre-merged single AGENTS.md / CLAUDE.md per role. It is useful, but merging agent instructions needs its own design (ordering, conflicts, duplicated sections). Track it as a follow-up.
- Client-side zip generation (unless the build-time approach is rejected).
- Custom role packs, picking your own agents, or "add to pack" from bookmarks.
- Remembering the role across visits (localStorage), accounts, or sync.
- Analytics or measuring the 60-second criterion in production. It is verified manually per AC13.
- Roles beyond the four listed, or more than one role at a time.
- Including `community` agents in role packs, even behind a toggle.
- Changes to the per-agent Download Kit button, kit file contents, or the curl pattern for single agents.
- Localizing the kit files or the zip README into Korean.
- CLI or package-manager install (`npx`, etc.).

## Open questions

1. **Pack coverage.** Do the existing engineering, product planning, design QA, and operations packs each contain at least 3 agents that are `tested`/`expert` and project-ready? With 15 eligible agents across 4 roles this is plausible, but the split may be uneven. Run the filter before implementation. If a role falls short, decide whether to re-curate its pack or ship that role later.
2. **Over 5 eligible agents:** truncate with a warning or fail the build?
3. **Should selecting a role also scroll to the pack, or filter or highlight the full grid below?** Proposed: show the pack inline and leave the grid untouched.
4. **Role wording in Korean** (e.g. 개발자 / PM / 디자이너 / 운영): confirm with the ko copy owner.

## Implementation notes (non-binding)

- `src/data/starter-packs.ts`: add `role?: Role` to the pack type, and export `getRolePack(role)`, which returns filtered, ordered, capped agents.
- Kit build step (wherever `/kits/<slug>/` is generated): after writing per-agent files, write `public/kits/roles/<role>.zip` (or write to the export output) with a small zip library used **only at build time** (e.g. `fflate` or `archiver` as a devDependency). Record the size for N4.
- `src/components/install/RolePicker.tsx` (client component, `useSearchParams`, wrapped in `<Suspense>` as static export requires) and `RolePack.tsx` (reuses `AgentCard`).
- `scripts/check-data.mjs`: add the R12 checks.
- `tests/`: selector and validation tests (AC18).
