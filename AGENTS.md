# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code, Cursor, and others) working in this repository. Human contributors should read [CONTRIBUTING.md](./CONTRIBUTING.md).

## Project

Agent Archive is a static-data-first Next.js 16 (App Router) + TypeScript + Tailwind site, exported as static HTML (`output: "export"`) and deployed to GitHub Pages. There is no database or backend. Agents are one YAML file each in `content/agents/`; workflows, starter packs, and taxonomy are TypeScript in `src/data/`.

## Commands

```bash
npm run dev          # dev server on :3000 + content watcher
npm run check:data   # schema + integrity checks (slugs, references, required metadata)
npm run content      # validate + bundle content/agents/*.yaml -> src/data/generated/agents.ts (auto-runs before build/typecheck; dev watches)
npm run schema       # regenerate schema/agent.schema.json after changing AgentSource in src/types/agent.ts
npm run lint         # ESLint (flat config in eslint.config.mjs)
npm run typecheck    # tsc --noEmit
npm run build        # production build
```

Run `check:data`, `lint`, `typecheck`, and `build` before you consider a change done. CI runs the same four.

## Layout

- `src/app/[locale]/…`: every page lives here and reads its locale from `params` via `resolveLocale()`. `src/app/(root)` only redirects `/` to `/en/`. The build is fully static: no middleware, `headers()`, or server-side `searchParams` (read query strings on the client with `useSearchParams`).
- `src/components/`: UI grouped by domain (`agents`, `workflows`, `layout`, `common`, …).
- `content/agents/*.yaml`: one file per agent, validated against `schema/agent.schema.json`. Start from `content/agents/_template.yaml`.
- `src/data/`: workflows, starter packs, taxonomy, and the agent loader. `src/data/generated/` is build output. Never edit it.
- `src/types/agent.ts`: `Agent` and `AgentSource` types (the schema is generated from `AgentSource`).
- `src/lib/`: search, exports, and install-kit generation (`agent-install-kit.ts`).
- `src/i18n/dictionaries.ts`: UI strings. Add every new key to **both** `en` and `ko`.
- `scripts/check-data.mjs`: data validation. Extend it when you add a new cross-reference.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).
- Match the surrounding code style: function components, Tailwind utility classes, `cn()` from `src/lib/utils.ts`, and the theme tokens in `tailwind.config.ts` (`canvas`, `panel`, `line`, `primary`, `accent`, …).
- Never set an agent's `verifiedStatus` or evaluation scores higher than what was actually tested. See the verification levels in CONTRIBUTING.md.
- Agent content (`content/` and `src/data`) is CC BY 4.0; code is MIT.
