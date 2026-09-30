Before I write a brief Codex can run without follow-up questions, I need a few repo details:

1. **Stack and styling:** Which framework and styling approach does the app use (for example React + Tailwind, CSS Modules, styled-components, plain CSS)? Is there already a theme file or set of color variables, and where does it live?
2. **Trigger:** Should dark mode follow the OS setting (`prefers-color-scheme`), come from a manual toggle, or both? If there's a toggle, should the choice be saved (for example in `localStorage`) and where should the toggle go?
3. **Scope:** Does this cover the whole app, or only certain pages or components? Are there images, charts, or third-party widgets you don't want touched?

Here's a short provisional brief in the meantime. Every assumption is marked, so swap in your answers.

---

## Codex task brief: Add dark mode

**Goal**
Add a dark color scheme that applies across the app when the user's OS is set to dark mode.

**Context**
- [ASSUMPTION] Colors are defined in one global stylesheet or theme file (path unknown; Codex should locate it and report the path before editing).
- [ASSUMPTION] There is no existing dark-mode or theme-switching code.

**Requirements**
1. Define a dark palette (background, surface, text, muted text, border, primary/accent) next to the existing light colors, in the same place and format.
2. Apply the dark palette automatically when `prefers-color-scheme: dark` matches. [ASSUMPTION: OS-driven only, no toggle]
3. Leave the light theme looking exactly as it does today.
4. Body text and primary UI text in dark mode meet WCAG AA contrast (4.5:1) against their backgrounds.

**Suggested (not required)**
- A manual light/dark toggle saved in `localStorage`.
- Set `color-scheme: light dark` so native form controls and scrollbars follow the theme.

**Non-goals**
- No layout, spacing, typography, or component-structure changes.
- No new dependencies unless the existing styling setup requires one.
- Don't restyle images, logos, or third-party embeds.

**Acceptance checks**
- The project's existing lint, typecheck, test, and build commands pass. [ASSUMPTION: the standard scripts exist in `package.json`]
- With the OS (or DevTools "Emulate prefers-color-scheme") set to **dark**, main pages show dark backgrounds with readable text, and no white panels or invisible text remain.
- With it set to **light**, the pages look the same as before the change (compare screenshots before and after).
- Spot-check contrast on body text and buttons in dark mode with a contrast checker, and confirm at least 4.5:1.

**Open questions**
- The three questions above. Answers to 1 and 2 decide which files Codex touches and whether a toggle is in scope.
