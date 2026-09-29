I can't see any screenshots yet. Your message only has the placeholder text "[screenshots]", so the images didn't upload. I also don't have your design system, so I have nothing to check the screens against. I won't guess at problems I can't see.

**What I need to run the QA**

1. **The screenshots.** Please send every checkout step for both mobile and desktop: cart, shipping, payment, review, and confirmation. Include error, empty, and loading states if you have them. It helps to name each file by step and breakpoint (e.g. `payment-mobile.png`).
2. **Your design system reference.** Any of these works:
   - A link to the Figma library or documentation site
   - Screenshots or exports of the tokens: colors, type scale, spacing, radii, shadows
   - The component specs for buttons, inputs, selects, checkboxes, alerts, and steppers
3. **A few details about the context** (optional, but they make the review sharper):
   - The breakpoints you designed for (e.g. 375 and 1440)
   - The accessibility level you target (e.g. WCAG 2.2 AA)
   - Whether this is a first pass or a pre-handoff review, so I know how strict to be

**What you'll get back**

Once I have these, I'll send a report with these sections:

- **Summary:** overall readiness and the most important issues
- **Findings table:** each finding with its screen and breakpoint, the element, what's wrong, the design system rule it breaks, a severity (Blocker, Major, Minor, or Nit), and a suggested fix
- **What I'll check:**
  - Token use: off-palette colors, type sizes outside the scale, spacing that doesn't fit the grid
  - Components: detached or modified components, wrong variants or states
  - Consistency between mobile and desktop
  - Checkout-specific UX: CTA hierarchy, form field patterns, error messaging, price and total clarity, trust signals
  - Accessibility you can judge from a static image: contrast, tap target size, labels, whether meaning depends on color alone
- **Assumptions and limits:** static screenshots can't show interactions, focus order, or responsive behavior between breakpoints, so I'll mark anything I couldn't verify
- **Risks and next actions:** what to fix before handoff, and what to confirm in a prototype or build

Send the screenshots and design system reference, and I'll start.
