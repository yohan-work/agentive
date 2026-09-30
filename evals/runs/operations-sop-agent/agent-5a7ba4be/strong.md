# SOP: Add a project-ready agent to Agent Archive

**Repo:** https://github.com/yohan-work/agentive
**Frequency:** roughly 2–4 times per month
**Written for:** a maintainer who knows git but not this codebase

Your notes were enough to write this without asking questions first. I marked each gap with **[TBD: …]**. Fill those in once, and the SOP will run without you.

---

## 1. Trigger, owner, and roles

**This SOP starts when either of these happens:**
- A contributor's **"New agent"** GitHub issue gets the label `accepted`.
- A maintainer decides to **promote an existing agent** to project-ready. See Exception E1; some steps differ.

| Role | Who | Does | Approves |
|---|---|---|---|
| Content maintainer (owner) | Seoyeon Lee (previously: you) | Runs every step below, opens the PR, verifies the deploy | The slug, the categories, and the `verifiedStatus` proposed in the PR |
| Reviewer | Any other maintainer | Reviews the PR against the checklist in Step 17 | Merge. The reviewer must be someone other than the person who opened the PR |
| Contributor | Person who filed the issue | Supplies the agent content and answers questions on the issue | Nothing. They must not set their own status higher than what they actually ran |
| Who applies the `accepted` label | [TBD: which maintainer(s) decide acceptance, and on what criteria] | | |

---

## 2. Before you start

**Access**
- Write access to `yohan-work/agentive`, so you can push branches and open PRs.
- Permission to view Actions runs for the CI and Deploy workflows.
- [TBD: whether branch protection requires reviewer approval before merge, and who is allowed to merge]

**Local setup (one time only)**
- Clone the repo and install dependencies. [TBD: required Node.js version and install command, e.g. whether to use `npm install` or `npm ci`]
- Confirm the five commands run on a clean `main` before you change anything: `npm run check:data`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
  - **Check:** all five exit without errors on `main`. If one fails on an unchanged `main`, stop. That is Exception E6, not your change.

**Inputs for each agent**
- The accepted issue, or for a promotion, the existing `content/agents/<slug>.yaml`.
- The agent's prompt and at least one **real** example input that you can paste into a chat.
- Access to at least one AI tool for the sample runs (Codex, Claude, or Cursor, matching the `installTargets`).
- Today's date in `YYYY-MM-DD` format.

---

## 3. Steps

### Part A: Branch and file

**Step 1. Pick the slug.**
Use the agent's name in kebab-case: lowercase words joined by hyphens, e.g. `release-notes-writer`.
Run `ls content/agents/` and confirm there is no file named `<slug>.yaml`.
- **Mistake this catches:** a duplicate slug. `check:data` fails on it later, after you have already filled in the file.
- **Check:** no file with that name exists, and the slug has no capitals, spaces, or underscores.

**Step 2. Create the branch.**
```bash
git checkout main
git pull
git checkout -b content/<slug>
```
- **Check:** `git branch --show-current` prints `content/<slug>`.

**Step 3. Copy the template.**
```bash
cp content/agents/_template.yaml content/agents/<slug>.yaml
```
- **Check:** `git status` shows exactly one new untracked file, `content/agents/<slug>.yaml`.

### Part B: Metadata

**Step 4. Fill in the core metadata fields** in `content/agents/<slug>.yaml`:
`name`, `summary`, `description`, `roles`, `tags`, `tools`, `difficulty`, `automationLevel`, `prompt`, `inputs`, `outputs`, `exampleInput`, `limitations`.
- `automationLevel` must be an integer from **1 to 5**.
- `exampleInput` must be real input, not a placeholder.
- [TBD: allowed values for `roles`, `difficulty`, and `tools`, and where they are defined, if anywhere]
- **Check:** each field has a value, and no text copied from the template is left behind. Search the file for the template's placeholder wording. [TBD: the placeholder text used in `_template.yaml`, so it can be searched for]

