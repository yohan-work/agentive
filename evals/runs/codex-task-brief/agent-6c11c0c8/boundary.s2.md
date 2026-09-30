Before this brief is ready to hand to Codex, I need a few details. Without them Codex would have to guess, and guessing is what makes a "quick" task slow.

**Blocking questions**

1. **What is the stack and how is styling done?** For example React + Tailwind, Next.js + CSS Modules, plain CSS, styled-components, or a UI kit like MUI or Chakra. Also, do you already have color variables or theme tokens? This decides whether dark mode is a small config change or a sweep through every component.
2. **How should dark mode turn on?** Follow the OS setting only (`prefers-color-scheme`), add a manual toggle, or both? If there's a toggle, should the choice be remembered (e.g. in `localStorage`), and where should the toggle go?
3. **What's the scope?** The whole app, or only certain pages? Are there parts that can stay as they are for now (charts, emails, embedded third-party widgets, images/logos)?

---

**Provisional brief** (every guess is marked [ASSUMPTION]; replace them with your answers)

**1. Goal**
Add a dark color theme that follows the user's OS setting, so the app is readable in dark mode with as little code change as possible.

**2. Context**
- [ASSUMPTION] Web app styled with Tailwind CSS, with a `tailwind.config` file at the repo root.
- [ASSUMPTION] There is no theme system yet. Colors are set directly in component class names.
- [ASSUMPTION] There is a single global stylesheet or root layout where theme-wide styles can go.

**3. Requirements**
1. When the OS is set to dark (`prefers-color-scheme: dark`), the app shows a dark background with light text. When it is set to light, the app looks exactly as it does today.
2. Handle this with a theme-wide mechanism (Tailwind `darkMode: "media"` plus `dark:` variants on the base layout and shared components, or CSS variables on the root). Do not restyle pages one at a time.
3. In dark mode, body text keeps a contrast ratio of at least 4.5:1 against its background.

*Suggested (not required)*
- Manual light/dark/system toggle with the choice saved in `localStorage`.
- Set `color-scheme: dark` so native form controls and scrollbars match.
- Dark variants for logos or images that disappear on a dark background.

**4. Non-goals**
- Do not change the light theme's colors, layout, spacing, or components.
- Do not add a new UI or theming library.
- Do not rename or restructure existing components.

**5. Acceptance checks**
- The project's existing lint, typecheck, and test commands pass ([ASSUMPTION] `npm run lint`, `npm run typecheck`, `npm test`).
- With the OS or browser DevTools set to *Emulate prefers-color-scheme: dark*, the main pages show a dark background and readable light text, with no white-on-white or black-on-black spots.
- With it set to *light*, those pages look the same as before the change (compare screenshots).
- A contrast checker (DevTools or axe) reports at least 4.5:1 for body text in dark mode.

**6. Open questions**
The three questions above. Answering #1 and #2 is enough for me to turn this into a final brief.
