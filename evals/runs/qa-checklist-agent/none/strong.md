Here's a checklist you can paste straight into a GitHub issue. Fill the **Result** column with `PASS` / `FAIL` / `N/A`, and link a screenshot or command output in **Notes** for any FAIL.

A few things to know before you start:

- **There's no staging, so you're QA'ing production.** Decide the rollback up front (revert the offending PR on `main` and let CI redeploy) and record the deployed commit SHA below.
- **GitHub Pages caches responses for about 10 minutes.** Wait until the Pages deploy job is green, then use a private window or hard refresh. Otherwise you may be testing the previous build.
- **Pick fixture slugs before you start** so everyone tests the same pages:
  - `KIT_SLUG`: a project-ready agent with a kit.
  - `NOKIT_SLUG`: an agent without a kit.
  - `DOWNGRADED_SLUG`: one of the 61 agents moved from tested to unverified.
  - `TESTED_SLUG`: an agent that is still tested or expert, if any remain.
  - `WF_SLUG`: a workflow.
- **One likely finding to note now:** crawlers only read `robots.txt` at the host root (`https://yohan-work.github.io/robots.txt`). A file at `/agentive/robots.txt` is ignored by search engines. It still does no harm, and the sitemap can be submitted directly in Search Console. Just don't count on it to keep `/bookmarks` out of the index. Use a `noindex` meta tag on that page if that matters (see C-12).

