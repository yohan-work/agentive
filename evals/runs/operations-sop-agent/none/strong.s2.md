# SOP: Add a Project-Ready Agent to Agent Archive

| Field | Value |
|---|---|
| Repository | https://github.com/yohan-work/agentive |
| Process owner | Content maintainer (currently: you → handing off to **Seoyeon Lee**) |
| Reviewer | Any other maintainer (must not be the author of the PR) |
| Frequency | ~2–4 per month |
| Typical effort | 1–3 hours per agent, most of it in sample runs |
| Last reviewed | _fill in_ |

---

## 1. Purpose

Add a new **project-ready** agent (an agent with install kits for Codex, Claude, and Cursor) to Agent Archive, or promote an existing agent to project-ready, so that it:

- passes all repository checks locally and in CI,
- publishes working pages and kit files on GitHub Pages,
- carries a verification status and scores that are **no higher than what was actually tested**.

## 2. Trigger

Start this SOP when either of these happens:

| Trigger | Source of truth |
|---|---|
| **A. New contribution** — a "New agent" GitHub issue receives the `accepted` label | The issue (use its text as the input spec) |
| **B. Promotion** — a maintainer decides an existing agent should become project-ready | The existing `content/agents/<slug>.yaml` file |

Do **not** start for issues without the `accepted` label. If you're unsure whether an issue is accepted, ask in the issue before starting.

## 3. Roles

| Role | Responsibilities |
|---|---|
| **Content maintainer (owner)** | Creates the branch, writes the YAML, runs sample runs, runs all checks, opens the PR, verifies the deploy, closes the issue. |
| **Reviewer** (any other maintainer) | Reviews the PR against the checklist in §8, specifically checking status/score honesty and sample-run evidence. Approves or requests changes. |
| **Contributor** (Trigger A only) | Answers questions on the issue; may supply real example inputs/outputs. |

## 4. Inputs

Before you start, have these ready:

