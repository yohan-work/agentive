# SOP: Add a project-ready agent to Agent Archive

## Purpose and trigger

Use this SOP to add a new **project-ready** agent (one that has install kits) to https://github.com/yohan-work/agentive, or to promote an existing agent to project-ready.

Start when either of these happens:
- A contributor's "New agent" GitHub issue gets the label `accepted`.
- A maintainer decides to promote an existing agent.

Expected volume is about 2–4 per month.

## Owner and roles

| Role | Who | Responsibility |
|---|---|---|
| Owner (content maintainer) | Seoyeon Lee (taking over from the current owner) | Runs every step, opens the PR, and checks the deploy |
| Reviewer | Any other maintainer | Reviews and approves the PR, and checks that no status was inflated |
| Contributor | Author of the "New agent" issue, if there is one | Answers questions about the agent and supplies any missing details |
| Escalation | [TBD: named maintainer to escalate to once the current owner has handed off] | Handles cases this SOP does not cover |

## Inputs (must exist before you start)

- One of: an issue labelled `accepted`, or a maintainer's decision to promote a named existing agent.
- The agent's prompt, inputs, outputs, and at least one real example input. For a new agent these come from the issue.
- Local clone of the repo with dependencies installed. [TBD: setup command and Node version]
- Access to an AI tool for sample runs: codex, claude, or cursor. [TBD: which tool or account to use for sample runs]

## Outputs ("done")

- A merged PR titled `feat(content): add <slug> agent` that is linked to the issue, if there is one.
- `content/agents/<slug>.yaml` with full metadata, `installTargets`, `runbook`, and `evaluation`.
- Green CI on `main`, and a completed Deploy workflow to GitHub Pages.
- These pages are live: `/en/agents/<slug>`, `/ko/agents/<slug>`, and `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`. The kit URL must return 200.

## Steps

| # | Action | Where / tool | Check that it worked |
|---|---|---|---|
| 1 | Choose a slug. It must be kebab-case (e.g. `release-notes-writer`) and not already used by another agent. | `content/agents/` | `ls content/agents/<slug>.yaml` finds no file. |
| 2 | Create the branch `content/<slug>` from an up-to-date `main`. | git | `git branch --show-current` prints `content/<slug>`. |
| 3 | **New agent:** copy `content/agents/_template.yaml` to `content/agents/<slug>.yaml`. **Promotion:** open the existing `content/agents/<slug>.yaml` instead. | `content/agents/` | The file exists at that path. |
| 4 | Fill the metadata: `name`, `summary`, `description`, `roles`, `categories`, `tags`, `tools`, `difficulty`, `automationLevel` (1–5), `prompt`, `inputs`, `outputs`, `exampleInput`, and `limitations`. | the YAML file | No template placeholder text is left in the file. |
| 5 | Check that every entry in `categories` exists in `src/data/taxonomy.ts`. Copy the slug from that file; do not retype it. Typos here are a common mistake. | `src/data/taxonomy.ts` | Each category slug appears in `taxonomy.ts` exactly as written. If one does not exist, see Exceptions. |
| 6 | Set `updatedAt` to today's date in `YYYY-MM-DD` format. Leaving the template date here is a common mistake. | the YAML file | The value equals today's date. |
| 7 | Add `installTargets` (codex, claude, cursor). [TBD: which targets to list if the agent was not run on all three] | the YAML file | All three keys are present, or the TBD rule above has been applied. |
| 8 | Add the `runbook`: context to prepare, a good input, a bad input, and an output checklist. | the YAML file | All four parts are filled in. |
| 9 | Do the sample runs. Open a fresh chat in the AI tool, paste the prompt plus a **real** input, and read the output. For each run, record the input, an output summary, and a verdict in `evaluation.sampleRuns`. [TBD: minimum number of runs when the target status is `community`] | AI tool + `evaluation.sampleRuns` | Each recorded run matches a chat that actually happened. No run is invented or paraphrased from memory. |
| 10 | Fill the rest of `evaluation`: `criteria`, `qualityScore` (1–5), and known weaknesses. Base the score only on the runs from step 9. [TBD: rubric for choosing qualityScore] | the YAML file | Every score and weakness can be traced to a recorded run. |
| 11 | Set `verifiedStatus` using the table below. Pick the highest level the evidence actually supports, never a higher one. | the YAML file | The status matches the table. For `tested` or `expert`, `sampleRuns` has at least 2 entries. |
| 12 | Optional: add Korean `realUseCases`. | the YAML file | If you add them, they are written in Korean. |
| 13 | If the agent belongs in a starter pack or workflow, edit `src/data/starter-packs.ts` or `src/data/workflows.ts`. [TBD: who decides whether an agent belongs in a pack or workflow] | `src/data/` | The slug in those files exactly matches `<slug>`. |
| 14 | If you added a new UI string, add it to **both** the `en` and `ko` dictionaries. Forgetting `ko` is a common mistake. | [TBD: dictionary file path] | The new key exists in both `en` and `ko`. |
| 15 | Do **not** edit `src/data/generated/agents.ts`. It is build output. | git | `git status` does not list `src/data/generated/agents.ts` as changed by hand. |
| 16 | Run, in order: `npm run check:data`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Content bundling (`npm run content`) runs automatically before build, typecheck, and test. | terminal | All five commands exit with no errors. |
| 17 | Commit, push, and open a PR titled `feat(content): add <slug> agent`. Link the issue if there is one. Request a review from any other maintainer. | GitHub | CI passes on the PR, and the PR shows the linked issue. |
| 18 | The reviewer approves, then merge. [TBD: merge method, e.g. squash] | GitHub | The PR shows as merged. |
| 19 | Wait for CI on `main`, then for the Deploy workflow. Deploy runs only if CI passes on `main`. | GitHub Actions | Both runs are green. |
| 20 | Open `/en/agents/<slug>`, `/ko/agents/<slug>`, and `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md`. | browser, or `curl -I <url>` | Both agent pages load and show the agent. The kit URL returns HTTP 200. |
| 21 | Close the issue, if there is one, with a link to the merged PR. [TBD: whether to comment on the issue or swap labels] | GitHub | The issue is closed. |

