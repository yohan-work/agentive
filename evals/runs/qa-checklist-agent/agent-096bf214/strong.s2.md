## 1. Smoke checks (run first on the Pages preview of `main`, after CI is green)

| ID | Check | Expected result | Pass/Fail |
|---|---|---|---|
| S1 | Open `/` | Redirects to `/en/`; home renders with no console errors | |
| S2 | Open `/en/agents` and `/ko/agents` | 100 cards render in both locales; search box and 7 filter groups visible | |
| S3 | Toggle "installable-only" on `/en/agents` | Count shows 20; every card shown is a project-ready agent | |
| S4 | Open one installable `/en/agents/<slug>` | Detail page loads; Download Kit button, curl command, and 7 per-file links visible | |
| S5 | Click each of the 7 per-file links on that page | Each returns 200 (not a GitHub Pages 404 page) and shows the file content | |
| S6 | Run the copied curl command in macOS zsh | `agent-kits/<slug>/` contains the 7 files, each non-empty | |
| S7 | Open an agent lowered in #14 on `/en` and `/ko` | Badge shows "unverified" (and its Korean equivalent on /ko), not "Tested" | |
| S8 | Open `/ko/agents/<slug>` | Page chrome, badges, and labels are in Korean | |
| S9 | Open `/sitemap.xml` and `/robots.txt` | Both return 200; sitemap parses as XML; robots.txt references the sitemap URL (verify the exact URL) | |
| S10 | Open `/en/bookmarks`, bookmark an agent from its detail page, reload bookmarks | Bookmarked agent appears and persists after reload | |

## 2. Regression checks

### Install kits (`/kits/*`, agent detail, `/install`) — #13

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R1 | For 3 installable slugs (first, last, one with a long slug), run `curl -sI` on each of the 7 `/kits/<slug>/…` URLs | All 21 return 200. Record the `Content-Type` of `.md`, `.mdc`, `.json` — note if `agent.json` is not `application/json` | |
| R2 | Click each per-file link in Chrome, Safari, Firefox | Record whether each file displays inline or downloads; the file must not be blank, garbled, or a 404. Flag `.mdc` behavior per browser | |
| R3 | Click Download Kit on an installable agent | Delivers the kit as the UI describes (verify: which files, what name); contents match the per-file links | |
| R4 | Ubuntu 20.04 bash, curl 7.68: paste the copied command | Command runs without an "unknown option" error; 7 files land in `agent-kits/<slug>/` | |
| R5 | Windows PowerShell with `curl.exe`: paste the copied command as shown | Record exactly what happens (brace expansion, `mkdir -p`, `&&`, `cd` subshell). If it fails, file a bug; verify whether the page offers a PowerShell alternative | |
| R6 | Open a non-installable agent's detail page | No curl command or Download Kit shown (verify intended behavior in the UI spec); no broken `/kits/` links | |
| R7 | Open `/en/install` and `/ko/install` | Instructions match the curl form shipped in #13 (no `--output-dir`); all links resolve | |

### Verified status — #14

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R8 | Filter `/en/agents` by status "tested" | Count and cards match the current data after #14 (verify the expected count against `main`); none of the 61 lowered agents appear | |
| R9 | Spot-check 5 of the 61 lowered agents on card, detail page, and any workflow page that lists them | Every badge reads "unverified"; no cached/stale "Tested" anywhere | |

### Korean translation — #15, #19

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R10 | `/ko/agents`: apply filters from each of the 7 groups, search, then "Clear all" | Filter labels, counts, empty state, and "Clear all" are Korean; counts match the same filters on `/en/agents` | |
| R11 | `/ko/workflows/<slug>`: check workflow and agent cards | Card labels and badges are Korean | |
| R12 | Switch language on `/en/agents/<slug>` and `/en/agents?…` with filters applied | Lands on the matching `/ko` page (verify whether filter state is expected to carry over) | |

### SEO files — #16

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R13 | Inspect `/sitemap.xml` | Contains en and ko URLs with `hreflang` alternates for each pair; URLs use the `/agentive/` base path; no `/bookmarks` entries | |
| R14 | Inspect `/robots.txt` | Sitemap line points to the live sitemap URL; verify whether bookmarks are also disallowed here and that it matches intent | |
| R15 | Open 5 random sitemap URLs (mix of en/ko, agent/workflow) | Each returns 200, not the Pages 404 page | |

## 3. Device and environment matrix

Mark P/F per cell.

| Check | Chrome macOS | Safari macOS | Firefox macOS | Chrome Win11 | Firefox Win11 | iOS Safari 17 (iPhone 13 mini, 375px) | Android Chrome (Pixel 7) |
|---|---|---|---|---|---|---|---|
| S2 agents list en/ko | | | | | | | |
| R10 /ko filters + Clear all | | | | | | | |
| S4 detail page, copy curl button | | | | | | | |
| R2 per-file links open/download | | | | | | | |
| /ko badges and chips don't overflow or clip | | | | | | | |
| S10 bookmarks persist | | | | | | | |

| Curl command | macOS zsh | Ubuntu 20.04 bash (curl 7.68) | Windows PowerShell (curl.exe) |
|---|---|---|---|
| Command runs without error | | | |
| 7 files created, non-empty | | | |
| Files match per-file links | | | |

## 4. Content checks

| ID | Check | Expected result | Pass/Fail |
|---|---|---|---|
| C1 | At 375px on `/ko/agents` and `/ko/agents/<slug>`: all status and difficulty badges, filter chips, counts | No overflow, clipping, or wrapping that hides text | |
| C2 | Scan `/ko` home, agents list, detail, install, workflow, bookmarks | List every string still in English; decide per string whether it blocks announce | |
| C3 | Curl command shown on the page | Slug in the path and URL matches the page's agent; the file list in braces has all 7 names, spelled exactly as served | |
| C4 | `README.md` / `EVALUATION.md` in one kit | Verified status inside the kit matches the badge on the page | |
| C5 | Status badge copy on `/en` and `/ko` | Uses the same terms as the filter labels | |

## If time allows

- Repeat R1 for all 20 installable slugs (140 URLs) with a scripted `curl -sI` loop.
- Run the curl command in PowerShell 7 as well as Windows PowerShell and note differences.
- Check `<link rel="alternate" hreflang>` tags in page HTML match the sitemap.
- Validate sitemap.xml with an online sitemap validator.
- Keyboard-only pass on `/agents` filters and the copy button.
- Check dark mode (if supported) on badges in `/ko` at 375px.
- Open a deep link like `/ko/agents/<slug>` directly in a fresh private window on iOS.
- Confirm Download Kit and curl produce byte-identical files (`diff -r`).
