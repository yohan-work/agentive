# Release QA Checklist: Agent Archive (PRs #13–#19)

You gave me enough context, so I haven't asked any clarifying questions. Where I had to guess, it's listed under assumptions. Everything below is formatted to paste straight into a GitHub issue. Fill the **Result** column with ✅ / ❌ / ⚠️ and put evidence (URL, screenshot, terminal output) in **Notes**.

---

## Assumptions

1. **The "Pages preview of main" is production.** GitHub Pages has one live site per repo, so once CI deploys main, users see it. Your QA window runs *after* go-live and *before* the announcement. Rollback means reverting the PR(s) and letting CI redeploy, which takes about 2–5 min plus up to 10 min of CDN cache (`max-age=600`).
2. Base path is `/agentive/`. Every asset, kit URL, sitemap `<loc>` and hreflang must include it.
3. "Download Kit" is a client-side action (zip or multi-file). I check that it produces all 7 files, not how it builds them.
4. There are exactly 20 installable agents. The 61 downgraded agents now show "unverified". Before starting, get the expected **status counts** (tested / expert / unverified / …) from `content/agents/` on main so you have numbers to compare against.
5. Hard-refresh or use a private window for every check, because the Pages CDN can serve the previous build for up to 10 minutes.

## Top risks (ranked) and what I'd do about each

| # | Risk | Likelihood / impact | Mitigation in this checklist |
|---|------|---------------------|------------------------------|
| R1 | **The PowerShell curl command fails.** The braces aren't the problem: they sit inside double quotes, so **curl** globs them, not the shell, and that works in `curl.exe`. The real blockers are that `mkdir -p` and `( … )` subshells are bash syntax, `&&` only works in PowerShell 7+, and `curl` in Windows PowerShell 5.1 is an alias for `Invoke-WebRequest`. | High / Medium | S-07, R-10. If it fails, add a separate PowerShell snippet (see Next actions). |
| R2 | `.mdc` served as `application/octet-stream` and `.md` as `text/markdown`. Browsers **download** these instead of displaying them. `agent.json` could be served with an unexpected type. | Medium / Low–Medium | C-10 to C-12. This mostly affects per-file links clicked in a browser. curl doesn't care. |
| R3 | Stale "Tested" badges or stale filter counts after #14 | Medium / High (trust issue) | C-01 to C-05 |
| R4 | Korean strings overflowing badges/chips at 375px | High / Low | D-section, R-15 |
| R5 | Untranslated English strings on `/ko` | High / Low | C-06 to C-09 |
| R6 | **`robots.txt` at `/agentive/robots.txt` is ignored by crawlers.** Crawlers only read `robots.txt` at the host root (`yohan-work.github.io/robots.txt`), and a project site can't serve that. The sitemap still works if you submit it in Search Console. | Certain / Low | C-15. Record it as a known limitation, not a release blocker. |
| R7 | Sitemap URLs missing the `/agentive` base path or the trailing slash, or hreflang pairs that don't match | Medium / Medium (SEO) | C-13, C-14 |

---

## 1. Smoke (about 10 min, run immediately after deploy; any ❌ here = stop, don't announce)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| S-01 | Load `https://yohan-work.github.io/agentive/` | Redirects to `/agentive/en/`, no 404, no console errors | | |
| S-02 | Load `/agentive/ko/` | Korean home renders, `<html lang="ko">` | | |
| S-03 | `/en/agents/` | 100 cards render and the count shows 100 | | |
| S-04 | Open one installable agent detail page (`/en/agents/<slug>/`) | Page renders with the Download Kit button, curl command, 7 per-file links and the bookmark button | | slug: |
| S-05 | `curl -sI https://yohan-work.github.io/agentive/kits/<slug>/AGENTS.md` | `HTTP/2 200` | | |
| S-06 | Copy the curl one-liner from the page and run it in macOS zsh | `agent-kits/<slug>/` contains 7 non-empty files, exit code 0 | | |
| S-07 | Run the same one-liner in Ubuntu 20.04 bash (curl 7.68) | 7 files, exit code 0, no `--output-dir` error | | |
| S-08 | `/agentive/sitemap.xml` and `/agentive/robots.txt` | Both 200; XML parses | | |
| S-09 | `/en/install/`, one `/en/workflows/<slug>/`, `/en/bookmarks/` | All render without errors | | |
| S-10 | The deployed commit SHA matches the main HEAD that passed CI | They match (check the Pages deployment in Actions) | | SHA: |

## 2. Regression (existing features that the changes touch)

