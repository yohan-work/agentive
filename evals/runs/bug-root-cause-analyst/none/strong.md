## Summary

Most likely cause: **the lockfile was written by npm 11 on your laptop and is being checked by npm 10 in CI.** `node-version-file: .nvmrc` with `22` gives CI Node 22.x, which bundles **npm 10.x**. Your laptop runs Node 24 with **npm 11.6.2**. The two majors treat optional and peer dependencies of platform-specific WASM fallback packages differently. `@emnapi/core` and `@emnapi/runtime` are exactly that kind of package: `@napi-rs/wasm-runtime` and `@img/sharp-wasm32` (the WASM fallback for sharp, which Next pulls in) depend on them. npm 11 decided those entries didn't need to be in the lockfile. npm 10's `npm ci` sync check decides they do, and it bails with `EUSAGE` before installing anything.

The `"optional"` / `"peer"` flags you saw move under `node_modules/@img/...` and `node_modules/@napi-rs/...` are the fingerprint of this. That churn is npm 11 re-resolving the tree on top of a lockfile that npm 10 (or an earlier npm) had written.

---

## Hypotheses, ranked

### H1 — npm major-version mismatch between lockfile author and CI (high, ~75%)
- Lockfile written by npm 11.6.2 (Node 24, local). Validated by npm 10.x (Node 22, CI).
- npm 11 omits or flags the `@emnapi/*` entries differently. npm 10's stricter `npm ci` validation reports them as "Missing from lock file".
- Fits every symptom: it's deterministic (3 re-runs, cache cleared), fails in about 6s (validation happens before any download), main is green (its lockfile was produced consistently), and it works locally (npm 11 agrees with its own lockfile).
- `npm ls @emnapi/runtime` printing `(empty)` locally also fits. On darwin-arm64 the WASM fallbacks are never installed, so nothing under them shows up in the tree. npm 10's `ci` still validates the lockfile across all platforms, though.

### H2 — The PR merge commit, not your branch head, is out of sync (medium-low, ~15%)
- For `pull_request` events, Actions checks out `refs/pull/<N>/merge`, which is your branch merged into current main.
- If main changed `package.json` or `package-lock.json` after you branched (a Next bump, for example), the merged `package.json` can disagree with the merged lockfile even though each side is fine alone.
- This is weaker than H1 because the missing packages are `@emnapi/*`, which point to the WASM/optional subtree, not to an unrelated dep. It's cheap to rule out, though.

### H3 — The committed lockfile differs from your local one (low, ~7%)
- Examples: a partial `git add -p`, a later `npm install` that you didn't commit, or a pre-commit hook or formatter touching `package-lock.json`.
- Your local `npm ci` would then pass against a file CI never sees.

### H4 — A genuine npm 11 lockfile bug that would also fail on npm 11 in CI (low, ~3%)
- npm 11 could have pruned the entries in a platform-dependent way, so that even npm 11 on Linux would object.
- Your local `npm ci` passing with npm 11 makes this unlikely, but step 3 of the reproduction plan distinguishes it from H1.

