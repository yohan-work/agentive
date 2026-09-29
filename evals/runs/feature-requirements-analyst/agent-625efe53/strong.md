You gave me enough to write the full spec, so I haven't asked any questions up front. Where I had to guess, I wrote the guess down under **Assumptions**, and the few decisions only you can make are under **Open questions** at the end. Everything below the line can be pasted straight into a GitHub issue.

---

# feat(install): "Pick your role" step with role starter packs and a download-all action

## Summary

Add a role picker at the top of `/install`. The roles are **Developer, PM, Designer, Operations**. After a visitor picks a role, they see a recommended pack of 3–5 project-ready agents rated `tested`/`expert`, plus one **"Download all kits for this role"** action that returns every kit file for that pack as a single `.zip`. The site stays fully static: no server, no analytics, no login.

## Why

First-time visitors currently have to compare 20 agent cards (or 4 unranked starter packs) before they install anything. The role step cuts this down to one click that produces a small set of trusted agents, and a second click that downloads them.

**Success criteria**
1. A first-time visitor can go from landing on `/install` to having kit files for their role on disk in **under 60 seconds**. With no analytics, this is checked by a manual timed walkthrough on desktop and on a 375px mobile viewport.
2. Every agent in a role pack has `verifiedStatus` of `tested` or `expert`. The build enforces this, so reviewers don't have to remember it.

## Assumptions

Please correct any of these that are wrong.

- **A1.** The 4 existing starter packs in `src/data/starter-packs.ts` map 1:1 onto the roles:
  - engineering → Developer
  - product planning → PM
  - design QA → Designer
  - operations → Operations
- **A2.** Kit files already exist as static files at `/kits/<slug>/<file>` for all 20 project-ready agents. The curl one-liner already depends on them.
- **A3.** A role's pack is the matching starter pack's agents, filtered to project-ready agents rated `tested`/`expert`, kept in pack order, and capped at 5. No new field on the agent schema is needed.
- **A4.** The role picker's state lives in the URL (`/install?role=developer`) and not in `localStorage`. This keeps the rule that only bookmarks are persisted, and it makes a role's pack shareable as a link.

## Requirements

### Data

- **R1.** Add a `role` field to the starter-pack type with the values `'developer' | 'pm' | 'designer' | 'operations'`. Set it on each of the 4 existing packs.
  - The field goes on starter packs, not agents. Roles group packs, so agent YAML files and `schema/agent.schema.json` stay as they are.
- **R2.** Add a pure helper `getRolePack(role)` in `src/data/` or `src/lib/`. It returns the pack's agents after these rules are applied, in this order:
  1. Keep only agents that are project-ready.
  2. Keep only agents whose `verifiedStatus` is `tested` or `expert`.
  3. Preserve the order the pack defines.
  4. Return at most 5 agents.
- **R3.** Extend `scripts/check-data.mjs` so it **fails** in these cases:
  - Any role is not covered by exactly one starter pack.
  - `getRolePack(role)` returns **fewer than 3** agents for any role.
  - Any agent slug in a pack does not resolve to an existing agent.
  - Any agent in a role pack is missing one of its 7 kit files under `public/kits/<slug>/`, if kits are static files there (see A2).
- **R4.** Add unit tests for `getRolePack` next to the existing tests. Cover:
  - The status filter.
  - The cap at 5.
  - Order preservation.
  - A pack where a `community` agent sits between eligible agents.

### UI (`/install`)

- **R5.** The role step renders **above** the existing content on `/install`. It shows:
  - A heading and a one-line prompt, e.g. "Pick your role" / "Get a small, verified set of agents for your repo".
  - Four role options, each with a short label and a one-line description.
- **R6.** The role options are a single-select **radio group**. Use `role="radiogroup"` and `role="radio"` with `aria-checked`, or native radios with styled labels. They must work by keyboard: arrow keys move the selection and the focus ring is visible.
- **R7.** No role is selected by default, and no pack is shown until the visitor picks one. The exception is when `?role=` is present and valid; then that role is preselected.
- **R8.** Selecting a role does three things:
  - Updates the URL with `router.replace`, so the choice doesn't add history entries.
  - Renders that role's pack using the existing **`AgentCard`** component.
  - Shows the **Download all** button and a curl alternative (R12).
