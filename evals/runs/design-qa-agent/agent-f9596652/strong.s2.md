## Design QA: Agent Archive `/agents` (1440 /ko, 375 /en)

Contrast ratios are computed with the WCAG 2.x relative-luminance formula from the hex values you gave. Where I needed a surface you didn't state, I marked it.

Luminance reference: canvas #0b0d12 = 0.0040 · panel #11141b = 0.0070 · chip bg #161a22 = 0.0102 · muted #6b7280 = 0.1672 · secondary #a3a9b7 = 0.3958 · primary #e6e8ee = 0.8071 · sky-400 #38bdf8 = 0.4401 · sky-200 #bae6fd = 0.7412

---

## 1. Findings

### Blocker

None. Nothing described stops the page from working. The majors below are failures against your own stated requirements and should be fixed before handoff.

### Major

**M1. Filter chips miss the 44px touch target on mobile**
- Where: Screenshot 2, 375px, every filter chip in all 6 groups.
- Problem: chips are 24px tall (12px text, 16px line-height, plus py-1 = 4+16+4). That is 20px short of 44px, and it affects every touch user. With an 8px gap between rows, you can't fix this by enlarging the invisible hit area alone: extending it 10px above and below overlaps the neighbouring row.
- Breaks: "interactive targets >= 44x44px on touch".
- Fix: below `md`, render chips at `min-h-11 px-4 text-sm` (44px tall, 16px horizontal padding, 14px text) with `gap-2`, and keep `h-6 px-2.5 text-xs` from `md:` up. Do this together with M5, the filter drawer; otherwise the filter area gets even taller.

**M2. "View agent →" tap area is about 20px tall**
- Where: Screenshot 2, 375px, card footer link.
- Problem: the link is text-only, so the tap area is about 14px text plus line-height, roughly 20px. That is 24px short, and touch users miss it.
- Breaks: 44x44px touch target.
- Fix, preferred: make the whole card the link with a stretched link. Put `relative` on the card and `after:absolute after:inset-0 after:content-['']` on the "View agent" anchor, and give the bookmark button `relative z-10` so it stays independently tappable. Minimum fix: `inline-flex min-h-11 items-center` on the link.

**M3. Bookmark icon button is 28x28px**
- Where: both screenshots, card top-right. It is a touch problem at 375px.
- Problem: 28px is 16px short of 44px in both directions. 28 is also off the 8px grid.
- Breaks: 44x44px touch target and the 8px grid.
- Fix: `grid size-11 place-items-center -m-2` with a 20px icon (`size-5`). The hit area becomes 44x44, and the -8px margin on each side keeps the visual footprint at 28px so the top row doesn't grow. Add `aria-label="북마크"` / `"Bookmark"` and `aria-pressed` for the saved state.

**M4. Filter-group titles and the search placeholder fail the 4.5:1 text contrast requirement**
- Where: Screenshot 1, 1440px /ko. Group titles 역할, 카테고리, 난이도, 자동화, 도구, 검증 (12px uppercase, muted), and the search placeholder "이름, 역할, 작업, 태그, 도구로 검색..." (muted on panel). The same tokens are used at 375px.
- Numbers:
  - muted #6b7280 on panel #11141b = (0.1672+0.05)/(0.0070+0.05) = **3.81:1**. This fails for the placeholder, and for the titles if they sit on panel.
  - muted #6b7280 on canvas #0b0d12 = (0.2172)/(0.0540) = **4.02:1**. This fails for the titles if they sit on canvas [ASSUMPTION: the filter area background isn't stated; it fails either way].
