# SOP: Adding a Project-Ready Agent to Agent Archive

| | |
|---|---|
| **Process** | Add a new "project-ready" agent (one with install kits) to `yohan-work/agentive` |
| **Owner** | Content maintainer (Seoyeon Lee, taking over from the current maintainer) |
| **Reviewer** | Any other maintainer |
| **Frequency** | About 2–4 per month |
| **Done when** | The PR is merged, CI is green on `main`, Pages is deployed, and all three live URLs return 200 with correct content |

---

## 1. Purpose and scope

This SOP lets a maintainer who knows git, but not this codebase, take an accepted agent from issue to live site without help.

**In scope:** creating a new installable agent YAML, promoting an existing agent to installable, optional starter-pack or workflow membership, verification, PR, deploy check, and rollback.

**Out of scope:** schema changes, new taxonomy categories, UI or code changes (see Exceptions, section 8).

---

## 2. Trigger

Start this SOP when either of these happens:

- **A.** A contributor's "New agent" GitHub issue gets the `accepted` label.
- **B.** A maintainer decides to promote an existing agent to project-ready.

Do **not** start on issues that are not labeled `accepted`.

---

## 3. Roles

| Role | Responsibilities |
|---|---|
| **Content maintainer (Owner)** | Runs every step, does the sample runs personally (or confirms real ones from the contributor), sets `verifiedStatus` honestly, opens the PR, and checks the deploy. |
| **Reviewer (another maintainer)** | Checks the PR against the checklist in section 7, especially status and score honesty and the category slugs. Approves or requests changes. |
| **Contributor (if trigger A)** | Supplies the agent idea, prompt, and ideally a real example input and output. Answers questions on the issue. |

---

## 4. Inputs

Before starting, have these ready:

- The accepted issue (trigger A), or the existing agent's slug (trigger B)
- A proposed **slug**: kebab-case and unique
- Agent content: name, summary, description, the prompt, expected inputs and outputs, and an example input
- The **category** slugs, which must already exist in `src/data/taxonomy.ts`
- At least one **real input** per planned sample run (two or more if you are aiming for `tested` or `expert`)
- Access to at least one AI tool (Codex, Claude, or Cursor) for the sample runs
- A local clone with dependencies installed (`npm install`)

If any of the agent content is missing, ask the contributor on the issue **before** creating the branch.

---

## 5. Outputs

- `content/agents/<slug>.yaml` with full metadata, `installTargets`, `runbook`, and `evaluation`
- (Optional) edits to `src/data/starter-packs.ts` and/or `src/data/workflows.ts`
- A merged PR titled `feat(content): add <slug> agent` that links the issue
- Live pages:
  - `/en/agents/<slug>`
  - `/ko/agents/<slug>`
  - `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`

---

## 6. Procedure (with checkpoints)

### Step 1: Create the branch
```bash
git checkout main && git pull
git checkout -b content/<slug>
```
For trigger B, use the existing agent's slug.

**Checkpoint:** You are on `content/<slug>`, branched from an up-to-date `main`.

### Step 2: Create the agent file
- **Trigger A:** `cp content/agents/_template.yaml content/agents/<slug>.yaml`
- **Trigger B:** edit the existing `content/agents/<slug>.yaml`. Do not copy the template over it.

Check that the slug is unique:
```bash
ls content/agents/ | grep <slug>
```

**Checkpoint:** Exactly one file uses the slug. `check:data` will fail on duplicates, but catching it now saves time.

### Step 3: Fill in the core metadata
Fill in: `name`, `summary`, `description`, `roles`, `categories`, `tags`, `tools`, `difficulty`, `automationLevel` (1–5), `prompt`, `inputs`, `outputs`, `exampleInput`, `limitations`, and `updatedAt`.

- Copy `categories` values **exactly** from `src/data/taxonomy.ts`. Don't type them from memory.
- Set `updatedAt` to **today** in `YYYY-MM-DD` format. Don't leave the template date.

**Checkpoint:** Every category slug appears character for character in `taxonomy.ts`, and `updatedAt` is today.

