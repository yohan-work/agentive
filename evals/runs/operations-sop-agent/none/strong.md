# SOP: Add a Project-Ready Agent to Agent Archive

| Field | Value |
|---|---|
| Repository | https://github.com/yohan-work/agentive |
| Process owner | Content maintainer (Seoyeon Lee, after the handoff) |
| Reviewer | Any other maintainer (not the author of the PR) |
| Frequency | About 2–4 times per month |
| Typical effort | 1–3 hours per agent, mostly spent on sample runs |
| Last updated | _fill in_ |

---

## 1. Purpose and scope

This SOP covers adding one **project-ready agent** (an agent with install kits) to Agent Archive, from the trigger to checking the live site. The goal is that a maintainer who knows git but not this codebase can do it end to end without asking anyone.

**In scope:** a new agent YAML file, install targets, runbook, evaluation and sample runs, optional Korean use cases, optional starter pack or workflow membership, the PR, and checks after deployment.

**Out of scope:** changes to UI code, the schema, or the taxonomy (adding a new category). If the agent needs one of these, see Exceptions (section 8).

---

## 2. Trigger

Start this SOP when **either** of these happens:

- **T1:** A contributor's "New agent" GitHub issue gets the label `accepted`.
- **T2:** A maintainer decides to promote an existing agent to project-ready (i.e., adding install kits to it).

One trigger = one agent = one branch = one PR. Do not batch several agents into one PR.

---

## 3. Roles

| Role | Who | Responsibilities |
|---|---|---|
| **Owner** (content maintainer) | Seoyeon Lee | Runs every step, does the sample runs, opens the PR, checks the site after deployment, closes the issue. |
| **Reviewer** | Any other maintainer | Reviews the PR against the checklist in section 7. Pays most attention to verification status and scores. Approves or requests changes. |
| **Contributor** (T1 only) | Issue author | Supplies the prompt, example input and output, and any tool runs they did. Answers questions on the issue. |

**Escalation:** if the owner and reviewer disagree on the verification status or on whether an agent is ready, the lower status wins until the question is settled on the issue.

---

## 4. Inputs

Before you start, make sure you have:

- [ ] The accepted issue (T1) or a short written note on why you are promoting the agent (T2). Put that note in the PR description.
- [ ] The agent's prompt text, plus at least one **real** example input.
- [ ] Access to at least one AI tool (Codex, Claude, or Cursor) for sample runs. Use a fresh chat for each run.
- [ ] A local clone of the repo with `main` up to date and `npm install` done.
- [ ] Any sample runs the contributor already did (their input, their output, and which tool they used), if available.

---

## 5. Outputs

When you finish, these should exist:

1. `content/agents/<slug>.yaml`, which is complete, valid, and installable.
2. (Optional) Edits to `src/data/starter-packs.ts` and/or `src/data/workflows.ts`.
3. A merged PR titled `feat(content): add <slug> agent` that links the issue.
4. Live pages that load correctly:
   - `https://yohan-work.github.io/agentive/en/agents/<slug>`
   - `https://yohan-work.github.io/agentive/ko/agents/<slug>`
   - `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md` (returns HTTP 200)
5. The issue is closed with a link to the live page.

---

## 6. Procedure

Each step ends with a **Checkpoint**. Don't go on to the next step until the checkpoint passes.

### Step 1: Create the branch

```bash
git checkout main && git pull
git checkout -b content/<slug>
```

Choose the slug now:
- Use kebab-case (`lowercase-words-with-hyphens`). Keep it short and descriptive.
- It must be unique. Check: `ls content/agents/ | grep <slug>`.
- For T2 (promotion), keep the existing slug. **Never rename an existing slug**, because that breaks live URLs.

**Checkpoint:** you are on `content/<slug>`, and no other file in `content/agents/` uses that slug.

### Step 2: Create the agent file

- **T1 (new agent):** `cp content/agents/_template.yaml content/agents/<slug>.yaml`
- **T2 (promotion):** edit the existing `content/agents/<slug>.yaml`. Don't copy the template.

**Checkpoint:** the file exists, and its name matches the slug exactly.

### Step 3: Fill in the core metadata

Fill in every field below. Don't leave any placeholder text from the template.

| Field | Notes |
|---|---|
| `name` | Human-readable title. |
| `summary` | One sentence. |
| `description` | A short paragraph: what it does, for whom, and when to use it. |
| `roles` | Who uses it. |
| `categories` | **Each value must exist in `src/data/taxonomy.ts`.** Copy and paste the slugs from that file. Don't type them. |
| `tags` | Free-form keywords. |
| `tools` | The AI tools it works with. |
| `difficulty` | Use the allowed values shown in the template or schema. |
| `automationLevel` | An integer from 1 to 5. |
| `prompt` | The full prompt text. |
| `inputs` / `outputs` | What the user provides and what the agent produces. |
| `exampleInput` | A realistic input. Not lorem ipsum. |
| `limitations` | Where the agent fails or shouldn't be used. |
| `updatedAt` | **Today's date**, `YYYY-MM-DD`. Don't leave the template date. |