| ID | Check | Expected | Result | Notes |
|----|-------|----------|--------|-------|
| **Search & filters (/agents)** | | | | |
| R-01 | Keyword search (en), e.g. "review" | Results narrow and the count updates | | |
| R-02 | Keyword search on `/ko/agents/` with an English term and a Korean term | Both behave sensibly, no crash | | |
| R-03 | Apply one filter from each of the 7 groups, one at a time | Count and cards update, and the counts are consistent | | |
| R-04 | Combine 2+ filters and the installable-only toggle | Intersection is correct. Installable-only alone gives **20** | | |
| R-05 | "Clear all" (en + ko) | All filters, the toggle and the query reset, and 100 cards return | | |
| R-06 | Filter state in the URL: apply filters, reload, then copy the URL into a new tab | State restores (if supported), with no hydration error in the console | | |
| R-07 | Switch en ↔ ko language on `/agents` with filters applied | Doesn't crash; state is kept or resets cleanly | | |
| **Agent detail / install kits** | | | | |
| R-08 | Download Kit on 3 different installable agents | Every file set is complete (7 files) with the correct slug in the content | | |
| R-09 | Every per-file link on one agent (7 links) | Each returns 200 and the content is for that agent, not a template or another slug | | |
| R-10 | **Windows PowerShell 5.1 and 7:** paste the one-liner as shown | Record the actual behavior. Expected: fails on `mkdir -p` / `&&` / `(cd …)`. Then run `curl.exe -fsSL --remote-name-all "https://…/kits/<slug>/{AGENTS.md,CLAUDE.md,…}"` from inside a new folder | | This decides whether you ship a separate PS snippet |
| R-11 | A kit URL for a slug that doesn't exist, e.g. `/kits/does-not-exist/AGENTS.md` | 404 (the command's `-f` then fails loudly, which is fine) | | |
| R-12 | Non-installable agent detail page | No curl command or Download Kit, or a clear "not installable" state. No broken links | | |
| R-13 | Copy button for the curl command (if present) | The copied text matches what's displayed exactly, with no smart quotes or line breaks | | |
| **Bookmarks** | | | | |
| R-14 | Bookmark 2 agents, open `/bookmarks`, reload, switch language | Bookmarks persist (localStorage) and show in both locales. Removing one works | | |
| **Layout / i18n** | | | | |
| R-15 | `/ko` agent detail, cards and search panel at 375px | No overflow, clipping or horizontal scroll. Chips wrap, they don't overflow | | |
| R-16 | Workflow page `/ko/workflows/<slug>/` | Translated cards render and links to agents keep the `/ko/` prefix | | |
| R-17 | Internal links from any `/ko` page | Stay in `/ko/` and never drop to `/en/` or to a path without `/agentive` | | |
| R-18 | 404 page: `/agentive/en/nope/` | Custom or GitHub 404 page, no blank screen | | |

## 3. Device / browser / terminal matrix

Run **S-01 to S-04, R-03 to R-05, R-08, R-14, R-15** on each browser row. The "Focus" column says what to look at hardest.

| ID | Platform | Browser | Focus | Result | Notes |
|----|----------|---------|-------|--------|-------|
| D-01 | macOS | Chrome latest | Baseline, console errors | | |
| D-02 | macOS | Safari latest | Download Kit behavior, clipboard copy | | |
| D-03 | macOS | Firefox latest | `.mdc` / `.md` link handling (download vs. display) | | |
| D-04 | Windows 11 | Chrome latest | Download Kit, file names | | |
| D-05 | Windows 11 | Firefox latest | Filters, Korean font rendering | | |
| D-06 | Windows 11 | Edge (optional; not in the supported list) | Skip unless time allows | | |
| D-07 | iPhone 13 mini, iOS 17+ (375px) | Safari | **Korean badge/chip overflow**, filter panel usability, Download Kit on iOS (downloads may open in a new tab or Files) | | |
| D-08 | Pixel 7 | Chrome | Filter panel, chip wrapping, bookmark persistence | | |