**Not suspects:** the `cache: npm` setting (it only caches `~/.npm`, and clearing it changed nothing), `.nvmrc` or the workflow file themselves (unchanged, and main is green with them), and tsx/esbuild directly (they aren't the reported missing packages).

---

## Evidence map

| Observation | H1 npm 10 vs 11 | H2 merge ref | H3 uncommitted lock | H4 npm 11 bug |
|---|---|---|---|---|
| `EUSAGE` sync error, fails in ~6s | ✅ | ✅ | ✅ | ✅ |
| Deterministic across re-runs and cache clear | ✅ | ✅ | ✅ | ✅ |
| Local `npm ci` passes (npm 11.6.2) | ✅ strong | ✅ | ✅ | ⚠️ contradicts |
| main green | ✅ (lock not touched by npm 11) | ✅ | ✅ | ✅ |
| Missing packages are `@emnapi/*` (WASM fallback deps) | ✅ strong | ⚠️ unexplained | ⚠️ unexplained | ✅ |
| `optional`/`peer` flags churned under `@img/*`, `@napi-rs/*` | ✅ strong (re-resolution by a different npm) | ➖ | ➖ | ✅ |
| Local Node 24 / npm 11 vs CI Node 22 / npm 10 | ✅ strong | ➖ | ➖ | ➖ |
| `npm ls @emnapi/runtime` is empty on macOS arm64 | ✅ (fallbacks not installed on this platform) | ➖ | ➖ | ✅ |

✅ consistent / ⚠️ in tension / ➖ neutral

---

## Reproduction plan (about 15 minutes)

1. **Confirm CI's npm version.** Add `- run: node -v && npm -v` before `npm ci`, or read the setup-node step output. I expect `v22.x` / `10.x`.
2. **Reproduce locally with npm 10 on a clean checkout of what CI tests:**
   ```bash
   git fetch origin pull/<N>/merge:pr-merge   # what Actions actually checks out
   git worktree add /tmp/pr-merge pr-merge
   cd /tmp/pr-merge
   npx -y npm@10 ci --ignore-scripts         # expect: EUSAGE, Missing @emnapi/*
   ```
   Or match CI exactly with Docker:
   ```bash
   docker run --rm -v "$PWD":/app -w /app node:22 npm ci --ignore-scripts
   ```
3. **Separate H1 from H4.** In the same checkout, run `npx -y npm@11.6.2 ci --ignore-scripts`. If that passes, the lockfile is fine for npm 11 and the cause is the version mismatch (H1). If it fails too, especially inside `node:24` on Linux, it's H4.
4. **Rule out H2.** Repeat step 2 on your branch head (`git checkout <branch>`) instead of the merge ref. If the head passes and the merge ref fails, it's H2. Then `git diff origin/main...HEAD -- package.json package-lock.json` and `git log origin/main -- package-lock.json` will show what main changed.
5. **Rule out H3.** Run `git status package-lock.json` and `git diff HEAD -- package-lock.json` locally. Both should be empty.
6. **Optional confirmation:** `grep -n '"node_modules/@emnapi' package-lock.json` on main and on your branch. If main has the entries and your branch lost them (or changed their flags), H1 is confirmed.

---

## Fix direction (for today)

**Option A: regenerate the lockfile with CI's npm (smallest change, recommended to unblock the PR)**
```bash
git checkout origin/main -- package-lock.json   # start from the known-good lock
rm -rf node_modules
npx -y npm@10 install -D tsx@^4.23.15           # re-add tsx using npm 10
npx -y npm@10 ci --ignore-scripts               # verify it validates under npm 10
git add package.json package-lock.json
git commit -m "fix: regenerate lockfile with npm 10 to match CI"
```
The lockfile diff should shrink to roughly just tsx, esbuild, and their platform binaries, with no `@img`/`@napi-rs` flag churn. If it still churns, look at H2/H4.

**Option B: align CI with your local npm (if the project wants npm 11)**
Add this after setup-node, before `npm ci`:
```yaml
- run: npm install -g npm@11.6.2
```
This unblocks without touching the lock. It moves the whole project to npm 11, though, and every contributor on Node 22 will hit the same error in reverse. Treat it as a project decision, not a PR fix.

**Don't** switch CI to `npm install`. That hides the drift instead of fixing it.

**Preventing a repeat (follow-up PR):**
- Pin the toolchain so contributors match CI. Add `"packageManager": "npm@10.x.y"` (or `"devEngines": { "packageManager": { "name": "npm", "version": "^10" } }`) and `"engines": { "node": ">=22 <23" }` to `package.json`, and optionally `engine-strict=true` in `.npmrc`.
- Or move everything to Node 24 / npm 11 together: update `.nvmrc` to `24` and regenerate the lock on main once.
- Add a line to CONTRIBUTING: "Use the Node version in `.nvmrc` (`nvm use`) before changing dependencies."
