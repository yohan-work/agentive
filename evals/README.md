# Agent evaluations

How we check whether an agent prompt actually helps, and where the evidence lives. The goal is a claim we can defend: "with this prompt, the model does better on these requests than without it."

## Layout

```text
evals/
├── cases/<slug>.json                     # test inputs for one agent
├── runs/<slug>/<variant>/<case>.md       # raw, unedited model outputs
├── runs/<slug>/<variant>/meta.json       # the system prompt, its SHA-256, generator model, date
├── verdicts/<slug>/<A>__vs__<B>/         # blind pairwise judgements (order1, order2) and summary.json
├── reviews/<slug>/<variant>.json         # absolute review: score, weaknesses, notes per case
├── candidates/<slug>[.vN].md             # candidate prompts under test (later revisions get .v2, .v3, ...)
└── prompts/                              # instructions for runner, judge, and reviewer sessions
```

A **variant** is one way of running the agent: `agent-<first 8 hex of the prompt's SHA-256>` for a system prompt, or `none` for the baseline with no system prompt. Because the id comes from the prompt text, editing a prompt produces a new variant and never overwrites old evidence.

## Protocol

1. **Cases.** At least three per agent, written before any run:
   - `strong`: a realistic request with every input the agent needs, using real material where possible (a real diff, real logs).
   - `boundary`: under-specified or contradictory. A good answer asks focused questions or states its assumptions, and still moves the work forward.
   - `out-of-scope`: a request the agent shouldn't fully take on, or one that invites invented facts.
   Inputs never contain the expected answer.
2. **Runs.** Each case runs in a fresh, isolated session with only the system prompt and the user message (`evals/prompts/runner.md`). Outputs are saved verbatim. Run at least two samples per case (`--sample 2` stores `<case>.s2.md`). One sample is not enough: the same prompt has swung from a 4–0 loss to a 3–0 win against a fresh baseline sample. Run the candidate prompt, the current prompt if one exists, and the `none` baseline on the same cases with the same model.
3. **Judging.** A judge from a different model than the generator compares two variants blind, case by case (`evals/prompts/judge.md`):
   - Pairwise, not a 1–5 scale. Absolute scales cluster (the first 20 agents all scored 4/5).
   - Both orders. `order1` shows the first variant as A and `order2` swaps them. A case only counts when both orders agree, which cancels position bias. In our first run, only 26 of 40 pairs agreed.
   - Neutral criteria. The judge sees the agent's task-specific criterion, never the prompt's own formatting rules. Judging "states assumptions, risks, and next actions separately" rewards the prompt for its own format; that circular setup gave the agent 33 of 40 wins, while neutral judging gave 38 vs 42.
   - Substance over headings and length.
   - Truly blind. Judges must not be able to tell the variants apart from anything but the text. Pair and verdict files get random names for this reason: an earlier round named them `<variant>__vs__none`, and a judge wrote "A is agent-7a64b4c7 and B is none". That round was discarded.
4. **Decision.** A candidate prompt replaces the current one only if it beats both the current prompt and the baseline on consistent cases. A tie with the baseline means the prompt isn't adding value yet.
5. **Record.** `scripts/eval/apply.mjs` writes the winning variant into the agent's YAML. It sets the prompt, the real inputs and outputs as `sampleRuns`, and the reviewer's score and weaknesses. It also quotes each blind comparison in the run notes. `check:data` fails if an agent's prompt changes without new runs for that prompt. Its `verifiedStatus` stays `community` until a maintainer reads the runs; see CONTRIBUTING.md for the levels.
6. **Align the runbook.** `apply.mjs` doesn't touch the rest of the YAML, so update it by hand. The runbook's `expectedOutputShape`, `outputChecklist`, and `failureModes`, the handoff starter input, and `outputs` must describe what the new prompt actually produces; they ship in the install kit's RUNBOOK.md and EVALUATION.md. Update the rest of `evaluationCriteria` too, but leave the first entry alone: it is the blind judge's criterion, and changing it would make new verdicts incomparable with old ones.

## Commands

```bash
npm run eval:prepare -- <slug> --model <generator-id>                 # current prompt
npm run eval:prepare -- <slug> --model <generator-id> --prompt <file> # candidate prompt
npm run eval:prepare -- <slug> --model <generator-id> --baseline      # no system prompt
# add --sample <n> to any prepare command for repeated samples
npm run eval:pairs -- <slug> <variantA> <variantB> [--sample <n>]
npm run eval:collect
npm run eval:aggregate -- <slug> <variantA> <variantB>
npm run eval:apply -- <slug> <variant> --judge <judge-id> --date <YYYY-MM-DD>
```

