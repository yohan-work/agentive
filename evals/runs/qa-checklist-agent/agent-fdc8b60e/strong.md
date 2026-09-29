You gave me enough to go on, so I won't ask any questions first. My assumptions are listed first. If any of them is wrong, tell me and I'll adjust the checklist.

## Assumptions

- **The "Pages preview of main" is production.** GitHub Pages has one live site per repo, so once CI deploys main, users see it. Your QA window is the gap between deploy and announcement, not a gate before deploy. Rollback means reverting on main and waiting for CI to redeploy (roughly one CI cycle). Time that before you start.
- Base URL is `https://yohan-work.github.io/agentive` and every path below is relative to it. `<slug>` means one project-ready agent you pick (write it in the Notes column). Use a different slug on each device so you cover more of them.
- There are 100 agents. 20 are project-ready and have kits, so 80 should have no `/kits/<slug>/`.
- Bookmarks are stored client-side (localStorage), so they don't carry over between browsers.
- Test in a private window, or hard-reload, so you aren't checking a cached copy of the previous build.

## Risks I'd add to your list

| Risk | Why it matters | Where it's checked |
|---|---|---|
| **robots.txt at `/agentive/robots.txt` is ignored by crawlers** | Crawlers only read `robots.txt` at the host root (`yohan-work.github.io/robots.txt`). The file itself can be valid and still do nothing. Its `Sitemap:` line won't be found either, so you'd have to submit the sitemap in Search Console. | C-10 |
| **The PowerShell problem is probably not the braces** | The braces are inside quotes, so the shell doesn't expand them. curl's own URL globbing does, and curl.exe supports that. The more likely failures are elsewhere. Windows PowerShell 5.1 has no `&&`. `mkdir -p` isn't a real flag there. `curl` is an alias for `Invoke-WebRequest` unless you type `curl.exe`. Test PowerShell 5.1 and 7 separately. | S-6, D-T3, D-T4 |
| **Content types only matter for the per-file links in a browser** | curl ignores Content-Type. In a browser, `.mdc` may download while `.md` displays inline, and `agent.json` served as `text/plain` still works. Decide whether that's a bug or cosmetic *before* you test. | S-7, R-8 |
| **Stale status data from caching or duplicated data** | A badge can read "Tested" if the card, detail page, search index, or `agent.json` in the kit comes from a different source than the one #14 changed. | C-1 to C-4 |

---

## 1. Smoke (about 15 min, right after deploy, one desktop browser plus one terminal)

If any smoke check fails, don't announce. Decide whether to roll back.

| ID | Check | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| S-1 | Open `/` | Redirects to `/en/` with no loop or 404 | | |
| S-2 | Load `/en/` and `/ko/` home | Renders with no console errors and no unstyled flash. `/ko/` shows Korean UI | | |
| S-3 | `/en/agents/` | 100 cards shown and the count label says 100 | | |
| S-4 | Search a known agent name, then apply one filter, then "Clear all" | Results narrow correctly and Clear all brings back 100 | | |
| S-5 | Open `/en/agents/<slug>/` (project-ready) | Detail page loads and shows the Download Kit button, curl command, and 7 per-file links | | |
| S-6 | Copy the curl one-liner from the page and run it in macOS zsh | Creates `agent-kits/<slug>/` with exactly 7 non-empty files and exits with code 0 | | |
| S-7 | `curl -sI <base>/kits/<slug>/agent.json` plus one `.md` and one `.mdc` | All return 200. Write each Content-Type in Notes | | |
| S-8 | `/sitemap.xml` and `/robots.txt` | Both return 200 and valid content, not an HTML 404 page | | |
| S-9 | `/en/install/`, one `/en/workflows/<slug>/`, `/en/bookmarks/` | All render with no console errors | | |
| S-10 | Status badge on one agent that #14 downgraded | Shows "Unverified" on its card and on its detail page | | |

## 2. Regression

### Install kits (#13)

