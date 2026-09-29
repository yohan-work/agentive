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
├── candidates/<slug>.md                  # candidate prompts under test
└── prompts/                              # instructions for runner, judge, and reviewer sessions
```

A **variant** is one way of running the agent: `agent-<first 8 hex of the prompt's SHA-256>` for a system prompt, or `none` for the baseline with no system prompt. Because the id comes from the prompt text, editing a prompt produces a new variant and never overwrites old evidence.

## Protocol

1. **Cases.** At least three per agent, written before any run:
   - `strong`: a realistic request with every input the agent needs, using real material where possible (a real diff, real logs).
   - `boundary`: under-specified or contradictory. A good answer asks focused questions or states its assumptions, and still moves the work forward.
   - `out-of-scope`: a request the agent shouldn't fully take on, or one that invites invented facts.
   Inputs never contain the expected answer.
2. **Runs.** Each case runs in a fresh, isolated session with only the system prompt and the user message (`evals/prompts/runner.md`). Outputs are saved verbatim. Run the candidate prompt, the current prompt if one exists, and the `none` baseline on the same cases with the same model.
3. **Judging.** A judge from a different model than the generator compares two variants blind, case by case (`evals/prompts/judge.md`):
   - Pairwise, not a 1–5 scale. Absolute scales cluster (the first 20 agents all scored 4/5).
   - Both orders. `order1` shows the first variant as A and `order2` swaps them. A case only counts when both orders agree, which cancels position bias. In our first run, only 26 of 40 pairs agreed.
   - Neutral criteria. The judge sees the agent's task-specific criterion, never the prompt's own formatting rules. Judging "states assumptions, risks, and next actions separately" rewards the prompt for its own format; that circular setup gave the agent 33 of 40 wins, while neutral judging gave 38 vs 42.
   - Substance over headings and length.
   - Truly blind. Judges must not be able to tell the variants apart from anything but the text. Pair and verdict files get random names for this reason: an earlier round named them `<variant>__vs__none`, and a judge wrote "A is agent-7a64b4c7 and B is none". That round was discarded.
4. **Decision.** A candidate prompt replaces the current one only if it beats both the current prompt and the baseline on consistent cases. A tie with the baseline means the prompt isn't adding value yet.
5. **Record.** `scripts/eval/apply.mjs` writes the winning variant into the agent's YAML. It sets the prompt, the real inputs and outputs as `sampleRuns`, and the reviewer's score and weaknesses. It also quotes each blind comparison in the run notes. `check:data` fails if an agent's prompt changes without new runs for that prompt. Its `verifiedStatus` stays `community` until a maintainer reads the runs; see CONTRIBUTING.md for the levels.

## Commands

```bash
npm run eval:prepare -- <slug> --model <generator-id>                 # current prompt
npm run eval:prepare -- <slug> --model <generator-id> --prompt <file> # candidate prompt
npm run eval:prepare -- <slug> --model <generator-id> --baseline      # no system prompt
npm run eval:pairs -- <slug> <variantA> <variantB>
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

## Known limits

- Generator and judge are both Claude models. A judge from another model family would reduce self-preference further.
- Few cases and samples per agent, so a single flipped case moves the result. Treat small margins as ties, and prefer running a second sample over reading much into a 2–1.
- The judge is not yet calibrated against human ratings. A maintainer should spot-check verdicts before promoting any agent to `tested`.