| ID | Terminal | Command | Expected | Result | Notes |
|----|----------|---------|----------|--------|-------|
| T-01 | macOS zsh (system curl) | Page one-liner | 7 files | | `curl --version`: |
| T-02 | Ubuntu 20.04 bash, curl 7.68 | Page one-liner | 7 files, no unknown-option error | | |
| T-03 | Windows PowerShell 5.1 | Page one-liner | Record the failure mode (see R-10) | | |
| T-04 | Windows PowerShell 7 | Page one-liner | Record it (`&&` works, `mkdir -p` / `( )` don't) | | |
| T-05 | PowerShell, any version | `curl.exe` variant from inside the target folder | 7 files | | |
| T-06 | Any terminal | Run the one-liner twice | Files are overwritten cleanly, no error | | |

## 4. Content & data checks

| ID | Check | How | Expected | Result | Notes |
|----|-------|-----|----------|--------|-------|
| **Verification status (#14)** | | | | | |
| C-01 | No stale "Tested" badges | Pick 5 of the 61 downgraded agents and open each card and detail page in **en and ko** | Badge shows Unverified (ko: the Korean equivalent) | | slugs: |
| C-02 | Status filter counts | Compare the /agents status filter counts to the counts from main's data | Exact match | | |
| C-03 | Every remaining tested/expert agent has ≥ 2 sample runs shown | Spot-check 3 | Runs are visible on the detail page | | |
| C-04 | `npm run check:data` on main | CI log | Passes. The new rule rejects tested/expert with < 2 runs | | |
| C-05 | Home page / featured sections | Look for "tested" wording or counts on the home page | No stale claims | | |
| **Korean translation (#15, #19)** | | | | | |
| C-06 | Detail page labels on `/ko/agents/<slug>/` | Scan headings, buttons (Download Kit, bookmark, copy), empty states | All Korean. Agent content itself may stay English (confirm that's intended) | | |
| C-07 | Search panel on `/ko/agents/` | Placeholder, 7 filter group titles, option labels, result count, "Clear all", installable toggle | All Korean, count is grammatical (e.g. "100개") | | |
| C-08 | Badges | Status + difficulty on cards and detail | Korean labels | | |
| C-09 | `<title>` / meta description on `/ko` pages | View source | Korean or intentionally English, and consistent | | |
| **Kit files & content types (#13)** | | | | | |
| C-10 | Content types | `for f in AGENTS.md CLAUDE.md cursor-rule.mdc agent.json README.md RUNBOOK.md EVALUATION.md; do curl -sI https://yohan-work.github.io/agentive/kits/<slug>/$f \| grep -i content-type; done` | Record each type. Acceptable: `.md` → `text/markdown`, `.json` → `application/json`, `.mdc` → anything (octet-stream is OK for curl) | | |
| C-11 | `agent.json` is valid JSON with the correct slug | `curl -s …/agent.json \| jq .slug` (or `python -m json.tool`) | Parses, slug matches | | |
| C-12 | All 20 kits exist | Loop over the 20 slugs × 7 files with `curl -o /dev/null -sw "%{http_code}"` | 140 × 200 | | |
| **SEO (#16)** | | | | | |
| C-13 | Sitemap URLs | Open sitemap.xml | Absolute URLs with `https://yohan-work.github.io/agentive/…`, trailing slash matching the site, no `/bookmarks` (en or ko) | | |
| C-14 | hreflang alternates | Check 3 entries | Every en URL has a ko pair and vice versa (+ `x-default` if used); every listed URL returns 200 | | |
| C-15 | robots.txt | Open it | `Sitemap:` line with the absolute URL, no accidental `Disallow: /`. Note R6: crawlers ignore it at this path | | |
| C-16 | Sitemap URL count | Count `<url>` entries | ≈ (pages per locale × 2), minus bookmarks. No kit files, no duplicates | | |

---

## Go / no-go

- **No-go (revert or hotfix before announcing):** any ❌ in Smoke; curl failing on macOS or Ubuntu; stale "Tested" badges (C-01/C-02); a missing kit file (C-12); a broken `/ko` page.
- **Go with known issues (put them in the announcement or a follow-up issue):** PowerShell needing a different command; `.mdc` downloading instead of displaying; minor ko overflow at 375px; the robots.txt path limitation; a few leftover English strings.

## Next actions

1. **Before deploy:** export the expected status counts and the list of 20 installable slugs from main (for C-02 and C-12).
2. **Right after CI goes green:** confirm the deployed SHA (S-10), then run Smoke. Budget about 10 minutes.
3. **Regression + matrix + content:** about 60–90 min for one person. Parallelize by giving mobile (D-07/D-08) to a second person if you can.
4. **If PowerShell fails (likely):** add a PowerShell tab or snippet on agent pages, e.g.
   `New-Item -ItemType Directory -Force agent-kits\<slug> | Out-Null; Push-Location agent-kits\<slug>; curl.exe -fsSL --remote-name-all "https://yohan-work.github.io/agentive/kits/<slug>/{AGENTS.md,CLAUDE.md,cursor-rule.mdc,agent.json,README.md,RUNBOOK.md,EVALUATION.md}"; Pop-Location`
   Then retest T-03/T-04 with it.
5. **Open follow-up issues** for any ⚠️ items. Announce only after the no-go list is clear and 10+ minutes have passed since the final deploy, so CDN caches have turned over.