### verifiedStatus (step 11)

| Status | When to use it |
|---|---|
| `unverified` | The default. Nobody has actually run the agent yet. |
| `community` | The contributor ran it with at least one AI tool, and the example output is real. |
| `tested` | An evaluation exists with **at least 2** recorded sample runs. `check:data` rejects this status otherwise. |
| `expert` | Requires at least 2 recorded sample runs, like `tested`. [TBD: what else separates `expert` from `tested`] |

## Exceptions

| Situation | What to do | Escalate to |
|---|---|---|
| `check:data` reports a duplicate slug | Choose a different kebab-case slug. Rename the file, and the branch if needed. Rerun step 16. | Contributor, if the name was theirs |
| A category the agent needs does not exist in `taxonomy.ts` | Do not invent the category. Pick an existing one, or ask whether a new category should be added. | [TBD: who approves new categories] |
| `check:data` rejects `tested`/`expert` (fewer than 2 sample runs) | Do more real sample runs (step 9), or lower the status to what the evidence supports. Never add runs that did not happen. | Reviewer |
| A sample run gives a poor or failing verdict | Record it honestly and add it to known weaknesses. Lower `qualityScore` or the status if needed. [TBD: whether a failing run blocks promotion] | Reviewer |
| The issue lacks a real example input or output | Ask the contributor on the issue and pause until they reply. [TBD: how long to wait before closing] | Contributor |
| The agent's content raises a legal, licensing, or compliance question (e.g. third-party material in the prompt or examples) | Do not decide it yourself. Pause the PR and route the question. | [TBD: responsible person for legal/licensing questions] |
| `lint`, `typecheck`, `test`, or `build` fails for a reason unrelated to your change | Do not fix unrelated code in this PR. Note the failure in the PR. | [TBD: escalation maintainer] |
| CI fails on `main` after the merge, or the Deploy workflow does not run | Follow the Rollback steps below. | Reviewer, then [TBD: escalation maintainer] |
| The kit URL does not return 200, or the agent pages are missing after deploy | First confirm that Deploy finished green (step 19). If it did and the pages are still missing, follow Rollback. | [TBD: escalation maintainer] |

## Rollback

1. On GitHub, use **Revert** on the merged PR. Open the revert PR and merge it.
2. GitHub Pages redeploys on the next green CI run on `main`.
3. Check: Actions shows CI and Deploy as green for the revert commit. The site then shows the previous state, meaning the new agent's pages are gone, or a promoted agent is back to its old version.
4. Reopen the issue, if there is one, and comment with the reason for the revert.

## Quality checks before handoff (before requesting review)

- [ ] All five commands (`check:data`, `lint`, `typecheck`, `test`, `build`) pass locally, and CI passes on the PR.
- [ ] `updatedAt` is today's date, not the template date.
- [ ] Every category exists in `src/data/taxonomy.ts`.
- [ ] `verifiedStatus` and `qualityScore` are no higher than what was actually tested. `tested`/`expert` have at least 2 real sample runs.
- [ ] `src/data/generated/agents.ts` was not hand-edited.
- [ ] Any new UI string exists in both `en` and `ko`.
- [ ] The PR title is `feat(content): add <slug> agent`, and the issue is linked.
- [ ] After deploy, the kit URL returns 200 and both `/en/` and `/ko/` agent pages load.
