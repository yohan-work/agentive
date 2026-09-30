Happy to. I don't know your stack yet, so below is a brief that works as-is for a typical web app, with the assumptions called out. If you can answer the three questions at the end, I'll tighten it so Codex doesn't have to guess.

---

# Codex Task Brief: Add Dark Mode

## Goal
Add a dark theme to the app that users can switch to, that follows the OS setting by default, and that persists across reloads. Keep the change small: no redesign and no new component library.

## Assumptions (edit these before handing off)
- Web frontend (React or similar) styled with CSS / CSS variables or Tailwind.
- There is a single root layout or app shell where a theme class or attribute can be set.
- No existing theming system. If one exists, extend it instead of adding a parallel one.
- Theme choice is stored client-side (`localStorage`), not in a user profile or backend.
- Scope is the main app UI only. Emails, PDFs, marketing pages, and third-party embeds are out of scope.

## Scope

**In scope**
1. Three theme options: `light`, `dark`, `system` (default = `system`).
2. Apply the theme with a `data-theme="dark"` attribute (or a `dark` class if the project uses Tailwind's `darkMode: "class"`) on `<html>`.
3. Define color tokens (background, surface, text, muted text, border, primary, focus ring) as CSS variables for both themes. Replace hard-coded colors in shared/base components with these tokens.
4. A theme toggle in the existing header/settings area that uses existing button/menu components.
5. Persist the choice in `localStorage` under a single key (e.g. `theme`).
6. Prevent the flash of the wrong theme on load with a small inline script in the document head that sets the attribute before first paint.
7. Set `color-scheme` so native controls (inputs, scrollbars) match.

**Out of scope**
- Per-page custom palettes, new illustrations, or redesigned components.
- Server-side persistence of the preference.
- Fixing every one-off hard-coded color in rarely used screens (list them instead, see Deliverables).

## Implementation Steps
1. **Survey:** find where global styles, the theme/color config, and the root layout live. Grep for hard-coded colors (`#fff`, `#000`, `white`, `black`, `rgb(`, Tailwind `bg-white`/`text-black`, etc.) to estimate the blast radius.
2. **Tokens:** add or extend CSS variables for light and dark under `:root` and `[data-theme="dark"]`. If Tailwind is used, map the theme colors to these variables.
3. **Theme logic:** add a small hook/module (`useTheme` or equivalent) that reads and writes the stored preference, listens to `prefers-color-scheme` when set to `system`, and updates the `<html>` attribute.
4. **No-flash script:** add an inline head script that runs the same resolution logic before hydration.
5. **Toggle UI:** add the control in the header or settings, with an accessible label and keyboard support.
6. **Migrate shared components:** swap hard-coded colors for tokens in the layout, nav, buttons, inputs, cards, modals, and tables first.
7. **Verify:** run the existing lint, typecheck, and tests. Add a unit test for the theme resolution logic (stored value vs. system preference).

## Acceptance Criteria
- With no stored preference, the app matches the OS light/dark setting and updates live when the OS setting changes.
- Picking Light or Dark overrides the OS setting and survives a reload.
- There is no visible flash of the wrong theme on a hard reload.
- Body text and primary UI text meet WCAG AA contrast (4.5:1) in both themes. Focus rings are visible in both.
- Main screens have no unreadable text or invisible borders in dark mode.
- Existing lint, typecheck, and test commands pass. No new dependencies unless the project already uses a theming library.

## Deliverables
- A single PR with the token definitions, theme logic, toggle, and shared-component migrations.
- A short PR note listing any screens or components still using hard-coded colors, for follow-up.
- Before/after screenshots of 2–3 key screens in both themes, if the environment allows it.

## Risks
- **Hard-coded colors spread across many files:** this is the main thing that turns a quick task into a big one. Mitigation: migrate shared components now and list the rest.
- **Images, logos, and charts** that assume a white background. Mitigation: flag them, and only add a dark variant where one already exists.
- **Third-party widgets** (date pickers, editors, embeds) may ignore your tokens. Mitigation: note them and don't patch vendor CSS in this PR.
- **SSR hydration mismatch** if the theme is read during server render. Mitigation: set it only through the inline script and the client-side hook.

## Next Actions
1. Answer the questions below (or confirm the assumptions).
2. Paste the finalized brief into Codex along with the relevant repo paths (global styles, root layout, header component).
3. Review the PR against the acceptance criteria, then triage the follow-up list.

---

**Three quick questions that would make this sharper:**
1. What's the stack: framework, and CSS approach (plain CSS, CSS modules, Tailwind, styled-components, a UI kit like MUI or Chakra)? This changes how the tokens and toggle are wired.
2. Is there an existing design/color system, or do you want Codex to propose the dark palette?
3. Is it web only, or also mobile/desktop apps? And should the preference sync to the user's account, or is per-device fine?
