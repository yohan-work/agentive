# Contributing to Agent Archive

Thanks for helping build a library of AI agents that actually work in real projects. This guide covers what we accept, how to propose changes, and how to run the project locally.

## Ways to contribute

| You want to… | Do this |
| --- | --- |
| Suggest a new agent | Open a [**Suggest an agent**](https://github.com/yohan-work/agentive/issues/new?template=new-agent.yml) issue, or use the Submit page on the site |
| Improve a prompt, runbook, or evaluation | Open a PR that edits the agent's data (see [Agent data](#agent-data)) |
| Fix a bug or improve the site | Open a [bug report](https://github.com/yohan-work/agentive/issues/new?template=bug-report.yml) or a PR |
| Translate UI text | Edit `src/i18n/dictionaries.ts` (English and Korean are supported today) |

Small, focused PRs are reviewed fastest. Please keep **one agent per PR**.

## What makes a good agent

We accept agents that describe a **real, repeatable piece of work**. Before submitting, check that your agent:

1. **Solves a specific job.** "PR Review Agent" is good; "Helpful Assistant" is not.
2. **Doesn't duplicate an existing agent.** If it overlaps, improve the existing one instead.
3. **Has a concrete prompt.** It states the role, required context, output format, and what to do when information is missing.
4. **Is honest about limits.** List when *not* to use it and known weaknesses.
5. **Has been run at least once.** Include a realistic example input and output.

### Verification levels

`verifiedStatus` tells users how much to trust an agent. Please set it honestly:

| Status | Meaning |
| --- | --- |
| `unverified` | Drafted but not yet run against real inputs |
| `community` | Run by the contributor with at least one AI tool; example output is real |
| `tested` | Run by a maintainer across the evaluation criteria with sample runs recorded |
| `expert` | Reviewed by a practitioner in the agent's domain |

New submissions start as `unverified` or `community`. Maintainers promote them after review.

## Agent data

**Every agent is one YAML file** in [`content/agents/`](./content/agents), named after its slug (e.g. `content/agents/pr-review-agent.yaml`).

### Adding an agent

1. Copy [`content/TEMPLATE.yaml`](./content/TEMPLATE.yaml) to `content/agents/<your-agent-slug>.yaml`.
2. Fill it in. With the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml), VS Code autocompletes and validates fields from [`schema/agent.schema.json`](./schema/agent.schema.json).
3. Run `npm run check:data`.

That's it: no index file to edit. The site picks up every file in `content/agents` at build time.

### Validation

`npm run check:data` checks that:

- every file matches the JSON Schema (field names, types, allowed values)
- the `slug` matches the file name, and slugs and ids are unique
- `roles` and `categories` exist in `src/data/taxonomy.ts`
- every `relatedAgents` / `decisionGuide` slug points to an existing agent
- project-ready agents (with `installTargets`) have a complete `runbook`, an `evaluation` with at least two sample runs, and a `decisionGuide`

### Other data

| File | Contents |
| --- | --- |
| `src/data/workflows.ts` | Multi-agent workflow packs |
| `src/data/starter-packs.ts` | Starter packs shown on the Install page |
| `src/data/impact-scenarios.ts` | Before/after scenarios on the home and cases pages |
| `src/data/taxonomy.ts` | Roles and categories |

The schema is generated from the `AgentSource` type in `src/types/agent.ts`. If you change that type, run `npm run schema` and commit the updated `schema/agent.schema.json` (CI checks that it's current).

## Development setup

Requirements: Node.js 20.9+ and npm.

```bash
git clone https://github.com/yohan-work/agentive.git
cd agentive
npm install
npm run dev          # http://localhost:3000
```

Before opening a PR, run the same checks as CI:

```bash
npm run check:data
npm run lint
npm run typecheck
npm run build
```

## Pull request process

1. Fork the repo and create a branch: `feat/<agent-slug>`, `fix/<topic>`, or `docs/<topic>`.
2. Use [Conventional Commits](https://www.conventionalcommits.org/) for messages, e.g. `feat: add api contract agent`.
3. Fill in the PR template checklist.
4. CI must pass. A maintainer will review, usually within a week.

## Licensing of contributions

By contributing, you agree that code is licensed under [MIT](./LICENSE) and agent content (anything under `content/` or `src/data`) under [CC BY 4.0](./LICENSE-CONTENT.md).

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
