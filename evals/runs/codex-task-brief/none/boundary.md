Here's a task brief you can hand to Codex. I don't know your stack yet, so I've marked the parts you should fill in with `[brackets]`. The more of those you fill in, the faster and more accurately Codex will work.

---

## Task: Add dark mode to the app

### Goal
Add a dark theme the user can turn on and off. By default it follows the operating system's light/dark setting, and the user's choice is remembered between sessions.

### Context
- **Framework / UI stack:** [e.g. React + Tailwind / Next.js / Vue / plain CSS / SwiftUI / Flutter]
- **Where styles live:** [e.g. `src/styles/`, `tailwind.config.js`, a theme file at `src/theme.ts`]
- **Existing design tokens / color variables:** [yes, in `___` / no, colors are hardcoded]
- **Where the toggle should go:** [e.g. header next to the profile menu / settings page]

### Requirements
1. **Theme source of truth:** Put all colors in semantic tokens (e.g. `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-primary`). Give each one a light value and a dark value.
2. **Three modes:** `light`, `dark`, `system` (the default). `system` follows `prefers-color-scheme` and updates live if the OS setting changes.
3. **Persistence:** Save the user's choice to [localStorage / user settings API], and restore it on load.
4. **No flash of the wrong theme:** Apply the theme before first paint, for example with a small inline script in the document head that sets a class or `data-theme` attribute on `<html>`.
5. **Toggle UI:** Add an accessible control (a button or menu with the three options) in [location]. It needs a clear label, works with the keyboard, and exposes its current state to screen readers.
6. **Replace hardcoded colors:** Swap the hardcoded color values in components for the new tokens. Pay attention to backgrounds, text, borders, inputs, cards, modals, and dropdowns.
7. **Contrast:** Text in dark mode should meet WCAG AA contrast (4.5:1 for body text).

### Out of scope
- Redesigning components or changing layouts
- Theming third-party embeds we don't control (note them instead)
- Themes beyond light and dark

### Acceptance criteria
- [ ] On first visit with the OS set to dark, the app shows in dark mode with no flash of light.
- [ ] The toggle switches between light, dark, and system, and the choice survives a reload.
- [ ] No component has unreadable text or invisible borders in dark mode. Check [list your key screens].
- [ ] Existing tests pass, and lint and typecheck are clean.
- [ ] Add a test for the theme logic: default resolution, persistence, and the toggle.

### Deliverable
One PR containing:
- the token/theme changes,
- the toggle component,
- the no-flash init script,
- a short PR description listing the files changed and any components that still need manual review (for example, images or charts with baked-in light backgrounds).

---

**Tips for getting a fast result:**
- Fill in the Context section. It's the biggest time-saver, because it stops Codex from guessing at your stack.
- If your app has many hardcoded colors, split this into two tasks: (1) the token setup, toggle, and persistence, then (2) migrating components screen by screen. Smaller tasks finish faster and are easier to review.
- If you tell me your framework and styling approach, I can tailor the brief with exact file paths and implementation details.