```markdown
## Release QA — Agent Archive — week of YYYY-MM-DD

- Deployed commit: `<sha>`  |  CI run: <link>  |  Pages deploy: <link>
- Tester(s):  |  Started:  |  Finished:
- Fixtures: KIT_SLUG=`…` NOKIT_SLUG=`…` DOWNGRADED_SLUG=`…` TESTED_SLUG=`…` WF_SLUG=`…`
- Base URL: https://yohan-work.github.io/agentive
- Go / No-go: ☐ Go  ☐ No-go  — decided by: ___

Result legend: PASS / FAIL / N/A (+ issue link for FAIL)

---

### 1. Smoke (blocker gate — do first, ~15 min, desktop Chrome)

Any FAIL here = stop, no announcement, consider revert.

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| S-01 | Open `/agentive/` | Redirects to `/agentive/en/`, no 404, no redirect loop | | |
| S-02 | `/en/` and `/ko/` home load | Page renders, no console errors, CSS/JS assets 200 (no `/_next/...` 404s from basePath) | | |
| S-03 | `/en/agents/` | 100 cards render; result count reads 100 | | |
| S-04 | Type a known agent name in search | List filters to matching card(s) | | |
| S-05 | Open `/en/agents/KIT_SLUG/` | Detail renders; Download Kit button, curl command, 7 per-file links visible | | |
| S-06 | Click each of the 7 per-file links on KIT_SLUG | All return 200 (no 404), content matches the agent | | |
| S-07 | Run the copied curl one-liner in macOS zsh | Exit 0; `agent-kits/KIT_SLUG/` contains 7 non-empty files | | |
| S-08 | Open `/ko/agents/KIT_SLUG/` | Korean UI renders, no 404 | | |
| S-09 | `/agentive/sitemap.xml` | 200, valid XML, opens in browser | | |
| S-10 | `/agentive/robots.txt` | 200, plain text, `Sitemap:` line points to absolute `https://yohan-work.github.io/agentive/sitemap.xml` | | |
| S-11 | `/en/install/`, `/en/workflows/WF_SLUG/`, `/en/bookmarks/` | All load, no console errors | | |
| S-12 | Unknown path e.g. `/agentive/en/agents/does-not-exist/` | Site 404 page (not a blank page / not GitHub's generic 404 if a custom one exists) | | |

---

### 2. Regression by feature

#### 2a. Install kits (#13)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| K-01 | Count kits: all 20 project-ready agents have `/kits/<slug>/` | For every installable slug, all 7 files return 200 (script below) | | |
| K-02 | Non-installable agent (NOKIT_SLUG) | No curl command / Download Kit shown, or a clear "not installable" state; no links to 404 kit files | | |
| K-03 | `/agents` "installable only" toggle | Shows exactly 20 cards; every one has a working kit | | |
| K-04 | Content-Type headers (`curl -sI`) | Record actual types for `.md`, `.mdc`, `.json`. Acceptable: `.md` → `text/markdown` or `text/plain`; `agent.json` → `application/json`; `.mdc` → anything that downloads intact | | |
| K-05 | Per-file links in browser: `.md` / `.json` | Open or download without garbling; UTF-8 (Korean or special chars not mojibake) | | |
| K-06 | Per-file link: `cursor-rule.mdc` | Either displays as text or downloads as `cursor-rule.mdc` (not `.txt`, not `cursor-rule.mdc.bin`) — check Chrome, Safari, Firefox | | |
| K-07 | `agent.json` validity | `curl -s …/agent.json \| python3 -m json.tool` succeeds; slug in file = URL slug | | |
| K-08 | Downloaded files byte-identical to browser view | `shasum` of curl-downloaded files matches files saved via links / Download Kit | | |
| K-09 | Download Kit button | Produces the kit (zip or files) with all 7 files; filename includes slug | | |
| K-10 | Copy button on curl command | Clipboard contains exact single-line command with correct slug; no smart quotes, no trailing whitespace/newline issues | | |
| K-11 | curl URLs use the production base | Command contains `https://yohan-work.github.io/agentive/kits/<slug>/`, not localhost or a relative path | | |
| K-12 | Re-run curl command in same dir | Overwrites cleanly, exit 0 (idempotent) | | |
| K-13 | `-f` behavior | Edit slug to a bogus value and run: non-zero exit, no HTML 404 page saved as `AGENTS.md` | | |

#### 2b. Verification status (#14)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| V-01 | DOWNGRADED_SLUG detail page (en + ko) | Badge shows Unverified (ko equivalent); no "Tested" anywhere on page | | |
| V-02 | Same agent's card on `/agents`, home, and any workflow referencing it | Unverified badge everywhere (no stale "Tested") | | |
| V-03 | Status filter counts | "Tested" count dropped by 61 vs last release; counts sum to 100 | | |
| V-04 | TESTED_SLUG (if any) | Still shows Tested/Expert and has ≥ 2 sample runs visible | | |
| V-05 | Kit files for a downgraded installable agent | `agent.json` / `EVALUATION.md` / `README.md` show unverified, matching the page | | |
| V-06 | CI guard | CI log for this commit shows `check:data` ran and passed (optional: confirm a local tested-with-1-run fixture fails) | | |

#### 2c. Korean translation (#15, #19)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| L-01 | `/ko/agents/` search panel | Placeholder, 7 filter group titles, options, result count, "Clear all", installable toggle all in Korean | | |
| L-02 | Result count with particles/plurals | Grammatical Korean with numbers (e.g. `20개`), not `20 agents` | | |
| L-03 | Status + difficulty badges (ko) | All values translated; none fall back to raw keys (`status.unverified`) | | |
| L-04 | Agent and workflow cards (ko) | Labels translated; agent content itself may remain English (confirm this is intended) | | |
| L-05 | Detail page (ko): section headings, Download Kit, copy button, bookmark button, toasts/tooltips | Korean | | |
| L-06 | Language switcher on detail, `/agents` with filters applied, workflow page | Stays on the equivalent page in the other locale; note whether filters/query string survive | | |
| L-07 | Internal links from `/ko/…` pages | Stay under `/ko/` (no silent jump to `/en/`) | | |
| L-08 | `<html lang>` | `ko` on /ko pages, `en` on /en pages | | |
| L-09 | Search in Korean input (IME) | Typing Hangul with IME doesn't fire mid-composition glitches or lose characters (esp. Safari/macOS) | | |
| L-10 | Untranslated sweep | Walk every surface in /ko and list any English UI strings (see C-section) | | |

#### 2d. Sitemap & robots (#16)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| M-01 | Sitemap URLs are absolute with `/agentive/` prefix and trailing slash policy matching the site | e.g. `https://yohan-work.github.io/agentive/en/agents/<slug>/` | | |
| M-02 | Each URL entry has `xhtml:link rel="alternate"` for `en` and `ko` (+ `x-default` if intended) | Pairs are reciprocal and point to the same page | | |
| M-03 | No `/bookmarks` URLs (either locale) | Absent | | |
| M-04 | Coverage | Contains home, agents index, all 100 agent pages × 2 locales, install, all workflows × 2 locales | | |
| M-05 | Every sitemap URL returns 200 | Script below: 0 failures | | |
| M-06 | Kit files and `/` redirect not listed | Absent (they're not pages) | | |
| M-07 | Pages' HTML `<link rel="alternate" hreflang>` / canonical (if present) | Consistent with sitemap | | |

#### 2e. Existing features (no intended change)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| R-01 | Each of the 7 filter groups: select one, combine two | Count and cards update correctly; "Clear all" resets everything incl. installable toggle | | |
| R-02 | Filter/search state in URL | Reload and back/forward restore state (if supported before) | | |
| R-03 | Empty result state | Sensible "no results" message in en and ko | | |
| R-04 | Bookmark add/remove from detail page | Appears on/disappears from `/bookmarks`; persists after reload | | |
| R-05 | Bookmarks across locales | Bookmark made on /en shows on /ko bookmarks page (and vice versa) | | |
| R-06 | Bookmarks in private window / storage blocked | Page doesn't crash | | |
| R-07 | `/install` page | Instructions consistent with new curl command (no `--output-dir` left anywhere) | | |
| R-08 | Workflow page | Linked agents resolve; badges current | | |
| R-09 | Keyboard: tab through filters, toggle, copy button, bookmark | Focus visible, all operable, Enter/Space work | | |
| R-10 | Lighthouse (mobile) on `/en/agents/` | No big regression in perf/a11y vs last release | | |

---

### 3. Device / browser matrix

Run the "core path" on each cell: home → /agents (search + one filter + installable toggle) → KIT_SLUG detail (copy curl, open one per-file link, bookmark) → /bookmarks → switch to /ko and repeat the /agents + detail steps.

| ID | Platform | Browser | en core path | ko core path | Per-file link behavior (.md / .mdc / .json) | Result | Notes |
|----|----------|---------|--------------|--------------|------------------------------------------|--------|-------|
| D-01 | macOS | Chrome latest | | | | | |
| D-02 | macOS | Safari latest | | | | | |
| D-03 | macOS | Firefox latest | | | | | |
| D-04 | Windows 11 | Chrome latest | | | | | |
| D-05 | Windows 11 | Firefox latest | | | | | |
| D-06 | Windows 11 | Edge (optional, Chromium) | | | | | |
| D-07 | iPhone 13 mini (375px) | iOS Safari 17+ | | | | | |
| D-08 | Pixel 7 | Android Chrome | | | | | |

Mobile-specific (D-07, D-08):

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| D-09 | 375px, /ko/agents: badges, filter chips, "Clear all", counts | No overflow, clipping, or ugly mid-word breaks; no horizontal page scroll | | |
| D-10 | 375px, /ko detail: long badge combos (status + difficulty + tags) | Wrap cleanly | | |
| D-11 | curl command block on mobile | Scrolls horizontally inside its box or wraps; doesn't widen the page; copy button reachable | | |
| D-12 | Copy button on iOS Safari | Clipboard actually contains the command (iOS clipboard API quirks) | | |
| D-13 | Tapping `.mdc` / `.md` link on iOS / Android | Doesn't dead-end (acceptable: shows text or offers download) | | |
| D-14 | Filter panel on mobile (drawer/collapsible if any) | Opens/closes, scroll works, toggle tappable (≥ 44px target) | | |

#### Terminal matrix (curl one-liner, KIT_SLUG)

| ID | Environment | Command as shown on page | Expected | Result | Notes |
|----|-------------|--------------------------|----------|--------|-------|
| T-01 | macOS zsh (system curl) | paste verbatim | Exit 0, 7 files, non-empty | | |
| T-02 | Ubuntu 20.04 bash, curl 7.68 | paste verbatim | Exit 0, 7 files (confirms `--output-dir` removal works) | | |
| T-03 | Windows PowerShell 5.1 | paste verbatim | **Likely FAIL**: `curl` is an alias for `Invoke-WebRequest`, `&&` isn't valid in 5.1 | | |
| T-04 | PowerShell 7.x | paste verbatim | `&&` works, but `curl` may still resolve to the alias — record result | | |
| T-05 | PowerShell, using `curl.exe` explicitly | `mkdir agent-kits\SLUG; cd agent-kits\SLUG; curl.exe -fsSL --remote-name-all "https://…/kits/SLUG/{AGENTS.md,CLAUDE.md,…}"` | Exit 0, 7 files. Braces are expanded by curl's own URL globbing (not the shell) because the URL is quoted, so this should work | | |
| T-06 | Any shell: file sanity | `wc -c *` all > 0; `head -1 AGENTS.md` isn't `<!DOCTYPE html>` | | |

> If T-03/T-04 fail, either add a separate PowerShell snippet on the page/`/install`, or a note "Windows: use `curl.exe` in PowerShell 7 or Git Bash". Decide whether that blocks the announcement.

---

### 4. Content checks

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| C-01 | Status distribution | Page/filter counts match data: 61 more unverified than last release; no agent shows "Tested" without ≥ 2 sample runs | | |
| C-02 | Spot-check 5 downgraded agents (en + ko) | Badge, card, detail, kit files all say unverified | | |
| C-03 | Spot-check 5 installable agents' kit files | Slug, name, and description in AGENTS.md / CLAUDE.md / agent.json match the detail page; no template placeholders (`<slug>`, `TODO`, `{{…}}`) | | |
| C-04 | RUNBOOK.md / EVALUATION.md | Evaluation info doesn't claim a higher status than the page | | |
| C-05 | Kit docs reference the right URLs | Any URLs inside kit files use `/agentive/` base and work | | |
| C-06 | /ko untranslated strings sweep: home, /agents, detail, /install, workflow, bookmarks, 404, footer/header, meta `<title>` / description | List every remaining English UI string; decide ship vs fix | | |
| C-07 | Korean copy quality | Consistent terminology (the same term used for "agent", "workflow", "kit" everywhere); badge wording short enough for chips | | |
| C-08 | Numbers in ko | "100", "20" counts correct and formatted consistently | | |
| C-09 | Page titles/meta per locale | ko pages have Korean `<title>`; share previews (OG) not broken | | |
| C-10 | No references to `--output-dir` | Search site/kit text: none | | |
| C-11 | Announcement copy | Claims match what shipped (20 kits, status changes explained, ko coverage stated accurately) | | |
| C-12 | Bookmarks indexing | `/bookmarks` excluded from sitemap; optional `noindex` meta present (robots.txt under `/agentive/` isn't read by crawlers) | | |

---

### Sign-off

- [ ] All Smoke PASS
- [ ] No open FAIL rated blocker in Regression / Device / Content
- [ ] Known non-blockers filed as issues: #…
- [ ] Rollback plan confirmed (revert PR # / redeploy commit `<sha>`)
- [ ] Announce
```

### Helper scripts

Kit availability and content types (K-01, K-04, K-06). Put the 20 installable slugs in `slugs.txt`:

```bash
BASE=https://yohan-work.github.io/agentive/kits
FILES="AGENTS.md CLAUDE.md cursor-rule.mdc agent.json README.md RUNBOOK.md EVALUATION.md"
while read -r s; do
  for f in $FILES; do
    out=$(curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}" "$BASE/$s/$f")
    echo "$s/$f $out"
  done
done < slugs.txt | tee kit-check.txt
grep -v '^.* 200 ' kit-check.txt && echo "FAILURES ABOVE" || echo "all 200"
```

Sitemap URLs all return 200 (M-05):

```bash
curl -s https://yohan-work.github.io/agentive/sitemap.xml \
  | grep -o '<loc>[^<]*</loc>' | sed -E 's#</?loc>##g' \
  | while read -r u; do printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "$u")" "$u"; done \
  | grep -v '^200' || echo "all sitemap URLs 200"
```

Stale "Tested" badges on downgraded agents (V-01, C-02). Put the 61 slugs in `downgraded.txt`:

```bash
while read -r s; do
  for l in en ko; do
    curl -s "https://yohan-work.github.io/agentive/$l/agents/$s/" | grep -qi 'tested' && echo "CHECK $l/$s"
  done
done < downgraded.txt
```

(This grep is rough. "Tested" can show up in body text, so treat hits as items to look at by hand, not as automatic FAILs. For `ko`, replace `tested` with the Korean label you use for the tested status.)

### Suggested blocker vs non-blocker triage

- **Blocker:** any Smoke fail, any kit file returning 404 or HTML, the curl command failing on macOS or Ubuntu 20.04, "Tested" badges still showing on downgraded agents, or the sitemap listing URLs that 404.
- **Usually non-blocker, but file an issue:** PowerShell needing a separate snippet (add a note to the page before announcing), `.mdc` downloading instead of displaying, a few English strings left on /ko, and minor chip wrapping at 375px (anything that breaks the layout is a blocker).
