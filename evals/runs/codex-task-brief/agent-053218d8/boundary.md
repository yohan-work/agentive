I can't name real files or APIs yet, so here are the blocking questions first, then a short provisional brief.

**Blocking questions**
1. What is the stack and how is styling done? (e.g. React + Tailwind, CSS modules, plain CSS, a component library like MUI.) This decides the whole approach.
2. How should dark mode turn on: follow the OS setting only, a user toggle, or both? If there's a toggle, where does it go and should the choice persist?
3. Are colors already centralized (theme file, CSS variables, design tokens), or hard-coded across components? If hard-coded, "quick" may not be realistic, and I'd limit scope to specific screens.

---

**Provisional brief** (replace every [ASSUMPTION] once answered)

**Goal**
Add a dark theme that follows the user's OS color-scheme preference, without changing the light theme.

**Context**
- [ASSUMPTION] Web app with a single global stylesheet or theme file where the main colors are defined.
- [ASSUMPTION] Colors are mostly defined in one place (CSS variables or a theme object), not hard-coded per component.

**Requirements**
1. When the OS preference is dark (`prefers-color-scheme: dark`), the app renders with a dark background, light text, and adjusted surface/border colors.
2. When the OS preference is light or unset, the app looks exactly as it does today.
3. Text and interactive elements in dark mode keep readable contrast (WCAG AA, 4.5:1 for body text).

Suggested (not required):
- A manual light/dark/system toggle with the choice saved in `localStorage`.
- Setting `color-scheme: light dark` so native form controls and scrollbars match.

**Non-goals**
- No redesign of layouts, spacing, or components.
- No changes to light-mode colors.
- No new dependencies unless the existing theme system requires one.

**Acceptance checks**
- Existing lint, typecheck, test, and build commands pass. [ASSUMPTION: the agent uses whatever scripts the repo already defines]
- With the browser/OS set to dark, the main pages show the dark theme; with it set to light, they are visually unchanged from before.
- No body text in dark mode falls below 4.5:1 contrast (spot-check with browser devtools).

Answer the three questions and I'll turn this into a final brief with real file paths.
