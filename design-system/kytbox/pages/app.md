# Kytbox Platform Home

> This page override defines the current /app information architecture. It intentionally does not introduce a persistent sidebar until the whole platform shell is ready for one.

## Direction

- Style: the same Swiss Modernism 2.0 foundation as the landing page, with denser dashboard spacing and quiet semantic surfaces.
- Role: /app is the authenticated workspace launchpad, not a recommendation engine.
- Navigation: keep the existing top header utilities — search, public profile, notifications, and user menu.
- Primary destinations: Bio, Cashflow, and List. Track remains visible as coming soon.
- Secondary utility: Support and Settings stay separate from product navigation.

## Page hierarchy

1. Personalized welcome and concise workspace context.
2. Data-backed stats: Bio clicks, Cashflow balance, and Open items.
3. Your workspace launchpad with the three active tools.
4. Recent activity with a real empty state when there is no activity.
5. Quick actions, followed by Help.
6. Coming soon tools below a clear divider.

## Copy rules

- Use the actual product names: Bio, Cashflow, List, and Track.
- “Open items” is more accurate than “Active tasks” because the current aggregate includes unfinished items across Todo, Wishlist, and Idea lists.
- Quick actions must be explicit operations: Add a Bio link, Record a cashflow entry, and Create a todo board.
- Never invent a “Next up” item, list source, due date, priority, or user intent.

## Data and states

- Stats and activity remain server-rendered and come from authenticated user data.
- Empty activity is a composed state with an explanation, not a blank panel.
- The marketing preview may illustrate structure, but must not expose real user values or imply live personalized data.

## Responsive behavior

- Keep the top-header shell on mobile and desktop.
- Use the existing app-card launchpad instead of a sidebar until cross-platform navigation is redesigned together.
- Preserve touch targets of at least 44px, visible focus states, and no horizontal overflow at 320px.

## Component rules

- Use semantic tokens from the shared system: background, card, border, primary, secondary, accent, muted, destructive, and ring.
- Keep cards quiet: bordered surfaces, restrained radius, subtle shadow, and hover changes limited to border, shadow, and a small lift.
- Treat Track as a non-interactive coming-soon state until its route exists.
- Keep active tools in a compact three-card row; place coming-soon tools in their own section below activity and support.
- Use explicit quick actions only: Add a Bio link, Record a cashflow entry, and Create a todo board.
- Keep Help below Quick actions and point it to the support route.

## Data and performance

- Preserve server-rendered stats and activity queries; do not add a recommendation query or infer user intent.
- Keep raw database rows on the server and pass only the existing typed activity and stat values to UI components.
- The landing preview is code-native and static, with honest placeholders and empty states; it does not fetch or imply user data.

## Accessibility

- Preserve the existing header utilities, search, notifications, public profile, user menu, command palette, and onboarding tour IDs.
- Keep visible keyboard focus rings on all links and controls.
- Use headings for each workspace section and mark decorative icons as hidden from assistive technology.
