I'd be glad to QA the checkout flow, but the screenshots didn't come through. I only see the placeholder text "[screenshots]", with no images attached. I also don't have your design system, so I can't check against it yet.

To do a useful review, please send:

1. **The screenshots.** Include every checkout step (cart, shipping, payment, review, confirmation) for both mobile and desktop. If you can, add the error, empty, and loading states too.
2. **Your design system reference.** Any one of these works:
   - a link to, or export of, the tokens (colors, type scale, spacing, radii, shadows)
   - screenshots of the key component specs (buttons, inputs, selects, checkboxes, alerts)
   - a short written summary, e.g. "8px spacing grid, primary button is 48px tall, body text is 16px Inter, error color is #D93025"
3. **Context (optional but helpful).** Tell me the breakpoints you target, whether there are accessibility requirements (for example WCAG 2.1 AA), and which areas you're most worried about.

Once I have them, here is what I'll check:

- **Tokens:** colors, typography (font, size, weight, line height), spacing, radii, and elevation, each compared with the system values
- **Components:** whether buttons, inputs, and other elements use the right variants, sizes, and states (default, hover, focus, disabled, error)
- **Layout and responsiveness:** grid alignment, consistent gutters, and how the layout changes between mobile and desktop
- **Checkout-specific UX:** a clear progress indicator, labels on form fields (not placeholder-only), correct keyboard types on mobile, inline validation and error messages, a visible order summary and total, trust signals near payment, and one clear primary CTA per step
- **Accessibility:** text and UI contrast, touch targets of at least 44×44 px, visible focus states, and errors that don't rely on color alone
- **Consistency:** the same copy, icons, and patterns across steps and across devices

I'll list each issue with its location (screen and element), what's wrong, what the design system specifies, and a severity (blocker, major, or minor), so your team can sort and fix them quickly.

If you don't have a formal design system handy, I can still review the screenshots for internal consistency and general best practices. Just let me know.
