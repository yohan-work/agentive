# AGENTS.md

Guidance for AI coding agents (Codex, Claude Code, Cursor, and others) working in this repository. Human contributors should read [CONTRIBUTING.md](./CONTRIBUTING.md).

## Project

Agent Archive is a static-data-first Next.js 15 (App Router) + TypeScript + Tailwind site. There is no database or backend. `src/data` is the source of truth for agents, workflows, starter packs, and taxonomy.

## Commands

```bash
npm run dev          # dev server on :3000
npm run check:data   # data integrity (slugs, references, required metadata)
npm run lint         # ESLint (flat config in eslint.config.mjs)
npm run typecheck    # tsc --noEmit
npm run build        # production build
```

Run `check:data`, `lint`, `typecheck`, and `build` before you consider a change done. CI runs the same four.

## Layout

- `src/app/[locale]/…`: locale-prefixed routes (`en`, `ko`). Localized pages re-export the page implementations in `src/app/…`.
- `src/components/`: UI grouped by domain (`agents`, `workflows`, `layout`, `common`, …).
- `src/data/`: content. Agent types live in `src/types/agent.ts`.
- `src/lib/`: search, exports, and install-kit generation (`agent-install-kit.ts`).
- `src/i18n/dictionaries.ts`: UI strings. Add every new key to **both** `en` and `ko`.
- `scripts/check-data.mjs`: data validation. Extend it when you add a new cross-reference.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).
- Match the surrounding code style: function components, Tailwind utility classes, `cn()` from `src/lib/utils.ts`, and the theme tokens in `tailwind.config.ts` (`canvas`, `panel`, `line`, `primary`, `accent`, …).
- Never set an agent's `verifiedStatus` or evaluation scores higher than what was actually tested. See the verification levels in CONTRIBUTING.md.
- Agent content in `src/data` is CC BY 4.0; code is MIT.
