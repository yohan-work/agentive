I'd be glad to QA the checkout flow, but I can't do it yet for two reasons:

1. **The screenshots didn't come through.** I only see the placeholder text "[screenshots]", with no images attached. Please try uploading them again. Ideally that means one image per screen or step, labeled with the step name and whether it's mobile or desktop (for example, "Desktop – Step 2 – Shipping").
2. **I don't have your design system.** I can't check the screens against rules I haven't seen. Please share whatever you have, such as:
   - Color tokens (primary, secondary, semantic colors like error, success and warning, and text and background colors)
   - Type scale (font families, sizes, weights, line heights for each text style)
   - Spacing scale and grid or breakpoint rules (for example, a 4/8px base, column counts, gutters, max content width)
   - Component specs for buttons, inputs, selects, checkboxes and radios, error messages, cards, steppers or progress indicators, and modals
   - Corner radius, borders, elevation and shadow tokens, and icon set and sizes
   - Accessibility requirements (contrast targets, minimum touch target size, focus styles)

   A link export, a PDF of your docs, or even screenshots of the key style pages all work.

If you can't share the full design system, I can still review the screens against general UI and checkout best practices. I'll just mark those findings as "best-practice" rather than "violates DS."

**What you'll get back** once I have both:

For each screen, a list of issues, with each one showing:
- **Where** (screen, component or area)
- **What's wrong** (for example, "CTA uses #2F6BFF; DS primary is #2563EB")
- **Rule it breaks** (the specific token or guideline)
- **Severity** (Blocker / Major / Minor / Polish)
- **Suggested fix**

After that I'll add a short section on **cross-breakpoint consistency**, meaning places where mobile and desktop disagree on things like labels, order, component variants or states. I'll finish with a **checkout-specific pass**:
- Clarity of the order summary and total
- Visibility of the promo code field
- Input types and autofill hints for address and card fields
- Placement and style of error states
- Trust signals
- Guest checkout option
- Primary CTA prominence and sticky behavior on mobile
- Progress indication

One heads-up is that some things can't be verified reliably from static screenshots. These include exact pixel values if the images are scaled, hover, focus and pressed states, animations, and real contrast if the images are compressed. If you can share Figma links or the actual build URL, I can be much more precise on spacing and color values. Otherwise I'll flag anything I'm estimating.

Send over the screenshots and the design system docs and I'll get started.