**Step 5. Set `categories`, copying each value from `src/data/taxonomy.ts`.**
Open `src/data/taxonomy.ts` and find the category slugs there. **Copy and paste** each slug rather than typing it.
- **Mistake this catches: a typo in a category slug.** The agent either fails validation or does not appear under the category it should.
- **Check:** for each category you used, `grep -n "<category-slug>" src/data/taxonomy.ts` returns a match. Run this for every category, not just the first one.

**Step 6. Set `updatedAt` to today.**
Write it as `updatedAt: YYYY-MM-DD` with today's date.
- **Mistake this catches: `updatedAt` left as the template date.** The agent looks older than it is, and the error passes every automated check.
- **Check:** `grep updatedAt content/agents/<slug>.yaml` shows today's date. The template file has a different date, so compare against it with `grep updatedAt content/agents/_template.yaml`.

**Step 7. (Optional) Add Korean `realUseCases`.**
Add them if the contributor supplied them or you can write them accurately. Skipping this step does not block the PR.
- **Check:** if you added them, they read as Korean use cases and not as a machine translation of the English summary. The reviewer confirms this.

### Part C: Install kit fields (these make the agent "project-ready")

**Step 8. Add `installTargets`.**
List the tools the kit supports, chosen from `codex`, `claude`, and `cursor`. Only include a target if the agent's instructions make sense in that tool.
- **Check:** each value is exactly `codex`, `claude`, or `cursor`, all lowercase.

**Step 9. Add the `runbook`** with these four parts:
- context to prepare
- a good input example
- a bad input example
- an output checklist

- **Check:** each of the four parts is present and specific to this agent. The good and bad inputs should differ in an observable way, such as a missing field or the wrong scope.

### Part D: Sample runs and verification status

**Step 10. Do the sample runs.**
For each run:
1. Open a **fresh chat** with no earlier context in one of the target tools.
2. Paste the agent's `prompt` and then a **real** input.
3. Record the run in `evaluation.sampleRuns` with the input, a summary of the output, and your verdict.

Do **at least 2 runs** if you intend to propose `tested` or `expert`. Use a different real input for each run. [TBD: whether two runs with the same input count as two runs]
- **Check:** the number of entries under `sampleRuns` equals the number of runs you actually did. Every entry has an input, an output summary, and a verdict.

**Step 11. Fill in the rest of `evaluation`:** `criteria`, `qualityScore` (1–5), and known weaknesses.
- Base `qualityScore` only on what the recorded sample runs showed.
- Known weaknesses must include every failure you saw during the sample runs.
- **Check:** someone could read the sample runs alone and agree with the score. If a verdict was negative, the score and the weaknesses reflect it.

**Step 12. Set `verifiedStatus` using the rules in CONTRIBUTING.md.**

| Status | Allowed only when |
|---|---|
| `unverified` | This is the default. Use it when nothing has been run. |
| `community` | The contributor ran the agent with at least one AI tool, **and** the example output is real. |
| `tested` / `expert` | The agent has an `evaluation` with **at least 2 recorded sample runs**. |

- **Never set status or scores higher than what was actually tested.** If you are unsure, pick the lower status. Your PR proposes the status, and the reviewer makes the final call.
- [TBD: how `tested` differs from `expert`, e.g. who qualifies as an expert reviewer]
- **Mistake this catches: `tested` with only 1 sample run.** `check:data` rejects this. Count the runs yourself before relying on the tool.
- **Check:** if the status is `tested` or `expert`, `sampleRuns` has 2 or more entries. If the status is `community`, the issue or PR shows that the contributor actually ran the agent and the example output is real.

### Part E: Starter packs and workflows (only if they apply)

**Step 13. Add the agent to a starter pack or workflow if it belongs there.**
Edit `src/data/starter-packs.ts` or `src/data/workflows.ts` and reference the agent by its exact slug.
[TBD: who decides whether an agent joins a pack or workflow. Until that is settled, propose it in the PR description and let the reviewer confirm.]
- **Check:** the slug in the `.ts` file matches the YAML file name exactly. Step 14 confirms the reference resolves.