- **R9.** Read the query string on the client with `useSearchParams`, wrapped in `<Suspense>` as the static export requires. Do not use server-side `searchParams`, middleware, or `headers()`.
- **R10.** Keep the existing starter-pack section and the grid of all 20 agents below the role step, unchanged. The role step adds a shortcut and replaces nothing.
- **R11.** At 375px wide:
  - The role options are a 2×2 grid, or a vertical stack if the labels wrap badly in Korean.
  - Agent cards are a single column.
  - The Download all button is full width with a touch target of at least 44px.
  - Nothing scrolls horizontally.
  - The curl block scrolls inside its own container, not the page.

### Download all

- **R12.** Download all produces **one `.zip` file**, named for example `agent-archive-developer-kits.zip`, with one folder per agent:

  ```
  agent-archive-developer-kits/
    <slug-a>/AGENTS.md, CLAUDE.md, <slug-a>.mdc, agent.json, README.md, RUNBOOK.md, EVALUATION.md
    <slug-b>/...
    README.md   ← short index: role, agents included, how to install, link back to the site
  ```

  **Recommended: build the zips at build time.** A build step writes `public/kits/roles/<role>.zip` from the same kit sources, and the button is a plain `<a href download>`. A pre-built zip is an ordinary static file, so it fits the "no server-side zip" constraint and GitHub Pages serves it like any other asset. This approach:
  - adds no client JS dependency,
  - works reliably on iOS Safari,
  - downloads in one click with no in-browser processing, which is best for the 60-second goal.

  **Fallback if you'd rather not add a build step:** zip in the browser with `fflate` (about 8 kB gzipped). The browser fetches `/kits/<slug>/<file>` for each agent, builds the zip in memory, and triggers the download from a Blob URL. The lazy-loaded dependency is the only cost.

  Do **not** fire 7 × N separate downloads. Browsers block or prompt on multiple automatic downloads, and on mobile this breaks.
- **R13.** Show a **copyable curl/shell one-liner** for the role next to the button, e.g. `curl -LO https://yohan-work.github.io/agentive/kits/roles/developer.zip && unzip developer.zip`. Terminal users, which is most developers, can then skip the browser entirely.
- **R14.** The button has these states:
  - **Idle:** "Download all kits (N agents)".
  - **Preparing:** only with the fallback approach; the button is disabled and shows a spinner.
  - **Done:** a short confirmation.
  - **Error:** a message plus links to each agent's page so the visitor can download the kits one by one.
- **R15.** The per-agent "Download Kit" button and curl one-liner on agent pages stay exactly as they are.

### i18n

- **R16.** Add every new string to **both** `en` and `ko` in `src/i18n/dictionaries.ts`. The expected new keys (names are illustrative):
  - `install.role.heading`, `install.role.prompt`
  - `install.role.developer.label` / `.description`, and the same for `pm`, `designer`, and `operations`
  - `install.role.packHeading` (with a `{role}` placeholder)
  - `install.role.downloadAll` (with an `{count}` placeholder), `install.role.preparing`, `install.role.downloaded`, `install.role.error`
  - `install.role.curlLabel`, `install.role.copy`, `install.role.copied`
  - `install.role.verifiedNote`, e.g. "Only agents rated Tested or Expert are included."
- **R17.** File names, folder names, and the index `README.md` inside the zip stay English and ASCII in both locales. Only the UI is translated.

## Acceptance criteria

- [ ] **AC1.** On `/en/install` and `/ko/install`, the role step is the first content section. It shows 4 role options, and none is selected on first load.
- [ ] **AC2.** Selecting a role shows 3–5 `AgentCard`s. The URL updates to `?role=<role>`, and the back button does not step through each role change.
- [ ] **AC3.** Every card in every role pack shows `tested` or `expert`. `npm run check:data` fails if a `community`/`unverified` agent is the only thing keeping a pack at 3 or more, or if any pack falls below 3.
- [ ] **AC4.** Loading `/en/install?role=designer` directly preselects Designer and shows its pack. An invalid value such as `?role=ceo` is ignored: nothing is selected and nothing breaks.
- [ ] **AC5.** Clicking Download all produces one `.zip` with the structure in R12. That means 7 files per agent, all non-empty, and file contents identical to the per-agent kit downloads.
- [ ] **AC6.** The curl one-liner in R13 works as written from a clean directory against the deployed site.
- [ ] **AC7.** Timed walkthrough: land on `/install`, pick a role, download, unzip. This takes under 60 s in current Chrome desktop, Safari iOS, and Chrome Android at 375px.
- [ ] **AC8.** At 375px there is no horizontal page scroll and every interactive element is at least 44px tall. This holds in both locales.
- [ ] **AC9.** The role picker works by keyboard alone, and a screen reader announces it as a radio group with the selected state.
- [ ] **AC10.** Every new UI string exists in both `en` and `ko`, and switching locale keeps the `?role=` selection.
- [ ] **AC11.** The existing starter packs, the 20-agent grid, and the per-agent downloads behave as they do today.
- [ ] **AC12.** `check:data`, `lint`, `typecheck`, `build`, and the unit tests all pass, and `next build` still produces a fully static export.

