## Short version

Your lockfile is fine according to the npm that wrote it (npm 11.6.2 on macOS) and not fine according to the npm CI uses (Node 22, so the bundled npm 10.x on Linux). The two disagree about whether `@emnapi/core` and `@emnapi/runtime` belong in the lock. Those packages only matter to WebAssembly fallback builds of native packages (`@img/sharp-wasm32` under `sharp`, `@napi-rs/wasm-runtime` under various `@napi-rs/*` / `*-wasm32-wasi` packages). They never install on your Mac, which is why `npm ls @emnapi/runtime` prints `(empty)`. The `"optional"` / `"peer"` flags that moved under `@img/...` and `@napi-rs/...` in your lock diff are the clue.

Fix for today: regenerate the lockfile with the same Node/npm major that CI uses, and commit that.

---

## Hypotheses, ranked

### H1 (most likely): npm major-version mismatch between lock author and CI
- **You:** Node 24.9.0 / npm 11.6.2 wrote the lock when you ran `npm install -D tsx`.
- **CI:** `.nvmrc` = `22`, so setup-node installs the latest Node 22, which ships npm 10.x.
- npm 11 and npm 10 resolve and record optional and peer dependencies of platform-specific packages differently. npm 11 recomputed the tree during your install (that's the flag churn under `@img/*` and `@napi-rs/*`) and wrote a lock with no `node_modules/@emnapi/*` entries. On Linux, npm 10's `npm ci` rebuilds the ideal tree from `package.json`, decides `@emnapi/core@1.11.3` and `@emnapi/runtime@1.11.3` are needed (as deps or peers of the wasm fallback packages), sees they're missing from the lock, and exits with `EUSAGE`.
- Why it passes locally: `npm ci` runs the same validation as the npm that wrote the lock, so it agrees with itself.
- Why main is green: main's lock was last written before this change, either by npm 10 or with those flags in the state npm 10 expects. Your install rewrote that part of the tree.

### H2 (likely, and may overlap with H1): npm 11 dropped cross-platform optional deps from the lock
- npm has a long-running class of bugs (e.g. npm/cli#4828 and follow-ups) where running `npm install` on one OS/arch prunes optional dependencies, or their transitive deps, that belong to other platforms. In that case the lock is incomplete no matter which npm reads it on Linux.
- The difference from H1: under H2, even npm 11 on Linux fails `npm ci`. Under H1, only npm 10 fails. The reproduction plan below tells them apart, and the fix is almost the same either way.

### H3 (low to medium): the PR is tested on a merge commit, not your branch head
- `pull_request` workflows check out `refs/pull/<n>/merge`. If main's `package.json` or `package-lock.json` changed after you branched, the merged lock could be out of sync even though your branch alone is fine.
- The error names only `@emnapi/*`, which lines up with your tsx/esbuild change, so this is less likely. It takes one command to rule out.

### H4 (very unlikely): cache or runner flakiness
- Ruled out. Three reruns and a cleared Actions cache all gave the same deterministic `EUSAGE`. `EUSAGE` is a lockfile/manifest consistency check that runs before any download, which also matches the ~6 s failure.

---

## Evidence map

| Evidence | H1 npm 10 vs 11 | H2 lock pruned | H3 merge ref | H4 cache |
|---|---|---|---|---|
| Fails only in CI; `npm ci` passes locally | strongly supports | supports (different OS) | supports | weak |
| Local npm 11.6.2 vs CI Node 22 (npm 10.x) | strongly supports | neutral | neutral | neutral |
| Missing packages are `@emnapi/*` (wasm fallback only, never installed on darwin-arm64) | supports | strongly supports | weak | contradicts |
| `optional`/`peer` flags moved under `@img/*` and `@napi-rs/*` without hand edits | strongly supports (lock re-shaped by a different npm) | supports | neutral | neutral |
| `npm ls @emnapi/runtime` empty locally | consistent (not needed on this platform) | consistent | neutral | neutral |
| Same error after 3 reruns + cache clear | consistent | consistent | consistent | **contradicts** |
| Fails in ~6 s with `EUSAGE`, before any fetch | consistent (pre-install validation) | consistent | consistent | contradicts |
| main is green | consistent (main's lock predates npm 11 rewrite) | consistent | weakly contradicts | neutral |

---

## Reproduction plan (about 15 minutes, all local)

Run these from a clean checkout of the PR branch.

1. **Check what the lock actually contains:**
   ```bash
   grep -n '"node_modules/@emnapi' package-lock.json      # expect: nothing
   git show main:package-lock.json | grep -n '"node_modules/@emnapi'   # does main have them?
   git diff main -- package-lock.json | grep -n -B4 -A4 -E '"(peer|optional)": true'
   ```
   If main has `@emnapi/*` entries and your branch doesn't, your install removed them.

2. **Reproduce CI exactly (Linux, Node 22 / npm 10):**
   ```bash
   docker run --rm -v "$PWD":/app -w /app node:22 \
     sh -c 'node -v && npm -v && npm ci --ignore-scripts --dry-run'
   ```
   Expected: the same `Missing: @emnapi/... from lock file` error. That confirms the failure isn't specific to GitHub.

3. **Separate H1 from H2 (Linux, npm 11):**
   ```bash
   docker run --rm -v "$PWD":/app -w /app node:24 \
     sh -c 'npm -v && npm ci --ignore-scripts --dry-run'
   ```
   - Passes means H1: only the npm major matters.
   - Fails means H2: the lock itself is missing cross-platform entries.

4. **Check npm 10 on your Mac too (optional):**
   ```bash
   npx -y npm@10 ci --ignore-scripts --dry-run
   ```

5. **Rule out H3:**
   ```bash
   git fetch origin main && git merge-tree $(git merge-base HEAD origin/main) origin/main HEAD -- package-lock.json | head
   git log origin/main --since="<your branch date>" -- package.json package-lock.json
   ```
   If main hasn't touched either file since you branched, H3 is out.

Note: `--dry-run` still runs the lock consistency check, so it's enough to reproduce `EUSAGE` without a full install. Drop it if you want to be certain.

---

## Fix direction (act on today)

**Recommended: regenerate the lock with CI's toolchain, without throwing the lock away.**
```bash
git checkout <pr-branch>
docker run --rm -v "$PWD":/app -w /app node:22 \
  sh -c 'rm -rf node_modules && npm install --ignore-scripts && npm ci --ignore-scripts --dry-run'
git diff --stat package-lock.json      # expect @emnapi/* entries added, small diff
git commit -am "fix: regenerate package-lock with npm 10 so npm ci passes in CI"
```
- Use `npm install`, not `rm package-lock.json && npm install`. Deleting the lock re-resolves every range and can pull in unrelated upgrades.
- If you have no Docker, `nvm use 22 && npm install` on your Mac gets you npm 10. Then confirm with step 2's container or just push. If H2 is the real cause, a macOS regeneration can still miss Linux-only entries, so the container is safer.
- After committing, rerun steps 2 and 3. Both should pass.

**Then prevent a repeat (pick one, small follow-up PR):**
- **Align local with CI:** everyone uses the `.nvmrc` version (`nvm use` / `fnm use`), so lockfiles get written by npm 10. You're on Node 24 locally, so this is where the drift came from.
- **Or move CI to match you:** bump `.nvmrc` to `24` (npm 11) if the project is ready for Node 24. That's a project decision, and main's lock would then be written by npm 11 from that point on.
- **Or pin npm explicitly:** add `"packageManager": "npm@10.x.y"` (or `devEngines.packageManager`) to `package.json`, and optionally a CI step `npm i -g npm@<pinned>` before `npm ci`. Everyone then writes and reads the lock with the same npm.
- Optional guard: a CI or pre-push check that runs `npm ci --dry-run` under the CI Node version whenever `package-lock.json` changes.

**Don't do these:** switching CI to `npm install` (hides the drift and makes builds non-reproducible), or adding `@emnapi/*` to your own `package.json` (you don't use them, and it only covers up the lock mismatch).
