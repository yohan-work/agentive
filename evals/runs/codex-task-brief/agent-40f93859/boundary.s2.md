Happy to. I don't know anything about your app's stack yet, so Codex would have to guess at the parts that matter most. Before I write a final brief, can you answer these?

**Blocking questions (most important first)**
1. **Stack and styling:** Which framework and styling approach does the app use (for example React + Tailwind, plain CSS, CSS-in-JS, a component library such as MUI)? Are colors already centralized somewhere (CSS variables, a theme file, Tailwind config), or hard-coded in components?
2. **How dark mode is chosen:** Should it follow the OS setting only, be a manual toggle only, or both (a toggle that defaults to the OS)? If there's a toggle, where should it go, and should the choice persist across visits?
3. **Scope:** Should it cover the whole app, or only certain screens? Are there areas to leave alone for now (charts, emails, third-party embeds, images/logos)?

Until you answer, here is a short provisional brief. Every guess is marked **[ASSUMPTION]**.

---

## Codex task brief: add dark mode (provisional)

**Goal**
Add a dark color scheme to the app that follows the user's OS preference, without changing layout or behavior.

**Context**
- [ASSUMPTION] Web app styled with CSS, with colors defined as CSS custom properties (or in a single theme file) that components already use.
- [ASSUMPTION] There is no theming or dark-mode code today.
- Follow the existing styling conventions. Do not introduce a new styling library.

**Requirements**
1. When the OS/browser reports `prefers-color-scheme: dark`, the app renders with a dark palette; otherwise it renders exactly as it does today. [ASSUMPTION: OS preference only, no manual toggle]
2. The dark palette is defined in the same place as the existing colors (e.g. dark values for the existing CSS variables inside a `@media (prefers-color-scheme: dark)` block), not as per-component overrides. [ASSUMPTION]
3. Body text and interactive elements meet WCAG AA contrast (4.5:1 for normal text) in dark mode.
4. Native form controls and scrollbars match the theme (`color-scheme: light dark` on the root).

**Suggested (not required)**
- A manual light/dark/system toggle with the choice saved in `localStorage`.
- An inline script to prevent a flash of the wrong theme on load (only needed if a toggle is added).

**Non-goals**
- No layout, spacing, typography, or copy changes.
- No new dependencies.
- Don't redesign the light theme or rename existing color tokens.
- Leave images, logos, and third-party embeds as they are.

**Acceptance checks**
- [ASSUMPTION] The project's existing lint, typecheck, test, and build commands all pass. Tell me the actual commands and I'll list them here.
- In browser devtools, emulate `prefers-color-scheme: dark` and check the main screens: backgrounds are dark, text is light and readable, and no component keeps a hard-coded light background.
- Emulate `prefers-color-scheme: light` and confirm the app looks the same as before the change.
- Run a contrast check (for example the Lighthouse accessibility audit) in dark mode and confirm there are no new contrast failures.

---

Once you answer the three questions, I'll replace the assumptions with real file paths and commands. If colors turn out to be hard-coded across many components, the task isn't quick, and I'll suggest splitting it: first centralize the colors, then add the dark palette.
