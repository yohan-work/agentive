Before this brief can run without Codex coming back to you, I need three things:

1. **What is the stack and styling approach?** For example: React with Tailwind, CSS Modules, styled-components, plain CSS, or a native mobile app. Where do colors live today (a theme file, CSS variables, hardcoded per component)?
2. **How should dark mode turn on?** Follow the OS setting only, a manual toggle, or both? If there's a toggle, should the choice persist, and where does the toggle go?
3. **What is the scope?** The whole app, or only certain screens? Are there areas Codex should leave alone, like emails, charts, or third-party widgets?

Below is a provisional brief. Replace each [ASSUMPTION] with your answers before you hand it to Codex.

---

**Goal**
Add a dark theme that follows the user's OS color-scheme preference.

**Context**
- [ASSUMPTION] Web app styled with Tailwind CSS. Colors are set in `tailwind.config` and in utility classes on components.
- [ASSUMPTION] There is no theme system or dark styling today.

**Requirements**
1. When the OS is set to dark (`prefers-color-scheme: dark`), the app renders with dark backgrounds and light text. When the OS is set to light, it looks the same as it does today.
2. [ASSUMPTION] Enable Tailwind's `darkMode: "media"` strategy and add `dark:` variants for backgrounds, text, borders, and form controls in the shared layout and components.
3. Body text and interactive elements keep at least WCAG AA contrast (4.5:1) in dark mode.

**Suggested (not required)**
- A manual light/dark/system toggle that persists in `localStorage`. This would require switching to `darkMode: "class"`.
- Moving colors into semantic tokens (such as `bg-surface` or `text-muted`) so future themes are easier to add.

**Non-goals**
- No redesign of the light theme and no layout or spacing changes.
- No new dependencies.
- No changes to images, logos, or third-party embeds.

**Acceptance checks**
- The project's existing lint, typecheck, test, and build commands [ASSUMPTION: `npm run lint && npm run build`] pass.
- In DevTools, set Rendering → "Emulate CSS prefers-color-scheme: dark", then load the main pages. Backgrounds are dark, text is readable, and nothing is left with white-on-white or black-on-black.
- With emulation set to light, the pages look the same as before the change.
