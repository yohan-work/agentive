# SOP: Adding a Project-Ready Agent to Agent Archive

**Repository:** https://github.com/yohan-work/agentive
**Process owner:** Content maintainer (handing over to Seoyeon Lee)
**Reviewer:** Any other maintainer
**Expected volume:** 2–4 agents per month
**Version:** 1.0 (draft for handover)

You gave me enough to write the full SOP without asking anything first. A few gaps I filled with assumptions. They're marked **[A#]** and collected in the Assumptions section, so you can confirm or fix them before Seoyeon uses this on her own.

---

## 1. Purpose and scope

This SOP lets a second maintainer add a **project-ready** agent to Agent Archive and take it through to a verified live deployment without the original maintainer's help. A project-ready agent is one that ships install kits.

**In scope:** new agent YAML files, promoting an existing agent to project-ready, optional starter-pack and workflow membership, PR, deploy verification, and rollback.
**Out of scope:** UI or code changes, taxonomy changes (adding new categories), and schema changes. If any of these is needed, see Exceptions (E3, E4).

---

## 2. Trigger

Start this SOP when either of these happens:

| Trigger | Source | Starting point |
|---|---|---|
| **T1**: A "New agent" GitHub issue gets the label `accepted` | Contributor issue | Create a new YAML file from the template |
| **T2**: A maintainer decides to promote an existing agent to project-ready | Maintainer decision | Edit the existing `content/agents/<slug>.yaml` file. Do **not** recopy the template. |

---

## 3. Roles

| Role | Who | Responsibilities |
|---|---|---|
| **Content maintainer (Owner)** | Seoyeon Lee (currently the original maintainer) | Writes the YAML, runs the sample runs, sets the verification status honestly, runs the checks, opens the PR, and verifies the deploy |
| **Reviewer** | Any other maintainer | Reviews the PR against the Quality Checks (Section 8), with special attention to status inflation, and approves or requests changes |
| **Contributor** (T1 only) | Issue author | Supplies the agent idea and prompt, and ideally a real example input and output. Answers follow-up questions on the issue. |

---

## 4. Inputs

Gather these before you start:

