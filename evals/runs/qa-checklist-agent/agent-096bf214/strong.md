## 1. Smoke checks (run first on the Pages preview of `main`, after CI is green)

| ID | Check | Expected | Pass/Fail |
|---|---|---|---|
| S1 | Open `https://yohan-work.github.io/agentive/` | Redirects to `/en/`; home renders with no broken layout or console errors | |
| S2 | Open `/ko/` home | Page renders; UI chrome is in Korean | |
| S3 | Open `/en/agents` | 100 cards render; search and 7 filter groups are visible | |
| S4 | Open one project-ready agent detail page (e.g. the first installable card) | Detail page renders with Download Kit button, curl command, per-file links, and bookmark button | |
| S5 | On that page, click each of the 7 per-file links | All 7 (`AGENTS.md`, `CLAUDE.md`, `cursor-rule.mdc`, `agent.json`, `README.md`, `RUNBOOK.md`, `EVALUATION.md`) return content, no 404 | |
| S6 | Copy the curl command from that page and run it in macOS zsh | `agent-kits/<slug>/` contains all 7 files; none are empty or HTML error pages | |
| S7 | Open `/en/agents` and check the status badges on the cards | No badge reads "Tested" for an agent whose data is not tested/expert (spot-check against the data for 5 cards) | |
| S8 | Open `/sitemap.xml` | Loads as XML; contains `/en/` and `/ko/` URLs | |
| S9 | Open `/robots.txt` | Loads; references the sitemap URL | |
| S10 | Open `/ko/agents/<slug>` on iPhone 13 mini (375px) | No horizontal scroll; badges and chips do not overflow | |

## 2. Regression checks

### /kits/* and install kit (#13)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R1 | For 3 different project-ready agents, run `curl -sI` on each of the 7 kit URLs | Every file returns 200. Record the `Content-Type` of `.md`, `.mdc`, and `agent.json` in the issue (known risk: `.mdc`/`.md` odd types, `agent.json` possibly as text) | |
| R2 | Open `agent.json` and `cursor-rule.mdc` directly in Chrome, Safari, and Firefox | Verify whether each displays in the tab or triggers a download; record the behavior per browser. Content is readable, not garbled (check Korean/UTF-8 characters if any) | |
| R3 | Run the page's curl command on Ubuntu 20.04 bash (curl 7.68) | All 7 files downloaded into `agent-kits/<slug>/`; no `--output-dir` error | |
| R4 | Run the page's curl command in Windows PowerShell using `curl.exe` | Verify whether the command runs as shown (including `mkdir -p`, `&&`, the subshell, and `{...}` in the URL). If it fails, record the exact error text; this is the known brace-expansion risk | |
| R5 | Click Download Kit on an agent detail page | Verify what it downloads (file name, format) and that it includes the same 7 files as the per-file links | |
| R6 | Open a detail page for an agent that is **not** project-ready | Verify whether the curl command/Download Kit is hidden or shown; if shown, its URLs must not 404 | |
| R7 | Compare the slug in the curl command, per-file links, and page URL for 3 agents | Slug is identical in all three places | |

### Verification status (#14)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R8 | Pick 3 agents from the 61 lowered to "unverified"; check their card on `/en/agents`, their detail page, and the same in `/ko` | All show "unverified" (and its Korean equivalent); none show "Tested" | |
| R9 | Use the status filter on `/en/agents` for "Tested" and for "unverified" | Counts shown match the number of cards listed; no lowered agent appears under "Tested" | |

### Korean translation (#15, #19)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R10 | On `/ko/agents`, walk through search, all 7 filter groups, the installable-only toggle, result count, and "Clear all" | All labels are Korean; filters narrow results; "Clear all" resets filters and count | |
| R11 | On `/ko/agents/<slug>`, check status/difficulty badges, section headings, buttons (Download Kit, bookmark), and per-file link labels | All UI strings are Korean; record any English strings with their location | |
| R12 | On `/ko` home and `/ko/workflows/<slug>`, check agent and workflow cards | Card badges and labels are Korean; layout matches `/en` version | |
| R13 | Switch language en ↔ ko on detail, agents list, and workflow pages | Lands on the same page in the other locale; no 404 | |

