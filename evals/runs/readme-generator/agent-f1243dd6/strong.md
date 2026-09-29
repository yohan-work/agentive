Here's the README. I kept it short and made a few assumptions, which are listed under the file.

````markdown
# agentkit-cli

A zero-config Node CLI that installs agent **install kits** from [Agent Archive](https://yohan-work.github.io/agentive/) into your repo. It handles many agents at once and merges into existing files safely.

Without it, you run one curl command per agent. With it:

```bash
npx agentkit-cli add pr-review-agent test-case-generator --target claude
```

## What gets installed

Every project-ready agent in the archive publishes 7 files at stable URLs:

```
https://yohan-work.github.io/agentive/kits/<slug>/
  AGENTS.md  CLAUDE.md  cursor-rule.mdc  agent.json  README.md  RUNBOOK.md  EVALUATION.md
```

`agentkit add` downloads them to `./agent-kits/<slug>/`. If you pass `--target`, it also wires the agent into your tool's config:

| `--target` | Writes to |
|---|---|
| `codex`  | appends to `AGENTS.md` |
| `claude` | appends to `CLAUDE.md` |
| `cursor` | writes `.cursor/rules/<slug>.mdc` |

Each append is wrapped in markers:

```md
<!-- agentkit:pr-review-agent:start -->
...
<!-- agentkit:pr-review-agent:end -->
```

When you run the command again, it updates the block in place instead of adding a second copy. **agentkit never changes content outside its own marked blocks.**

## Getting started

Requires **Node >= 20.9**.

```bash
# one-off
npx agentkit-cli add <slug...>

# or install globally
npm install -g agentkit-cli
agentkit add <slug...>
```

Find slugs on [Agent Archive](https://yohan-work.github.io/agentive/). They're in each agent's URL.

## Usage

```bash
agentkit add <slug...>                        # download kits to ./agent-kits/<slug>/
agentkit add <slug> --target codex|claude|cursor
agentkit remove <slug>                        # remove the marked block and the kit folder
agentkit list                                 # installed kits and their agent.json version
```

| Option | Description |
|---|---|
| `--target <tool>` | `codex`, `claude`, or `cursor` (see table above) |
| `--dry-run` | Print the diff without writing anything |
| `--base-url <url>` | Use a self-hosted mirror of the archive |

**Exit codes:** the command exits non-zero if any kit file returns 404.

Tip: run with `--dry-run` first on repos that already have an `AGENTS.md` or `CLAUDE.md`.

## Development

```bash
npm install
npm run build      # tsup -> dist/
npm test           # vitest run
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm link           # try the `agentkit` command locally
```

Stack: TypeScript, commander, undici fetch, vitest, tsup.

## Known limitations

- **No Windows CI yet.** It's tested in CI on macOS and Linux only.
- **No offline cache.** Every `add` fetches from the network.
- **No signature or checksum verification.** Downloaded files are trusted as served. Only use `--base-url` with mirrors you control or trust, and review the diff (`--dry-run`) before committing, because these files become instructions for your coding agent.

## Roadmap

- [ ] Windows CI
- [ ] `agentkit update` to refresh all installed kits
- [ ] Checksum verification using `agent.json`
- [ ] `--pack <starter-pack>` to install a curated set of agents at once

## Contributing

Issues and PRs are welcome at [github.com/yohan-work/agentkit-cli](https://github.com/yohan-work/agentkit-cli). Please run `lint`, `typecheck`, and `test` before you open a PR.

## License

MIT
````

**Assumptions to check:**
1. The npm bin name is `agentkit`, so `npx agentkit-cli …` and a global `agentkit …` both work.
2. `--target claude` appends the kit's `CLAUDE.md`, and `--target codex` appends its `AGENTS.md`.
3. `--target` takes one value per run. If it accepts several (for example `--target claude,cursor`), update the usage line.
4. I left out a "what happens on a partial failure" line, because the brief doesn't say whether files already written are rolled back when one 404s.

**Risk to note:** The biggest one is unverified downloads that turn into agent instructions (a prompt-injection risk). I called it out under limitations instead of hiding it. Once checksum verification ships, change that bullet.

**Next actions:**
- Confirm the four assumptions above.
- Add a `CHANGELOG.md` entry for v0.3.0.
- Add npm version and CI badges under the title once the CI workflow URL is final.
