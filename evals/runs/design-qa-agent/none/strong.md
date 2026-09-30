# Design QA: Agent Archive `/agents` (ko @1440, en @375)

I worked from your written descriptions, so everything below is checked against what you described plus contrast math on your tokens. Anything I couldn't see (focus states, hover, exact line-heights) is listed separately at the end as "needs verification".

## Summary

| # | Finding | Where | Severity |
|---|---|---|---|
| 1 | Filter group titles fail small-label contrast (muted #6b7280 ≈ 3.8:1 on panel) | Both | **High** |
| 2 | Selected chip differs from unselected by color only | Both | **High** |
| 3 | Touch targets below 44×44: chips (24px), bookmark (28px), "View agent →" (~20px) | 375 | **High** |
| 4 | Card summaries not line-clamped; 3-line summaries and uneven card heights | 1440 ko | **High** |
| 5 | Badge row wraps and pushes the bookmark button out of top alignment | 1440 ko | **Medium** |
| 6 | Filter area ~1100px tall before first result on mobile | 375 | **Medium** |
| 7 | Tool filter row: 49 chips over 7 lines | Both | **Medium** |
| 8 | Search placeholder in muted #6b7280 ≈ 3.8:1 on panel | Both | **Medium** |
| 9 | Selected chip border (sky-400 @40%) ≈ 2.4:1 against panel, below 3:1 non-text contrast | Both | **Medium** |
| 10 | "모두 지우기" is shown when no filters are active, and it's a link styled only by color | 1440 ko | **Low** |
| 11 | Uppercase + 0.16em tracking applied to Korean labels | 1440 ko | **Low** |
| 12 | Chip horizontal padding (10px) and card padding (20px) are off the 8px grid | Both | **Low** (spec question) |
| 13 | Korean isn't covered at 375 / 768, the riskiest widths for badge wrapping | Coverage gap | **Medium** |

---

## Findings

### 1. Filter group titles fail contrast (High)
- **Observed:** 12px uppercase titles (역할, 카테고리, …) in muted `#6b7280`.
- **Measured:** `#6b7280` on panel `#11141b` ≈ **3.8:1**, on canvas `#0b0d12` ≈ **4.0:1**. Your requirement for small labels is ≥ 4.5:1. The labels are also 12px, which makes low contrast worse.
- **Fix:** Use secondary `#a3a9b7` (≈ 7.4:1 on `#161a22`, higher on panel) or a lighter muted token such as `#9ca3af` (gray-400, ≈ 7.2:1 on panel). Keep `#6b7280` for disabled or decorative text only, never for text people need to read.

### 2. Chip selected state is color-only (High)
- **Observed:** Selected = sky border/bg/text; unselected = gray border/bg/text. Shape, weight, and content are identical.
- **Why it matters:** This violates your "more than color alone" requirement (and WCAG 1.4.1). It is also hard to scan in grayscale or with color-vision deficiency, especially in a 49-chip row.
- **Fix (pick one or more):**
  - Add a leading check icon (12px `Check`) in selected chips. This is the clearest option.
  - Bump the selected text to `font-medium` and use a solid 1px sky-400 border instead of 40% opacity.
  - Expose the state to assistive tech with `aria-pressed="true"` on toggle buttons (or `role="checkbox"` + `aria-checked`). This is required regardless of the visual fix.

### 3. Touch targets below 44×44 on mobile (High)
- **Observed at 375px:**
  - Chips: 24px tall, 8px gap.
  - Bookmark button: 28×28.
  - "View agent →": text-only tap area, ~20px tall.
  - Also check "설치 가능만 보기" / "Installable only": a 16×16 checkbox. It passes only if the label is also clickable.
- **Fix:**
  - **Bookmark:** keep the 28px visual but make the button `h-11 w-11` (44px) with the icon centered. Alternatively add a `before:` pseudo-element with `-inset-2`, as long as it doesn't overlap neighboring targets.
  - **View agent link:** make the whole card the link (stretched link: `after:absolute after:inset-0` on the anchor, with the bookmark button raised via `relative z-10`). If you'd rather not, give the link `inline-flex min-h-11 items-center`.
  - **Chips:** at 24px tall with an 8px gap you can't extend the hit area to 44px without overlapping targets. On touch widths, either make chips `min-h-11 px-3` (below `md:`) or move filters into a sheet with 44px list rows (see #6).
  - **Checkbox:** wrap the input and text in a `<label>` with `min-h-11 inline-flex items-center gap-2`.

### 4. Card summaries not clamped; uneven heights (High)
- **Observed:** `min-height: 48px` but no line clamp. Two cards show 3-line summaries, so cards in the same row differ in height up to the footer.
- **Fix:**
  - Use `line-clamp-2 min-h-12` (48px = 2 × 24px leading, which matches `leading-6` at 14px). The min-height keeps 1-line summaries aligned.
  - **No mid-word truncation:** for Korean add `break-keep` (`word-break: keep-all`). By default Hangul breaks between any syllables, so the clamp's ellipsis can land mid-word. For English, the default wrapping already breaks at spaces. Avoid `break-all`.
  - **Equal footers:** make the card `flex h-full flex-col` and give the footer `mt-auto`. Grid items stretch by default, so footers will then line up across the row even if a summary is shorter.
  - Put the full summary in a `title` attribute, or rely on the detail page, so clamped text is still reachable.

### 5. Badge wrap displaces the bookmark button (Medium)
- **Observed:** Four badges (검증됨, 중급, 설치 가능, 품질 4/5) wrap to a second line and the bookmark drops out of the top-right corner.
- **Fix:** Split the top row into two flex children: `flex items-start justify-between gap-3`, with badges in `flex min-w-0 flex-1 flex-wrap gap-1.5` and the bookmark in `shrink-0`. The bookmark then stays top-aligned regardless of wrapping.
- **Also worth considering:** move "품질 4/5" to the card footer. It's the least scannable of the four, and removing it usually keeps the ko badge row to one line at 1440.
- This currently meets the "not 3+ lines" rule at 1440, but see #13: narrower widths are likely to break it.

### 6. Mobile filter area ~1100px tall (Medium)
- **Observed:** At 375px, six stacked filter groups push the first result card roughly 1.5 screens down.
- **Fix:**
  - Below `md`, collapse filters behind a "Filters (n)" button that opens a bottom sheet or drawer. Keep search and the result count ("100 of 100") visible above the results.
  - At minimum, make each group a collapsible `<details>`, collapsed by default except groups with active selections.
  - Show active filters as a single removable-chip row above the results so state stays visible when the panel is closed.

### 7. Tool filter: 49 chips over 7 lines (Medium)
- **Fix:**
  - Show the top ~10–12 tools by agent count, followed by a "+37 more" / "37개 더 보기" toggle.
  - Or add a small type-ahead filter inside the group.
  - Always keep selected tools visible even when the group is collapsed.
  - Sorting by frequency, not alphabetically, makes the collapsed set more useful.

### 8. Search placeholder contrast (Medium)
- **Observed:** Placeholder "이름, 역할, 작업, 태그, 도구로 검색..." in `#6b7280` on `#11141b` ≈ **3.8:1**.
- **Fix:** Use `#9ca3af` or secondary `#a3a9b7`. Placeholders are the only hint of what the field searches, so they should meet the 4.5:1 body-text bar. Also confirm there's a visible or `sr-only` label, since the placeholder can't serve as the label.

### 9. Selected chip border below 3:1 (Medium)
- **Observed:** sky-400 at 40% over panel composites to roughly `#215773`, which is ≈ **2.4:1** against `#11141b`. The 15% fill is lower still.
- **Why it matters:** The border is the main visual boundary of the selected state. WCAG 1.4.11 asks for 3:1 for UI-component state indicators.
- **Fix:** Use a solid `border-sky-400` (≈ 9:1) for the selected state, or ~70% opacity at minimum. Combine this with the icon from #2.

### 10. "모두 지우기" behavior and styling (Low)
- **Observed:** The result bar reads "100개 중 100개 표시" (no filters active), yet "모두 지우기" is shown. It's sky-200 text with no underline, 14px.
- **Fix:**
  - Hide or disable the control when no filters or search are active.
  - It's an action rather than navigation, so make it a `<button>` styled as a ghost button (`rounded px-2 py-1 hover:bg-white/5`). Or keep the link style and add `underline underline-offset-4` so it isn't distinguished by color alone.
  - Give it `min-h-11` on touch.

### 11. Uppercase + wide tracking on Korean (Low)
- **Observed:** The eyebrow "에이전트 라이브러리" and the group titles use `uppercase` with 0.16em tracking.
- **Why it matters:** Uppercase does nothing to Hangul. Wide letter-spacing breaks up syllable blocks and makes Korean look loose and harder to read.
- **Fix:** Scope the treatment to Latin. For example, apply `tracking-normal` under `:lang(ko)` (or `[lang=ko] &` / a locale-aware class), and consider 13px `font-medium` for ko labels instead.

### 12. Grid inconsistencies (Low: clarify spec)
- **Chip padding:** `px-2.5` = 10px is off the 8px grid. Use `px-2` (8px) or `px-3` (12px, a 4px half-step if you allow those). Vertical `py-1` (4px) is a half-step; confirm half-steps are allowed.
- **Card padding:** the spec itself says 20px, which isn't a multiple of 8. Either amend the grid rule to "8px grid with 4px half-steps" or move card padding to 16px or 24px. Right now the spec contradicts itself.
- **Grid gap:** 16px is fine.

### 13. Coverage gap: Korean at narrow widths (Medium)
- **Gap:** The Korean fit requirement ("badges not on 3+ lines") was only checked at 1440. At 1440 each column is roughly (1440 − 240 − 200 − page padding) / 2 ≈ 470px wide.
- **Riskiest widths:** at 768 (2 columns, ~350px cards) and at 375 (~335px card content width), four Korean badges plus a 44px bookmark are likely to hit 3 lines.
- **Please capture:** `/ko/agents` at 375, 768, and ~1024 (the widest point before the sidebar and TOC appear, if that's where they kick in). If it does wrap to 3 lines, the fix in #5 (moving the quality score to the footer) is the cheapest remedy.

---

## Passes
- Horizontal scroll at 375: none. ✅
- Search input height 48px, above the touch minimum. ✅
- Eyebrow sky-400 `#38bdf8` on canvas ≈ 9:1. ✅
- Unselected chip text `#a3a9b7` on `#161a22` ≈ 7.4:1. ✅
- Selected chip text sky-200 on the tinted fill: well above 4.5:1. ✅
- Grid switches to 2 columns at `md` as specified; 16px gap. ✅

## Needs verification (not determinable from the description)
- Visible focus rings on chips, the checkbox, the bookmark, the card link, and "모두 지우기" (e.g. `focus-visible:ring-2 ring-sky-400 ring-offset-2 ring-offset-canvas`).
- Accessible name on the bookmark button (`aria-label="Bookmark {agent name}"`) and its pressed state (`aria-pressed`).
- Hover states on chips and cards, and whether hover-only affordances exist on touch.
- Body line-height: #4's `min-h-12` assumes 24px leading. If you use `leading-5`, use `min-h-10` instead.
- Result count announced to screen readers when filters change (`aria-live="polite"` on the result bar).

## Suggested fix order
1. #1, #8, #9: token changes, fast, fix contrast across the whole site.
2. #2 + #9 together: chip selected state.
3. #4 and #5: card layout (`line-clamp-2 break-keep`, `h-full flex-col`, split top row).
4. #3: mobile targets (stretched card link, 44px bookmark).
5. #6 and #7: filter collapse. This is a larger UX change, so do it after the fixes above.
6. Re-shoot ko at 375/768 (#13) after steps 3–4.
