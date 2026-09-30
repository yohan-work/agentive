I can't see any screenshots in your message. Only the placeholder text "[screenshots]" came through, so the images didn't attach. I also don't have your design system. I won't review screens I haven't seen, so there are no findings yet.

## Questions (most important first)

1. **Can you re-attach the screenshots?** I need every checkout step (cart, shipping, payment, review, confirmation) at each breakpoint you ship, for example 375 px mobile and 1440 px desktop, plus any error, loading, or empty states you have.
2. **What design system should I check against?** Tokens or a style guide excerpt is enough: color hex values, type scale, spacing grid (4 or 8 px), button and input specs, and minimum touch-target size. Without this I can only check general guidelines, not *your* system.
3. **Are there specific requirements for this flow?** For example: a WCAG level target, supported locales or currencies, guest checkout, specific payment methods, or copy/legal text that must appear.

## Checks I'll run once I have them

**Design-system conformance**
- Colors, type sizes/weights/line-heights, radii, and shadows against your tokens. Anything off-token gets flagged with the correct token.
- Spacing and alignment against the grid, measured per element.
- Component usage: buttons, inputs, selects, steppers, and alerts match the library variants (sizes, states, icon placement).

**Accessibility (report only; sign-off stays with a human)**
- Text and UI contrast computed from the hex values: 4.5:1 for body text, 3:1 for large text, input borders, and focus rings.
- Touch targets: at least 44×44 pt (iOS) or 48×48 dp (Android), and at least 24×24 CSS px under WCAG 2.2 AA.
- Visible labels on every field (placeholders don't count as labels), required-field marking, and error messages that say how to fix the problem.
- Focus states on every interactive element.

**Checkout-specific**
- Primary CTA placement and visibility on mobile, including whether it's hidden under the keyboard or behind a sticky footer.
- Correct keyboard/input types for card number, expiry, CVC, postal code, email, and phone, plus autofill hints.
- States for every step: default, focus, filled, error, disabled, loading or processing, and payment declined.
- The order summary and total are visible or reachable at every step, and prices, tax, and shipping stay consistent across screens.
- Progress indicator accuracy and back-navigation.

**Responsive and localization**
- Layout at each breakpoint: wrapping, truncation, and overflow in long fields (addresses, product names).
- Text expansion (about +30–40% for German, for example), currency and number formats, and address formats if you support multiple locales.

**What I'll need a real device or tool for**
- Keyboard overlap and scroll behavior on iOS and Android.
- Screen reader order and announcements (VoiceOver, TalkBack).
- Actual rendered contrast and font rendering, which screenshots can distort.

Send the screenshots and the design system details, and I'll return findings ordered by severity (blocker, major, minor). Each one will list the screen, breakpoint, element, and an exact fix.