**Step 13a. Only if you added or changed a user-facing UI string:** add it to both the English and the Korean dictionaries. [TBD: path to the dictionary file]
Pure content changes, meaning only the YAML file and pack or workflow entries, usually add no UI strings. In that case skip this step.
- **Mistake this catches: forgetting the `ko` dictionary.** The Korean page shows a missing or English string.
- **Check:** every new key you added under `en` also exists under `ko`, with Korean text.

### Part F: Validate locally

**Step 14. Run all five commands, in this order:**
```bash
npm run check:data
npm run lint
npm run typecheck
npm test
npm run build
```
`npm run content` bundles the agent YAML files. It runs automatically before build, typecheck, and test, so you do not run it yourself.
- **Check:** all five exit without errors. If `check:data` fails, read the message. It names the problem, such as a duplicate slug, a bad reference, or a missing field. Fix it in the YAML file, not somewhere else.

**Step 15. Confirm you did not edit generated files by hand.**
```bash
git status
git diff --name-only main
```
- **Mistake this catches: editing `src/data/generated/agents.ts` by hand.** It is build output. Your edits get overwritten, or they hide a real error in the YAML.
- **Check:** your changes are limited to `content/agents/<slug>.yaml`, plus `src/data/starter-packs.ts`, `src/data/workflows.ts`, and the dictionary file if Steps 13 or 13a applied. If `src/data/generated/` shows up as changed after Step 14, **do not edit it by hand**. [TBD: whether regenerated output under `src/data/generated/` should be committed or discarded with `git restore`]

### Part G: PR and review

**Step 16. Commit, push, and open the PR.**
```bash
git add content/agents/<slug>.yaml   # plus any files from Steps 13/13a
git commit -m "feat(content): add <slug> agent"
git push -u origin content/<slug>
```
Open the PR:
- **Title:** `feat(content): add <slug> agent`. For a promotion, see E1.
- **Description:**
  - a link to the issue [TBD: whether to use `Closes #<n>` to auto-close the issue, or close it manually after deploy]
  - the proposed `verifiedStatus` and why
  - the number of sample runs
  - any starter pack or workflow change
- Request review from another maintainer.
- **Check:** the PR shows the issue link, and CI has started on the PR.

**Step 17. The reviewer checks, before approving:**
- [ ] Every category exists in `src/data/taxonomy.ts` (Step 5).
- [ ] `updatedAt` is the date of the PR, not the template date (Step 6).
- [ ] `verifiedStatus` matches the evidence, and `tested`/`expert` has 2 or more real sample runs (Steps 10–12).
- [ ] `qualityScore` and the weaknesses match the sample-run verdicts (Step 11).
- [ ] No hand edits under `src/data/generated/` (Step 15).
- [ ] Any new UI string exists in both `en` and `ko` (Step 13a).
- [ ] CI is green on the PR.

**Check:** the reviewer approves, and all CI checks on the PR are green.

**Step 18. Merge.** [TBD: merge method, i.e. squash, merge commit, or rebase, and who clicks merge]
- **Check:** the PR shows "Merged", and a CI run starts on `main`.

### Part H: Verify the deploy

**Step 19. Wait for CI on `main`, then for the Deploy workflow.**
Deploy publishes to GitHub Pages **only if CI passes on `main`**.
- **Check:** in the Actions tab, both CI and Deploy show green for your merge commit. If CI on `main` is red, nothing is deployed. Go to E5.

