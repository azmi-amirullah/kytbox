# Kytbox Garage Design Specification

> This page override defines the visual and UX standards for `/garage` and `/garage/[vehicleId]` based on Kytbox Swiss Modernism 2.0 and the `ui-ux-pro-max` design system.

## Direction & Aesthetic

- **Style**: Swiss Modernism 2.0; content-first, flat semantic surfaces, high contrast borders, clear data density, no ornamental clutter or fake 3D gradients.
- **Color Discipline**: Strictly Shadcn semantic tokens. Never use arbitrary inline hex values.
  - Page Background: `bg-background`
  - Cards & Panels: `bg-card border border-border/80`
  - Primary Accent: `text-primary bg-primary/10` for active indicators and vehicle type badges
  - Attention / Due Alerts: `text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20`
  - Overdue / Destructive: `text-destructive bg-destructive/10 border-destructive/20`
  - Success / Good State: `text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20`
- **Typography**:
  - Display & Headings: Geist Sans with tracking `tracking-[-0.03em]`
  - Eyebrows & Numbers: Geist Mono uppercase `tracking-[0.16em]` for factual odometer and plate metrics
- **Icon Set**: Vector-only `react-icons/lu` (`LuCar`, `LuBike`, `LuGauge`, `LuFuel`, `LuCalendar`, `LuWrench`, `LuShieldCheck`, `LuPlus`, `LuCheck`, `LuArchive`, `LuArrowRight`, etc.). Never use emojis as structural interface icons.

## Layout & Hierarchy

1. **Dashboard Header**:
   - Breadcrumb: `<BreadcrumbNav />` (`Homepage / Garage` on desktop, `< Homepage` on mobile)
   - Title: `Vehicle Garage`
   - Subtitle: Factual vehicle count and status summary
   - Primary Action: `+ Add Vehicle` (accessible dialog trigger, min 44px touch height)
2. **KPI Metrics Strip**:
   - Total Vehicles (active / archived count, fleet status)
   - Maintenance Health (fleet status, overdue service alerts)
   - Default Vehicle quick-card (1-tap log target, plate & capitalized fuel type)
   - Driver's License status card (user-scoped license expiry countdown)
3. **Filter Strip**:
   - Segmented toggle: `Active Vehicles (N)` vs `Archived (M)`
   - Fast client-side search input (filter by vehicle name or license plate)
4. **Vehicles Grid**:
   - Responsive CSS Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
   - Mobile: 320px min-width friendly, fluid padding without horizontal scrollbar leaks
   - Container queries (`@container`) inside vehicle cards for adaptive badge wrapping
5. **Vehicle Card Anatomy**:
   - Header: Vehicle Type icon badge (`Car`, `Motorcycle`, `Bicycle`, `Other`), Vehicle Name, Default indicator star/badge
   - Meta: License Plate chip (`font-mono tracking-wider bg-secondary/60 px-2.5 py-1 rounded`), Year, Fuel Type
   - Metric: Current Odometer (bold prominent numbers + unit), Estimated Monthly driving velocity
   - Actions: 1-click `View Garage Details →`, and dropdown menu (`Edit Vehicle`, `Set as Default`, `Archive/Restore`, `Delete`)
6. **Mobile Quick Action FAB**:
   - Bottom-right fixed floating action button `[ ⛽ Quick Fuel ]` on mobile viewports (< 768px), respecting bottom navigation / safe areas.

## Vehicle Detail Hierarchy (`/garage/[vehicleId]`)

1. **Breadcrumb**: `Garage / [Vehicle Name]`
2. **Profile Hero**: Clean `h1` vehicle name anchor with a consolidated horizontal metadata bar below (type badge, default/archived badge, license plate chip, dot-separated year, fuel type, currency) and quick action buttons on the right.
3. **Spec Matrix Bento**:
   - Current Odometer reading with last recorded relative timestamp
   - Estimated monthly velocity (~X km/mo · ~Y km/day)
   - Fuel type & preferred Cashflow book link
4. **Odometer 6-Month Timeline**:
   - Clean tabular and bar representation of rolling monthly odometer readings
5. **Sub-feature Tabs (Roadmap Days 2–5 Placeholders)**:
   - `Vehicle Specs & Odometer`
   - `Maintenance Rules` (Day 2)
   - `Service History` (Day 3)
   - `Tax & Documents` (Day 4)
   - `Fuel Economy` (Day 5)

## Accessibility (WCAG 2.2 AA)

- All buttons and interactive links have min-height 44px.
- Visible focus rings: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`.
- Dialogs implement Radix UI `Dialog` with accessible `DialogTitle` and `DialogDescription`.
- Screen readers announce vehicle type, name, plate, and odometer.
- Contrast ratio >= 4.5:1 for body text and >= 3:1 for large metrics and badges.
- `prefers-reduced-motion`: disable non-essential motion transitions.