| ID | Check | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| R-1 | Loop over all 20 slugs × 7 files, printing the HTTP code for each (e.g. `curl -o /dev/null -w "%{http_code} %{url_effective}\n"`) | 140 × 200 | | |
| R-2 | Pick 2 agents that are *not* project-ready and request `/kits/<slug>/AGENTS.md` | 404. Their detail pages show no curl command and no Download Kit | | |
| R-3 | Check the kit file contents for one slug | Agent name and slug are correct, the files aren't empty or HTML error pages, and `agent.json` passes `jq .` | | |
| R-4 | `agent.json` status fields | `verifiedStatus` matches what the site shows (no stale "tested") | | |
| R-5 | Curl command text on the page | Uses `--remote-name-all`, has no `--output-dir`, the URL includes the `/agentive/` base path, and the slug is correct | | |
| R-6 | Run the command a second time in the same directory | Overwrites files cleanly with no error | | |
| R-7 | Copy button (if there is one) | Clipboard holds exactly the command shown, with no extra characters and no line breaks | | |
| R-8 | Click each of the 7 per-file links in Chrome and Safari | Every link opens or downloads. Write down which open inline and which download. Nothing 404s | | |
| R-9 | Download Kit button | Delivers the files it promises, with sensible filenames | | |

### Verification status (#14)

