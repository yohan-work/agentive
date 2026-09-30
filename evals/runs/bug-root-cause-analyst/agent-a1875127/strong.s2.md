You gave enough to work with. Two facts would settle this quickly, so if you can get them, please send them:

1. **The exact npm version in CI.** Add `- run: node -v && npm -v` before `npm ci`, or expand the "Setup Node" step in the log.
2. **Whether main's `package-lock.json` has `@emnapi/core` / `@emnapi/runtime` entries.** Run `git show main:package-lock.json | grep -n '"node_modules/@emnapi'`.

The analysis below doesn't wait on those answers. Anything I haven't verified is marked [ASSUMPTION].

---

## 1. Evidence

| Fact | What it tells us |
|---|---|
| `npm error code EUSAGE` … "package.json and package-lock.json … are in sync" | This isn't a network, registry, auth, or build error. npm checked the lockfile against the dependency tree it calculated itself and rejected it before downloading anything. That fits the ~6 s failure time. **Rules out**: flaky network, registry outage, broken postinstall scripts, disk issues. |
| `Missing: @emnapi/runtime@1.11.3` and `Missing: @emnapi/core@1.11.3 from lock file` | The CI npm thinks these two packages belong in the tree and can't find them in the lock. Your local `npm ls @emnapi/runtime` prints `(empty)`, so your local npm doesn't think they belong. **The two npm installs disagree about the same lockfile.** That disagreement is the whole bug. |
| `@emnapi/*` is not a direct dependency of yours | It comes in transitively. In the npm ecosystem, `@emnapi/core` and `@emnapi/runtime` are usually dependencies or peer dependencies of **WebAssembly fallback builds** of native packages, like `@napi-rs/wasm-runtime` and `@img/sharp-wasm32` (the latter comes from `sharp`, which Next.js uses for image optimization). Those fallbacks are `optional` and platform-gated. [ASSUMPTION: that's where they come from in your tree. §2 has a command to confirm it.] |
| `"optional": true` / `"peer": true` flags moved under `node_modules/@img/...` and `node_modules/@napi-rs/...` | **Yes, this matters, and it's the most important detail you gave.** These are the packages that pull in `@emnapi/*`. When the flags moved, the npm that wrote the lock classified the optional/peer subtree differently. That's exactly the sort of change that makes a different npm decide entries are "missing". |
| Lock diff +61 / −38 for a single `tsx` add | tsx and esbuild explain the additions. The **38 deleted lines** are the suspicious part. Adding tsx shouldn't delete anything. [ASSUMPTION: some of those lines were the `@emnapi/*` entries, or flags on their parents. Confirm with question 2.] |
| Local: Node **24.9.0**, npm **11.6.2**, macOS arm64 | Your local npm wrote the lock. |
| CI: `.nvmrc` = `22`, setup-node | CI runs Node 22. Node 22 ships with **npm 10.x**, not 11. [ASSUMPTION: CI uses the bundled npm. Confirm with question 1.] So a lock written by npm 11 is being checked by npm 10. That's a version mismatch *and* a platform mismatch (darwin-arm64 vs linux-x64). |
| Local `rm -rf node_modules && npm ci` passes | Your npm 11 on darwin agrees with the lock it wrote itself. That proves nothing about npm 10 on Linux. The laptop pass doesn't count against a lockfile problem. |
| Fails on 3 re-runs and with the Actions cache cleared | The failure is deterministic. **Rules out** cache corruption: `cache: npm` only caches `~/.npm` anyway, and EUSAGE happens before the cache matters. |
| main is green, `.nvmrc` and workflow unchanged | The CI environment is the same as for main. What changed is the lockfile. The trigger is the lockfile write from `npm install -D tsx`. |

---

## 2. Hypotheses (ranked)

### H1 (most likely): An npm 11 lockfile checked by npm 10 in CI, which disagrees about optional peer dependencies

**How it breaks:** `npm install -D tsx` under npm 11.6.2 re-evaluated the whole tree and rewrote the optional/peer flags under `@img/*` and `@napi-rs/*`. It either dropped the `@emnapi/*` entries or never wrote them, because npm 11 treats them as unnecessary for the optional wasm fallbacks on your machine. npm 10 on Linux, which Node 22 bundles, rebuilds the ideal tree from `package.json`. It decides `@emnapi/core` and `@emnapi/runtime@1.11.3` are required (e.g. as non-optional peers of an optional package), doesn't find them in the lock, and fails with EUSAGE.

- **For:** the local/CI npm major versions differ. Only the lockfile changed. The flag churn is in the exact subtree that depends on `@emnapi`. The error is deterministic. `npm ls` says empty locally but CI says required.
- **Against:** I can't see the CI npm version yet, so I haven't confirmed it's 10.x.

**Confirm or kill it** by reproducing CI's npm on your laptop, with no Docker needed:
```bash
git stash -u   # clean tree
rm -rf node_modules
npx -y npm@10 ci
```
- **If H1 is right:** you get the same `EUSAGE … Missing: @emnapi/runtime@1.11.3 … @emnapi/core@1.11.3`.
- **If H1 is wrong:** it installs cleanly. Then npm version alone isn't the trigger, so go to H2.

Also check which package asks for `@emnapi`, without trusting either npm's tree:
```bash
grep -n -B2 -A12 '"@emnapi/' package-lock.json | grep -E 'node_modules/|@emnapi|optional|peer'
```
Expect it to show up under `dependencies` or `peerDependencies` of `node_modules/@napi-rs/wasm-runtime` and/or `node_modules/@img/sharp-wasm32` (or similar). If no package lists it, the lock was simply pruned.

### H2: A platform difference (lock written on darwin-arm64, checked on linux-x64), independent of npm version

**How it breaks:** even with the same npm version, the tree calculation for optional, OS/CPU-gated packages can differ between platforms. A lock written on macOS can leave out entries that Linux considers required.

- **For:** the platforms really differ, and the affected packages are exactly the platform-gated ones.
- **Against:** main's lock was presumably also generated on macOS and passes. H2 alone doesn't explain why it only broke now, unless it combines with H1.

**Confirm or kill it** by testing both platform and npm version in Docker from the repo root:
```bash
docker run --rm -v "$PWD":/app -w /app node:22 sh -c 'rm -rf node_modules && npm -v && npm ci'
docker run --rm -v "$PWD":/app -w /app node:24 sh -c 'rm -rf node_modules && npm -v && npm ci'
```
- **Both fail:** it's the platform (H2), whatever the npm version.
- **node:22 fails and node:24 passes:** it's the npm version (H1).
- **Both pass:** neither explains it, so go to §4.

(Warning: this deletes your local `node_modules`. Run `npm ci` again afterwards.)

### H3: The lock was actually pruned (entries deleted that main had)

This is less a separate cause than a way to see H1 in the data, but you can check it on its own.

**How it breaks:** the install removed the `@emnapi/*` package entries that main's lock had.

**Confirm or kill it:**
```bash
git show main:package-lock.json | grep -c '"node_modules/@emnapi'
grep -c '"node_modules/@emnapi' package-lock.json
git diff main -- package-lock.json | grep -n -A3 -B3 emnapi
```
- **If H3 is right:** main shows 2+ matches, the branch shows 0, and the diff shows `-` lines for them.
- **If H3 is wrong:** both show 0. Then main passes because its tree never made CI's npm need `@emnapi`, and something tsx/esbuild brought in (or a re-resolved `@napi-rs`/`@img` version) introduced that requirement. Check the diff for version bumps in those packages: `git diff main -- package-lock.json | grep -E '^[+-].*"version"'`.

### Unlikely (already ruled out or near it)
- **Actions cache:** ruled out, since you cleared it and EUSAGE comes before the cache matters.
- **tsx itself being broken:** unlikely. The error concerns lock consistency, not tsx.

---

## 3. Fix (for H1)

Regenerate the lock with the **same npm that CI uses**, starting from main's known-good lock. Don't patch the current one.

```bash
git checkout main -- package-lock.json
rm -rf node_modules

# Option A: use the project's Node (and its bundled npm)
nvm use            # reads .nvmrc -> 22
npm -v             # expect 10.x
npm install -D tsx@^4.23.15

# Option B: keep Node 24 but use npm 10 for this one command
# npx -y npm@10 install -D tsx@^4.23.15
```

**Verify before pushing:**
```bash
grep -c '"node_modules/@emnapi' package-lock.json      # expect > 0 again (if H3 was true)
rm -rf node_modules && npx -y npm@10 ci                 # must pass
docker run --rm -v "$PWD":/app -w /app node:22 sh -c 'rm -rf node_modules && npm ci && npm test'   # closest match to CI
git diff main -- package-lock.json | grep -E '^[-+]' | grep -v -E 'tsx|esbuild' | head -50   # should be mostly tsx/esbuild
```
The last check is a sanity check. The new diff should be much cleaner than +61/−38, with no stray flag changes under `@img`/`@napi-rs`.

Then commit (`fix: regenerate package-lock with npm 10 to match CI`) and push. CI should pass `npm ci` and go on to the later steps.

**Rollback:** this only changes the PR branch's lockfile. If CI still fails, `git revert` the commit, or reset the lock to the previous branch version. Nothing on main or anywhere in production is touched.

**Stop it happening again** (pick what suits the repo):
- Match local Node to `.nvmrc`. Use `nvm use` (or `fnm`/`volta`/`corepack` with auto-switching) so contributors don't write locks with npm 11 while CI uses npm 10.
- Declare the npm version, e.g. `"engines": { "node": "22.x", "npm": "10.x" }` in `package.json` plus `engine-strict=true` in `.npmrc`. Then `npm install` under the wrong npm fails fast locally, before it rewrites the lock. [Check how your npm version treats `engine-strict` for the `npm` field before relying on it.]
- Add `- run: node -v && npm -v` to the workflow so future logs show the versions straight away.
- Or go the other way: move CI to npm 11 (`.nvmrc` → `24`, or `npm i -g npm@11` in the workflow). Only do that after the Docker test in H2 shows npm 11 on Linux accepts the lock. Otherwise you just move the mismatch to the platform.

---

## 4. Missing evidence (if nothing above is confirmed)

- The full CI debug log (`/home/runner/.npm/_logs/2026-09-29T05_12_44_101Z-debug-0.log`). Upload it as an artifact with `actions/upload-artifact` using `if: failure()`. It shows which edge in the tree npm thinks needs `@emnapi/*`.
- The exact `npm -v` and `node -v` from the CI run.
- `npm explain @emnapi/runtime` run inside `node:22` Docker after a plain `npm install` (not `ci`). It shows who requires it on Linux.
- The complete `git diff main -- package-lock.json`, especially the 38 deleted lines and every `@img`/`@napi-rs` hunk.

---

**Also worth checking**
- `tests/*.test.ts` depends on shell glob expansion in npm scripts. On Linux CI that's `sh`, so confirm the glob matches there once the install passes.
- Local Node 24 vs CI Node 22 can also cause test/runtime differences (e.g. built-in TS type stripping). Running `npm test` under Node 22 locally catches that early.