### Sitemap / robots (#16)

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R14 | In `/sitemap.xml`, check 3 entries for en/ko hreflang alternates, and search for "bookmarks" | Each entry lists both `en` and `ko` alternates with URLs that load (open them); no bookmarks URL appears | |

### Bookmarks

| ID | Steps | Expected result | Pass/Fail |
|---|---|---|---|
| R15 | Bookmark 2 agents from their detail pages, open `/bookmarks`, remove one, reload | Bookmarks list shows the saved agents, removal persists after reload | |

## 3. Device and environment matrix

Mark each cell Pass / Fail / N/A.

| Environment | S1–S4 core pages | S5 per-file links | Curl command | R10 /ko search + filters | S10 / R11 375px & Korean overflow | R15 bookmarks |
|---|---|---|---|---|---|---|
| macOS Chrome latest | | | N/A | | N/A | |
| macOS Safari latest | | | N/A | | N/A | |
| macOS Firefox latest | | | N/A | | N/A | |
| Windows 11 Chrome latest | | | N/A | | N/A | |
| Windows 11 Firefox latest | | | N/A | | N/A | |
| Windows 11 Safari | N/A (Safari is not available on Windows 11; confirm this row is out of scope) | | | | | |
| iOS Safari 17+ (iPhone 13 mini, 375px) | | | N/A | | | |
| Android Chrome (Pixel 7) | | | N/A | | | |
| macOS zsh | N/A | N/A | S6 | N/A | N/A | N/A |
| Ubuntu 20.04 bash (curl 7.68) | N/A | N/A | R3 | N/A | N/A | N/A |
| Windows PowerShell (curl.exe) | N/A | N/A | R4 | N/A | N/A | N/A |

## 4. Content checks

| ID | Check | Expected | Pass/Fail |
|---|---|---|---|
| C1 | Read every string on `/ko` home, `/ko/agents`, one `/ko/agents/<slug>`, `/ko/workflows/<slug>`, `/ko/bookmarks`, `/ko/install` | No leftover English UI strings; list any found with page + location | |
| C2 | Korean badge/chip text on 375px (status, difficulty, filter chips) | Text is fully visible: not clipped, not overflowing its container, not wrapping in a way that breaks the row | |
| C3 | The curl command text on a detail page | Uses the correct base URL `https://yohan-work.github.io/agentive/kits/<slug>/`, lists all 7 file names, and contains no `--output-dir` | |
| C4 | Status counts on `/agents` filters vs. the release data | Verify that the number of "Tested" agents shown matches the data after #14 (61 moved to unverified) | |
| C5 | Links on `/install` and in each kit's `README.md` / `RUNBOOK.md` for one agent | All links resolve (no 404); links to the site point at `yohan-work.github.io/agentive` | |
| C6 | Agent counts on `/en/agents` and `/ko/agents` | Both show 100 agents; installable-only toggle shows 20 in both locales | |

## If time allows

- Run the curl command on 2 more project-ready agents per terminal, to cover more slugs.
- `curl -sI` all 140 kit URLs (20 agents × 7 files) in a loop and grep for non-200 responses.
- Check `<link rel="alternate" hreflang>` tags in the HTML `<head>` of one en and one ko page match the sitemap.
- Check page `<title>` and meta description are Korean on `/ko` pages.
- Re-run S10 and C2 on Android Chrome at the narrowest viewport available.
- Keyboard-only pass through `/agents` filters and the "Clear all" button.
- Check a direct deep link to `/ko/agents/<slug>` loads without a redirect to `/en`.
- Verify a nonexistent URL (e.g. `/en/agents/does-not-exist`) shows the site's 404 page.