| ID | Check | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| R-10 | Status filter on `/agents` | Counts for Tested, Expert, and Unverified add up to 100, and the Unverified count reflects the 61 downgrades | | |
| R-11 | Every agent still marked tested or expert | Has at least 2 sample runs visible on its detail page | | |
| R-12 | Locally: `npm run check:data` on main, then temporarily set one agent to `tested` with fewer than 2 runs | Passes on main and fails on the edited copy with a clear message (don't commit the edit) | | |

### i18n (#15, #19)

| ID | Check | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| R-13 | Language switch on the detail page, agents list, workflow, and install pages | Stays on the same page in the other locale, with no redirect to home | | |
| R-14 | `/ko/agents/`: filters, filter group labels, counts, "Clear all", empty-results message, installable-only toggle | All Korean. Counts are formatted correctly (e.g. "N개") | | |
| R-15 | Search in `/ko` using Korean terms and English agent names | Both work, or the behaviour is documented | | |
| R-16 | Filter state across a locale switch | Resets or persists. Either is fine as long as it's deliberate and nothing breaks | | |
| R-17 | `/en/` after the i18n PRs | No Korean strings leaking into the English locale | | |

### Sitemap, robots, bookmarks, general (#16, #17)

| ID | Check | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| R-18 | Sitemap URLs | Absolute URLs with `/agentive/` and trailing slashes that match the canonical URLs. No `/bookmarks`. No kit files | | |
| R-19 | Sitemap hreflang | Every entry has `en` and `ko` alternates that point at each other (reciprocal). `x-default` is present if you intend to have one | | |
| R-20 | Spot-check 10 random sitemap URLs | All return 200 | | |
| R-21 | Sitemap URL count | Roughly (pages + 100 agents + workflows) × 2 locales. No duplicates | | |
| R-22 | `/robots.txt` content | No accidental `Disallow: /`. The `Sitemap:` line points at the absolute sitemap URL | | |
| R-23 | Bookmark from a card and from a detail page, reload, then open `/bookmarks` in both locales | Bookmark persists, appears on the page in both locales, and can be removed | | |
| R-24 | Deep link or hard refresh on a nested route (e.g. `/ko/agents/<slug>/`) | 200, not a 404 page | | |
| R-25 | Unknown URL | Custom 404 page with working navigation | | |
| R-26 | CI run for main | Unit tests (#17), lint, typecheck, check:data, and build all green on the commit that was deployed | | |

## 3. Device matrix

For each cell, record P or F (or N/A). A = home page. B = `/agents` search and filters. C = detail page, including the badge and curl block. D = per-file links. E = bookmarks. F = `/ko` layout.

| Platform | A | B | C | D | E | F | Notes |
|---|---|---|---|---|---|---|---|
| macOS Chrome | | | | | | | |
| macOS Safari | | | | | | | |
| macOS Firefox | | | | | | | |
| Win 11 Chrome | | | | | | | |
| Win 11 Firefox | | | | | | | |
| iOS Safari 17+, iPhone 13 mini (375px) | | | | | | | |
| Android Chrome, Pixel 7 | | | | | | | |

Mobile-specific checks, especially at 375px:

| ID | Check | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| D-M1 | Korean status and difficulty badges and filter chips on `/ko/agents/` | No overflow, clipping, or wrapping mid-word, and no horizontal page scroll | | |
| D-M2 | Curl block on the detail page | Scrolls horizontally inside its box or wraps. The page itself never scrolls sideways | | |
| D-M3 | Filter panel (7 groups plus the toggle) | Can be opened, scrolled, and closed, and "Clear all" is reachable | | |
| D-M4 | Per-file links on iOS | `.md`, `.mdc`, and `.json` open or download without leaving you on a blank page | | |
| D-M5 | Bookmarks on iOS in a private tab | Fails gracefully when storage isn't available | | |

Terminal checks. Run the command exactly as copied from the page.

| ID | Terminal | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| D-T1 | macOS zsh | 7 files and exit code 0 | | |
| D-T2 | Ubuntu 20.04 bash, curl 7.68 | 7 files and exit code 0 (this is the case #13 fixed) | | |
| D-T3 | Windows PowerShell 5.1 with the copied command | Record exactly what happens. I expect it to fail on `&&` or `mkdir -p` | | |
| D-T4 | PowerShell 7 with the copied command | Record the result. `curl` must resolve to `curl.exe` | | |
| D-T5 | If D-T3 or D-T4 fails | Either the page offers a PowerShell version of the command or the docs mark it as bash/zsh only. Decide whether this blocks the release | | |

## 4. Content checks

| ID | Check | Expected | Pass/Fail | Notes |
|---|---|---|---|---|
| C-1 | Search the built site for leftover "Tested" labels (list and detail pages, both locales) | Only agents with tested status show it. None of the 61 downgraded agents do | | |
| C-2 | Spot-check 5 of the 61 downgraded agents | Card, detail page, filter bucket, and `agent.json` all say unverified | | |
| C-3 | Korean status label | Uses the translated label, not "Tested" or "Unverified" in English | | |
| C-4 | Evaluation or score text on downgraded agents | Doesn't still claim tested results | | |
| C-5 | Scan all of `/ko` for English leftovers (detail page, cards, search panel, badges, empty states, aria-labels, page `<title>`, meta description) | Nothing left untranslated apart from agent content and brand names | | |
| C-6 | Korean copy review by a native speaker | Consistent terminology (e.g. the same word for "agent" and "workflow" everywhere) and a natural tone | | |
| C-7 | `/install` page | Instructions match the command and file list actually used in #13 | | |
| C-8 | `<html lang>` attribute | `en` on English pages and `ko` on Korean pages | | |
| C-9 | Page `<head>` | Has hreflang alternates or a canonical tag consistent with the sitemap, if implemented | | |
| C-10 | Crawl control | Accept that `/agentive/robots.txt` is advisory only. Submit `sitemap.xml` in Search Console. Use a `noindex` meta tag if bookmarks must stay out of the index | | |
| C-11 | Announcement draft | Numbers match the live site (20 kits, 100 agents), and it doesn't promise PowerShell support unless D-T3 or D-T4 passed | | |

---

## Release blockers vs. fix later

- **Block the announcement:** any S-row fails, R-1 has anything short of 140/140, D-T1 or D-T2 fails, or a downgraded agent still shows "Tested" anywhere (C-1, C-2).
- **Fix forward, then announce with a caveat:** PowerShell (D-T3 to D-T5), content types on per-file links (R-8), minor Korean overflow or leftover strings (D-M1, C-5), robots scope (C-10).

## Next actions

1. Before deploying, agree the rollback owner and the revert commit. Note how long CI takes to redeploy.
2. Deploy, then run Smoke. One person can do it in about 15 minutes.
3. Run R-1 and the terminal checks D-T1 to D-T4 in parallel with the browser regression. The kit checks can be scripted, and the output can go straight into the issue.
4. Split the device matrix: one person on desktop, one on the two phones, and a Korean reader on `/ko`.
5. Triage failures against the blocker list, then announce or roll back.
6. Follow-ups whatever the outcome: a PowerShell version of the command, a CI step that curls all kit URLs after deploy, and a Search Console sitemap submission.
