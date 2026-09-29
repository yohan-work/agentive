<div align="center">

<img src="docs/assets/logo.svg" width="72" height="72" alt="Agent Archive logo" />

# Agent Archive

**An open-source library of practical AI agents, with prompts, runbooks, evaluations, and install kits for Codex, Claude Code, and Cursor.**

[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](./LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-lightgrey.svg)](./LICENSE-CONTENT.md)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

[Features](#features) · [Quick start](#quick-start) · [Install kits](#install-kits) · [Contributing](#contributing) · [한국어](./README.ko.md)

<img src="docs/assets/screenshot-home.png" alt="Agent Archive home page" width="900" />

</div>

## Why Agent Archive?

Most prompt collections stop at "copy this text". In a real project you also need to know:

- **When** an agent is the right tool, and when it isn't
- **What context** to give it, and what a weak input looks like
- **How to judge** the output before you trust it
- **How to install** it where you work: `AGENTS.md`, `CLAUDE.md`, or a Cursor rule

Agent Archive treats every agent as a reusable work recipe. Each one documents its inputs, outputs, limits, and review criteria, and the project-ready agents can be dropped straight into a repository.

## Features

- **100 agents** across 9 roles and 11 categories, from PRD review to incident postmortems
- **20 project-ready agents** with runbooks, quality evaluations, sample runs, and one-click install kits
- **Install kits** for Codex (`AGENTS.md`), Claude Code (`CLAUDE.md`), and Cursor (`.mdc` rule), plus `agent.json`, `RUNBOOK.md`, and `EVALUATION.md`
- **Workflow packs** that chain several agents into end-to-end playbooks, with a visual handoff at each step
- **Starter packs** that bundle agents for engineering, product planning, design QA, and operations
- **Search and filters** by role, category, tool, difficulty, and automation level, with a project-ready-only toggle
- **Portable exports**: copy the full agent card or download it as Markdown or JSON
- **Bookmarks** stored locally in your browser; no account required
- **English and Korean** UI

<table>
  <tr>
    <td><img src="docs/assets/screenshot-agent.png" alt="Agent detail page" /></td>
    <td><img src="docs/assets/screenshot-install.png" alt="Install page" /></td>
  </tr>
  <tr>
    <td align="center"><sub>Agent detail: expected effect, runbook, evaluation</sub></td>
    <td align="center"><sub>Install: starter packs and project-ready agents</sub></td>
  </tr>
</table>

## Quick start

Requirements: Node.js 20.9 or newer, and npm.

```bash
git clone https://github.com/yohan-work/agentive.git
cd agentive
npm install
npm run dev
```

Open http://localhost:3000. The app redirects to `/en`; switch to Korean with `/ko`.

## Install kits

Open any project-ready agent and choose **Download Kit** in the *Use this agent* panel. You get:

```text
pr-review-agent-AGENTS.md         # Codex / generic AGENTS.md instructions
pr-review-agent-CLAUDE.md         # Claude Code project instructions
pr-review-agent-cursor-rule.mdc   # Cursor project rule
pr-review-agent-agent.json        # machine-readable manifest
pr-review-agent-README.md         # setup notes
pr-review-agent-RUNBOOK.md        # context to prepare, good/bad inputs, output checklist
pr-review-agent-EVALUATION.md     # quality score, known weaknesses, sample runs
```

Then place the files where your tool expects them:

| Tool | Where to put it |
| --- | --- |
| Codex and other `AGENTS.md`-aware agents | Append the contents to `AGENTS.md` at your repo root |
| Claude Code | Append the contents to `CLAUDE.md` at your repo root |
| Cursor | Save as `.cursor/rules/<name>.mdc` |

## How it works

Agent Archive is a **static-data-first** Next.js app. There is no database or backend: every agent, workflow, and taxonomy entry is typed data in `src/data`, validated by `npm run check:data`.

```text
src/
├── app/              # Next.js App Router pages (locale-prefixed: /en, /ko)
├── components/       # UI: agents, workflows, layout, common primitives
├── data/             # Source of truth: agents, workflows, starter packs, taxonomy
├── i18n/             # Locale config and UI dictionaries
├── lib/              # Search, export, and install-kit generation
└── types/            # Agent, workflow, and taxonomy types
scripts/
└── check-data.mjs    # Data integrity checks (slugs, references, required metadata)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run check:data` | Validate agent, workflow, and taxonomy data |

## Contributing

Contributions are welcome, especially new agents, better prompts, and honest evaluations.

- **Suggest an agent**: use the [submit form](https://github.com/yohan-work/agentive/issues/new?labels=new-agent) or open an issue.
- **Improve an existing agent**: edit its entry in `src/data`, run `npm run check:data && npm run lint && npm run build`, and open a pull request.
- **Report a bug**: [open an issue](https://github.com/yohan-work/agentive/issues).

## Roadmap

- [ ] One file per agent, with schema validation
- [ ] Hosted site with a public URL
- [ ] Download install kits straight from a URL, no browser needed
- [ ] More hand-verified agents and sample runs

## License

- Code: [MIT](./LICENSE)
- Agent content in `src/data` (prompts, runbooks, evaluations, workflows): [CC BY 4.0](./LICENSE-CONTENT.md)

You can use exported prompts and install kits in your own projects, including commercial ones. Attribution is appreciated.