### Step 4: Make it installable
Add these fields:
- `installTargets`: `codex`, `claude`, `cursor`
- `runbook`: context to prepare, a good input, a bad input, and an output checklist
- `evaluation`: criteria, `qualityScore` (1–5), known weaknesses, and `sampleRuns` (filled in during Step 5)

**Checkpoint:** All three blocks are present. Leave `qualityScore` provisional until Step 5 is done.

### Step 5: Do the sample runs
For each run:
1. Open a **fresh** chat in the AI tool, with no prior context.
2. Paste the agent's prompt, then a **real** input (not the template example).
3. Record an entry in `sampleRuns` with the input, a summary of the output, and a verdict.

Run it at least twice if you intend to set `tested` or `expert`.

**Checkpoint:** Every recorded run actually happened, and the output summaries describe what the model really produced.

### Step 6: Set `verifiedStatus` and scores honestly

| Status | Requirement |
|---|---|
| `unverified` | Default. Nothing has been run. |
| `community` | The contributor ran it with at least one AI tool, and the example output is real. |
| `tested` / `expert` | There is an `evaluation` with **at least 2 recorded sample runs**. `check:data` rejects this status otherwise. |

**Rule: never set the status or `qualityScore` higher than what was actually tested.** If you are unsure, pick the lower value. You can raise it in a later PR.

**Checkpoint:** The status matches the number of sample runs, and the score reflects the verdicts you recorded.

### Step 7 (optional): Add Korean `realUseCases`
Add them if you can write them well. Skip rather than machine-translate carelessly.

### Step 8 (optional): Add to a starter pack or workflow
Only if the agent clearly belongs there, edit `src/data/starter-packs.ts` and/or `src/data/workflows.ts` and reference the slug exactly.

**Checkpoint:** Every slug you referenced matches the YAML filename.

### Step 9: Validate locally
Run all five commands, in order. Stop at the first failure and fix it.
```bash
npm run check:data
npm run lint
npm run typecheck
npm test
npm run build
```
`npm run content` (bundling) runs automatically before build, typecheck, and test. **Never edit `src/data/generated/agents.ts` by hand.** It is build output.

**Checkpoint:** All five pass, and `git status` shows no hand edits under `src/data/generated/`.

### Step 10: Open the PR
- Commit with a Conventional Commit message, for example `feat(content): add <slug> agent`.
- PR title: `feat(content): add <slug> agent`
- In the PR body, link the issue (`Closes #<n>`), state the chosen `verifiedStatus`, and list the sample runs.
- Request review from another maintainer.

**Checkpoint:** CI is green on the PR and the reviewer has approved.

### Step 11: Merge and check the deploy
1. Merge the PR.
2. Watch CI on `main`. The Deploy workflow publishes to GitHub Pages **only if CI passes on `main`**.
3. When the deploy finishes, open:
   - `/en/agents/<slug>`
   - `/ko/agents/<slug>`
   - `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`
4. Close the issue if the PR didn't close it automatically.

**Checkpoint:** All three URLs return 200 and show the new agent's content.

---

## 7. Quality checks (reviewer checklist)

- [ ] The slug is kebab-case, unique, and matches the filename
- [ ] Category slugs exist in `src/data/taxonomy.ts`
- [ ] `updatedAt` is the date of this change, not the template date
- [ ] `installTargets`, `runbook`, and `evaluation` are all present
- [ ] `verifiedStatus` is supported by the evidence: `tested`/`expert` has 2 or more real sample runs
- [ ] `qualityScore` matches the recorded verdicts, with no inflation
- [ ] No hand edits to `src/data/generated/`
- [ ] If a new UI string was added, it exists in **both** `en` and `ko` dictionaries
- [ ] `check:data`, `lint`, `typecheck`, `test`, and `build` all pass locally and in CI
- [ ] The PR title follows Conventional Commits and links the issue
- [ ] After deploy, all three live URLs return 200

---

## 8. Exceptions

