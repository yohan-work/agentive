# Agent evaluations

How we check whether an agent prompt actually helps, and where the evidence lives. The goal is a claim we can defend: "with this prompt, the model does better on these requests than without it."

## Layout

```text
evals/
├── cases/<slug>.json                     # test inputs for one agent
├── runs/<slug>/<variant>/<case>.md       # raw, unedited model outputs
├── runs/<slug>/<variant>/meta.json       # the system prompt, its SHA-256, generator model, date
├── verdicts/<slug>/<A>__vs__<B>/         # blind pairwise judgements (order1, order2) and summary.json
└── prompts/                              # instructions for runner and judge sessions
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
4. **Decision.** A candidate prompt replaces the current one only if it beats both the current prompt and the baseline on consistent cases. A tie with the baseline means the prompt isn't adding value yet.
5. **Record.** The agent's `evaluation` keeps the real inputs and outputs as `sampleRuns`. Its `verifiedStatus` stays `community` until a maintainer reads the runs; see CONTRIBUTING.md for the levels.

## Commands

```bash
npm run eval:prepare -- <slug> --model <generator-id>                 # current prompt
npm run eval:prepare -- <slug> --model <generator-id> --prompt <file> # candidate prompt
npm run eval:prepare -- <slug> --model <generator-id> --baseline      # no system prompt
npm run eval:pairs -- <slug> <variantA> <variantB>
npm run eval:aggregate -- <slug> <variantA> <variantB>
```

- `prepare` writes one input file per case under `.eval-work/` (gitignored) and prints where each runner should save its output.
- `pairs` writes the two judge files.
- `aggregate` tallies the verdicts into `summary.json`.

Runner and judge sessions are separate model sessions (e.g. Claude Code subagents), each given one input file and the matching instructions in `prompts/`.

## Known limits

- Generator and judge are both Claude models. A judge from another model family would reduce self-preference further.
- Few cases per agent, so a single flipped case moves the result. Treat small margins as ties.
- The judge is not yet calibrated against human ratings. A maintainer should spot-check verdicts before promoting any agent to `tested`.