- `prepare` writes one input file per case under `.eval-work/` (gitignored) and prints where each runner should save its output.
- `pairs` writes the two judge files under random names, so neither the path nor the content tells a judge which variant is which. The mapping stays in `.eval-work/judge-manifest.json`, outside the folder judges work in.
- `collect` files finished verdicts under `evals/verdicts/`.
- `aggregate` tallies the verdicts into `summary.json`.

Runner and judge sessions are separate model sessions (e.g. Claude Code subagents), each given one input file and the matching instructions in `prompts/`.

## Lessons so far

- **2026-09-29, 20 installable agents.** The generic ~250-character prompts did no better than no prompt. The result was 38 vs 42 verdicts: the prompt lost on fully specified requests because its forced sections padded the answer, and won on under-specified ones.
- **2026-09-30, pilot rewrite of three prompts.**
  - Only `qa-checklist-agent` improved. The old prompt lost all three cases to the baseline, while the new one beat both the baseline and the old prompt, 2–1 each.
  - `codex-task-brief` shows how noisy one sample per case is: the same old prompt lost 4–0 to a baseline sample in one round and won 3–0 against a fresh baseline sample in the next.
  - **Use at least two samples per case before drawing conclusions.**
- **2026-09-30, second sample of the pilot.** Each case was run again for every variant and judged blind in both orders.
  - `qa-checklist-agent` held up: the new prompt beat the baseline 4–2 and the old prompt 4–2, and both samples agreed on every case. It wins under-specified and out-of-scope requests but still loses the fully specified one to no prompt, where it runs long.
  - `codex-task-brief` stayed a coin flip. The new prompt went 3–3 against the baseline, and the strong and boundary cases flipped between samples.
  - `operations-sop-agent` did not beat the baseline with either prompt (new 0–3, old 1–2, many order-inconsistent cases), so this agent adds no measurable value yet.
- **2026-09-30, length rule (v2) for `qa-checklist-agent` and `codex-task-brief`.**
  - The hypothesis was that the prompts lose fully specified requests because they run long. v2 added "no preamble, cap the checklist, put extras under If time allows" and was tested on 3 cases × 2 samples.
  - The hypothesis did not hold. `qa-checklist-agent` v2 was much shorter on the fully specified case (1,387 words against 3,181 in sample 1; 1,214 against 2,190 in sample 2), still went 4–2 against the baseline, and lost 1–3 to v1.
  - The judges preferred the longer answers on the fully specified case because they covered the risks the user named in more depth: the PowerShell failure modes, `robots.txt` under a sub-path, and runnable scripts. Capping rows removed exactly that.
  - `codex-task-brief` v2 went 3–3 against the baseline and 3–2 against the current prompt (one case order-inconsistent). It did not beat both, so neither v2 was adopted.
  - Next hypothesis: require depth on every risk the request names, and cap only the extras nobody asked for.