## Edge cases

| Case | Expected behavior |
|---|---|
| An agent in a pack is later downgraded to `community` | It disappears from the role pack automatically. If the pack drops below 3, `check:data` fails the build instead of shipping a thin pack. |
| A pack has more than 5 eligible agents | The first 5 in pack order are shown. The zip contains exactly the agents shown. |
| A pack lists an agent that isn't project-ready (no kit) | That agent is excluded from the role pack, and `check:data` warns. |
| An agent appears in two role packs | Allowed. It appears in both zips. |
| A kit file is missing at build time | The build fails (R3). The site never ships a zip with missing files. |
| JS is disabled | The role step can't be interactive. Show a `<noscript>` note with links to the static starter packs below. With pre-built zips, you can optionally render 4 plain download links. |
| The fallback download fails because one fetch fails | Abort, show the error state, and list per-agent links. Never download a partial zip silently. |
| iOS Safari and Blob downloads (fallback only) | Test explicitly. If Blob download is unreliable, open the file in a new tab. This risk is the main reason pre-built zips are recommended. |
| Double-clicking Download all | The button is disabled while preparing, so it doesn't trigger duplicate downloads. |
| `?role=` combined with other query params or a hash | Preserve the other params when updating `role`. |
| Korean labels are longer or wrap | The layout still holds at 375px (AC8). The grid may switch to a vertical stack. |
| Bookmarks | Unaffected. Role packs do not read or write `localStorage`. |

## Out of scope

- Persisting the chosen role across visits (`localStorage`/cookies). The role lives in the URL only.
- Analytics, events, or any funnel tracking. The 60-second goal is checked manually.
- Roles beyond the four, multiple roles at once, or a "custom pack" builder.
- Adding `role` or any other new field to the agent schema or YAML files.
- Changing which agents are `tested`/`expert`, or promoting `community` agents to fill a pack.
- Redesigning the existing starter-pack section, `AgentCard`, or agent detail pages.
- Server-side or on-demand zipping, and CLI/npm installers.
- A role step on any page other than `/install`.

## Risks

- **Thin packs.** Only 15 of the 20 project-ready agents are `tested`/`expert`, and they may not spread evenly across 4 roles. A role such as Designer could end up with fewer than 3. *Mitigation:* run `getRolePack` against current data **before** building the UI. If a role falls short, rebalance which agents the packs contain; do not relax the status rule.
- **Drift between the zip and the per-agent kits.** If role zips are generated separately from `/kits/<slug>/`, their contents can diverge. *Mitigation:* build zips from the same generated kit files, and cover this with AC5 in a test.
- **Repo and deploy size.** 4 zips of up to 35 small text files each is negligible, but generate them at build time rather than committing them.
- **Mobile download behavior** (fallback approach only). See the edge-case table.

## Next actions

1. **Check pack coverage** (about 15 min). Run a one-off script to count the `tested`/`expert` project-ready agents in each current starter pack. If any role has fewer than 3, decide on rebalancing first.
2. **Decide the zip approach:** build-time (recommended) or client-side with `fflate`.
3. Implement the data layer: R1–R4, including the `check:data` rules and unit tests.
4. Implement the build-time zip generation (or the fallback) and the curl one-liner: R12–R14.
5. Implement the UI: R5–R11 and R16. Check it at 375px in both locales.
6. Run AC1–AC12, including the timed walkthrough on 3 browsers. Attach the timings to the PR.

## Open questions

1. Does the 1:1 mapping from the 4 existing starter packs to the 4 roles (A1) hold, or do the role packs need different agents from the current packs?
2. Once the role step ships, should the existing starter-pack section stay as it is, be collapsed, or be removed? This spec assumes it **stays** (R10).
3. Is a new build step that writes `public/kits/roles/*.zip` acceptable? If not, the client-side `fflate` fallback applies.
