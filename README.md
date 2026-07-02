# Agent Archive

## phase-01
<img width="1427" height="911" alt="image" src="https://github.com/user-attachments/assets/9ac76026-5e52-4ed0-9947-76a07b65511b" />


## Overview

Agent Archive is a static-data-first library of practical AI agents, prompts, install kits, and workflow recipes for real-world work.

## Features

- Browse 100 curated agents by role, category, task, and tool
- Search agents and filter installable project-ready agents
- View detailed agent cards with prompts, examples, real use cases, runbooks, and quality evaluations
- Copy portable prompt bundles or download markdown/JSON exports
- Download install kits for Codex, Claude, and Cursor
- Explore workflow packs
- Bookmark useful agents
- Submit new agent ideas

## Project-Ready Agents

20 agents currently include project install metadata. Each install kit includes:

- `AGENTS.md`
- `CLAUDE.md`
- Cursor `.mdc` rule
- `agent.json`
- `README.md`
- `RUNBOOK.md`
- `EVALUATION.md`

Quality evaluations include differentiated scores, recommended use cases, known weaknesses, review criteria, and sample runs.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS

## Getting Started

```bash
npm install
npm run dev
```

## Validation

```bash
npm run check:data
npm run lint
npm run build
```

## Future Roadmap

- Supabase database
- Authentication
- Community submissions
- Agent execution
- Team workspace
- Private internal agent archive
