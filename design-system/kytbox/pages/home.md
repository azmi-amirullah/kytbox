# Kytbox Home Landing Page

> This page override intentionally narrows the generated system into a landing-page system for the Kytbox product suite.

## Direction

- Style: Swiss Modernism 2.0 with flat surfaces and a restrained bento grid.
- Product story: Kytbox is one personal workspace with three focused tools — Bio, Cashflow, and List.
- Audience: creators, freelancers, and independent builders who need fewer disconnected tools.
- Tone: clear, calm, direct, quietly confident.
- Layout: mobile-first, asymmetric desktop grid, generous whitespace, no decorative clutter.

## Tokens

| Role | Token | Value |
| --- | --- | --- |
| Page background | --background | Warm off-white |
| Text | --foreground | Deep ink navy |
| Primary | --primary | Cobalt blue |
| Signal | --signal | Accessible signal orange |
| Blue surface | --surface-blue | Cool blue tint |
| Warm surface | --surface-warm | Soft warm tint |
| Dark surface | --surface-strong | Deep ink navy |
| Border | --border | Low-contrast blue-gray |

Use semantic tokens in components. Do not introduce one-off hex values in the page.

## Typography

- Use the local Geist variable font for display and body text.
- Hero: clamp(3.25rem, 8vw, 7rem), tight leading, negative tracking.
- Body: minimum 16px, line-height around 1.75.
- Eyebrows and metrics: local mono, uppercase, wide tracking.

## Page Structure

1. Fixed header with Platform, Workflow, and Principles anchors.
2. Hero with one primary CTA and an integrated workspace preview.
3. Product bento: Bio, Cashflow, and List using real product vocabulary.
4. Workflow section with three numbered steps.
5. Principles and factual product metrics.
6. Dark closing CTA.
7. Footer with legal links and creator attribution.

## Interaction and Motion

- Keep interactive targets at least 44px tall.
- Use 150–300ms hover/focus transitions.
- Reveal sections once on scroll with ScrollReveal.
- Respect prefers-reduced-motion; reduced motion must render content immediately.
- No autoplay, infinite decorative animation, or hover-only information.

## Accessibility and Performance

- Keep the skip link and sequential heading hierarchy.
- Use real links for navigation and Button asChild for CTA semantics.
- Decorative mockups use an accessible role=img label and do not load raster assets.
- Keep the landing page server-rendered; only the scroll reveal remains client-side.
- Validate at 320px/375px, 768px, 1024px, and 1440px with no horizontal overflow.

## Avoid

- Generic gradient blobs as the primary visual identity.
- Invented testimonials, logos, ratings, usage numbers, timestamps, or personalized next actions.
- A persistent sidebar in the marketing preview while the platform shell uses the top-header launchpad.
- Emoji as icons.
- A separate full section for every feature with identical layout.
- Muted gray-on-gray copy that fails contrast.
