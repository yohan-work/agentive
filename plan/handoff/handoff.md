# Agent Archive Handoff

## 1. Current State

Agent Archive is now a Next.js App Router MVP for browsing, searching, bookmarking, exporting, and reusing curated AI agents.

The project is intentionally static-data first. There is no DB, auth, or live web import pipeline. Agent data is stored in TypeScript files under `src/data`, and the app renders static/SSG pages from that data.

Latest verified state:

```txt
npm run build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (136/136)
✓ /agents/[slug] includes 100 agent detail pages
```

## 2. Implemented Features

### App Foundation

- Next.js App Router, TypeScript, Tailwind CSS.
- Dark documentation-style UI.
- Shared layout:
  - top navigation
  - left sidebar
  - main content column
  - right-side table of contents
- Responsive behavior:
  - desktop: sidebar + content + TOC
  - mobile: collapsible navigation, single-column cards

Main setup files:

- `package.json`
- `next.config.ts`
- `tailwind.config.ts`
- `tsconfig.json`
- `src/app/globals.css`

### Pages

Implemented routes:

```txt
/
/agents
/agents/[slug]
/categories
/categories/[slug]
/roles
/roles/[slug]
/workflows
/workflows/[slug]
/submit
/bookmarks
/about
```

Route files are under `src/app`.

### Agent Library

- Total agents: 100.
- Original manually written agents: 24.
- Additional generated static agents: 76.
- Existing 24 agents are preserved and automatically enriched with default Korean real-use-case content.

Data files:

- `src/data/agents.ts`
  - exports the final `agents` array.
  - merges the original core agents with the expanded dataset.
- `src/data/agent-expansion.ts`
  - contains the 76 additional static agents.
- `src/data/taxonomy.ts`
  - roles, categories, task tags.
- `src/data/workflows.ts`
  - workflow pack data.

Types:

- `src/types/agent.ts`
  - `Agent`
  - `AgentUseCase`
  - `Difficulty`
  - `VerifiedStatus`
- `src/types/workflow.ts`
- `src/types/taxonomy.ts`
- `src/types/portable-agent.ts`

### Search And Filters

`/agents` supports client-side search and filtering.

Search currently includes:

- agent name
- summary
- description
- tags
- categories
- roles
- tools
- real use case title/context/problem/howToUse/exampleInput/expectedResult

Filter fields:

- role
- category
- difficulty
- automation level
- tool
- verified status

Search logic:

- `src/lib/search.ts`

### Agent Detail

Each agent detail page includes:

- header metadata
- `Use this agent`
- when to use
- inputs
- outputs
- prompt
- example
- real use cases
- best practices
- limitations
- related agents

Main files:

- `src/app/agents/[slug]/page.tsx`
- `src/components/agents/agent-detail-header.tsx`
- `src/components/agents/agent-export-panel.tsx`
- `src/components/agents/agent-use-case-list.tsx`
- `src/components/agents/related-agents.tsx`

### Real Use Cases

Real use cases are stored on each agent as:

```ts
type AgentUseCase = {
  title: string;
  context: string;
  problem: string;
  howToUse: string;
  exampleInput: string;
  expectedResult: string;
  recommendedWorkflow?: string;
};
```

Content policy chosen:

- UI remains English.
- Real use cases are written in Korean.
- Web material is source-inspired only; no copied external prompt/case text.
- No Supabase or live web import in this phase.

### Agent Export

The `Use this agent` panel lets users:

- copy a full portable agent bundle
- download `.md`
- download `.json`

The export includes:

- role
- description
- use cases
- inputs
- outputs
- prompt
- examples
- best practices
- limitations
- real use cases
- metadata

Main files:

- `src/components/agents/agent-export-panel.tsx`
- `src/lib/agent-export.ts`
- `src/types/portable-agent.ts`

### Bookmarks

- Bookmark agents without login.
- Stored in `localStorage`.
- Visible at `/bookmarks`.

Main files:

- `src/components/agents/bookmark-button.tsx`
- `src/components/agents/bookmarks-list.tsx`
- `src/lib/bookmarks.ts`

### Workflows

Workflow packs are static and link to agent slugs.

Implemented workflows:

- Website Outsourcing Proposal Flow
- Codex Development Prep Flow
- Meeting Notes Automation Flow
- Content Production Flow
- Local Business Validation Flow

Main files:

- `src/data/workflows.ts`
- `src/app/workflows/page.tsx`
- `src/app/workflows/[slug]/page.tsx`
- `src/components/workflows/workflow-card.tsx`
- `src/components/workflows/workflow-steps.tsx`

## 3. Commit History

Recent feature commits:

```txt
0554df4 feat: include use cases in search and export
3fd4979 feat: show real use cases on agent details
27c479d feat: expand static agent library
67a47c3 fix: dedupe browse task links
5935c77 feat: implement agent archive experience
3c46036 feat: add agent archive data model
bb9da74 chore: scaffold agent archive app
```

Note: `origin/main` currently points to:

```txt
0ef6428 feat : ENV SHOT
```

Local `main` has commits after that.

## 4. Known Decisions

- Do not use Supabase yet.
- Do not add live web import/search yet.
- Keep `src/data` as the source of truth for now.
- Keep generated/static agent expansion in `src/data/agent-expansion.ts`.
- Keep export portable and platform-neutral.
- Prioritize practical agent usage over marketplace/import complexity.

## 5. Validation

Last validation command:

```bash
npm run build
```

Result:

```txt
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (136/136)
```

## 6. Next Recommended Work

High-value next steps:

1. Improve data quality for the 76 expanded agents.
   - Replace templated prompts with more domain-specific prompts.
   - Add 2-3 real use cases for high-priority agents.
   - Add better related-agent links.

2. Add a dedicated `/cases` page.
   - Aggregate all `AgentUseCase` entries.
   - Filter by role/category/workflow.
   - Link each case back to its agent.

3. Improve agent browsing for 100+ items.
   - Add category counts.
   - Add role counts.
   - Add sorting by role, difficulty, verification, or automation level.

4. Add data integrity checks.
   - Verify unique slugs.
   - Verify related agent slugs exist.
   - Verify workflow step agent slugs exist.
   - Verify every agent has at least one real use case.

5. Consider splitting data by domain.
   - `src/data/agents/planning.ts`
   - `src/data/agents/development.ts`
   - `src/data/agents/marketing.ts`
   - `src/data/agents/index.ts`

6. Later, revisit web-based sourcing.
   - Start with curated manual research.
   - Avoid automatic publishing.
   - Keep source material as inspiration, not copied content.

## 7. How To Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Default local URL:

```txt
http://localhost:3000
```
