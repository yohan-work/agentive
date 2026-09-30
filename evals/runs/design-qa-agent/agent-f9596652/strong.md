# Design QA: Agent Archive `/agents` (ko @1440, en @375)

Scope: only what your description covers. 768px was not shown, and neither was `/ko` at 375px, so anything about those is in the verify list.

Contrast ratios below are computed from your hex values with the WCAG relative-luminance formula:

| Foreground | Background | Ratio | vs 4.5:1 |
|---|---|---|---|
| primary `#e6e8ee` | canvas `#0b0d12` | 15.9:1 | pass |
| secondary `#a3a9b7` | canvas | 8.27:1 | pass |
| secondary `#a3a9b7` | chip bg `#161a22` | 7.40:1 | pass |
| sky-400 `#38bdf8` | canvas | 9.09:1 | pass |
| sky-200 `#bae6fd` | canvas | 14.7:1 | pass |
| sky-200 | selected chip bg (sky-400 15% over canvas ≈ `#122734`) [ASSUMPTION: chips sit on canvas] | ~11.5:1 | pass |
| **muted `#6b7280`** | **canvas** | **4.03:1** | **fail** |
| **muted `#6b7280`** | **panel `#11141b`** | **3.86:1** | **fail** |

---

## 1. Findings

### Blocker
None found in what you described. The items below fail your stated requirements, but none of them stops a user from finishing the task.

### Major

**M1. Filter chips show selected state with color alone**
- Where: `/ko/agents` @1440, all 6 filter groups (the same chip component at 375).
- What's wrong: selected and unselected chips differ only in border color, background tint, and text color (sky-200 vs secondary, which is only 1.77:1 between the two text colors). Chip size, weight, and icon stay the same. Users with color-vision deficiency, users on low-contrast or dimmed screens, and screen-reader users (unless state is exposed) can't reliably tell which filters are active.
- Breaks: your requirement "selected state with more than color alone"; WCAG 1.4.1 Use of Color; 4.1.2 if the state isn't exposed programmatically.
- Fix:
  - Add a leading check icon to selected chips: `<Check className="size-3.5 -ml-0.5" aria-hidden="true" />`, with `gap-1` inside the chip.
  - Add a weight change: selected `font-semibold`, unselected `font-normal`.
  - Expose the state: `<button aria-pressed={selected}>` (or checkbox semantics if the group is multi-select).
  - The icon changes chip width when toggled. If the reflow bothers you, reserve the space with a fixed-width icon slot that is `invisible` when unselected.

**M2. Touch targets under 44×44px at 375px**
- Where: `/en/agents` @375px.
  - Filter chips: 24px tall (py-1 + 12px text), 8px gap. Fails by 20px.
  - Bookmark icon button: 28×28px. Fails by 16px on each axis.
  - "View agent →" link: text-only, ~20px tall. Fails by ~24px.
