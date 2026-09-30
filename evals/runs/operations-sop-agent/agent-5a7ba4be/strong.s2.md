# SOP: Add a project-ready agent to Agent Archive

**Repository:** https://github.com/yohan-work/agentive
**Frequency:** about 2–4 per month
**Written for:** a maintainer who knows git but not this codebase

Your notes cover most of what the SOP needs, so I wrote it without asking questions first. Anything your notes don't specify is marked [TBD: …]. Please fill those in before you hand this over.

---

## 1. Trigger, owner, and roles

**The SOP starts when either of these happens:**
- A contributor's GitHub issue of type "New agent" gets the label `accepted`, or
- A maintainer decides to promote an existing agent to project-ready (one with install kits).

| Role | Who | Does | Approves |
|---|---|---|---|
| Content maintainer (owner) | Currently Yohan Choi; handing off to Seoyeon Lee | Runs every step below and opens the PR | Nothing alone. Needs a reviewer |
| Reviewer | Any other maintainer | Reviews the PR, checks the verification status against the recorded sample runs, and merges | PR merge; the final `verifiedStatus` |
| Contributor (issue path only) | The issue author | Supplies the agent's prompt, an example, and their real run if they claim `community` | — |
| Policy owner | [TBD: who decides when a case is not covered by CONTRIBUTING.md, e.g. licensing of contributed content or a disputed status] | Rules on cases this SOP doesn't cover | Exceptions marked "policy owner" below |

---

## 2. Before you start

**Access**
- [ ] Write access to `yohan-work/agentive`, or the ability to push a branch and open a PR. [TBD: confirm whether Seoyeon works on the main repo or on a fork]
- [ ] Permission to add labels and link issues. [TBD: confirm which GitHub role grants this]
- [ ] At least one AI tool for the sample runs (Codex, Claude, or Cursor, the same targets as `installTargets`).

**Local setup**
- [ ] A clone of the repo with dependencies installed. [TBD: the Node version and the install command, e.g. `npm ci` or `npm install`. Take them from the README or CONTRIBUTING.md]
- [ ] You can run `npm run check:data` on a clean `main` and it passes. If it fails on a clean `main`, stop. The problem is on `main`, not in your change. See Exceptions.

**Inputs**
- [ ] The issue number (issue path), or the slug of the existing agent you're promoting (promotion path).
- [ ] The agent's prompt and at least one **real** input you can use for the sample runs. Don't make one up if the issue doesn't supply one. Ask the contributor.
- [ ] CONTRIBUTING.md open, at the verification levels section.
- [ ] `src/data/taxonomy.ts` open, so you can copy category slugs from it.

**Outputs of this SOP**
- `content/agents/<slug>.yaml` with metadata, install targets, a runbook, and an evaluation.
- Optionally, edits to `src/data/starter-packs.ts` and/or `src/data/workflows.ts`.
- A merged PR titled `feat(content): add <slug> agent`, linked to the issue.
- A live agent page in English and Korean, plus a kit at `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md` that returns HTTP 200.

---

## 3. Steps

### A. Branch and file

**1. Pick the slug.** It must be kebab-case (lowercase words joined by `-`, e.g. `release-notes-writer`) and unique.
Run: `ls content/agents/ | grep -i '<slug>'`
**Check:** there's no output. If a file with that slug already exists and you're not promoting it, choose a different slug. `check:data` fails on duplicates, but it's cheaper to find out now.

**2. Update `main` and create the branch.**
```
git checkout main
git pull
git checkout -b content/<slug>
```
**Check:** `git branch --show-current` prints `content/<slug>`.

**3. Create the agent file.**
- **New agent:** `cp content/agents/_template.yaml content/agents/<slug>.yaml`
- **Promotion:** don't copy the template. Edit the existing `content/agents/<slug>.yaml` and add the sections from step 5 onward.

**Check:** `git status` shows `content/agents/<slug>.yaml` as new (or modified, for a promotion), and nothing else.

> **Never edit `src/data/generated/agents.ts`.** It's build output that `npm run content` regenerates from the YAML files. A hand edit either disappears on the next build or makes the generated file disagree with the source. The check that catches it is in step 17.

### B. Metadata

**4. Fill in the base metadata** in `content/agents/<slug>.yaml`:

| Field | What to put | Common failure |
|---|---|---|
| `name` | Display name | — |
| `summary` | One line | — |
| `description` | A paragraph | — |
| `roles` | Who uses the agent | [TBD: the allowed values, if any. Check the template or taxonomy] |
| `categories` | **Only slugs that exist in `src/data/taxonomy.ts`**, copied from that file, not typed from memory | A typo such as `code-reveiw` |
| `tags` | Free-text keywords | — |
| `tools` | The tools the agent uses | — |
| `difficulty` | [TBD: the allowed values. Check the template] | — |
| `automationLevel` | An integer from 1 to 5 | Values outside 1–5, or a string instead of a number |
| `prompt` | The full agent prompt | — |
| `inputs`, `outputs`, `exampleInput` | As in the template | An `exampleInput` that isn't a real input |
| `limitations` | Known limits | — |
| `updatedAt` | **Today's date, `YYYY-MM-DD`** | The date copied from the template is left unchanged |