- [ ] The accepted issue link (Trigger A) or the existing agent's slug (Trigger B)
- [ ] The agent's prompt and intended use (from the issue or the existing file)
- [ ] At least **one real input** for a sample run — **two or more** if you intend to set `tested` or `expert`
- [ ] Access to at least one AI tool (Codex, Claude, or Cursor, or their chat equivalents) to run sample runs in a **fresh chat**
- [ ] A local clone of the repo with dependencies installed (`npm install`) and `main` up to date
- [ ] The list of valid category slugs in `src/data/taxonomy.ts` (open it; don't guess)

## 5. Outputs

When done, all of the following exist:

- [ ] `content/agents/<slug>.yaml` (new or updated) with metadata, `installTargets`, `runbook`, and `evaluation`
- [ ] Optional: edits to `src/data/starter-packs.ts` and/or `src/data/workflows.ts`
- [ ] A merged PR titled `feat(content): add <slug> agent` that links the issue
- [ ] Live pages (HTTP 200):
  - `https://yohan-work.github.io/agentive/en/agents/<slug>/`
  - `https://yohan-work.github.io/agentive/ko/agents/<slug>/`
  - `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`
- [ ] The issue closed with a link to the live page

## 6. Procedure

Each step ends with a **Checkpoint**. Don't move to the next step until the checkpoint is true.

### Step 1 — Create a branch

```bash
git checkout main
git pull
git checkout -b content/<slug>
```

- **Slug rules:** kebab-case (lowercase letters, digits, hyphens), unique across `content/agents/`.
- Check uniqueness before you commit to a name:
  ```bash
  ls content/agents/ | grep -i "<slug>"
  ```
- For Trigger B, use the **existing** slug. Never rename a slug during promotion, because that would break existing URLs.

**Checkpoint:** You are on `content/<slug>`, branched from an up-to-date `main`, and the slug isn't already taken (Trigger A).

### Step 2 — Create or open the agent file

- **Trigger A:** `cp content/agents/_template.yaml content/agents/<slug>.yaml`
- **Trigger B:** open the existing `content/agents/<slug>.yaml`.

> ⚠ Never edit `src/data/generated/agents.ts`. It's build output, regenerated from the YAML files, and your changes there will be overwritten.

**Checkpoint:** `content/agents/<slug>.yaml` exists, and you haven't touched anything under `src/data/generated/`.

### Step 3 — Fill in the core metadata

Fill every field below. Copy wording from the issue where possible, but rewrite it into clear, neutral English.

| Field | Notes |
|---|---|
| `name` | Human-readable name |
| `summary` | One sentence |
| `description` | A short paragraph: what it does, for whom |
| `roles` | Who uses it |
| `categories` | **Must exactly match slugs in `src/data/taxonomy.ts`.** Copy-paste them; don't type from memory. |
| `tags` | Free-form, lowercase |
| `tools` | Tools the agent works with |
| `difficulty` | As defined in the template |
| `automationLevel` | Integer **1–5** |
| `prompt` | The full agent prompt |
| `inputs` / `outputs` | What the user provides / what the agent returns |
| `exampleInput` | A realistic example |
| `limitations` | Be honest about what it doesn't do well |
| `updatedAt` | **Today's date**, `YYYY-MM-DD`. Don't leave the template's date. |

**Checkpoint:** No template placeholder text remains, `updatedAt` is today, and each category was copied from `taxonomy.ts`.

### Step 4 — Add the project-ready sections

These three sections are what make an agent "installable":

1. **`installTargets`:** `codex`, `claude`, `cursor`.
2. **`runbook`:**
   - context to prepare,
   - an example of good input,
   - an example of bad input,
   - an output checklist.
3. **`evaluation`:**
   - `criteria`,
   - `qualityScore` (1–5, filled in after Step 5),
   - known weaknesses,
   - `sampleRuns` (filled in during Step 5).

**Checkpoint:** All three sections are present. `qualityScore` and `sampleRuns` may stay provisional until Step 5 is done.

### Step 5 — Run and record sample runs

For **each** sample run:

1. Open a **fresh chat** in an AI tool, with no prior context.
2. Paste the agent's `prompt`, followed by a **real** input. Not a made-up toy input.
3. Read the full output and judge it against the `evaluation.criteria` and the runbook's output checklist.
4. Record one entry in `sampleRuns` containing:
   - the input,
   - an output summary,
   - a verdict (did it meet the criteria? where did it fall short?).
5. Add any new weaknesses you saw to known weaknesses and/or `limitations`.

Then set `qualityScore` based **only** on what you observed in these runs.

**Checkpoint:** Every `sampleRuns` entry corresponds to a run that actually happened. You can point to the chat or output if the reviewer asks.

### Step 6 — Set `verifiedStatus`

Pick the **highest level your evidence supports, and no higher**:

| Status | Requirement |
|---|---|
| `unverified` | Default. No real runs recorded. |
| `community` | Run by the contributor with at least one AI tool; example output is real. |
| `tested` | An `evaluation` with **at least 2 recorded sample runs**. |
| `expert` | An `evaluation` with **at least 2 recorded sample runs** (plus whatever additional bar CONTRIBUTING.md defines for expert; check it before using this level). |

`check:data` rejects `tested` or `expert` with fewer than 2 sample runs. But the script can't check honesty. **You** are responsible for that.

> **Rule:** Never set status or scores higher than what was actually tested. If in doubt, choose the lower level.

**Checkpoint:** The status matches the table above, and there are ≥ 2 real `sampleRuns` if the status is `tested`/`expert`.

### Step 7 — (Optional) Add Korean real use cases

If you can, add Korean `realUseCases`. This is optional. Skipping it doesn't block the PR.

**Checkpoint:** Either Korean `realUseCases` are added, or you consciously skipped them (mention it in the PR description).

### Step 8 — (If applicable) Add to starter packs or workflows

If the agent belongs in a starter pack or workflow, edit:

- `src/data/starter-packs.ts`
- `src/data/workflows.ts`

Reference the agent by its exact slug.

If your change adds **any new UI string** (uncommon for a content-only change), add the key to **both** the `en` and `ko` dictionaries in `src/i18n/dictionaries.ts`.

**Checkpoint:** Every slug referenced in these files exists, and any new UI string exists in both `en` and `ko`.

### Step 9 — Run all checks locally

Run all five, in this order, and fix any failures before continuing:

```bash
npm run check:data
npm run lint
npm run typecheck
npm test
npm run build
```

Content bundling (`npm run content`) runs automatically before build/typecheck/test. You don't need to run it separately.

Common failures and fixes:

| Failure | Likely cause | Fix |
|---|---|---|
| `check:data`: unknown category | Category slug typo | Copy the slug from `src/data/taxonomy.ts` |
| `check:data`: duplicate slug | Slug already in use | Pick a new slug (Trigger A only) |
| `check:data`: status requires evaluation / sample runs | `tested`/`expert` with < 2 sample runs | Add real runs or lower the status |
| Schema error | Missing required field, wrong type (e.g. `automationLevel` outside 1–5) | Compare with `_template.yaml` |
| Unexpected diff in `src/data/generated/` | Generated file was committed or edited by hand | Discard those changes (`git checkout -- src/data/generated/`) |

**Checkpoint:** All five commands pass locally with no errors.

### Step 10 — Commit and open the PR

```bash
git add content/agents/<slug>.yaml   # plus any starter-pack/workflow files
git commit -m "feat(content): add <slug> agent"
git push -u origin content/<slug>
```

Open a PR:

- **Title:** `feat(content): add <slug> agent` (for Trigger B, `feat(content): promote <slug> to project-ready` is clearer. Agree on this with the team.)
- **Description:** include
  - `Closes #<issue>` (Trigger A),
  - chosen `verifiedStatus` and a one-line justification,
  - the number of sample runs and which AI tool(s) were used,
  - whether Korean `realUseCases` were added,
  - any starter-pack/workflow changes.
- **Reviewer:** request any other maintainer.

**Checkpoint:** The PR is open, CI is running, the issue is linked, and a reviewer is assigned.

### Step 11 — Review and merge

- Wait for CI to pass (the same five checks).
- Address reviewer comments. Push fixes to the same branch.
- Merge only when **CI is green and the reviewer has approved**.

**Checkpoint:** The PR is merged into `main`.

### Step 12 — Verify the deploy

After merge, CI runs on `main`. The Deploy workflow publishes to GitHub Pages **only if CI passes on `main`**.

1. In the repo's **Actions** tab, confirm CI on `main` passed and Deploy finished.
2. Check that each URL returns 200 and shows the new agent:
   ```bash
   for u in \
     https://yohan-work.github.io/agentive/en/agents/<slug>/ \
     https://yohan-work.github.io/agentive/ko/agents/<slug>/ \
     https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md
   do
     echo "$(curl -s -o /dev/null -w '%{http_code}' "$u")  $u"
   done
   ```
3. Open the `en` and `ko` pages in a browser and skim them. Confirm the name, status badge, and install kit links look right.
4. Close the issue with a comment linking the live page.

**Checkpoint:** All three URLs return 200, and the issue is closed.

---

## 7. Exceptions

| Situation | What to do |
|---|---|
| Can't get 2 real sample runs | Ship as `community` (if a real run exists) or `unverified`. Don't inflate. Note it in the PR. |
| Sample runs show the agent performs poorly | Record the honest verdicts and a low `qualityScore`, or pause and ask the contributor on the issue to improve the prompt. Don't publish scores you didn't observe. |
| Needed category doesn't exist in `taxonomy.ts` | Don't invent one inside the YAML. Use the closest existing category, or open a separate PR/issue to add the category first and get it reviewed. |
| Slug conflict with an existing agent | Trigger A: choose a different, more specific slug. Trigger B: keep the existing slug. |
| Local checks pass but CI fails | Read the CI log. Usually it's an out-of-date branch or a file you forgot to commit. Rebase on `main`, rerun locally, push. |
| CI on `main` fails after merge | The site won't redeploy (Deploy requires green CI). Fix forward with a new PR, or roll back (§9). |
| Deploy finished but a kit URL returns 404 | Wait a few minutes (Pages caching). If it's still 404, check that `installTargets` is set and the build output includes `kits/<slug>/`. Ask another maintainer if unresolved. |
| No other maintainer is available to review | Don't self-merge. Wait, or ping the maintainers. |
| Change requires new UI strings or code changes beyond content | Out of scope for this SOP. Treat it as a regular code PR and involve another maintainer. |

## 8. Quality checks (reviewer checklist)

The reviewer confirms each item before approving:

- [ ] Branch name is `content/<slug>`. PR title follows Conventional Commits. Issue is linked.
- [ ] Slug is kebab-case and unique (or unchanged, for promotion).
- [ ] All metadata fields filled. No template placeholder text left.
- [ ] `updatedAt` is the PR date, not the template date.
- [ ] Every category exists in `src/data/taxonomy.ts`.
- [ ] `automationLevel` and `qualityScore` are integers from 1 to 5.
- [ ] `installTargets` includes `codex`, `claude`, `cursor`.
- [ ] `runbook` has context, good input, bad input, output checklist.
- [ ] `evaluation` has criteria, score, known weaknesses, sample runs.
- [ ] **No status inflation:** `tested`/`expert` has ≥ 2 real sample runs. The score is consistent with the recorded verdicts.
- [ ] No changes under `src/data/generated/`.
- [ ] Any new UI string exists in both `en` and `ko`.
- [ ] CI is green (all five commands).
- [ ] After merge: all three URLs return 200.

## 9. Rollback

Use when a published agent is wrong, broken, or its status/score turned out to be inflated.

1. On GitHub, open the merged PR and click **Revert**. This creates a revert PR. (CLI alternative: `git revert <merge-commit-sha>` on a new branch, push, open a PR.)
2. Get it reviewed and merge it like any other PR.
3. CI runs on `main`. When it's green, Deploy republishes Pages without the agent.
4. Confirm the agent's pages and kit URL no longer show the reverted content.
5. Comment on the original issue explaining the rollback and next steps. Reopen the issue if the agent should come back after fixes.

> For a minor problem, such as a typo or an overstated status, a **fix-forward PR** (e.g. lowering `verifiedStatus`) is usually better than a full revert.

## 10. Open questions to confirm before handoff

These weren't in the original notes. Settle them with Seoyeon so she doesn't have to guess:

1. What extra bar, if any, separates `expert` from `tested` in CONTRIBUTING.md?
2. PR title for promotions (Trigger B): keep `add`, or use `promote`?
3. Who may apply the `accepted` label? Can Seoyeon accept issues herself?
4. What's the expected turnaround from `accepted` to merged?
5. Where do sample-run transcripts live if a reviewer wants to see them (PR description, gist, nowhere)?
