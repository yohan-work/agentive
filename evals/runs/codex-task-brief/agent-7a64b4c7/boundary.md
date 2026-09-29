I don't know your stack yet, so I wrote this brief to work on most web frontends. Codex starts by reading the repo and fills in the specifics. The scope is kept small so it's a quick task. Fill in the three `[bracketed]` lines before you hand it over if you can. If you can't, the defaults will work.

---

## Codex Task Brief: Add Dark Mode

**Stack:** `[e.g. React + Tailwind / Next.js / Vue + plain CSS]`. If this is left blank, find out from the repo.
**Default theme:** `[follow the OS setting]`
**Toggle location:** `[header / settings page]`

### Goal
Add a dark theme that the user can switch on and that stays set after a reload. By default it should follow the OS setting (`prefers-color-scheme`). All existing screens must stay readable in both themes.

### Scope (in)
1. **Theme tokens.** Put the app's colors (background, surface, text, muted text, border, primary, accent) into CSS custom properties or the framework's existing theme/token system. Define values for light and for dark.
2. **Theme switching.** Switch themes with a class or attribute on `<html>`, such as `class="dark"` or `data-theme="dark"`. If a styling framework is already in use (for example Tailwind's `darkMode: "class"`), use its built-in approach.
3. **Toggle.** Add one control with three options: Light, Dark, System. Put it in the header or on the settings page, and give it an accessible label.
4. **Persistence.** Save the user's choice in `localStorage`. "System" means nothing is stored and the OS setting is followed.
5. **No flash of the wrong theme.** Add a small inline script in `<head>` that sets the theme before first paint.
6. **Fix hard-coded colors.** Replace hard-coded hex, rgb, or named colors in components with tokens wherever they would break in dark mode.

### Scope (out)
- No redesign, new palette work, or brand changes. Dark values should be straightforward inversions of the current palette.
- No per-user theme saved on the server or in the database.
- No new UI or theming libraries unless the project already uses one.
- Don't rework images, illustrations, or charts beyond making sure they're still visible.

### Implementation notes
- Start by finding where colors are defined today: global CSS, the Tailwind config, a theme file, or inline styles. Build on that. Don't create a second parallel system.
- Keep the theme logic in one small module or hook, such as `useTheme` or `theme.ts`, with `getTheme`, `setTheme`, and a listener for OS changes when set to "System".
- Set `color-scheme: light dark` (or the matching value) so native form controls and scrollbars match the theme.
- If the app renders on the server, the stored theme isn't available to the server. Use the inline head script and suppress the hydration warning on `<html>` rather than reading the theme on the server.

### Acceptance criteria
- [ ] The toggle switches between Light, Dark, and System, and the page updates without a reload.
- [ ] The choice survives a reload. "System" follows the OS setting and updates when the OS setting changes.
- [ ] Reloading in dark mode shows no light flash.
- [ ] Main text and interactive elements meet WCAG AA contrast (4.5:1 for body text) in both themes.
- [ ] Focus rings, borders, form inputs, and modals are visible in dark mode.
- [ ] The existing lint, typecheck, test, and build commands all pass.
- [ ] The PR description lists every component that still has hard-coded colors, if any are left.

### Assumptions
- This is a web frontend with a single root layout where the head script and the `<html>` attribute can go.
- No theming system exists yet. If one does, extend it rather than adding another.
- Only a few components have hard-coded colors. If there are many, see the risks below.

### Risks
| Risk | Mitigation |
|---|---|
| Many hard-coded colors turn a quick task into a long one | Codex converts the shared components and layouts first and lists the rest in the PR instead of fixing everything |
| Flash of the wrong theme on load, or hydration mismatch with server rendering | Inline head script plus a hydration-warning suppression on `<html>` |
| Third-party widgets (embeds, date pickers, charts) ignore the theme | Note them in the PR and don't patch vendor styles |
| Low contrast in dark mode | Check the main screens with a contrast tool or browser devtools |

### Deliverables
- One PR titled `feat: add dark mode with light/dark/system toggle`.
- Before and after screenshots of 2 or 3 key screens in both themes.
- A short PR note listing where the tokens live and how to add a new color.

### Next actions
1. **You:** fill in the stack, default theme, and toggle location. Paste the brief into Codex.
2. **Codex:** read the repo and report where colors are defined. Then make the changes in scope, run the checks, and open the PR.
3. **You:** check the main screens in both themes, then merge or ask for contrast fixes.

---

Three quick answers would make this more precise:
1. What framework and styling approach does the app use (for example React + Tailwind, or Vue + SCSS)?
2. Is it a web app, or mobile/desktop (React Native, Electron, and so on)? If it isn't web, the brief needs different theming instructions.
3. Do you have a design system or brand colors for dark mode, or should Codex choose sensible dark values?