**4a. Category check** (common mistake: a typo in a category slug).
For each category you entered, run:
`grep -n '<category-slug>' src/data/taxonomy.ts`
**Check:** every category returns at least one match. If one returns nothing, you have a typo or a category that doesn't exist. Fix the slug. Don't add a category to the taxonomy without asking; see Exceptions. [TBD: confirm whether `check:data` also rejects unknown categories. If it doesn't, this grep is the only check.]

**4b. Date check** (common mistake: `updatedAt` left at the template's date).
Run `date +%F` and `grep -n 'updatedAt' content/agents/<slug>.yaml`.
**Check:** the two dates are the same.

### C. Install kit sections (what makes the agent "project-ready")

**5. Add `installTargets`** with the targets the agent supports: `codex`, `claude`, and/or `cursor`.
**Check:** list only targets you or the contributor actually ran it on, or that the reviewer agrees are supported. [TBD: whether all three are required for "project-ready", or at least one]

**6. Add `runbook`** with four parts:
- context to prepare
- a good input
- a bad input
- an output checklist

**Check:** all four are present and none still holds template text.

### D. Sample runs and evaluation

**7. Do the sample runs.** For each run:
1. Open a **fresh** chat in the AI tool, with no earlier conversation.
2. Paste the agent's `prompt` and then one **real** input.
3. Record three things in `evaluation.sampleRuns`: the input, a summary of the output, and a verdict.

**Check:** every entry in `sampleRuns` matches a run you actually did. Don't write an entry for a run that didn't happen.

**8. Fill in the rest of `evaluation`:** `criteria`, `qualityScore` (1–5), and `known weaknesses`.
**Check:** `qualityScore` reflects what the sample runs showed, not what you expect the agent could do.

**9. Set `verifiedStatus`.** Use the lowest status the evidence supports:

| Status | Requires |
|---|---|
| `unverified` | The default. Use it when nothing has been run |
| `community` | The contributor ran it in at least one AI tool, and the example output is real |
| `tested` or `expert` | An evaluation with **at least 2** recorded sample runs |

**9a. Status check** (common mistake: `tested` with only 1 sample run).
Count the entries under `sampleRuns`.
**Check:** if the status is `tested` or `expert`, there are 2 or more entries, and each one is a run that really happened. `check:data` rejects fewer than 2, but it can't tell whether a run was real. That part is your job and the reviewer's.
If you're unsure between two statuses, choose the lower one and write the question in the PR description for the reviewer. Don't raise the status or the scores above what was tested.
[TBD: what separates `expert` from `tested`. Copy the definition from CONTRIBUTING.md here]

**10. (Optional) Add Korean `realUseCases`** if you have real Korean use cases.
**Check:** leaving the section out is fine. If you add it, the cases must be real.

### E. Starter packs and workflows (only if needed)

**11. Decide whether the agent belongs in a starter pack or a workflow.** [TBD: who decides and on what basis. The reviewer, or the issue?]
If it does, edit `src/data/starter-packs.ts` and/or `src/data/workflows.ts` and add the agent by its slug.
**Check:** the slug you added matches the file name `<slug>` exactly. [TBD: confirm that `check:data` validates these references]

**12. New UI strings (rare).** If your change adds a new UI string, add the key to **both** the English and the Korean dictionary. [TBD: the path of the dictionary file]
**Check:** search for the new key. It should appear once in the `en` section and once in the `ko` section. Common mistake: `en` only, so Korean pages show a missing string.

### F. Local verification

**13. Run the five commands in this order.** `npm run content` (bundling) runs automatically before build, typecheck, and test.
```
npm run check:data
npm run lint
npm run typecheck
npm test
npm run build
```
**Check:** each command exits without errors. If one fails, fix the cause and **rerun all five from the start**. A fix for one can break another.

| If this fails | Likely cause |
|---|---|
| `check:data` | A duplicate slug, a missing required field, or `tested`/`expert` with fewer than 2 sample runs |
| `typecheck`/`build` | A syntax error in the YAML, or a wrong slug in `starter-packs.ts`/`workflows.ts` |

**14. Preview the page locally.** [TBD: the preview command, e.g. `npm run dev`, and its URL]
Open `/en/agents/<slug>` and `/ko/agents/<slug>`.
**Check:** both pages load and show the name, summary, and install targets.

### G. PR

**15. Commit and push.**
```
git add content/agents/<slug>.yaml   # plus starter-packs.ts / workflows.ts / the dictionary if you edited them
git commit -m "feat(content): add <slug> agent"
git push -u origin content/<slug>
```
**Check:** the push succeeds and GitHub offers a link to open a PR.

**16. Open the PR.**
- Title: `feat(content): add <slug> agent`
- Description: include `Closes #<issue-number>` on the issue path, the chosen `verifiedStatus` and why, the number of sample runs, and any questions for the reviewer.
- Ask another maintainer for review.

**Check:** the issue shows the PR as linked, and CI starts on the PR.

**17. Check what the PR changes** (common mistake: a hand edit to the generated file).
Run: `git diff --name-only main...HEAD`
**Check:** the list contains **no** `src/data/generated/` paths. If one appears, revert it with `git checkout main -- src/data/generated/`, commit, and push.

**18. Wait for CI.**
**Check:** all CI checks on the PR are green. If one is red and it passed locally, see Exceptions.

**19. Review and merge.** The reviewer checks the following, then merges:
- `verifiedStatus` and `qualityScore` match the recorded `sampleRuns`.
- `categories` exist in the taxonomy.
- `updatedAt` is the date the work was done.
- No files under `src/data/generated/` changed.

**Check:** the PR shows as merged and the issue closes.

### H. After the merge

**20. Watch CI on `main`, then Deploy.** The Deploy workflow publishes to GitHub Pages only if CI passes on `main`.
**Check:** on the repo's Actions tab, both CI and then Deploy show a green run for the merge commit.

**21. Check the published pages and the kit.** The site's base is `https://yohan-work.github.io/agentive/`.
```
curl -sI https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md | head -1
```
**Check:**
- The `curl` command prints a line with `200`.
- `https://yohan-work.github.io/agentive/en/agents/<slug>` opens in a browser.
- `https://yohan-work.github.io/agentive/ko/agents/<slug>` opens in a browser.

If you get a 404 right after Deploy finishes, wait a few minutes and try again. [TBD: how long to wait before treating it as a failure]

---

## 4. Exceptions

| Situation | What to do | Who decides |
|---|---|---|
| The issue has no real input for sample runs | Ask the contributor in the issue. Until one arrives, keep the status at `unverified`, or wait | Content maintainer |
| The contributor claims `community` but there's no real example output | Set `unverified` and ask in the issue for the real output | Content maintainer; the reviewer confirms |
| You're unsure between `tested` and `expert`, or between `community` and `tested` | Choose the lower status and write the question in the PR | Reviewer |
| The agent needs a category that isn't in `taxonomy.ts` | Don't add it yourself. Raise it in the issue or the PR | [TBD: who approves a new category] |
| `check:data` or another command fails on a clean `main` before you change anything | Stop and report it to the other maintainers. Don't fix it on your content branch | [TBD: who fixes a broken `main`] |
| CI fails but everything passed locally | Compare your Node version with the one CI uses, and read the CI log. If it's still unclear, ask the reviewer | Reviewer |
| Deploy doesn't run after the merge, or the kit URL doesn't return 200 after [TBD: wait time] | Check the Deploy workflow log. If CI on `main` is red, deploy was skipped, so fix CI first | [TBD: who owns GitHub Pages and Deploy] |
| Doubts about contributed content: licence, copyright, or whether it may be published | Don't merge. Hand the case to the policy owner with a link to the issue | Policy owner [TBD] |
| A case this SOP doesn't cover | Stop, write down what happened in the issue or PR, and ask | Content maintainer; policy owner if it's a policy question |

This list covers the cases known so far. It isn't complete. For anything not listed, stop and ask.

---

## 5. Done when

**Done when** all of these are true:
- [ ] The PR `feat(content): add <slug> agent` is merged and the issue is closed (issue path).
- [ ] All five commands passed locally, and CI passed on the PR and on `main`.
- [ ] Deploy is green.
- [ ] `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md` returns 200.
- [ ] `/en/agents/<slug>` and `/ko/agents/<slug>` both load.
- [ ] `verifiedStatus` and `qualityScore` are no higher than the recorded sample runs support.
- [ ] No hand edits under `src/data/generated/`.

**Rollback** (for example, the agent went live with an inflated status, or it broke the site):
1. On the merged PR, click **Revert** in GitHub to create a revert PR. Alternatively, run `git revert <merge-commit>` on a new branch and open a PR from it.
2. Let CI pass on that PR, then merge it. [TBD: whether a revert PR also needs a reviewer]
3. Pages redeploys on the next green CI on `main`.

**Check:** the kit URL no longer returns 200 (or the previous version is back), and `/en/agents/<slug>` is gone or shows the previous state.

If the agent came from an issue, reopen the issue or leave a comment explaining why.

---

## Optional improvements
- A PR template containing this checklist (status, sample runs, categories, date, no generated files).
- A `check:data` rule that validates `updatedAt` against the date (e.g. not in the future and not the template's date).
- A CI step that checks after Deploy that the kit URLs return 200.
- A `check:data` rule that rejects unknown categories, if it doesn't already.
