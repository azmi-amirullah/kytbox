# Kytbox Design System Master

> Shared UI rules for Kytbox. Page-specific files under pages/ may narrow these rules, but must stay consistent with the product foundation.

## Product foundation

- Product: one personal workspace with three focused tools: Bio, Cashflow, and List.
- Platform shell: fixed top header with search, notifications, public profile, and user menu.
- Style: Swiss Modernism 2.0; flat semantic surfaces, clear borders, strong typography, and restrained bento composition.
- Tone: calm, direct, useful, quietly confident.
- Font: local Geist for display and body, Geist Mono for labels and metrics.
- Icon set: react-icons/lu only. Never use emoji as interface icons.

## Design principles

1. Make the product model obvious: Bio, Cashflow, and List are named directly.
2. Use hierarchy instead of decoration: typography, spacing, borders, and semantic color do the work.
3. Prefer honest states: empty states and placeholders are clearer than invented activity or recommendations.
4. Keep navigation consistent: the top-header launchpad is the source of truth until every route needs a shared sidebar.
5. Design mobile first from 320px, then expand with container-aware layouts.

## Semantic tokens

Use the tokens defined in src/app/globals.css. Do not add one-off hex values in page or feature components.

| Role | Token |
| --- | --- |
| Page background | --background |
| Main text | --foreground |
| Elevated surface | --card |
| Subdued text | --muted-foreground |
| Action | --primary / --primary-foreground |
| Secondary surface | --secondary / --secondary-foreground |
| Warm signal | --accent / --accent-foreground |
| Attention signal | --signal / --signal-foreground |
| Error | --destructive / --destructive-foreground |
| Divider and input | --border / --input |
| Focus | --ring |
| Editorial surfaces | --surface-blue, --surface-warm, --surface-strong |

Light mode uses a warm off-white background, deep ink text, cobalt primary, and signal orange. Dark mode keeps the same hue relationships with a deep blue-black canvas. Every foreground/background pairing must meet WCAG 2.2 AA contrast.

## Layout and type

- Use max-width containers with fluid padding and no fixed page widths.
- Use clamp for display type and responsive spacing where appropriate.
- Keep body copy at 16px or larger on marketing surfaces, with comfortable line height.
- Use mono uppercase eyebrows only for labels, section indices, and factual metrics.
- Use border-t sections and asymmetric grids to create rhythm without decorative clutter.
- Use container queries for component-level adaptation; reserve media queries for page layout.

## Component language

- Buttons: rounded-full for marketing CTAs, clear primary/outline hierarchy, minimum 44px height, visible focus ring.
- Cards: semantic background, border, 16px to 24px radius, subtle shadow, and hover changes limited to border, shadow, and a small lift.
- Inputs: semantic input and border tokens, descriptive labels, visible invalid state, and keyboard focus.
- App launchpad: active tools are real links; coming-soon tools are non-interactive and clearly labelled.
- Quick actions: explicit operations with real destinations. Never present a guessed next task, due date, priority, or source list.
- Help: a quiet secondary card below Quick actions that links to support.

## Motion

- Use 150ms to 300ms transitions for color, border, shadow, and transform.
- Scroll reveals are progressive enhancement; content must be present without JavaScript.
- Respect prefers-reduced-motion by disabling transforms and delays.
- Avoid autoplay, infinite decorative animation, parallax, and layout-shifting hover effects.

## Accessibility and performance

- Maintain sequential headings, landmark regions, skip links, and descriptive link text.
- Mark decorative icons aria-hidden and provide accessible names for icon-only controls.
- Keep touch targets at least 44px and prevent horizontal overflow at 320px.
- Keep public pages server-rendered; isolate client code to interaction that needs it.
- Use code-native mockups when a visual explains the product; do not add raster assets without product value.
- Keep authenticated data on the server and pass explicit typed DTOs to client components.

## Anti-patterns

- Generic gradient blobs as the primary identity.
- Fake testimonials, logos, ratings, usage numbers, timestamps, or personalized recommendations.
- A marketing preview with a sidebar that the real platform does not use.
- Raw database rows in client components.
- Raw color values, unscoped global styles, or speculative abstractions.

## Delivery checklist

- Verify 320px, 375px, 768px, 1024px, and 1440px layouts.
- Verify light and dark semantic token pairings.
- Verify keyboard navigation and visible focus states.
- Verify reduced motion behavior.
- Run typecheck, lint, tests, production build, and git diff --check.
