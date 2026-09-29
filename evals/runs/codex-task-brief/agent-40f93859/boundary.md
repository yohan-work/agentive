Happy to. Your message doesn't say anything about the app itself yet, and Codex will stall or guess without it. Three quick questions first, most important first:

1. **Stack and styling.** What framework is it (React, Next.js, Vue, plain HTML…), and how are styles written: Tailwind, CSS Modules, plain CSS, styled-components, or a UI library like MUI or Chakra? This decides how dark mode gets wired in.
2. **Behavior.** Should the app follow the OS setting automatically, have a manual light/dark toggle, or both? If there's a toggle, should the choice be remembered across visits, and where does the toggle go?
3. **Colors.** Are colors already centralized (theme file, CSS variables, Tailwind config), or hard-coded across components? And do you have dark palette values, or should Codex choose reasonable ones?

In the meantime, here's a short provisional brief. Every guess is marked [ASSUMPTION], so swap them out once you've answered.

---

## Codex task brief: Add dark mode (provisional)

**Goal**
Add a dark color scheme that follows the user's OS preference. Light mode should look exactly as it does today.

**Context**
- [ASSUMPTION] Web app styled with plain CSS or CSS Modules.
- [ASSUMPTION] Colors can be pulled into CSS custom properties from one global stylesheet (e.g. `:root { --color-bg: …; }`). Codex should find the actual global stylesheet and say which file it used; I'm not naming one here.
- Stick to the existing code style and file layout.

**Requirements**
1. Define the app's color tokens (at least background, surface, text, muted text, border, primary/accent) as CSS custom properties in the global stylesheet. Light values must match the current colors exactly.
2. Add dark values for the same tokens inside `@media (prefers-color-scheme: dark)`.
3. Replace hard-coded color values in components with those tokens, so every screen switches with the OS setting.
4. In dark mode, body text and primary buttons must reach WCAG AA contrast (4.5:1 for normal text).
5. Set `color-scheme: light dark` on `:root` so native controls and scrollbars match.

**Suggested (not required)**
- A manual light/dark/system toggle with the choice saved in `localStorage`.
- Setting the theme before first paint to avoid a flash of the wrong theme.
- Dark-mode variants for images or logos that don't work on dark backgrounds.

**Non-goals**
- No layout, spacing, typography, or component structure changes.
- No new dependencies or UI libraries.
- No redesign of the existing light theme.

**Acceptance checks**
- The project's existing lint, type-check, test, and build commands all pass. [ASSUMPTION] These exist in `package.json`; Codex should run whatever the repo defines.
- With the OS (or DevTools "Emulate prefers-color-scheme") set to **light**, the main screens look the same as before the change.
- With it set to **dark**, the main screens use the dark palette. No component is left with a hard-coded light background or dark text.
- A contrast check (e.g. Lighthouse or axe) shows no new contrast failures in dark mode.
- Codex's summary lists every file changed and any colors it couldn't convert to tokens.

---

Once you answer the three questions, I'll swap out the assumptions and tighten the brief. If you already have Tailwind or a theme provider, for example, the task gets even smaller.
