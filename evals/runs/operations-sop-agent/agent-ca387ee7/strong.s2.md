# SOP: Add a project-ready agent to Agent Archive

## 1. Purpose and trigger
Use this SOP to add a new **project-ready** agent (one with install kits) to https://github.com/yohan-work/agentive.

Start it when either of these happens:
- A contributor's "New agent" GitHub issue gets the label `accepted`.
- A maintainer decides to promote an existing agent to project-ready.

Expected volume: about 2–4 per month.

## 2. Owner and roles
| Role | Who | Responsibility |
|---|---|---|
| Owner (content maintainer) | Seoyeon Lee (taking over from the current maintainer) | Runs every step, opens the PR, confirms the deploy |
| Reviewer | Any other maintainer | Reviews and approves the PR |
| Contributor | Issue author (if there is one) | Supplies the agent content and answers questions on the issue |

## 3. Inputs and outputs
**Inputs (must exist before you start)**
- An issue labeled `accepted`, or a maintainer's recorded decision to promote an existing agent [TBD: where promotion decisions are recorded].
- The agent's content: prompt, intended inputs/outputs, and an example input.
- Access to at least one AI tool to run sample runs (fresh chat).
- A local clone of the repo with dependencies installed [TBD: install command, e.g. the project's usual one].

**Outputs ("done")**
- A merged PR titled `feat(content): add <slug> agent`, linked to the issue.
- `content/agents/<slug>.yaml` with full metadata, `installTargets`, `runbook`, and `evaluation`.
- Green CI on `main` and a successful Deploy to GitHub Pages.
- These pages load: `/en/agents/<slug>`, `/ko/agents/<slug>`, and `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md` (returns 200).

## 4. Steps

| # | Action | Tool / location | Check that confirms it worked |
|---|---|---|---|
| 1 | Choose the slug: kebab-case, unique. | `content/agents/` | No file named `<slug>.yaml` already exists there. |
| 2 | Create the branch `content/<slug>` from `main`. | git | `git branch --show-current` prints `content/<slug>`. |
| 3 | Copy the template: `content/agents/_template.yaml` → `content/agents/<slug>.yaml`. | file system | New file exists; template is unchanged. |
| 4 | Fill metadata: `name`, `summary`, `description`, `roles`, `categories`, `tags`, `tools`, `difficulty`, `automationLevel` (1–5), `prompt`, `inputs`, `outputs`, `exampleInput`, `limitations`. | `content/agents/<slug>.yaml` | Every field above has a real value, none left as template text. |
| 5 | Check each category slug against the taxonomy. | `src/data/taxonomy.ts` | Each value in `categories` appears in that file character-for-character (typos are a common mistake). |
| 6 | Set `updatedAt` to today's date, `YYYY-MM-DD`. | `content/agents/<slug>.yaml` | Date is today, not the template date (common mistake). |
| 7 | Add `installTargets`: `codex`, `claude`, `cursor`. | `content/agents/<slug>.yaml` | All three listed. |
| 8 | Add `runbook`: context to prepare, good input, bad input, output checklist. | `content/agents/<slug>.yaml` | All four parts filled. |
| 9 | Do sample runs: paste the agent's prompt plus a **real** input into a **fresh** chat. Record input, output summary, and verdict for each run in `evaluation.sampleRuns`. | AI tool of choice; `content/agents/<slug>.yaml` | Each entry reflects a run you actually did. Count the runs. |
| 10 | Fill the rest of `evaluation`: criteria, `qualityScore` (1–5), known weaknesses. | `content/agents/<slug>.yaml` | Score reflects only what the sample runs showed. |
| 11 | Set `verifiedStatus` using the rules below (from CONTRIBUTING.md). | `content/agents/<slug>.yaml` | Status matches evidence; see the rule table. |
| 12 | (Optional) Add Korean `realUseCases`. | `content/agents/<slug>.yaml` | Skip if not available; do not machine-invent use cases [TBD: confirm whether translated examples are acceptable]. |
| 13 | If the agent belongs in a starter pack or workflow, add it there. | `src/data/starter-packs.ts` or `src/data/workflows.ts` | Slug is spelled exactly as the YAML filename. |
| 14 | If you added any new UI string, add it to the Korean (`ko`) dictionary as well as English. | [TBD: dictionary file path] | Both languages have the key (common mistake). |
| 15 | Run, in order: `npm run check:data`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. (`npm run content` runs automatically before build/typecheck/test.) | terminal | All five exit without errors. |
| 16 | Commit and push the branch; open a PR titled `feat(content): add <slug> agent`, link the issue, request a review from another maintainer. | GitHub | PR shows the linked issue and a requested reviewer; CI starts. |
| 17 | Wait for CI and reviewer approval, then merge. | GitHub | CI green on the PR; approval recorded [TBD: required number of approvals / merge method]. |
| 18 | After merge, confirm CI passes on `main` and the Deploy workflow publishes. | GitHub Actions | Deploy run succeeded (it only runs if CI on `main` is green). |
| 19 | Check the live pages. | browser | `/en/agents/<slug>` and `/ko/agents/<slug>` load; `https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md` returns 200. |
| 20 | Close the issue [TBD: close manually or via PR "Closes #" keyword]. | GitHub | Issue closed with a link to the PR. |

**verifiedStatus rules (step 11)**
| Status | Required evidence |
|---|---|
| `unverified` | Default. |
| `community` | Contributor ran it with at least one AI tool; example output is real. |
| `tested` or `expert` | An `evaluation` with **at least 2** recorded sample runs. `check:data` rejects it otherwise. [TBD: what distinguishes `expert` from `tested`, and who may grant it] |

Never set status or scores higher than what was actually tested.

**Never edit `src/data/generated/agents.ts` by hand.** It is build output and is regenerated from the YAML files.

## 5. Exceptions
| Situation | What to do | Escalate to |
|---|---|---|
| `check:data` reports a duplicate slug | Pick a different kebab-case slug; rename the file and branch. | — |
| `check:data` rejects `tested`/`expert` | Add another real sample run, or lower status to what the evidence supports. Do not add a run you didn't do. | Reviewer if unsure which status fits |
| Category doesn't exist in `src/data/taxonomy.ts` | Use an existing category. Do not add a new one in this PR without agreement. | Current maintainer / reviewer [TBD: who approves taxonomy changes] |
| You can't produce a real input or a sample run fails badly | Record the honest verdict; keep status at the level supported. If the agent doesn't work, pause the PR and comment on the issue. | Issue author, then reviewer |
| Contributor's content is incomplete (e.g. no example input, no limitations) | Ask on the issue; don't fill gaps with guesses. | Issue author |
| Agent content may raise licensing or rights questions (e.g. copied from another source) | Don't decide yourself; pause and ask. Note: agent content is published under CC BY 4.0. | [TBD: who decides licensing questions] |
| Any of the five commands fails and the cause isn't in your YAML | Don't change unrelated code to make it pass; stop and ask. | Reviewer |
| You find a hand edit to `src/data/generated/agents.ts` in your diff | Discard that change and rerun the commands. | — |
| CI fails on `main` after merge, or Deploy doesn't run | Pages keeps the old version. Investigate or roll back (section 7). | Reviewer |
| Live page 404s or kit URL not 200 after a successful deploy | Recheck the slug in URL vs. filename; wait [TBD: how long to wait for Pages]; then roll back if still broken. | Reviewer |

## 6. Quality checks before handoff (before requesting review / before closing)
- [ ] All five commands pass locally **and** in CI.
- [ ] `updatedAt` is today; categories match `src/data/taxonomy.ts`.
- [ ] `installTargets`, `runbook`, and `evaluation` are all present and filled.
- [ ] `verifiedStatus` and `qualityScore` match the recorded evidence; `tested`/`expert` has ≥ 2 real sample runs.
- [ ] No hand edits to `src/data/generated/agents.ts`.
- [ ] Any new UI string exists in both `en` and `ko`.
- [ ] PR title is `feat(content): add <slug> agent` and links the issue.
- [ ] After deploy: both locale pages load and the kit `AGENTS.md` URL returns 200.

## 7. Rollback
1. Revert the PR on GitHub (the "Revert" button on the merged PR), and merge the revert PR [TBD: whether a revert needs review].
2. Wait for CI to pass on `main`; Pages redeploys on the next green CI.
3. Confirm the agent pages and kit URL are gone or back to their previous state.
4. Comment on the issue explaining the rollback, and reopen it if the agent will be retried.