- **2026-09-30, depth rule (v3), adopted for both.**
  - For `qa-checklist-agent`, v3 is v1 with the caps removed ("at most ten smoke checks", "what one tester can run") and a depth rule added: go deep on every risk, surface, and environment the request names (the failure mode, exact steps or commands, a script where possible), and keep anything unasked-for to one line.
  - For `codex-task-brief`, v3 is the unadopted v1 candidate with its edge-case rule replaced by the same depth rule plus a one-line cap on unrequested suggestions. It was compared with the prompt the agent currently ships (`agent-7a64b4c7`), not with that candidate.
  - Both were tested on 3 cases × 2 samples.
  - `qa-checklist-agent` v3 beat the baseline 6–0 and v1 5–0 (one case order-inconsistent).
  - `codex-task-brief` v3 beat the baseline 5–1 and the current prompt 5–0 (one inconsistent).
  - For the first time a prompt beat the no-prompt baseline on the fully specified case, in both samples, for both agents. Against the current prompt it also won that case, except one order-inconsistent codex sample.
  - The lesson for the other agents: a useful prompt tells the model where to spend depth (the user's stated risks and constraints), not how long to be or which sections to print.
- **2026-09-30, depth rule on four more agents (batch 1).** Each agent got a v3 prompt built on the same recipe and an out-of-scope case, and was tested on 3 cases × 2 samples.
  - `pr-review-agent` v3 beat the baseline 5–1 and the current prompt 4–0 (two inconsistent). Adopted.
  - `bug-root-cause-analyst` v3 beat the baseline 4–1 (one inconsistent) and the current prompt 4–2. Adopted, but it lost the fully specified case to the current prompt in both samples: its wins come from the under-specified and out-of-scope cases.
  - `operations-sop-agent` v3 beat the baseline 3–1 (two inconsistent) and the current prompt 4–2. Adopted. It is the first prompt for this agent to beat the baseline, though the margins are thin: only the under-specified case won in both samples.
  - `feature-requirements-analyst` v3 lost to the baseline 0–2 (four inconsistent), though it beat the current prompt 3–2. Not adopted. The baseline won the fully specified case in both samples, and the judges could not agree on the other two.
  - The recipe transfers, but not everywhere. Where the model already writes a strong answer unprompted (a fully specified requirements request), a prompt adds little.
- **2026-09-30, depth rule on four more agents (batch 2).** Same recipe, protocol, and new out-of-scope cases.
  - `product-roadmap-prioritizer` v3 beat the baseline 4–0 (two inconsistent) and the current prompt 5–0 (one inconsistent). Adopted. Its prompt also forbids tuning the scoring to reach a predetermined answer, which decided the out-of-scope case in all four runs.
  - `design-qa-agent` v3 beat the baseline 3–1 (two inconsistent) and the current prompt 3–0 (three inconsistent). Adopted, with thin margins.
  - `readme-generator` v3 beat the baseline 3–2 (one inconsistent) and the current prompt 4–1 (one inconsistent). Adopted, but the baseline won the fully specified case in both samples; the wins come from the under-specified and out-of-scope cases.
  - `policy-doc-writer` v3 lost to the baseline 0–4 (two inconsistent) and to the current prompt 0–3 (three inconsistent). Not adopted. The judges' reasons were consistent: the "[TBD] instead of inventing" rule plus the up-front questions left the policy full of blanks and less ready to publish, even where the request gave enough to fill them (or asked for one page). For documents meant to be published as-is, "never invent" needs a counterweight: fill what the request supports, and mark only genuinely missing facts.
- **2026-09-30, depth rule on four more agents (batch 3).** Same recipe and protocol.
  - `refactor-plan-agent` v3 beat the baseline 6–0 and the current prompt 6–0, with no inconsistent cases. Adopted.
  - `api-contract-agent` v3 beat the baseline 6–0 and the current prompt 5–1. Adopted; the current prompt won the fully specified case in one sample.
  - `customer-feedback-clusterer` v3 beat the baseline 4–1 (one inconsistent) and the current prompt 3–0 (three inconsistent). Adopted.
  - `test-case-generator` v3 beat the baseline 5–1 but only tied the current prompt 2–2 (two inconsistent). Not adopted. The current prompt won the fully specified and under-specified cases in the first sample: judges preferred building the matrix straight away with a placeholder over v3's "list contradictions and ask first".
  - Judging note (batch 3): a different session judged six of these pairs with a GPT model while this batch was paused. Those verdicts were set aside and every pair was re-judged with the same Sonnet judge, so all recorded verdicts come from one judge model.
- **2026-09-30, depth rule on three more agents (batch 4a).** Same recipe and protocol. The prompts now start with the output when the request gives enough detail, instead of opening with questions (the test-case lesson from batch 3).
  - `security-checklist-agent` v3 beat the baseline 5–1 and the current prompt 5–0 (one inconsistent). Adopted. The reviewer gave 5; capped at 4 because its own notes cite very long output and a case scored 4.
  - `performance-audit-agent` v3 beat the baseline 5–0 (one inconsistent) and the current prompt 4–1 (one inconsistent). Adopted.
  - `release-notes-writer` v3 beat the baseline 5–0 (one inconsistent) and the current prompt 4–1 (one inconsistent). Adopted.
  - The only losses: security lost the fully specified case to the baseline in one sample, and performance and release notes each lost the under-specified case to the current prompt in one sample.

## Known limits

- Generator and judge are both Claude models. A judge from another model family would reduce self-preference further.
- Few cases and samples per agent, so a single flipped case moves the result. Treat small margins as ties, and prefer running a second sample over reading much into a 2–1.
- The judge is not yet calibrated against human ratings. A maintainer should spot-check verdicts before promoting any agent to `tested`.
