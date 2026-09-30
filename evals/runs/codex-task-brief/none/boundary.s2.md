Here's a Codex brief you can paste in. I don't know your stack, so the parts in `[brackets]` are for you to fill in. Spending two minutes on them will save Codex a lot of guessing. If you'd rather leave them out, the brief tells Codex to look at the repo and work them out.

---

## Task: Add dark mode

### Goal
Add a dark theme to the app. It should follow the user's OS setting by default, and there should be a manual toggle that remembers the user's choice.

### Context
- Framework / styling: `[e.g. React + Tailwind / Next.js + CSS modules / Vue + SCSS — or: "inspect the repo and use the existing styling approach"]`
- Where global styles/theme live: `[e.g. src/styles/globals.css, tailwind.config.js, theme.ts]`
- Where the toggle should go: `[e.g. header/navbar component at src/components/Header.tsx]`

### Requirements
1. **Theme tokens:** Define colors as CSS custom properties (or extend the existing theme system if there is one) for at least: background, surface/card, text (primary/secondary), border, primary/accent, and focus ring. Give each one a light value and a dark value.
2. **Default behavior:** With no saved preference, follow `prefers-color-scheme`.
3. **Toggle:** Add a light/dark toggle (a "system" option is optional) in `[location]`. Save the choice in `localStorage`.
4. **No flash:** Apply the saved or system theme before first paint, e.g. with a small inline script in the document `<head>` that sets `data-theme` or a `dark` class on `<html>`.
5. **Replace hard-coded colors:** Switch hard-coded colors in shared/global components to the new tokens. Skip one-off illustrations and brand images.
6. **Accessibility:** Text and interactive elements must meet WCAG AA contrast in both themes. The toggle needs an accessible label and must work with the keyboard.

### Out of scope (keep it quick)
- Redesigning components or changing layouts
- Theming third-party embeds, charts, or images beyond what's easy
- Syncing the preference to a backend or user account

### Acceptance criteria
- [ ] With the OS set to dark, the app loads in dark mode with no light flash on refresh.
- [ ] The toggle switches the theme immediately, and the choice survives a reload.
- [ ] Main screens (`[list 2–4 key pages]`) have no unreadable text or invisible borders in dark mode.
- [ ] Existing tests, lint, and typecheck/build all pass. Add a small test for the toggle/persistence logic if the project already has a test setup.

### Notes for Codex
- Use the existing patterns and libraries in the repo. Don't add a new theming dependency unless one is clearly already expected (e.g. `next-themes` in a Next.js app).
- Keep the diff focused. When you finish, list the files you changed and any components you left with hard-coded colors.

---

**Two tips for keeping it fast:**
- If your app has many screens, list only the 2–4 that matter most in the acceptance criteria. That keeps the task small, and you can do a follow-up pass for the rest.
- If you already use Tailwind, tell Codex to use `darkMode: 'class'` (or `'selector'` in newer versions). That's usually the fastest way to do this.

If you tell me your framework and styling setup, I can fill in the placeholders for you.