**Checkpoint:** `npm run check:data` passes. (It catches duplicate slugs, unknown categories, and missing required fields early, so you don't find them only at the end.)

### Step 4: Add the install sections

These sections make the agent "project-ready":

- **`installTargets`:** `codex`, `claude`, `cursor`. Include only the targets you have reason to believe work.
- **`runbook`:**
  - context to prepare before using the agent
  - an example of good input
  - an example of bad input (and why it's bad)
  - an output checklist the user can check the result against
- **`evaluation`:**
  - `criteria`: what a good output must do
  - `qualityScore`: 1–5 (set it in Step 6, after the sample runs)
  - known weaknesses
  - `sampleRuns`: filled in Step 5

**Checkpoint:** all three sections are present and contain no placeholder text.

### Step 5: Do the sample runs

For each run:
1. Open a **fresh** chat in the AI tool (no earlier context, no custom instructions that would affect the result).
2. Paste the agent's `prompt` plus a **real** input. Don't use the `exampleInput` for every run. Vary the inputs.
3. Judge the output against the `evaluation.criteria` and the runbook output checklist.
4. Record a `sampleRuns` entry: the input, an output summary, a verdict, and the tool used.

Record every run you did, including failures. A failed run is useful data and belongs under known weaknesses. Don't leave it out to improve the score.

How many runs:
- `community`: at least 1 real run.
- `tested` / `expert`: **at least 2 recorded sample runs** (`check:data` rejects fewer).

**Checkpoint:** every recorded run actually happened, and each has a real input and a real verdict.

### Step 6: Set the verification status and score

Use the **lowest** status that the evidence supports:

| Status | Requirement |
|---|---|
| `unverified` | Default. No real run is recorded. |
| `community` | Run by the contributor (or you) with at least one AI tool. The example output is real. |
| `tested` | An evaluation with **2 or more** recorded sample runs. |
| `expert` | An evaluation with 2 or more recorded sample runs, **plus** the additional expert review described in CONTRIBUTING.md. |

Set `qualityScore` from the sample-run verdicts, not from how promising the prompt looks.

> **Rule: never set the status or the scores higher than what was actually tested.** If in doubt, go one level lower and write in the PR why.

**Checkpoint:** you can point to the specific recorded runs that justify the status and the score.

### Step 7: (Optional) Add Korean realUseCases

If you can, add Korean `realUseCases`. Leave the section out rather than filling it with a low-quality machine translation.

**Checkpoint:** if you added it, it reads naturally in Korean.

### Step 8: (Optional) Add the agent to a starter pack or workflow

Do this only if the agent clearly belongs in one:
- Starter pack: `src/data/starter-packs.ts`
- Workflow: `src/data/workflows.ts`

Reference the agent **by its exact slug**.

**Checkpoint:** `npm run check:data` still passes, so the references resolve.

### Step 9: Run the local checks

Run all five in this order:

```bash
npm run check:data
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run content` (bundling) runs automatically before build, typecheck, and test. You don't need to run it yourself.

Then check `git status`. The generated bundle `src/data/generated/agents.ts` must **not** show up as a manual edit you made. It is build output. Never edit it by hand. If your diff contains hand edits to it, discard them (`git checkout -- src/data/generated/`).

**Checkpoint:** all five commands exit with no errors, and your diff contains only the files you meant to change.

### Step 10: Open the PR

```bash
git add content/agents/<slug>.yaml [src/data/starter-packs.ts src/data/workflows.ts]
git commit -m "feat(content): add <slug> agent"
git push -u origin content/<slug>
```

- PR title: `feat(content): add <slug> agent`
- PR description:
  - `Closes #<issue>` (T1), or your promotion note (T2)
  - the chosen `verifiedStatus`, and which sample runs justify it
  - the tools used for the sample runs
  - any known weaknesses the reviewer should know about
- Request a review from another maintainer.

**Checkpoint:** CI is green on the PR, and a reviewer is assigned.

### Step 11: Review and merge

The reviewer uses the quality checklist (section 7). Once it is approved and CI is green, merge.

**Checkpoint:** the PR is merged, and CI on `main` passes.

### Step 12: Check the live site

The Deploy workflow publishes to GitHub Pages **only if CI passes on `main`**. Wait for Deploy to finish, then check:

- [ ] `https://yohan-work.github.io/agentive/en/agents/<slug>`: the page renders, and the metadata and status are correct
- [ ] `https://yohan-work.github.io/agentive/ko/agents/<slug>`: the page renders
- [ ] `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`: returns **200**

  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md
  ```
- [ ] The kit files for the other install targets also load, if the site publishes them

**Checkpoint:** everything above passes. Close the issue with a link to the live page.

---

## 7. Quality checks

### Quality bar (all must be true)

1. All five commands pass locally **and** in CI.
2. The kit URLs return HTTP 200.
3. No status inflation: `verifiedStatus` and `qualityScore` match the recorded evidence.

### Reviewer checklist

- [ ] The slug is kebab-case, unique, and matches the file name. An existing slug was not renamed.
- [ ] The categories are copied exactly from `src/data/taxonomy.ts`.
- [ ] `updatedAt` is the date of this change, not the template date.
- [ ] No placeholder or template text remains.
- [ ] The runbook has context, good input, bad input, and an output checklist.
- [ ] The `sampleRuns` entries look real (specific inputs, specific verdicts), not invented.
- [ ] `tested`/`expert` has 2 or more sample runs. `community` has at least 1 real run.
- [ ] The score is consistent with the verdicts. Failures are listed as weaknesses.
- [ ] There are no hand edits to `src/data/generated/`.
- [ ] If a UI string was added, it exists in **both** the `en` and `ko` dictionaries (and see Exceptions, section 8).
- [ ] The PR title follows Conventional Commits and links the issue.

### Common mistakes (check these first)

| Mistake | How to catch it | Fix |
|---|---|---|
| Typo in a category slug | `check:data` fails | Copy the slug from `taxonomy.ts` |
| `updatedAt` left as the template date | Reviewer checklist | Set it to today |
| `tested` with only 1 sample run | `check:data` fails | Do another real run, or lower the status to `community` |
| Hand edit to `src/data/generated/agents.ts` | `git status` / diff | Revert it. Edit the YAML instead |
| New UI string missing in `ko` | Reviewer checklist / pages | Add it to both `en` and `ko` |

---

## 8. Exceptions

| Situation | What to do |
|---|---|
| **Needed category doesn't exist** | Don't invent one. Pick the closest existing category, or open a separate PR to change the taxonomy, reviewed on its own. Merge that first. |
| **Slug already taken** | Pick a more specific slug. If it's really the same agent, treat it as T2 (promotion) instead. |
| **You can't get 2 good runs** | Ship it as `community` (if at least one real run exists) or `unverified`. Record the weaknesses. Don't retry until you get a pass and then report only the passes. |
| **Contributor's output can't be reproduced** | Record your own run as it happened. Lower the status. Ask on the issue. |
| **Agent needs a new UI string or code change** | This is outside this SOP. Split it into a separate PR (`feat:`/`fix:`), add the string to both `en` and `ko`, and get a normal code review. |
| **Contributor unresponsive for more than 14 days** | Comment on the issue. Either ship with what you can verify yourself, or remove `accepted` and park it. |
| **A check fails and you don't understand why** | Don't bypass it or edit generated files. Post the error output on the PR and ask the reviewer. |
| **CI green on the PR but red on `main` after merge** | Deploy will not run. Fix forward with a follow-up PR, or revert (section 9). |
| **Kit URL returns 404 after a green deploy** | Wait a few minutes and hard-refresh (Pages caching). If it still fails, check that `installTargets` is set and that the Deploy run finished. Then escalate to the other maintainer. |

---

## 9. Rollback

Use this when a merged agent is broken, wrong, or has an inflated status.

1. On GitHub, click **Revert** on the merged PR. Or run it locally:
   ```bash
   git checkout main && git pull
   git checkout -b revert/<slug>
   git revert -m 1 <merge-commit-sha>   # use `git revert <sha>` for squash merges
   git push -u origin revert/<slug>
   ```
2. Open the revert PR, titled `revert: add <slug> agent`, and explain why.
3. Merge it once CI is green. Pages redeploys on the next green CI run on `main`.
4. Check that `/en/agents/<slug>` and the kit URL no longer serve the reverted content.
5. Reopen the issue (T1) with an explanation. Then fix it on a new branch and start this SOP again.

**If only the status or score is wrong:** you don't need a full revert. Open a small PR that lowers `verifiedStatus`/`qualityScore` and updates `updatedAt`.

---

## 10. Quick checklist (copy into the PR)

```markdown
- [ ] Branch `content/<slug>`; slug unique, kebab-case
- [ ] Metadata complete; categories from taxonomy.ts; updatedAt = today
- [ ] installTargets, runbook, evaluation filled
- [ ] Sample runs real and recorded (≥2 for tested/expert)
- [ ] verifiedStatus / qualityScore match evidence
- [ ] (opt) ko realUseCases; starter pack / workflow refs
- [ ] check:data, lint, typecheck, test, build all pass
- [ ] No edits to src/data/generated/
- [ ] PR title `feat(content): add <slug> agent`, issue linked
- [ ] After deploy: /en, /ko pages OK; kits/<slug>/AGENTS.md → 200
```

---

### Open questions for you (to settle before the handoff)

1. **What separates `tested` from `expert`?** Your notes only give the shared requirement of 2 or more runs. Seoyeon will need the extra criterion for `expert` spelled out.
2. **Does a promotion (T2) require new sample runs**, or can existing recorded runs count?
3. **Which kit files exist for each target** besides `AGENTS.md` (for example, a Claude- or Cursor-specific file)? If you list them, Step 12 can check them all.
4. **Merge method** (squash or merge commit). This changes the revert command in section 9.
5. **Should Seoyeon get the permissions to add labels and merge** before the handoff, so she isn't blocked?