| Situation | Action |
|---|---|
| The needed category doesn't exist in `taxonomy.ts` | Stop. Changing the taxonomy is out of scope. Either use an existing category or raise it with a maintainer as a separate PR first. |
| The slug is already taken | Choose a more specific slug and note it on the issue. |
| Only 1 sample run is possible | Set `community` (if the run is real) or `unverified`. **Never** `tested`. |
| The contributor's example output isn't real or can't be confirmed | Use `unverified` until you've done a real run yourself. |
| Promoting an existing agent (trigger B) | Edit the existing file, update `updatedAt`, and keep any existing real sample runs. Re-check that the status is still justified. |
| A change needs a new UI string | Add it to both the `en` and `ko` dictionaries. If it goes beyond content, flag it for a code-owning maintainer. |
| `check:data` fails with an unclear error | Compare your file against `_template.yaml` field by field. If it's still stuck, ask in the PR and tag a maintainer. Don't bypass the check. |
| CI passes locally but fails on the PR | Read the CI log. Don't merge until it's green. |
| The deploy doesn't run after merge | CI on `main` probably failed. Fix it in a follow-up PR or roll back (section 9). |
| A kit URL returns 404 after a green deploy | Check that `installTargets` is present and the slug is spelled right. Open a fix PR. |

---

## 9. Rollback

**When:** the live site is broken, the agent content is wrong or misleading, or the status turns out to be inflated.

1. On GitHub, **Revert** the merged PR. This creates a revert PR.
2. Let CI run and merge the revert PR once it's green.
3. Pages redeploys automatically on the next green CI on `main`.
4. Confirm that `/en/agents/<slug>` and `/ko/agents/<slug>` are gone or back to their previous state, and that the site is healthy.
5. Comment on the original issue explaining the revert, and reopen it if the work should continue.

Note: if CI on `main` is red for another reason, the revert won't deploy until that is fixed.

---

## 10. Assumptions

- Seoyeon has write access to the repo, can merge PRs, and can see CI and Deploy runs.
- Node and npm are installed, and `npm install` works on her machine.
- "Real input" means a realistic task from actual use, not the agent's own `exampleInput`.
- The site's base path is `/agentive/`, so the full page URLs are `https://yohan-work.github.io/agentive/en/agents/<slug>` and the equivalent `/ko/` path.
- Branch protection, if any, requires one reviewer approval.

---

## 11. Recommendations

1. **Pair on the first one.** Have Seoyeon run this SOP on the next accepted issue while you review. She drives and you only watch.
2. **Add a PR template** that contains the reviewer checklist from section 7, so the checks happen every time.
3. **Automate the URL check.** Add a post-deploy step that curls the three URLs, including the kit `AGENTS.md`, and fails loudly on a non-200.
4. **Add a `check:data` rule for `updatedAt`** (for example, it must not equal the template's date) to remove a common mistake for good.
5. **Keep a short "decisions log"** on the issue that records why a status or score was chosen. This helps reviewers and future re-evaluations.

---

## 12. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Status or score inflation | Loses the archive's credibility | Status table in Step 6, and the reviewer checks it explicitly |
| A category typo passes review | Broken filters and taxonomy | Copy slugs from `taxonomy.ts`, and `check:data` validates them |
| Hand edits to generated files | Changes get silently overwritten, or the build breaks | Checkpoint in Step 9, and the reviewer checks the diff |
| A missing `ko` string | Broken or English-only Korean UI | Reviewer checklist item |
| Knowledge concentrated in one person | The process stalls if Seoyeon is away | Any maintainer can follow this SOP, so keep it in the repo |
| Red CI on `main` blocks deploys | New agents and rollbacks don't go live | Watch CI after every merge and fix `main` first |

---

## 13. Next actions

| # | Action | Owner | When |
|---|---|---|---|
| 1 | Share this SOP with Seoyeon and confirm her repo permissions | Current maintainer | This week |
| 2 | Pick the next `accepted` issue for a paired run | Current maintainer + Seoyeon | Next accepted issue |
| 3 | Commit this SOP to the repo (for example, next to CONTRIBUTING.md) | Current maintainer | After the paired run, with any fixes |
| 4 | Add a PR template with the section 7 checklist | Any maintainer | Within 2 weeks |
| 5 | Decide whether to automate the post-deploy URL check and the `updatedAt` guard | Maintainers | Next planning pass |
