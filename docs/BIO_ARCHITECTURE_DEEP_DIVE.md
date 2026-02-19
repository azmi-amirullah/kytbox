# Deep Dive: Unified Profile Architecture

This document serves as the definitive reference for the **Profile View Architecture** in Kytbox Bio. It outlines the transition from a "Duplicate Preview" model to a "True 1:1 Parity" system.

## 1. Executive Summary

Historically, the live phone preview used a parallel set of styles (`isPreview` flags) to mimic a mobile screen on a desktop monitor. This led to "Drift"—where the preview looked shrunken or slightly different from the actual public page.

In February 2026, we refactored the system into a **True Unified Component Architecture**.

- **100% Component Parity**: The Dashboard uses the exact same `ProfileView` component as the public page.
- **Scaling vs. Logic**: We removed all conditional mobile-vs-preview logic. Instead, we use **85% CSS scaling** and **mobile-first breakpoints** to handle the rendering.

## 2. Core Architectural Decisions

### 2.1 The "Parity Over Logic" Rule

We eliminated all `isPreview` and `variant` props from `ProfileHeader`, `ProfileLinks`, and `SocialGrid`.

| Feature      | Old Method                                                 | New Method                                                                                                   |
| :----------- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Styling**  | Conditional Tailwind (e.g., `isPreview ? 'w-20' : 'w-32'`) | Mobile-first CSS + `md:` overrides                                                                           |
| **Scaling**  | Font-size reduction logic                                  | `transform: scale(0.85)` in [PhonePreview.tsx](<file:///src/app/(platform)/bio/components/PhonePreview.tsx>) |
| **Rounding** | Hardcoded `rounded-2xl`                                    | Concentric geometry (Parent radius - Border width)                                                           |

### 2.2 CSS Viewport Scaling

To fit a 390px (iPhone 14) screen onto a desktop dashboard without triggering `md:` (768px) media queries erroneously, the `PhonePreview` component:

1. Wraps the content in a fixed `width: 390px`.
2. Applies a `scale(0.85)` transform.
3. Automatically calculates negative margins to keep the scaled element visually centered.

## 3. Unified Skeleton Architecture

We moved away from hardcoded server-side skeletons in favor of a **Prop-Driven Unified System**.

### 3.1 Principles

- **Matched Containers**: The `loading.tsx` file for both the platform and public profile now renders the **real** client components with `isLoading={true}`.
- **Pixel-Perfect Skeletons**:
  - [ProfileLinks.tsx](file:///src/app/[username]/components/ProfileLinks.tsx) skeletons use `h-[60px]` to match the exact height of a LinkButton.
  - [ProfileHeader.tsx](file:///src/app/[username]/components/ProfileHeader.tsx) skeletons use responsive height classes (e.g., `md:h-10`) to match typography drift.

### 3.2 Zero-Flash Hydration (Optimization)

To prevent the "Double Loading" flash (Server Shell -> Client Skeleton -> Real UI), we implemented **Single-Source Handover**:

1. **Public Profile**: Renders themed HTML on the server. The client hydrates directly into the real UI without showing a temporary skeleton.
2. **Dashboard Preview**: Uses the same `isLoading` state passed from the Parent.

## 4. Component Deep Dive

### [ProfileView](file:///src/app/[username]/components/ProfileView.tsx)

The orchestrator. It is responsible for the themed container, branding footer, and layout structure. It is the only component rendered in `loading.tsx` for the public page.

### [SocialGrid](<file:///src/app/(platform)/bio/components/SocialGrid.tsx>)

Handles platform auto-detection. It now supports a premium loading state with circular icon skeletons to maintain row geometry.

## 5. Summary of Achievements

✅ **Zero Layout Shift (CLS)**: Skeletons and UI are geographically identical.
✅ **Mobile-True Preview**: Dashboard preview is now an authentic representation of the public page.
✅ **Unified Codebase**: 40% reduction in conditional rendering logic in bio components.