- For whom: all touch users, and especially users with motor impairments or large fingers.
- Breaks: your requirement "interactive targets ≥ 44×44px on touch" (it's also WCAG 2.5.5 AAA; the 24px chips only meet the 2.5.8 AA minimum).
- Fix:
  - **Chips.** A 24px chip with an 8px gap gives a 32px row pitch, so you can't expand the hit area to 44px without overlapping the next row. Go to a 32px visual chip with a 12px row gap (pitch = 44px) and extend the hit area 6px above and below:
    `relative h-8 px-3 text-xs before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']` on the chip, and `flex flex-wrap gap-x-2 gap-y-3` on the container.
    Scope this to touch devices with `pointer-coarse:` (Tailwind v4) or `@media (pointer: coarse)` [ASSUMPTION: Tailwind version not stated], so the desktop mouse layout stays at 24px.
  - **Bookmark.** Keep the 28px visual and grow the hit area by 8px per side: `relative size-7 before:absolute before:-inset-2 before:content-['']` → 44×44. Or make the button `size-11` with a 20px icon centered.
  - **"View agent →".** Use a stretched link so the whole card is the target. Put `relative` on the card and `after:absolute after:inset-0 after:content-['']` on the title link, and give the bookmark `relative z-10` so it stays clickable. If you'd rather keep a discrete link: `inline-flex min-h-11 items-center`.

**M3. Muted text fails 4.5:1 (group titles, placeholder)**
- Where: `/ko/agents` @1440.
  - Filter group titles (역할, 카테고리, …): 12px `#6b7280` on canvas = 4.03:1.
  - Search placeholder "이름, 역할, 작업, 태그, 도구로 검색...": `#6b7280` on panel `#11141b` = 3.86:1.
- For whom: low-vision users, and anyone reading in bright ambient light. Uppercase has no effect on Hangul, so the Korean titles are plain 12px text with no extra visual weight to help them.
- Breaks: your requirement "small labels ≥ 4.5:1"; WCAG 1.4.3.
- Fix: raise the muted token. `#7d8595` computes to 5.25:1 on canvas, 5.03:1 on panel, and 4.70:1 on chip bg `#161a22`, and it stays visibly dimmer than secondary (8.27:1), so the hierarchy survives. Or use secondary `#a3a9b7` for group titles only.
  If the placeholder is the search field's only label [ASSUMPTION: no visible label described], also add `aria-label="에이전트 검색"` / `"Search agents"`, because the placeholder disappears as soon as the user types.

**M4. Card summaries run to 3 lines, so card heights are uneven at 1440**
- Where: `/ko/agents` @1440, 2-column card grid; two cards show 3-line summaries.
- What's wrong: `min-height: 48px` sets a floor but no ceiling. With no line clamp, a longer summary pushes that card's footer lower than the footer of the card next to it.
- Breaks: your requirement "max 2 lines for card summaries on desktop".
- Fix:
  - Summary: `text-sm leading-6 line-clamp-2 min-h-12`. That gives 2 × 24px = 48px, which matches your current min-height. [ASSUMPTION: 24px line-height; if it's Tailwind's default 20px for `text-sm`, use `leading-5 min-h-10` instead.]
  - For `/ko`, add `break-keep` (`word-break: keep-all`). Without it, Hangul can wrap mid-word at any syllable.
  - Card: `flex h-full flex-col`. Footer: `mt-auto`. Footers then align even when badge rows differ in height (see m1).
  - "No mid-word truncation": the ellipsis from `line-clamp` cuts at the character, so it can land mid-word. The only reliable way to meet this requirement is a length limit on summaries at authoring time, with the clamp kept as a fallback. Rough capacity: [ASSUMPTION: ~32px page padding] (1440 − 240 − 200 − 64 − 16) / 2 = 460px card, minus 40px padding = ~420px of text. At Inter 14px that's ~55–60 Latin characters per line (~110 for two lines) and ~28 Hangul syllables per line. Measure this on the real build before you set the limit.

**M5. Filters push results ~1100px down on mobile**
- Where: `/en/agents` @375.
- What's wrong: six stacked filter groups (including the 49-chip tool group) come before the first card. On a typical 667–812px-tall phone viewport [ASSUMPTION], the first result is 1.4–1.6 screens down. The M2 chip fix raises the row pitch from 32px to 44px (+37.5%) and makes this worse, so fix M2 and M5 together.
- For whom: mobile users who come to browse results rather than filter.
- Breaks: none of your listed requirements; this is a usability issue.
- Fix: below `md`, collapse the filters behind a sticky "Filters (n)" / "필터 (n)" button (`h-11`) that opens a bottom sheet or full-screen dialog. Show the active selections as removable chips above the result bar. Keep search visible. In the sheet, make each group a collapsible `<details>`, and start the tool group collapsed with a search box (see m3).

### Minor

**m1. Badge wrap pushes the bookmark off the top edge**
- Where: `/ko/agents` @1440, card top row.
- What's wrong: the four badges and the bookmark share one wrapping row. When the Korean badges wrap to a second line, the bookmark drops down with them and loses its top alignment.
- Fix: split the row into two elements. Row: `flex items-start justify-between gap-3`. Badges: `flex min-w-0 flex-wrap gap-1.5`. Bookmark: `shrink-0` as the second child. The badges then wrap under themselves, and the bookmark stays pinned top-right.

**m2. Letter-spacing on Korean labels**
- Where: `/ko` @1440, the eyebrow "에이전트 라이브러리" and the group titles (0.16em tracking, uppercase).
- What's wrong: wide tracking suits uppercase Latin, but it spreads Hangul syllables apart, and `uppercase` does nothing for Hangul.
- Fix: `tracking-[0.16em] [&:lang(ko)]:tracking-normal` (requires `<html lang="ko">` on `/ko`; verify).

**m3. Tool filter group is 49 chips across 7 lines on desktop**
- Where: `/ko/agents` @1440. At 24px chips with an 8px gap [ASSUMPTION: same gap as mobile], that's 7 × 24 + 6 × 8 = 216px for one group.
- Fix: show the ~10 most-used tools, then a "+39개 더 보기" / "+39 more" toggle, or replace the group with a searchable multi-select combobox.

**m4. Values off the 8px grid**
- Card padding 20px is itself off the 8px grid (2.5 units), so your requirements conflict with each other. Pick one: accept a 4px half-step (use `p-5`) or change the padding to 16px/24px (`p-4` / `p-6`).
- Chip `px-2.5` = 10px is off both the 8px grid and a 4px half-grid. Use `px-2` (8px) or `px-3` (12px, half-grid).
- Bookmark 28px is off-grid. The M2 fix gives it a 44px target, which is also off-grid; if you need strict grid alignment, use `size-12` (48px).
- On-grid: search 48px, chip height 24px, chip gap 8px, summary min-height 48px.

### Nits (optional)
- Mark the "→" in "View agent →" `aria-hidden` so screen readers don't announce "right arrow".
- Repeated "View agent" links: add `aria-label="View {agent name}"` so each link reads distinctly when listed out of context.
- "모두 지우기": add `hover:underline` and `focus-visible:underline`; it reads as a button, so use a `<button>`.
- Unselected chip border `#1f2430` on canvas is 1.25:1, so the chip edge is faint. Fine, since the text identifies the chip, but `#2a3140` would give it more definition.

---

## 2. Requirement check

| Requirement | Result | Evidence |
|---|---|---|
| 8px spacing grid | **Fail (partial)** | Chip px 10px, bookmark 28px, and card padding 20px are off-grid; search 48, chip 24/gap 8, and min-h 48 are on-grid (m4). |
| Card padding 20px | Can't tell | Card padding is not described. |
| Grid gap 16px | Can't tell | Card grid gap is not described. |
| Body text ≥ 4.5:1 | **Pass** / **Fail** for placeholder | Body text passes: description secondary 8.27:1, primary 15.9:1. The placeholder fails at 3.86:1 (M3). |
| Small labels ≥ 4.5:1 | **Fail** | Group titles 4.03:1 (M3). These pass: eyebrow 9.09:1, unselected chip text 7.40:1, selected ~11.5:1. Badge text colors not given (can't tell). |
| Touch targets ≥ 44×44 | **Fail** | At 375: chips 24px, bookmark 28×28, "View agent" ~20px (M2). Search 48px tall passes. Checkbox and "Clear all" at 375 not described. |
| Chip selected state beyond color | **Fail** | Only border, background, and text color change (M1). |
| Max 2 lines for summaries on desktop | **Fail** | Two cards show 3 lines; no line clamp (M4). |
| No mid-word truncation | Can't tell | Nothing is truncated today. Once clamped, the ellipsis can cut words, and ko needs `break-keep` (M4). |
| Korean badges not on 3+ lines | **Pass @1440** / can't tell elsewhere | 2 lines max at 1440. `/ko` at 375 and 768 not shown, and a narrower card makes 3 lines likely (see verify list). |
| 768px: 2-column grid | Can't tell | 768px not shown. |
| 375px: no horizontal scroll | **Pass** | As described. |

---

## 3. Verify on a real device or with a tool

1. **`/ko/agents` at 375px (highest priority).** At 1440 the badges already wrap with ~380px available. At 375 [ASSUMPTION: 16px page padding] the badge row has about 375 − 32 − 40 − 28 − 12 ≈ 263px, so a 3-line badge stack is plausible and would fail your Korean requirement. Screenshot it.
2. **768px in both locales:** the 2-column grid, badge wrapping at the narrowest card width, and whether the sidebar/TOC hide as expected. Also check which chip size applies on a touch tablet at this width.
3. **Summary line-height:** confirm whether `min-h` 48px is 2 × 24px, then check the clamp in Chrome, Safari (iOS), and Firefox with long English and Korean summaries.
4. **Chip background:** confirm whether chips sit on canvas or panel (it shifts the selected-chip ratio only slightly; both pass).
5. **Badge colors** (success emerald, warning amber, and whatever the quality badge uses): the hex values aren't given, so run a contrast checker on the actual text/background pairs.
6. **States not described:** check focus-visible rings on chips, the bookmark, the checkbox, and the search field (keyboard pass), plus hover/active states and the search input's border contrast against canvas (panel vs canvas alone is 1.04:1).
7. **Screen reader (VoiceOver iOS / NVDA):** chip state announced after the M1 fix, the checkbox label associated with the 16×16 box, and `lang="ko"` set on `/ko`.
8. **Checkbox "설치 가능만 보기" at 375:** make sure the whole label row is tappable (`<label class="inline-flex min-h-11 items-center gap-2">`), because the 16×16 box alone fails 44px.

These are findings against your stated requirements, not an accessibility certification. A human reviewer still needs to sign off before launch.