- Who: low-vision users and anyone on a dim or glare-affected screen. The 0.16em tracking in Korean makes it worse, because Hangul syllables spread apart and read as fragmented.
- Breaks: "small labels >= 4.5:1" (titles) and "body text >= 4.5:1" (placeholder, which carries the only hint about what's searchable).
- Fix:
  - Group titles: use `text-secondary` (#a3a9b7), which is 8.25:1 on canvas and 7.82:1 on panel. Alternatively, lighten the muted token to **#7c8493**, which is 5.16:1 on canvas, 4.90:1 on panel, and 4.63:1 on chip bg #161a22, so it passes everywhere muted is used today.
  - Placeholder: use `placeholder:text-secondary` or the new #7c8493.
  - Korean tracking: `tracking-[0.16em]` for Latin only, for example `[&:lang(ko)]:tracking-normal` or `ko:` locale handling in the layout. Uppercase does nothing to Hangul anyway.

**M5. Selected filter chips differ from unselected ones by color alone**
- Where: Screenshot 1, all filter groups. It also applies at 375px.
- Problem: every difference between the states is a color: border (sky-400 at 40% vs #1f2430), background (sky-400 at 15% vs #161a22), and text (sky-200 vs secondary). Users with color-vision deficiency, users with forced-colors or high-contrast mode (which strips these colors), and users on grayscale screens can't tell which filters are active. The text contrast itself is fine: sky-200 on the blended selected bg (≈ #122734, [ASSUMPTION] chip over canvas) is about 11.6:1, and secondary on #161a22 is 7.40:1.
- Breaks: "Filter chips must show selected state with more than color alone".
- Fix:
  - Add a leading check icon to selected chips: `<Check className="size-3.5" aria-hidden />` with `gap-1`, plus `font-medium` on the selected text. To stop the chip shifting width when the icon appears, reserve the space or accept the reflow.
  - Expose the state: `aria-pressed="true|false"` on toggle buttons, or real checkboxes.
  - Optionally, use a 1px solid sky-400 border (not 40%) so the selected state survives forced-colors mode via `forced-colors:border-[Highlight]`.

**M6. Card summaries run to 3 lines and card rows have uneven internal heights**
- Where: Screenshot 1, 1440px /ko, card grid (2 cards affected).
- Problem: the summary has `min-height: 48px` but no line clamp, so long summaries render 3 lines. Footers then sit at different heights within a row.
- Breaks: "Max 2 lines for card summaries on desktop".
- Fix:
  - Summary: `line-clamp-2 min-h-12 leading-6`. At 14px with a 24px line-height, 2 lines is exactly 48px, which matches your min-height.
  - Card: `flex h-full flex-col`. Footer: `mt-auto`. Footers then align across a row, whatever the summary length.
  - Mid-word rule in Korean: by default, CSS wraps Korean between any two syllables, so a 2-line clamp can break inside a word. Add `break-keep` (`word-break: keep-all`) on `/ko` summaries.
  - Content side: the clamp's ellipsis replaces the end of line 2 and can cut a word, so the real fix for "no truncation mid-word" is a character budget. Estimated [ASSUMPTION: about 452px inner card width at 1440, see Verify]: about 60 Korean characters or about 120 Latin characters for 2 lines. Add that budget as a content-validation rule, and keep `line-clamp-2` only as a safety net.

**M7. On mobile, about 1100px of filters come before the first result**
- Where: Screenshot 2, 375px /en.
- Problem: on a typical 667 to 844px-tall phone viewport, users scroll one and a half to two screens before seeing any agent. The tool group (49 chips, already 7 lines at 1440px) is the main contributor. After M1 raises chips to 44px, this gets worse.
- Breaks: no stated requirement. It is a major usability issue for mobile users on the primary task (browsing agents).
- Fix: below `md`, collapse the filter groups behind a full-width "Filters (n)" button (`h-11`, 44px) that opens a bottom sheet or drawer with the 44px chips and a sticky "Show 100 results" button. Keep the search input and the result bar inline, so the first card starts within about 200px of the header. Inside the sheet, make each group an accordion.

### Minor

**m1. Wrapping badges push the bookmark icon off the top row**
- Where: Screenshot 1, 1440px /ko, card top row. The badges are 검증됨, 중급, 설치 가능, and 품질 4/5.
- Problem: the bookmark is in the same wrapping flow as the badges, so when the Korean badges wrap it drops to line 2 and loses its fixed position. This is inconsistent across cards in the same row. It still meets the /ko requirement (2 lines, not 3+).
- Fix: `flex items-start justify-between gap-3` on the row. Badges go in `flex min-w-0 flex-wrap gap-2`, and the bookmark gets `shrink-0`. Optionally cut a badge: "설치 가능" can become an icon with a tooltip or `sr-only` text, which reduces wrapping in /ko.

**m2. Tool filter row: 49 chips over 7 lines at 1440px**
- Where: Screenshot 1, 도구 group.
- Problem: about 7 × 24px + 6 × 8px gap = **216px** [ASSUMPTION: 8px row gap at 1440 too] for one group. It pushes the results down and makes scanning hard.
- Fix: show the top 12 tools by usage, then a "+37개 더 보기" / "+37 more" toggle, or a small in-group search. Keep selected tools always visible even when collapsed.

**m3. Spacing values off the 8px grid**
- Where: chips `px-2.5` (10px) and bookmark 28px (covered in M3).
- Fix: chips `px-2` (8px) or `px-3` (12px, a 4px half-step if you allow one). **Conflict in the requirements:** card padding of 20px is itself not a multiple of 8. Decide whether it is a documented exception (keep `p-5`) or should become `p-4` (16px) or `p-6` (24px).

**m4. "모두 지우기" shows when no filters are active**
- Where: Screenshot 1, result bar. The bar reads "100개 중 100개 표시", meaning nothing is filtered.
- Problem: the action does nothing in this state.
- Fix: render it only when at least one filter or query is active, or `disabled` with `text-muted`. At 375px, give it `inline-flex min-h-11 items-center` (it is 14px text-only today). Contrast is fine: sky-200 on canvas is 14.65:1.

### Nits (optional)
- Placeholder "…" (U+2026) instead of "...".
- The eyebrow `uppercase` is meaningless for "에이전트 라이브러리". It's harmless, but tracking on it has the same Hangul issue as M4.

---

## 2. Requirement check

| Requirement | Result | Evidence |
|---|---|---|
| 8px spacing grid | **Fail** | Chip px-2.5 = 10px; bookmark 28px. Search 48px, chip height 24px, and chip gap 8px pass. |
| Card padding 20px | Can't tell | Card padding isn't in the description. It also conflicts with the 8px grid (m3). |
| Grid gap 16px | Can't tell | The card grid gap isn't described. |
| Body text >= 4.5:1 | **Fail** (partial) | Description secondary on canvas is 8.25:1 (pass). H1 primary on canvas is 15.86:1 (pass). Placeholder muted on panel is **3.81:1** (fail). Summary text color isn't given (can't tell). |
| Small labels >= 4.5:1 | **Fail** (partial) | Group titles muted are **4.02:1** on canvas or **3.81:1** on panel (fail). Eyebrow sky-400 on canvas is 9.07:1 (pass). Chip text secondary on #161a22 is 7.40:1 (pass). Selected sky-200 is about 11.6:1 (pass). Badge colors aren't given (can't tell). |
| Targets >= 44x44 on touch | **Fail** | Chips are 24px tall, bookmark 28x28, "View agent" about 20px. The checkbox (16x16) and "모두 지우기" at 375 aren't described (can't tell). |
| Selected chip state beyond color | **Fail** | Border, background, and text color are the only differences (M5). |
| Summaries max 2 lines on desktop, no mid-word truncation | **Fail** | Two cards show 3 lines. The mid-word rule can't be judged, and it is at risk in Korean without `break-keep` (M6). |
| /ko badges not wrapping to 3+ lines | Pass at 1440 / can't tell at 768 and 375 | At 1440 they wrap to 2 lines. /ko isn't shown at 768 or 375. |
| 768px: grid becomes 2 columns | Can't tell | No 768px screenshot was described. |
| 375px: no horizontal scroll | Pass | Stated as "Horizontal scroll: none". |

---

## 3. Verify on a device or with a tool

1. **/ko badges at 768px.** This is the most likely failure for the 3+ lines rule. [ASSUMPTION: no sidebar at 768 and 16px page padding] The card inner width is about (768 − 32 − 16) / 2 − 40 = **320px**. After the 28px bookmark and a 12px gap, about **280px** is left for four Korean badges. That is narrower than a single-column card at 375 (about 375 − 32 − 40 − 40 ≈ 263px, which is similar). Render /ko at 768 and 375 with the longest badge combination and count lines.
2. **Card inner width at 1440.** 1440 − 240 − 200 = 1000px, minus page padding (unknown), 16px gap, and 2 × 20px padding, giving roughly 450px. Confirm it, so the summary character budget in M6 can be set from real measurements.
3. **Filter area background.** Check whether it is canvas or panel, to confirm which of 4.02:1 or 3.81:1 applies (both fail).
4. **Badge and summary text colors.** "검증됨" (emerald?), "품질 4/5", and the summary body color weren't given. Run them through a contrast checker against the card's panel background.
5. **Checkbox "설치 가능만 보기" at 375.** Check whether the `<label>` wraps the input so the label text is tappable, and whether the combined hit area is at least 44px tall. Use `min-h-11 inline-flex items-center gap-2` on the label.
6. **Focus states.** Keyboard-tab through the chips, bookmark, and links, and check for a visible focus ring. Suggest `focus-visible:ring-2 ring-sky-400 ring-offset-2 ring-offset-canvas`; sky-400 on canvas is 9.07:1.
7. **Forced-colors / Windows High Contrast.** Check that selected chips remain distinguishable after M5.
8. **Placeholder length at 375 in /ko.** "이름, 역할, 작업, 태그, 도구로 검색..." will likely truncate in a full-width input on a small phone. Check it, and consider a shorter "에이전트 검색" with the field list moved to helper text.
9. **Screen reader pass (VoiceOver iOS, TalkBack).** Check chip state announcements (`aria-pressed`), the bookmark label, and whether the stretched-link card announces a sensible name.

These results cover only the material you described. They are not an accessibility sign-off; a human reviewer should confirm on real devices before launch.