- [ ] The accepted issue link (T1) or the name of the existing agent to promote (T2)
- [ ] A proposed **slug** (kebab-case, unique)
- [ ] The agent's **prompt**, plus a description of its inputs and outputs
- [ ] At least one **real input** you can use for sample runs (at least two if you're aiming for `tested` or `expert`)
- [ ] Access to at least one AI tool to run the agent in a fresh chat
- [ ] The current category list in `src/data/taxonomy.ts`
- [ ] A local clone with dependencies installed, so `npm run …` commands work **[A1]**
- [ ] Push access to the repo, or a fork, plus the ability to open PRs **[A2]**

---

## 5. Outputs

- `content/agents/<slug>.yaml`, complete with install fields (`installTargets`, `runbook`, `evaluation`)
- Optionally, edits to `src/data/starter-packs.ts` and/or `src/data/workflows.ts`
- A merged PR titled `feat(content): add <slug> agent` that links the issue
- Live pages:
  - `/en/agents/<slug>`
  - `/ko/agents/<slug>`
  - `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`, which must return HTTP 200

---

## 6. Procedure (with checkpoints)

### Step 1: Create a branch
```bash
git checkout main && git pull
git checkout -b content/<slug>
```
**Checkpoint 1:** You're on `content/<slug>`, branched from an up-to-date `main`.

### Step 2: Create or open the agent file
- **T1 (new):** copy the template.
  ```bash
  cp content/agents/_template.yaml content/agents/<slug>.yaml
  ```
- **T2 (promote):** open the existing `content/agents/<slug>.yaml`.

Slug rules: kebab-case (`lowercase-words-with-hyphens`) and unique. Check for an existing file first:
```bash
ls content/agents/ | grep <slug>
```
**Checkpoint 2:** The file exists, the filename slug is kebab-case, and no other agent uses that slug. `check:data` fails on duplicates.

### Step 3: Fill in the core metadata
Fill in every field: `name`, `summary`, `description`, `roles`, `categories`, `tags`, `tools`, `difficulty`, `automationLevel`, `prompt`, `inputs`, `outputs`, `exampleInput`, `limitations`, `updatedAt`.

Watch these fields in particular:
- **`categories`**: copy each slug **exactly** from `src/data/taxonomy.ts`. Don't type them from memory. Typos are the most common mistake.
- **`automationLevel`**: an integer from 1 to 5.
- **`updatedAt`**: **today's date** in `YYYY-MM-DD` format. Replace the template date. Update it for T2 promotions too.

**Checkpoint 3:** No template placeholder values remain. Every category exists in `taxonomy.ts`. `updatedAt` is today's date.

### Step 4: Add the install fields (what makes it "project-ready")
- **`installTargets`**: `codex`, `claude`, `cursor`, whichever apply
- **`runbook`**: context to prepare, a good input example, a bad input example, and an output checklist
- **`evaluation`**: criteria, `qualityScore` (1–5), known weaknesses, and `sampleRuns` (filled in during Step 5)

**Checkpoint 4:** All three blocks are present and not empty. Only `sampleRuns` may be pending at this point.

### Step 5: Run the sample runs and record them
For each run:
1. Open a **fresh** chat in the AI tool. Don't reuse a conversation.
2. Paste the agent's `prompt` and a **real** input.
3. Record the input, an output summary, and a verdict in `evaluation.sampleRuns`.

Aim for **at least 2** runs, with different inputs where possible. **[A3]**

**Checkpoint 5:** Every recorded sample run actually happened, and each has an input, an output summary, and a verdict.

### Step 6: Set `verifiedStatus` (the honesty gate)
Pick the **highest level your evidence supports, and no higher**:

| Status | Requirement |
|---|---|
| `unverified` | Default. Nothing has been run. |
| `community` | Run by the contributor with at least one AI tool, **and** the example output is real |
| `tested` / `expert` | An evaluation with **at least 2 recorded sample runs**. `check:data` rejects anything less. |

Rules:
- **Never** set the status or `qualityScore` higher than what was actually tested.
- If you only managed 1 sample run, the status can't be `tested`. Use `community` if the contributor's criteria are met, otherwise `unverified`.
- `qualityScore` should reflect what the sample runs showed, not what you expect the agent could do.

**Checkpoint 6:** The status matches the evidence in the file, and the score is justified by the sample runs.

### Step 7: Add Korean `realUseCases` (optional)
Add them if you can. Skipping this doesn't block the PR.

### Step 8: Add to a starter pack or workflow (only if relevant)
Edit `src/data/starter-packs.ts` or `src/data/workflows.ts` and reference the agent by its exact slug.

**Checkpoint 8:** Any reference you added uses the exact slug from Step 2.

### Step 9: Run the local checks
Run all five, in order:
```bash
npm run check:data
npm run lint
npm run typecheck
npm test
npm run build
```
`npm run content` (bundling) runs automatically before build, typecheck, and test. You don't need to run it yourself.

**Never edit `src/data/generated/agents.ts` by hand.** It's build output. If it shows up as changed in `git status`, leave it for the build to regenerate. Don't hand-fix it. **[A4]**

**Checkpoint 9:** All five commands pass with no errors. Don't open the PR until they do.

### Step 10: Open the PR
- Title: `feat(content): add <slug> agent`
- Body: link the issue (for example, `Closes #<issue>` for T1), say which status you chose and why (for example, "2 sample runs in Claude, see evaluation.sampleRuns"), and list any starter pack or workflow edits.
- Request a review from another maintainer.

**Checkpoint 10:** CI is green on the PR, and the reviewer has approved it against Section 8.

### Step 11: Merge and verify the deploy
1. Merge the PR.
2. Wait for CI on `main`. The Deploy workflow publishes to GitHub Pages **only if CI passes on `main`**.
3. Once the deploy finishes, check these URLs **[A5]**:
   - `https://yohan-work.github.io/agentive/en/agents/<slug>`
   - `https://yohan-work.github.io/agentive/ko/agents/<slug>`
   - `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`

   Confirm the kit URL returns 200:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md
   ```
4. For T1, close the issue (if the PR didn't close it automatically) with a link to the live page.

**Checkpoint 11:** Both locale pages render, the kit URL returns 200, and the issue is closed.

---

## 7. Exceptions

| # | Situation | What to do |
|---|---|---|
| **E1** | You can't get 2 real sample runs | Ship with `community` (if the contributor's criteria are met) or `unverified`. Note in the PR that it can be upgraded later. Don't inflate. |
| **E2** | Contributor information is incomplete (no real input or output, vague prompt) | Ask on the issue. Pause the SOP until they answer. Don't invent example outputs. |
| **E3** | The agent needs a category that doesn't exist in `taxonomy.ts` | Stop. That's a taxonomy change, which is out of scope. Raise it with a maintainer, or pick the closest existing category. **[A6]** |
| **E4** | The change needs a new UI string or a code change | Out of scope for this SOP. If you do add a UI string, add it to **both** the `en` and `ko` dictionaries. Forgetting `ko` is a known mistake. |
| **E5** | `check:data` fails | Read the error. Usual causes: a duplicate slug, a category typo, `tested`/`expert` with fewer than 2 sample runs, or a missing required field. Fix the YAML, not the generated file. |
| **E6** | CI passes on the PR but fails on `main` after the merge | Nothing deploys. Fix it forward with a follow-up PR, or revert (Section 9). |
| **E7** | The deploy finishes but a kit URL returns 404, or a page is missing | Check that `installTargets` and `runbook` are present, that the slug matches the filename, and that the Deploy workflow actually ran. If you can't find the cause quickly, revert. |
| **E8** | Slug collision found late (after the PR is open) | Rename the file and every reference (starter packs, workflows) to a new unique slug. Update the PR title and branch name if that helps clarity. |

---

## 8. Quality checks (reviewer checklist)

The reviewer confirms each item before approving:

- [ ] The filename slug is kebab-case, unique, and matches all references
- [ ] Every `categories` entry exists in `src/data/taxonomy.ts`
- [ ] `updatedAt` is the PR date, not the template date
- [ ] `automationLevel` is 1–5 and `qualityScore` is 1–5
- [ ] `installTargets`, `runbook`, and `evaluation` are all present and substantive
- [ ] **No status inflation:** the `verifiedStatus` and `qualityScore` are supported by the recorded `sampleRuns`, and there are at least 2 runs for `tested`/`expert`
- [ ] The sample runs look real (specific inputs and honest verdicts, including weaknesses)
- [ ] `src/data/generated/agents.ts` was not edited by hand
- [ ] If UI strings changed, both `en` and `ko` were updated
- [ ] The PR title follows `feat(content): add <slug> agent` and links the issue
- [ ] CI is green (all five commands)

**Definition of done:** all five commands pass locally and in CI, the kit URLs return 200, and there's no status inflation.

---

## 9. Rollback

**When:** a broken page, a kit URL returning 404 or wrong content, a status or score found to be inflated, or a failing `main`.

1. Open the merged PR on GitHub and click **Revert** (or run `git revert <merge-commit>` on a branch).
2. Open the revert PR with the title `revert: add <slug> agent` and a one-line reason.
3. Get it reviewed and merged. **[A7]**
4. GitHub Pages redeploys on the **next green CI run on `main`**. Confirm the agent pages and kit URL are gone, or back to their previous state for a T2 promotion.
5. Comment on the original issue explaining the revert and what's needed to re-land it.

**Faster alternative for status inflation only:** instead of a full revert, open a small fix PR that lowers `verifiedStatus` or `qualityScore` to what the evidence supports.

---

## 10. Assumptions

| # | Assumption | Please confirm |
|---|---|---|
| A1 | Seoyeon has a working local environment (Node and npm) and has run `npm install` | Is there a required Node version? |
| A2 | Seoyeon has (or will get) write access to create `content/*` branches and merge PRs | Does `main` have branch protection or a required-reviewer rule? |
| A3 | Two sample runs is a good default for every project-ready agent, even when targeting `community` | Or is one run acceptable for `community`? |
| A4 | The generated file is either gitignored or regenerated by the build, so it shouldn't appear in PR diffs | Should it ever be committed? |
| A5 | Agent pages live under the same Pages base URL as the kits (`/agentive/en/agents/<slug>`) | Is that the right URL shape? |
| A6 | Taxonomy changes need separate maintainer approval | Who approves new categories? |
| A7 | A revert PR goes through the same review as any other PR | Can the owner self-merge reverts in an emergency? |

Also worth confirming: whether any kit files besides `AGENTS.md` should be checked for 200. Your notes mention only `AGENTS.md`.

---

## 11. Recommendations

1. **Add a PR template** for content PRs that embeds the Section 8 checklist. The reviewer then has nothing to remember.
2. **Script the post-deploy check.** A small script that curls all three URLs for a slug turns Step 11 into one command.
3. **Pair on the first one.** Have Seoyeon run this SOP on her first agent while you review live. On the second, she runs it alone and you review only the PR.
4. **Keep a record of the sample-run prompts and inputs** (for example, in the PR description). Later status upgrades or audits can then be reproduced.
5. **Add a "copy categories from taxonomy.ts" note** to `_template.yaml`, so the most common mistake is prevented at the source.

---

## 12. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Status or score inflation | Users trust an agent more than the evidence supports, which damages the archive's credibility | The Step 6 gate, the reviewer checklist, and `check:data` enforcement for `tested`/`expert` |
| Fabricated or non-fresh sample runs | Same as above, and harder to detect | Require fresh chats and real inputs. The reviewer spot-checks for specificity. |
| New owner unfamiliar with the codebase | Hand-editing generated files, or wandering out of scope into code | Explicit "never edit generated" rule and out-of-scope exceptions (E3, E4) |
| A single reviewer pool | PRs stall if no other maintainer is available | Agree on a review turnaround target (for example, 3 business days) and a backup reviewer |
| A deploy silently not happening (CI red on `main`) | The agent merges but never goes live | Checkpoint 11 requires checking the live URLs, not just that the merge happened |

---

## 13. Next actions

| # | Action | Owner |
|---|---|---|
| 1 | Confirm or correct assumptions A1–A7 | You (current maintainer) |
| 2 | Grant Seoyeon repo permissions and confirm the branch protection settings | You |
| 3 | Walk Seoyeon through `content/agents/_template.yaml`, `src/data/taxonomy.ts`, and the verification levels in CONTRIBUTING.md (about 30 minutes) | You and Seoyeon |
| 4 | Seoyeon runs the SOP on the next `accepted` issue, paired with you | Seoyeon |
| 5 | Add a content PR template with the Section 8 checklist | Either maintainer |
| 6 | Revise this SOP after Seoyeon's first two agents, based on where she got stuck | Seoyeon |