**Step 20. Check the live pages and the kit.**
Open each of these:
- `https://yohan-work.github.io/agentive/en/agents/<slug>` [TBD: confirm the site's base URL for pages; only the kit URL below was given]
- `https://yohan-work.github.io/agentive/ko/agents/<slug>`
- `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`

You can check the status codes from the command line:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md
```
- **Check:** each URL returns **200**. The English and Korean pages show the agent's name, and the Korean page shows the Korean use cases if you added them. `AGENTS.md` contains the agent's prompt. Pages can take a few minutes to update after Deploy finishes. [TBD: how long to wait before treating a 404 as a failure]

**Step 21. Close the loop.** Comment on the issue with the live links, and close it if the PR did not close it automatically.
- **Check:** the issue is closed and has the live links in a comment.

---

## 4. Exceptions

| # | Situation | What to do | Who decides |
|---|---|---|---|
| E1 | **Promoting an existing agent**, not adding a new one | Skip Steps 1 and 3. The file already exists, so create the branch `content/<slug>` and edit the existing YAML. Still do Steps 6 and 8–21. [TBD: PR title for promotions, since `add <slug> agent` does not fit] | The maintainer who proposed the promotion. The reviewer approves the status. |
| E2 | The issue lacks a real example input, or the contributor never actually ran the agent | Ask on the issue. Until real evidence arrives, use `unverified`, or run the samples yourself and record them honestly. | Owner proposes the status. Reviewer approves. |
| E3 | The sample runs show the agent performs poorly | Record the negative verdicts and weaknesses honestly. Do not raise the score. Ask the contributor for a revised prompt, or ship at a lower status. | Owner, with the reviewer. |
| E4 | `check:data` fails and the message is unclear | Do not work around it by editing generated files or skipping the check. Post the error on the PR and ask a maintainer. | Any other maintainer. |
| E5 | CI passes locally but fails in CI, or CI fails on `main` after merge | Nothing deploys. Open the failing job's log. If your change caused it, fix it on a new branch or revert (see Rollback). If the failure is unrelated to your change, see E6. | Owner fixes. The reviewer approves the fix. |
| E6 | `main` is already broken before your change | Do not merge content on top of it. Report it to [TBD: who owns CI/build failures]. | [TBD] |
| E7 | CI and Deploy are green but a kit URL returns 404 | Wait [TBD: minutes], then recheck. If it still fails, check the Deploy workflow log and escalate. | [TBD: who owns the Pages/deploy setup] |
| E8 | A contributor disputes the status you assigned | Explain which rule applies, citing CONTRIBUTING.md, and what evidence would raise the status. | The reviewer makes the final call. |
| E9 | The submission raises a licensing, copyright, safety, or other policy question, e.g. the prompt copies someone else's material | Stop before merging. Do not decide it yourself. Route it to the responsible person with a link to the issue. | [TBD: responsible maintainer for licensing/policy questions] |
| E10 | Anything not listed here | Pause, leave a comment on the issue or PR describing what happened, and ask. | [TBD: fallback contact while you are unavailable] |

This list covers the cases known today. It is not every possible case. Anything else goes to E10.

---

## 5. Done when

**Outputs**
- `content/agents/<slug>.yaml` is on `main` with the metadata, `installTargets`, `runbook`, and `evaluation` filled in, and an honest `verifiedStatus`.
- Any starter pack, workflow, or dictionary changes are merged in the same PR.

**Quality checks (all must be true)**
- [ ] All five commands pass locally **and** in CI.
- [ ] `/en/agents/<slug>`, `/ko/agents/<slug>`, and `/kits/<slug>/AGENTS.md` all return 200.
- [ ] No status or score inflation: `tested`/`expert` has 2 or more real recorded runs, and the scores match the verdicts.
- [ ] The issue is closed with the live links.

**Rollback**
1. On GitHub, click **Revert** on the merged PR. This creates a revert PR.
2. Get it reviewed and merge it, following the same review rule as Step 17.
3. Pages redeploys on the **next green CI** on `main`.
   - **Check:** after Deploy finishes, `/en/agents/<slug>` and `/kits/<slug>/AGENTS.md` no longer show the agent. [TBD: expected response for a removed page, 404 or something else]
4. Comment on the issue explaining the revert, and reopen it if the agent will be resubmitted.

If the revert itself leaves CI red, the site stays on the last good deploy. Handle it as E5.

---

## Optional improvements
- Add an issue form field for "sample runs done (count + tool)" so the evidence for status arrives with the issue.
- Add a PR template containing the Step 17 checklist.
- Add a check that fails when `updatedAt` equals the template's date.
- Add a check that fails the PR if `src/data/generated/` was hand-edited, if generated output isn't meant to be committed.
