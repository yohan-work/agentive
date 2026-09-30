I can't see any screenshots. Your message only has the placeholder "[screenshots]", with no images or descriptions attached. I also don't have your design system. So I can't review anything yet, and I won't guess at what the checkout looks like.

**Questions, most important first**

1. **Could you attach the actual screenshots?** Please include every checkout step (cart → shipping → payment → review → confirmation) for both mobile and desktop. Label each one with its viewport width, for example 375px and 1440px.
2. **Which design system should I check against?** Tokens are most useful: color hex values, the type scale, the spacing grid (4px or 8px?), radii, and component specs for buttons, inputs, and error states. A link to the docs or a token export is fine.
3. **Are there requirements or states I should cover?** For example, target locales (RTL, long-string languages like German), WCAG level, supported payment methods, and the error, loading, and empty states. Please send screenshots of those states too if you have them.

**Checks I'll run once I have them**

- **Tokens vs. design system:** colors, type sizes and weights, line heights, spacing against the grid, radii, and shadows. I'll flag every value that doesn't match a token.
- **Contrast:** I'll compute ratios from the hex values for body text, placeholder text, button labels, error text, disabled states, and focus rings. Targets are 4.5:1 for text and 3:1 for large text and UI components.
- **Touch and click targets (mobile):** buttons, checkboxes, radio buttons, steppers, and "edit" links, measured against 44×44pt (iOS) / 48×48dp (Android). I'll also check spacing between adjacent targets.
- **Form fields:** visible labels (not placeholder-only), the right keyboard type per field (numeric for card, postcode, and phone), autofill hints, required and optional markers, and inline error placement and copy.
- **States:** default, focus, error, disabled, loading (for example, submitting payment), success, and empty cart.
- **Layout per breakpoint:** reflow between mobile and desktop, the sticky CTA or order summary on mobile, truncation of long product names, prices, and addresses, and nothing hidden behind the keyboard.
- **Checkout-specific content:** the order total, tax, and shipping cost shown before the pay button, a clear primary CTA per step, progress indicator accuracy, promo code placement, and trust and security cues.
- **Localization:** currency and number formatting, date and address formats, text expansion (+30–40%) on buttons and labels, and RTL mirroring if relevant.
- **Consistency across steps:** the same component variants, CTA position, and back/edit behaviour on every screen.

For each finding, I'll give the screen, breakpoint, and element, who is affected, which rule it breaks, and a concrete fix with values. After that come a pass/fail/can't-tell check against each requirement you give me, and a list of things to verify on a real device.
