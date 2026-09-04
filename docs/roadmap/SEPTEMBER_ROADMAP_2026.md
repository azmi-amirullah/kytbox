# 🗺️ September 2026 Roadmap — Kytbox Ecosystem

> **Theme**: Personal Utility First — Garage (`/garage`: Vehicle & Service Tracker), Actionable Cashflow, and High-Velocity List Productivity  
> **Duration**: September 1, 2026 – September 30, 2026  
> **Status**: 🟢 Approved & Battle-Tested (Dogfooding-First, 100% Free, Zero-Storage Risk, Edge-Case Hardened)  

---

## 📌 Table of Contents & Progress Checklist

- [x] [Day 1 — Garage: Vehicle Garage & Profile Management (`/garage`)](#day-1)
- [ ] [Day 2 — Garage: Maintenance Checklist & Interval Rules Engine](#day-2)
- [ ] [Day 3 — Garage: Service & Maintenance Logging Engine & Due Predictor](#day-3)
- [ ] [Day 4 — Garage: Vehicle Tax, STNK, Insurance & Driver's License (`SIM`) Expiry](#day-4)
- [ ] [Day 5 — Garage: Fuel Log, Mileage Efficiency & Auto-Odometer Sync](#day-5)
- [ ] [Day 6 — Garage: Cross-App Integration with Cashflow & List](#day-6)
- [ ] [Day 7 — Weekly Sprint Audit & Garage E2E Test Suite](#day-7)
- [ ] [Day 8 — Cashflow: Subscription & Bill Matrix with Dynamic "Safe-to-Spend" Engine](#day-8)
- [ ] [Day 9 — Cashflow: Budget Rollover & Envelope Allocation Engine](#day-9)
- [ ] [Day 10 — Cashflow: Multi-Currency Support & Live Exchange Rate Converter](#day-10)
- [ ] [Day 11 — Cashflow: Zero-Signup Shared Expense Links (`/split/[token]`) & Net-Balance Ledger](#day-11)
- [ ] [Day 12 — Cashflow: Custom Financial Report Generator & Export (PDF/CSV)](#day-12)
- [ ] [Day 13 — Cashflow: Power Features E2E Test Suite](#day-13)
- [ ] [Day 14 — Weekly Sprint Audit & Multi-Currency Decimal Precision Check](#day-14)
- [ ] [Day 15 — List: Card Custom Colored Labels & Multi-Tag Taxonomy (`#Personal, #Work, #Urgent`)](#day-15)
- [ ] [Day 16 — List: Card Resource Links & Cloud Attachment Bookmarks (`Drive, Figma, GitHub, Loom`)](#day-16)
- [ ] [Day 17 — List: Quick Filter Pills & Kanban Column WIP Limits (`In Progress: max 3`)](#day-17)
- [ ] [Day 18 — List: 1-Click Trello & Notion Board Importer (`JSON / CSV Migration Engine`)](#day-18)
- [ ] [Day 19 — List: Board Data Export Engine (`Markdown, CSV & Clean Printout`)](#day-19)
- [ ] [Day 20 — List: Advanced Productivity E2E Test Suite](#day-20)
- [ ] [Day 21 — Weekly Sprint Audit & Accessibility (WCAG 2.2)](#day-21)
- [ ] [Day 22 — Platform: Two-Factor Authentication (`TOTP 2FA + Recovery Codes`)](#day-22)
- [ ] [Day 23 — Platform: Quick Action Shortcuts in Global Command Palette (`Cmd+K Actions`)](#day-23)
- [ ] [Day 24 — Platform: Keyboard Shortcuts Command Reference Guide (`?` Modal)](#day-24)
- [ ] [Day 25 — Bio: Bento-Style Grid Layout Canvas (`1x1, 1x2, 2x2 Custom Tiles`)](#day-25)
- [ ] [Day 26 — Bio: Persistent Audio & Podcast Stream Widget (`Zero-Storage External Stream`)](#day-26)
- [ ] [Day 27 — Platform & Bio E2E Test Suite](#day-27)
- [ ] [Day 28 — Weekly Sprint Audit & Zero-Trust Security Verification](#day-28)
- [ ] [Day 29 — List: Public List & Wishlist Sharing with Guest Gift Claiming (`/{username}/list`)](#day-29)
- [ ] [Day 30 — Bio & Platform: Contact Relay Widget & September Sprint Retrospective / Q4 Planning](#day-30)

---

## 🎯 Strategic Focus & Dogfooding Principles

1. **Dogfooding First (Build What You Actually Use Daily)**: Front-loading **Garage (`/garage`)** in Week 1 directly solves the founder's daily personal need. You can add your car or motorbike, log oil changes, track fuel efficiency, and monitor tax renewals immediately.
2. **Cross-App Synergy (The Kytbox Moat)**: Garage is not an isolated silo. Maintenance costs and fuel fill-ups log directly to **Cashflow** under the `Vehicle/Transport` category with 1 click, and service deadlines generate automatic reminder cards in **List**.
3. **Zero Storage Risk (Free Tier Safe Forever)**: No raw PDF or audio hosting on Supabase. Uses cloud bookmarks (Google Drive, Figma, GitHub) and external audio streams to keep Supabase storage at **0 bytes**.
4. **Edge-Case Hardening**: Built-in cold-start defaults, partial fill-up math guards, sticky Cashflow book memory, and strict multi-vehicle data isolation prevent common tracking errors.

---

## 📅 Detailed September 2026 Execution Schedule

---

### Week 1 — Garage: Vehicle & Service Tracking (Sep 1 - Sep 7)

<a id="day-1"></a>
#### Day 1 — Tuesday, Sep 1 | ✨ Feature
##### Garage: Vehicle Garage & Profile Management (`/garage`)
- **Why**: As envisioned in `docs/Kytbox.md`, `Garage` is Kytbox's dedicated private utility for asset maintenance. Users need a clean garage dashboard to manage their vehicles (cars, motorcycles, scooters, bicycles) with key specs, current odometer, and license plates.
- **Implementation Blueprint**:
  - Create `vehicles` table:
    ```sql
    create table vehicles (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade not null,
      name text not null,               -- e.g. "Honda Civic Turbo", "Yamaha NMAX"
      type text not null,               -- 'car' | 'motorcycle' | 'bicycle' | 'other'
      license_plate text,               -- e.g. "B 1234 ABC"
      year integer,                     -- e.g. 2022
      is_default boolean not null default false,   -- Default vehicle for Cmd+K and quick logging
      current_odometer integer not null default 0, -- in km or miles
      odometer_unit text not null default 'km',    -- 'km' | 'miles'
      estimated_monthly_km integer default 1000,   -- Cold-start fallback estimate
      fuel_type text not null default 'petrol',    -- 'petrol' | 'diesel' | 'electric' | 'hybrid'
      currency text not null default 'IDR',        -- Primary currency for fuel & service costs
      is_archived boolean not null default false,  -- Preserves service history for resale proof!
      vin text,                         -- Vehicle Identification Number (optional)
      preferred_cashflow_id uuid references cashflows(id) on delete set null, -- Sticky book memory
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
    create index idx_vehicles_user_id on vehicles(user_id);
    create unique index idx_vehicles_one_default_per_user on vehicles(user_id) where is_default = true and not is_archived;
    alter table vehicles enable row level security;
    create policy "Users manage their own vehicles" on vehicles for all using (auth.uid() = user_id);
    ```
  - Create `vehicle_monthly_odometers` table (rolling 6-month snapshot with latest reading upsert):
    ```sql
    create table vehicle_monthly_odometers (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade not null,
      vehicle_id uuid references vehicles(id) on delete cascade not null,
      year_month text not null,          -- e.g. "2026-09"
      odometer integer not null,
      updated_at timestamptz default now(),
      unique (vehicle_id, year_month)    -- 1 row per month per vehicle
    );
    create index idx_monthly_odo on vehicle_monthly_odometers(vehicle_id, year_month);
    create index idx_monthly_odo_user on vehicle_monthly_odometers(user_id);
    alter table vehicle_monthly_odometers enable row level security;
    create policy "Users manage their own monthly odometers" on vehicle_monthly_odometers for all using (auth.uid() = user_id);
    ```
  - Colocate domain folder `src/features/garage/` with schemas, actions, types, and DTOs.
  - Build Garage Dashboard page `src/app/(platform)/garage/page.tsx` displaying vehicle cards with vehicle type icons, current mileage, and quick-action buttons.
  - Build `AddVehicleModal.tsx` with Zod bounds validation, unit selectors, and initial monthly driving estimate.
- **🛡️ Edge-Case & Usability Guardrails**:
  - **Cold-Start Fallback**: If `< 2` monthly odometer records exist, usage velocity falls back gracefully to `estimated_monthly_km` (e.g. `1,000 km / month` or `~33 km / day`), completely preventing `NaN` or broken predictions.
  - **Vehicle Context Isolation**: Strict URL routing `src/app/(platform)/garage/[vehicleId]/page.tsx` guarantees that updates for a car never bleed into a motorbike.
  - **Odometer Time-Machine Prevention**: `vehicles.current_odometer` is forward-only. It only updates if `new_odometer > current_odometer` and `log_date >= latest_recorded_date`. Logging an old glovebox receipt from 2 months ago never rewinds the car's current mileage.
  - **Fat-Finger Odometer Typo Guard & Snapshot Cascade**: If `new_odometer - current_odometer > 3,000 km` in a single log, display an explicit confirmation dialog (*"You entered 431,000 km. Did you mean 43,100 km?"*). When a user executes a manual edit override on the vehicle profile to fix an odometer typo, the Server Action atomically updates the current month's row in `vehicle_monthly_odometers` (`year_month = to_char(now(), 'YYYY-MM')`), preventing negative velocity math (`-40,000 km/mo`) in subsequent months.
  - **Resale History & Archival**: `is_archived: boolean` allows users who sell a vehicle to hide it from active dashboards without destroying 2 years of valuable maintenance records.
  - **PII Privacy Isolation**: `license_plate` and `vin` are strictly encapsulated within authenticated server queries and never leaked to public DTOs.
  - **Odometer Unit Immutability / Switch Lock**: Once the first service rule, monthly snapshot, or fuel log is recorded, `odometer_unit` (`km` vs `miles`) is locked against accidental toggling in vehicle settings. Changing units thereafter requires an explicit confirmation dialog with optional one-time mathematical conversion (`1 mi = 1.60934 km`), preventing historical odometer, fuel economy, and interval countdowns from getting corrupted.
  - **Mobile 1-Tap Quick Fuel FAB**: Persistent floating action button `[ ⛽ Quick Fuel ]` on mobile `/garage` pops up the fuel modal in under 1.5 seconds at the gas pump.

---

<a id="day-2"></a>
#### Day 2 — Wednesday, Sep 2 | ✨ Feature
##### Garage: Maintenance Checklist & Interval Rules Engine
- **Why**: Before logging services, each vehicle must have its customized maintenance checklist and interval rules configured. A scooter needs CVT belt rules, while a car needs oil filter and transmission fluid rules.
- **Implementation Blueprint**:
  - Create `vehicle_maintenance_rules` table:
    ```sql
    create table vehicle_maintenance_rules (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade not null,
      vehicle_id uuid references vehicles(id) on delete cascade not null,
      name text not null,               -- e.g. "Engine Oil", "CVT Belt", "Ferrox Air Filter"
      category text not null,           -- 'fluids' | 'filters' | 'brakes' | 'tires' | 'powertrain' | 'electrical' | 'other'
      interval_distance integer,        -- In vehicle's native unit (e.g. 5000 km or 3000 miles)
      interval_months integer,          -- e.g. 6 (every 6 months)
      last_service_odometer integer,
      last_service_date date,
      is_active boolean default true,
      created_at timestamptz default now()
    );
    create index idx_vehicle_maintenance_rules_vehicle on vehicle_maintenance_rules(vehicle_id);
    create index idx_vehicle_maintenance_rules_user on vehicle_maintenance_rules(user_id);
    alter table vehicle_maintenance_rules enable row level security;
    create policy "Users manage their own maintenance rules" on vehicle_maintenance_rules for all using (auth.uid() = user_id);
    ```
  - Pre-populate smart default template presets based on vehicle type and unit (`km` vs `miles`):
    - **Motorcycle / Scooter**: Engine Oil (`3,000 km` / `1,800 mi`), CVT Belt (`20,000 km` / `12,000 mi`), Gear Oil (`6,000 km` / `3,600 mi`), Spark Plug (`8,000 km` / `5,000 mi`), Brake Fluid, Coolant.
    - **Car (Petrol/Diesel)**: Engine Oil (`5,000 km` / `3,000 mi` synthetic), Engine Oil Filter (`10,000 km` / `6,000 mi`), Air Filter, Cabin Filter, Brake Pads (`25,000 km` / `15,000 mi`), Transmission Fluid (`40,000 km` / `24,000 mi`), Coolant.
    - **Electric Vehicle (EV)**: Reduction Gearbox Oil (`40,000 km` / `24,000 mi`), Cabin Filter (`20,000 km` / `12,000 mi`), Brake Fluid (`30,000 km`), High-Voltage Coolant.
  - Build `MaintenanceChecklistManager.tsx` allowing users to customize intervals, toggle active items, and add custom parts (e.g., *"Ferrox Air Filter"*).
- **🛡️ Used Vehicle Baseline Guardrail**:
  - To prevent a newly added second-hand car (e.g. at `38,000 km`) from triggering 8 false 🔴 `OVERDUE` alarms on Day 1, each rule provides a baseline toggle: `Last serviced at: [ X km ]` OR `[x] Unknown — Start countdown from current odometer (38,000 km)`.

---

<a id="day-3"></a>
#### Day 3 — Thursday, Sep 3 | ✨ Feature
##### Garage: Service & Maintenance Logging Engine & Due Predictor
- **Why**: Keeping a complete service history prevents premature engine wear and preserves resale value. When you log a service, the form pulls your vehicle's configured checklist from Day 2 and auto-advances the maintenance countdown.
- **Implementation Blueprint**:
  - Create `vehicle_services` table:
    ```sql
    create table vehicle_services (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade not null,
      vehicle_id uuid references vehicles(id) on delete cascade not null,
      service_date date not null,
      odometer integer not null,
      service_type text not null,       -- 'routine' | 'repair' | 'inspection' | 'upgrade'
      items_serviced text[] not null,   -- Display names snapshot (e.g. ['Engine Oil', 'Oil Filter'])
      serviced_rule_ids uuid[],         -- Foreign keys to vehicle_maintenance_rules (relational integrity even if renamed!)
      cost numeric(12, 2) not null default 0,
      workshop_name text,
      invoice_number text,              -- Workshop invoice # (e.g. INV-2026-8842)
      external_invoice_url text,        -- Google Drive / Dropbox link (Zero storage footprint!)
      notes text,
      created_at timestamptz default now()
    );
    create index idx_vehicle_services_vehicle on vehicle_services(vehicle_id);
    create index idx_vehicle_services_user on vehicle_services(user_id);
    alter table vehicle_services enable row level security;
    create policy "Users manage their own vehicle services" on vehicle_services for all using (auth.uid() = user_id);
    ```
  - Build `ServiceLogTimeline.tsx` displaying chronological service events with category chips, odometer stamps, and costs.
  - Build `LogServiceModal.tsx`:
    - Checklist checkboxes are dynamically populated from `vehicle_maintenance_rules`.
    - Pre-fills predicted current odometer.
    - Upon submission: atomically updates `vehicles.current_odometer` (forward-only), upserts `vehicle_monthly_odometers`, and updates `last_service_odometer` & `last_service_date` on all checked rules matching `serviced_rule_ids`.
  - Real-time due predictor `predictNextMaintenance()` with visual badges:
    - 🟢 `Good` (due in > 1,000 km and > 30 days)
    - 🟡 `Due Soon` (due within 500 km or 14 days)
    - 🔴 `Overdue` (exceeded km or date)
  - **Zero Supabase Storage & Drive Thumbnail Sanitizer**: Physical receipts are tracked via structured text notes, workshop invoice numbers, and external cloud URLs rather than burning Supabase storage quotas. Google Drive view URLs (`/file/d/[id]/view`) are automatically transformed into direct thumbnail image streams (`https://drive.google.com/thumbnail?id=[id]&sz=w800`), preventing broken image icons in `ServiceLogTimeline.tsx`.

---

<a id="day-4"></a>
#### Day 4 — Friday, Sep 4 | ✨ Feature
##### Garage: Vehicle Registration, Road Tax, Insurance & Driver's License Expiry
- **Why**: Expired vehicle registration, annual road taxes, insurance, or driver's licenses result in government fines, impound risk, or re-taking driving examinations.
- **Implementation Blueprint**:
  - Create `vehicle_documents` table (scoped to `vehicle_id`):
    ```sql
    create table vehicle_documents (
      id uuid primary key default gen_random_uuid(),
      vehicle_id uuid references vehicles(id) on delete cascade not null,
      user_id uuid references auth.users(id) on delete cascade not null,
      title text not null,             -- e.g. "Annual Road Tax", "Registration Renewal", "Comprehensive Insurance"
      document_type text not null,     -- 'road_tax_annual' | 'registration_renewal' | 'insurance' | 'inspection'
      expiry_date date not null,
      notes text,
      created_at timestamptz default now()
    );
    create index idx_vehicle_documents_user on vehicle_documents(user_id);
    create index idx_vehicle_documents_vehicle on vehicle_documents(vehicle_id);
    alter table vehicle_documents enable row level security;
    create policy "Users manage their own vehicle documents" on vehicle_documents for all using (auth.uid() = user_id);
    ```
  - Create `driver_licenses` table (scoped to `user_id` on root `/garage` dashboard):
    ```sql
    create table driver_licenses (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade not null,
      license_name text not null,      -- e.g. "Class C (Driver)", "Class M (Motorcycle)"
      category text not null,          -- 'car' | 'motorcycle' | 'commercial' | 'other'
      license_number text,
      expiry_date date not null,
      notes text,
      created_at timestamptz default now()
    );
    create index idx_driver_licenses_user on driver_licenses(user_id);
    alter table driver_licenses enable row level security;
    create policy "Users manage their own driver licenses" on driver_licenses for all using (auth.uid() = user_id);
    ```
  - Render countdown alert cards: *"Annual Road Tax expires in 18 days (Sep 21, 2026)"* on `/garage/[vehicleId]` and *"Driver's License (Class C) expires in 14 days"* on the root `/garage` KPI strip.
  - Visual urgency badges (`Expired`, `Expiring in < 30 days`, `Valid`).
- **🛡️ Driver Document Safety & Global Notification Center Integration**:
  - **Clean Domain Ownership**: Driver licenses belong to the human user, not the machine; they live on the root `/garage` dashboard and are preserved when vehicles are sold or deleted. Vehicle documents (road tax, registration, insurance) are strictly tied to `vehicle_id`.
  - **Platform Notification Bell Integration**: When any document or license enters `<= 14 days` before expiry (or overdue), emit an in-app notification to the platform header bell via `createNotification({ type: 'garage_alert', ... })` so users never miss a renewal even if they only visit Cashflow or List.
  - **1-Click Cashflow Renewal Sync**: Paying annual road tax or comprehensive insurance is often a household's largest single vehicle expense. When renewing a document, `DocumentRenewalModal.tsx` provides an inline `[x] Record to Cashflow Book` toggle, pre-populating `vehicles.preferred_cashflow_id` and category `Vehicle & Transport`, automatically creating the transaction in Cashflow without manual double entry.

---

<a id="day-5"></a>
#### Day 5 — Saturday, Sep 5 | ✨ Feature
##### Garage: Fuel Log, Mileage Efficiency & Auto-Odometer Sync
- **Why**: Tracking fuel fill-ups reveals engine efficiency problems, real-world fuel economy (km/L or MPG), and exact fuel cost per kilometer.
- **Implementation Blueprint**:
  - Create `vehicle_fuel_logs` table:
    ```sql
    create table vehicle_fuel_logs (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade not null,
      vehicle_id uuid references vehicles(id) on delete cascade not null,
      log_date date not null,
      odometer integer not null,
      fuel_amount numeric(8, 2) not null, -- Liters, Gallons, or kWh
      price_per_unit numeric(10, 2),      -- Price per Liter / Gallon / kWh
      total_cost numeric(10, 2) not null,
      is_full_tank boolean default true,
      is_missed_previous boolean default false, -- Reset baseline flag
      battery_start_pct smallint check (battery_start_pct between 0 and 100), -- For EV charging logs
      battery_end_pct smallint check (battery_end_pct between 0 and 100),   -- For EV charging logs
      calculated_kml numeric(6, 2),
      created_at timestamptz default now()
    );
    create index idx_vehicle_fuel_logs_vehicle_date on vehicle_fuel_logs(vehicle_id, log_date desc);
    create index idx_vehicle_fuel_logs_user on vehicle_fuel_logs(user_id);
    alter table vehicle_fuel_logs enable row level security;
    create policy "Users manage their own fuel logs" on vehicle_fuel_logs for all using (auth.uid() = user_id);
    ```
  - **🛡️ Advanced Fuel Math & Pump Auto-Calculation**:
    - **Gas Station Pump Dual-Input**: Supports entering `Total Cost` + `Price per Liter` to auto-calculate `Liters` (e.g., Rp 150.000 @ Rp 13.700/L = 10.95 L), or `Liters` + `Price per Liter` to calculate `Total Cost`, eliminating pump-side mental math.
    - `is_full_tank` toggle: `[x] Full Tank (Default)` vs `[ ] Partial Fill-up`. For Electric Vehicles (`fuel_type = 'electric'`), this toggle dynamically labels as `[x] Charged to Target Limit (80% or 100%)` (with optional `battery_start_pct` / `battery_end_pct` inputs), ensuring EV owners capping daily charges at 80% to preserve lithium pack health are not trapped in a perpetual "Pending Full Tank" state.
    - **Partial Fill-up Pending State**: For partial fill-ups (`is_full_tank = false`), fuel economy cannot be calculated mathematically; `calculated_kml` is strictly set to `null` with a pending badge: `[ ⏳ Pending Full Tank ]`. Economy is accurately resolved upon the next full-tank log by summing all intermediate partial fuel quantities.
    - `is_missed_previous` toggle: `[ ] Missed previous fill-up?` resets calculation baseline and prevents phantom inflated economy numbers.
    - First fill-up is marked as *"Baseline Fill-up (Economy starts on next fill-up)"* (zero `NaN` bugs).
    - Consecutive full-tank math: `km/L = (currentOdo - prevFullOdo) / sum(fuelSincePrevFull)`.
    - Dynamic unit labels: Petrol/Diesel + KM = `Liters` & `km/L`; Petrol/Diesel + Miles = `Gallons` & `MPG`; Electric = `kWh` & `km/kWh`.
    - Masked currency inputs: clean formatting for Indonesian Rupiah (`Rp 450.000`) and USD (`$45.50`) without decimal misplacement.
  - **Auto-Odometer Sync & Non-Destructive Estimate UX**:
    - Pre-fills predicted current odometer in fuel modal with an interactive badge: `✦ Est. {value} km`.
    - **Persistent Estimate**: When the user edits or types a new odometer reading, the estimated value is **not destroyed**. Instead, an interactive restore chip appears: `[↺ Reset to Est. {value} km]`, allowing the user to 1-click restore the calculated estimate if they change their mind or make a typo.
    - Saving a fuel log automatically updates `vehicles.current_odometer` (forward-only) and upserts `vehicle_monthly_odometers` for the current month in 1 click!

---

<a id="day-6"></a>
#### Day 6 — Sunday, Sep 6 | ✨ Feature
##### Garage: Cross-App Integration with Cashflow & List
- **Why**: The true power of Kytbox is ecosystem synergy. You shouldn't have to manually retype a $75 oil change or $30 gas fill-up in Cashflow.
- **Implementation Blueprint**:
  - **Cashflow 1-Click Sync with Currency Reconciliation & Smart Category Selector**:
    - In `LogServiceModal.tsx`, `AddFuelLogModal.tsx`, and `DocumentRenewalModal.tsx` (Day 4 Tax & Insurance), include a toggle: `[x] Record to Cashflow Book`.
    - Dropdown pre-selects `vehicles.preferred_cashflow_id` (remembers your last selected book per vehicle).
    - **Cross-App Currency Reconciliation**: If `vehicle.currency !== selectedCashflow.currency`, the sync dialog detects the mismatch, queries the Day 10 exchange rate engine, and shows an inline conversion preview (e.g. `Syncing Rp 1.500.000 IDR → ~$95.20 USD (Rate: 15.750)`), preventing absurd $1,500,000 accounting explosions.
    - **Smart Category Matcher**: Scans the selected cashflow book's existing categories for keywords (`Transport`, `Vehicle`, `Kendaraan`, `Bensin`, `Bahan Bakar`), pre-selecting the match with an inline category picker to prevent creating unwanted duplicate/orphan categories.
    - **Consolidated Transaction**: Creates **1 single transaction** for the full invoice total (matching bank/credit card statements), summarizing individual parts in the transaction note: `"[Civic] Service: Oil, Brake Pads, Air Filter at Honda Workshop — Rp 1.200.000"`.
  - **List Maintenance Tasks Sync**:
    - "Add to List" button on upcoming maintenance cards to auto-create an item in a designated List board with the predicted due date.

---

<a id="day-7"></a>
#### Day 7 — Monday, Sep 7 | 🔧 Audit
##### Weekly Sprint Audit & Garage E2E Test Suite
- **Why**: Validate vehicle creation, maintenance rule predictions, fuel economy calculations, and cross-app Cashflow transaction creation.
- **Implementation Blueprint**:
  - Playwright test suite in `tests/e2e/garage.test.ts` with deterministic clock freezing (`page.clock.setFixedTime(new Date('2026-09-01T09:00:00Z'))`) to prevent flaky date-countdown CI failures.
  - Unit tests verifying fuel economy math (`src/features/garage/__tests__/fuel-math.test.ts`), partial fill-ups, missed fill-ups, Notification Center alerts, and monthly odometer upserts.

---

### Week 2 — Cashflow Power Features & Subscriptions (Sep 8 - Sep 14)

<a id="day-8"></a>
#### Day 8 — Tuesday, Sep 8 | ✨ Feature
##### Cashflow: Subscription & Bill Matrix with Dynamic "Safe-to-Spend" Engine
- **Why**: Users hate backward-looking budgets that only show red bars after money is spent. A forward-looking subscription timeline paired with a dynamic **"Safe to Spend Today / This Month"** calculation (`Current Balance - Upcoming Bills - Savings Target`) gives users practical daily financial control.
- **Implementation Blueprint**:
  - **Zero Duplication (Anti-Overengineering)**: Leverage the existing `cashflow_recurring_rules` table (migrated on Sep 1 via `20260901_create_cashflow_recurring_rules.sql`) rather than creating a duplicate subscriptions table. Optionally add `billing_url text` or `payment_method text` to `cashflow_recurring_rules` if extra metadata is needed.
  - Safe-to-spend calculation engine `calculateSafeToSpend(balance, upcomingBills, savingsGoal, daysRemaining)` in `src/features/cashflow/lib/safe-to-spend.ts`:
    - Queries active recurring expenses from `cashflow_recurring_rules` (`type = 'expense' AND is_active = true`).
    - Projects bills due in the current budgeting cycle.
  - Render prominent KPI card on Cashflow Dashboard: *"Safe to Spend: $42.50 / day until next payday"*.
  - Subscription & bill renewal timeline listing recurring commitments due in the next 7 and 30 days.
- **🛡️ Balance Reality Check Guardrail**:
  - Without automated bank feeds, manual balance tracking can drift. Safe-to-Spend includes an inline **"Reconcile Balance"** trigger (`Tracked Balance: $1,450.00 • [ ✎ Reconcile with Bank Account ]`) allowing 1-click baseline correction so daily safe-to-spend numbers stay grounded in actual cash.

---

<a id="day-9"></a>
#### Day 9 — Wednesday, Sep 9 | ✨ Feature
##### Cashflow: Budget Rollover & Envelope Allocation Engine
- **Why**: Static monthly budgets that reset to zero ignore real-world habits. Unspent budget surpluses (or overspent deficits) should optionally roll over into the next month like an envelope budgeting system.
- **Implementation Blueprint**:
  - Add `enable_rollover: boolean default false` column to `cashflow_budgets`.
  - **Zero-Drift Dynamic Calculation**: Rollover is calculated **dynamically on-the-fly** (`prevMonthSurplus = budget.amount - actualSpentInPrevMonth`) rather than storing a stale static `rollover_balance` on a non-temporal table, eliminating cron dependencies, desynced balances, or retroactive edit corruption.
  - Calculate dynamic available spend: `available = budget_limit + prevMonthSurplus - current_spent`.
  - Build visual envelope balance meters in `BudgetOverview.tsx` with rollover badges.

---

<a id="day-10"></a>
#### Day 10 — Thursday, Sep 10 | ✨ Feature
##### Cashflow: Multi-Currency Support & Live Exchange Rate Converter
- **Why**: Expats, digital nomads, and international freelancers track income and expenses across USD, EUR, IDR, GBP, SGD, and JPY. Converting amounts manually causes accounting inaccuracies.
- **Implementation Blueprint**:
  - Ensure `currency: text not null default 'IDR'` exists on `cashflows` table as the book's home currency.
  - Add `original_currency: text`, `original_amount: numeric`, and `exchange_rate: numeric default 1.0` to `cashflow_entries`, with `amount: numeric` storing the converted base-currency figure for seamless ledger sums and charts.
  - Edge-cached exchange rate provider (JSON API with 24-hour daily fallback cache).
  - Multi-currency selector in transaction entry modal with live converted amount preview in book base currency.
  - Display dual-currency badges in transaction tables and summary KPI cards (e.g., `€50.00 (~$54.20)`).
- **🛡️ Zero-Decimal Currencies & Third-Party API Resiliency**:
  - **Zero-Decimal Currency Formatting**: Currencies with no sub-units in active circulation (`IDR`, `JPY`, `KRW`, `VND`) are explicitly formatted with `maximumFractionDigits: 0` (e.g. `Rp 450.000`, never `Rp 450.000,00`), preventing decimal confusion on Indonesian Rupiah and Japanese Yen transactions.
  - External currency APIs are **never called synchronously on client page load**. Rates are server-cached every 24 hours with a static fallback dictionary. If an external API is down or throttled, Cashflow gracefully falls back to the last known rate with a subtle stamp (`Rates updated 6h ago`), ensuring zero page load hangs.

---

<a id="day-11"></a>
#### Day 11 — Friday, Sep 11 | ✨ Feature
##### Cashflow: Zero-Signup Shared Expense Links (`/split/[token]`) & Net-Balance Ledger
- **Why**: Splitwise lost users by throttling free accounts. Forcing group members to register an account kills adoption on vacation trips or roommate bills. A **zero-signup shareable link** with a clean, fast net-balance breakdown (`Net = Paid - Owed`) solves this in 25 lines of code without academic graph overengineering.
- **Implementation Blueprint**:
  - Create `cashflow_split_groups` table (`id`, `token text unique not null`, `title text not null`, `pin_hash text | null`, `creator_id uuid references auth.users(id) on delete set null`, `created_at timestamptz default now()`).
  - Create `cashflow_split_group_expenses` table (`id uuid primary key default gen_random_uuid()`, `group_id uuid references cashflow_split_groups(id) on delete cascade not null`, `device_token text not null`, `description text not null`, `amount numeric(12, 2) not null check (amount > 0)`, `paid_by text not null`, `split_between text[] not null`, `is_settlement boolean not null default false`, `created_at timestamptz default now()`).
  - Add indexes: `idx_split_groups_token` on `cashflow_split_groups(token)` and `idx_split_expenses_group` on `cashflow_split_group_expenses(group_id)`.
  - Enable RLS on both tables with scoped token validation policies for guest read/write.
  - Public link route `src/app/split/[token]/page.tsx` allowing participants to add expenses and view balances without logging in.
  - Net-balance calculation helper `calculateNetBalances(expenses)`: for each person, calculates `totalPaid - totalOwed` and outputs clear summary cards (*"Bob owes Alice $20.00"*, *"Charlie owes Alice $40.00"*).
- **🛡️ Anti-Vandalism, Ghost Debt & Bot Defense**:
  - **Ghost Debt & Settlement Separation**: Transactions with `is_settlement = true` represent peer-to-peer debt payoffs. They directly adjust debtor/creditor balances in `calculateNetBalances()` but are **strictly excluded from the group trip total spend KPI**, preventing vacation expense double-counting.
  - **Upstash Redis Rate Limiting & Honeypot**: Public submission endpoints are protected against free-tier DB spam via Upstash Redis IP rate limiting (max 10 requests / min per IP) and a honeypot trap field.
  - **Device Token Ownership**: Anyone with the link can add an expense, but an expense can **only be edited or deleted by the device token that created it or by the group creator**, preventing disgruntled group members from deleting or tampering with other people's expenses.
  - **90-Day Inactive Group TTL & Cleanup Lifecycle**: Unauthenticated split groups (`creator_id IS NULL`) with no recorded activity for > 90 days are automatically marked archived or purged via an automated maintenance script (`npm run db:cleanup-splits`), permanently protecting Supabase free-tier database row quotas from zombie group bloat.
  - **Participant Name Canonicalization**: In guest mode, participants enter names manually without signing in. To prevent accidental duplicate debtor entries (`"Alex"`, `"alex "`, and `"ALEX"` treated as 3 separate people), names in `paid_by` and `split_between` are trimmed and canonicalized case-insensitively (`name.trim().toLowerCase()` with first-seen display capitalization preserved), keeping net balance graphs and IOUs coherent.

---

<a id="day-12"></a>
#### Day 12 — Saturday, Sep 12 | ✨ Feature
##### Cashflow: Custom Financial Report Generator & Export (PDF/CSV)
- **Why**: Exporting monthly or annual summaries for tax prep, personal review, or accounting partners needs to be 1-click and formatted cleanly.
- **Implementation Blueprint**:
  - Dedicated print-optimized template `src/features/cashflow/components/FinancialReportModal.tsx`.
  - Date range selector (`This Month`, `Last Quarter`, `Year to Date`, `Custom Range`).
  - Summary KPI cards, category breakdown table, and full transaction ledger with clean CSV and print triggers.
  - **CSV Formula Injection Sanitization (CWE-1236)**: Cells starting with `=`, `+`, `-`, or `@` are automatically escaped with a leading single quote (`'`) to neutralize malicious spreadsheet formula execution upon opening.

---

<a id="day-13"></a>
#### Day 13 — Sunday, Sep 13 | 🧪 Testing
##### Cashflow: Power Features E2E Test Suite
- **Why**: Guarantee floating-point safety across foreign currency conversions, guest group split balances, safe-to-spend projections, and envelope rollovers.
- **Implementation Blueprint**:
  - Playwright test suite in `tests/e2e/cashflow-power.test.ts` with fixed time mocking (`page.clock.setFixedTime()`) for safe-to-spend and subscription countdown checks.

---

<a id="day-14"></a>
#### Day 14 — Monday, Sep 14 | 🔧 Audit
##### Weekly Sprint Audit & Multi-Currency Decimal Precision Check
- **Why**: Prevent rounding errors across currency exchanges and multi-party split IOUs by enforcing integer minor units and precise Decimal arithmetic.
- **Implementation Blueprint**:
  - Run automated mathematical validation and pre-commit checks.

---

### Week 3 — List App Power Productivity (Sep 15 - Sep 21)

<a id="day-15"></a>
#### Day 15 — Tuesday, Sep 15 | ✨ Feature
##### List: Card Custom Colored Labels & Multi-Tag Taxonomy (`#Personal, #Work, #Urgent`)
- **Why**: Priority flags alone (`Urgent`, `High`) are not enough for real project management. Users need flexible, colorful label tags (Trello/Linear style) with high-contrast color tokens and 1-click filter strips.
- **Implementation Blueprint**:
  - Add `labels: text[]` array column with GIN index to production `list_items` table and create `list_labels` metadata table (`id uuid primary key default gen_random_uuid()`, `list_id uuid references lists(id) on delete cascade not null`, `name text not null`, `color_index integer not null`).
  - Reuse high-contrast 12-color slot-filling token allocation algorithm from Cashflow tags (`src/features/cashflow/lib/tag-colors.ts`).
  - Build `CardLabelPicker.tsx` inside `EditTodoModal.tsx` with live color preview.
  - Multi-label filter strip above board with active checkmarks and count badges.

---

<a id="day-16"></a>
#### Day 16 — Wednesday, Sep 16 | ✨ Feature
##### List: Card Resource Links & Cloud Attachment Bookmarks (`Drive, Figma, GitHub, Loom`)
- **Why**: Users keep design files, specs, and spreadsheets on Google Drive, Figma, GitHub, Dropbox, or OneDrive. Storing raw files on Supabase Free Tier (1 GB cap) risks rapid quota exhaustion. Cloud resource bookmarks resolve file metadata (domain favicon, title, OpenGraph preview) with **zero storage bytes consumed**.
- **Implementation Blueprint**:
  - Create `list_item_resources` table (`id uuid primary key default gen_random_uuid()`, `item_id uuid references list_items(id) on delete cascade not null`, `url text not null`, `title text`, `domain text`, `icon_url text`, `created_at timestamptz default now()`).
  - Create index `idx_list_item_resources_item` on `list_item_resources(item_id)`.
  - Enable RLS on `list_item_resources` with ownership check matching parent list owner.
  - Build server utility `resolveResourceMetadata(url)` with **Comprehensive SSRF Defense**:
    - Rejects private/internal IP blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.169.254`, `::1`).
    - Enforces protocol whitelist (`http:`, `https:` only).
    - Implements a 3-second `AbortController` timeout and a 100KB streaming limit to prevent server memory exhaustion.
  - Build `CardResourceBookmarks.tsx` in `EditTodoModal.tsx` rendering interactive tiles.
  - Storage cost: **0 BYTES**.

---

<a id="day-17"></a>
#### Day 17 — Thursday, Sep 17 | ✨ Feature
##### List: Quick Filter Pills & Kanban Column WIP Limits (`In Progress: max 3`)
- **Why**: Large boards become visual clutter. Quick filter pills enable 1-click filtering (`Due This Week`, `High Priority`, `Assigned to Me`), while Work-In-Progress (WIP) limits prevent bottlenecks by capping active tasks.
- **Implementation Blueprint**:
  - Add `wip_limit: integer | null` column to `list_columns`.
  - Render visual alert badge on column headers when card count exceeds `wip_limit`.
  - Build quick filter pills strip above Kanban board with active state indicators and count badges.
  - Implement client-side filtering helper `filterCards(cards, activeFilters)` with zero refetch latency.
  - **Fractional Indexing Re-ordering**: Card drag-and-drop utilizes fractional positioning (`sort_order = (prev.sort_order + next.sort_order) / 2`). Dragging any card into a column updates **strictly 1 database row**, eliminating 50-row sequential update cascades and multi-tab write lock collisions.
- **🛡️ Soft WIP Limits (No Hard Drag Blocking)**:
  - Exceeding a WIP limit highlights the column header with an amber warning badge (*"WIP Limit: 4/3"*). Drag-and-drop is **never hard-blocked**, ensuring users are alerted to bottlenecks without disrupting live sprint triage or emergency re-ordering.

---

<a id="day-18"></a>
#### Day 18 — Friday, Sep 18 | ✨ Feature
##### List: 1-Click Trello & Notion Board Importer (`JSON / CSV Migration Engine`)
- **Why**: Moving existing boards from Trello or Notion into Kytbox List must be instant. A 1-click JSON/CSV importer parses exported boards and creates columns, cards, due dates, and descriptions automatically.
- **Implementation Blueprint**:
  - Client-side parser in `src/features/list/lib/board-importer.ts` using `PapaParse` and `JSON.parse` (100% in-browser processing, **0 bytes** Supabase storage), with automatic UTF-8 BOM stripping (`content.replace(/^\uFEFF/, ''))` to prevent Windows Excel exports from breaking column header detection.
  - **Interactive Column Mapper**: Instead of hardcoded English column names, show a mapping preview modal with 4 dropdowns (*"Card Title column: [Name ▼]"*, *"Status/Column: [Phase/Tahap ▼]"*, *"Due Date: [Deadline ▼]"*, *"Priority: [Priority ▼]"*).
  - Interactive import preview modal allowing users to review parsed columns and card counts before committing.
  - Atomic chunked batch Server Action `importBoardData(listId, data)` creating columns and cards in client-orchestrated batches of 50 cards with an interactive progress bar, preventing Next.js / Supabase Server Action timeouts on large board imports.

---

<a id="day-19"></a>
#### Day 19 — Saturday, Sep 19 | ✨ Feature
##### List: Board Data Export Engine (`Markdown, CSV & Clean Printout`)
- **Why**: Users own their data and frequently need to export sprint tasks into meeting notes, client summaries, or spreadsheets without being locked into the platform.
- **Implementation Blueprint**:
  - Build export helpers in `src/features/list/lib/board-exporter.ts`:
    - `exportBoardToMarkdown(board)`: formats columns and cards into a clean hierarchical markdown checklist.
    - `exportBoardToCSV(board)`: tabular format with Column, Title, Priority, Due Date, Labels, and Description, sanitized against formula injection (CWE-1236) by escaping `=`, `+`, `-`, `@` characters.
  - Print-friendly CSS `@media print` stylesheet for clean 1-click browser printing.

---

<a id="day-20"></a>
#### Day 20 — Sunday, Sep 20 | 🧪 Testing
##### List: Advanced Productivity E2E Test Suite
- **Why**: Verify custom label filters, cloud bookmarks, WIP limits, board import parsing, and board export files without regressions.
- **Implementation Blueprint**:
  - Playwright test suite in `tests/e2e/list-advanced.test.ts` with deterministic mock clock for due-date badge tests.

---

<a id="day-21"></a>
#### Day 21 — Monday, Sep 21 | 🔧 Audit
##### Weekly Sprint Audit & Accessibility (WCAG 2.2)
- **Why**: Verify that label pickers, resource tiles, and import modals meet WCAG 2.2 keyboard navigation standards.
- **Implementation Blueprint**:
  - Run automated accessibility tests via `@axe-core/playwright`.

---

### Week 4 — Platform Security, Shortcuts & Bio Bento (Sep 22 - Sep 28)

<a id="day-22"></a>
#### Day 22 — Tuesday, Sep 22 | 🛡️ Security
##### Platform: Two-Factor Authentication (`TOTP 2FA + Recovery Codes`)
- **Why**: Financial accounts (Cashflow) and personal vehicle records (Garage) require enterprise-grade security. TOTP 2FA prevents unauthorized account access.
- **Implementation Blueprint**:
  - Integrate Supabase MFA API (`supabase.auth.mfa.enroll`, `challenge`, `verify`).
  - Build `TwoFactorSetupModal.tsx` with high-contrast QR code, manual secret key copy, and downloadable 8-digit emergency recovery codes.
  - **NIST 800-63B Hashed Recovery Codes**: Emergency recovery codes are cryptographically hashed (SHA-256 / bcrypt) before database storage in `user_2fa_recovery_codes (user_id, code_hash, used_at)`. Plaintext codes are displayed only once at setup; database compromise never reveals plaintext master bypass keys.
  - Enforce 2FA verification challenge on login when MFA is enabled.
- **🛡️ Routing Boundary AAL2 Enforcement & Dev Guardrail**:
  - **Middleware AAL2 Verification**: In `src/middleware.ts`, inspect `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`. If `currentLevel === 'aal1'` and `nextLevel === 'aal2'`, redirect immediately to `/auth/mfa-challenge` before granting access to platform routes (`/garage`, `/cashflow`, `/list`), closing the client-side bypass loophole.
  - **Mandatory Recovery Code Download**: The *"Enable 2FA"* button remains disabled until the user explicitly clicks *"Copy Codes"* or *"Download recovery-codes.txt"*, preventing accidental self-lockouts.
  - **Dev Environment Reset**: Provide an administrative reset CLI script (`npm run auth:reset-mfa`) so local testing never bricks development accounts.

---

<a id="day-23"></a>
#### Day 23 — Wednesday, Sep 23 | ✨ Feature
##### Platform: Quick Action Shortcuts in Global Command Palette (`Cmd+K Actions Upgrade`)
- **Why**: The Command Palette (`src/components/command-palette.tsx`) already exists for navigation and search. Day 23 upgrades it from passive search into an **active command runner**: pressing `Cmd+K` / `Ctrl+K` and typing `"add task"`, `"log fuel"`, or `"new expense"` triggers creation modals directly with zero navigation lag.
- **Implementation Blueprint**:
  - Upgrade existing `src/components/command-palette.tsx` with a new `Actions` group (`Create Card`, `Add Cashflow Entry`, `Log Vehicle Service (Garage)`, `Log Fuel Fill-up (Garage)`, `Switch Active Board`).
  - Add `/garage` and `/garage/[id]` navigation items to the Navigation category.
  - **Cross-Domain Action Dispatcher**: Actions local to the current active page dispatch in-memory modal open events (`open-new-card`, `open-log-fuel`). Actions belonging to a different feature domain (e.g. adding a Cashflow entry from Garage) perform client-side route transitions with action query parameters (`router.push('/cashflow?action=new-entry')`), where the destination layout mounts and triggers the creation modal immediately, eliminating unmounted event listener voids.
- **🛡️ Mobile Accessibility Trigger**:
  - Mobile phones do not have physical `Cmd` or `Ctrl` keys. Add a prominent **Quick Action search/lightning icon in the mobile platform header** that dispatches the existing `window.dispatchEvent(new Event('toggle-command-palette'))`, giving mobile users full 1-tap quick action access.

---

<a id="day-24"></a>
#### Day 24 — Thursday, Sep 24 | ✨ Feature
##### Platform: Keyboard Shortcuts Command Reference Guide (`?` Modal)
- **Why**: Power users navigate with keyboards. Pressing `?` or `Shift+/` anywhere across the platform opens an elegant shortcuts cheat sheet overlay.
- **Implementation Blueprint**:
  - Colocate global keyboard listener hook `useKeyboardShortcuts()` with input-element guard (`target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)`) to prevent question marks (`?`) typed in form inputs from stealing focus.
  - Build `<KeyboardShortcutsModal />` categorized by context (`Global`, `Garage`, `Cashflow`, `List Kanban`).
  - Support instant search and keybinding highlighting.

---

<a id="day-25"></a>
#### Day 25 — Friday, Sep 25 | ✨ Feature
##### Bio: Bento-Style Grid Layout Canvas (`1x1, 1x2, 2x2 Custom Tiles`)
- **Why**: Bento.me officially shut down on Feb 13, 2026. Displaced creators need a modern visual canvas where links and media are rendered as resizable Bento grid tiles (`1x1 Square`, `1x2 Wide Banner`, `2x2 Feature Box`) rather than boring vertical Linktree lists.
- **Implementation Blueprint**:
  - Add `grid_size: '1x1' | '1x2' | '2x2' | 'full'` column to production `links` table.
  - Update public bio renderer CSS with CSS Grid template (`grid-auto-flow: dense`) and `@container` query responsiveness.
  - **Mobile Packing Hole Defense**: On viewports `< 640px` (or `@container (max-width: 480px)`), `2x2` tiles automatically clamp to full width (`col-span-2 row-span-1`), preventing CSS Grid auto-placement voids and unsightly blank spaces on 2-column mobile viewports.
  - Build interactive visual tile size selector in `LinkEditorModal.tsx` with live preview.

---

<a id="day-26"></a>
#### Day 26 — Saturday, Sep 26 | ✨ Feature
##### Bio: Persistent Audio & Podcast Stream Widget (`Zero-Storage External Stream`)
- **Why**: Musicians, podcasters, and voice artists want visitors to sample their audio directly on their bio page without bouncing away to Spotify or Apple Podcasts. Streaming directly from external public audio URLs or podcast feeds uses **zero Supabase storage**.
- **Implementation Blueprint**:
  - **First-Class Bio Tile Integration (Anti-Overengineering)**: Integrate audio blocks directly into `links` by extending link types with `type: 'audio'` (storing `stream_url`, `title`, `artist`, and `cover_url`), maintaining unified drag-and-drop ordering with Bento tiles rather than maintaining a disjointed relational table.
  - **Layout-Level Audio Persistence**: Mount `<BioAudioPlayer />` and its underlying HTML `<audio>` instance inside the shared layout `src/app/[username]/layout.tsx` (backed by a persistent `AudioProvider` context), ensuring playback is never destroyed or cut off when a visitor navigates between `/[username]` and `/[username]/list`.
  - Build `BioAudioPlayer.tsx` with persistent bottom playback bar, waveform visualizer, and play/pause controls.
  - Support direct streaming from external public audio links (podcast RSS MP3, Soundcloud audio, or CDN hosted URL).
- **🛡️ Media Error & Embed Fallback Guardrail**:
  - Spotify and YouTube do not offer raw audio streams. The audio widget validates URLs with Zod: direct audio streams (`.mp3`, `.m4a`, podcast enclosure) render in the custom player, while Spotify/Soundcloud URLs **automatically switch to an embedded responsive iframe player**, preventing `MEDIA_ELEMENT_ERROR` crashes.

---

<a id="day-27"></a>
#### Day 27 — Sunday, Sep 27 | 🧪 Testing
##### Platform & Bio E2E Test Suite
- **Why**: Guarantee that 2FA login challenges, palette quick actions, Bento grid tile sizing, and audio stream widgets function reliably.
- **Implementation Blueprint**:
  - Playwright test suite in `tests/e2e/platform-features.test.ts` with fixed clock mocking.

---

<a id="day-28"></a>
#### Day 28 — Monday, Sep 28 | 🔧 Audit
##### Weekly Sprint Audit & Zero-Trust Security Verification
- **Why**: Conduct security audit across MFA enforcement, palette action guards, and CSV formula injection prevention.
- **Implementation Blueprint**:
  - Pre-commit check, full TypeScript compiler run (`npx tsc --noEmit`), and vulnerability scan.

---

### Week 5 — Public Sharing, Inquiries & Retrospective (Sep 29 - Sep 30)

<a id="day-29"></a>
#### Day 29 — Tuesday, Sep 29 | ✨ Feature
##### List: Public List & Wishlist Sharing with Guest Gift Claiming (`/{username}/list`)
- **Why**: Users want to publish curated wishlists or resource hubs linked to their Bio profile. Friends can click **"Claim Gift"** (name-only, no login required) so two people don't buy the same gift.
- **Implementation Blueprint**:
  - Add `slug: text` column with `unique (user_id, slug)` to production `lists` table (leveraging existing `is_public: boolean` and `type = 'wishlist'` created in July 2026).
  - Public routes:
    - `src/app/[username]/list/page.tsx`: Public gallery hub showing the user's published lists/wishlists (prevents route collision with dynamic `[username]/[linkId]` redirect route).
    - `src/app/[username]/list/[slug]/page.tsx`: Specific public board or wishlist item claiming interface.
  - Name-only claim flow with device token cookie allowing the guest to unclaim, plus owner administrative unclaim override.
- **🛡️ Concurrency Race Guard & Admin Override**:
  - **Atomic Concurrency Protection**: Claim submissions execute an atomic conditional SQL query (`UPDATE list_items SET metadata = jsonb_set(...) WHERE id = $2 AND (metadata->'claim'->>'claimed_at' IS NULL)`). If zero rows are updated because another guest claimed the item milliseconds earlier, the action returns an immediate friendly notice (*"Someone just claimed this gift a moment ago"*), preventing double-claim race conditions.
  - If a guest claims an item but changes their mind or never follows through, the wishlist owner always has an administrative **`[ ↺ Release Claim (Reset to Available) ]`** override on their private board, preventing items from being locked in limbo.

---

<a id="day-30"></a>
#### Day 30 — Wednesday, Sep 30 | ✨ Feature & 📋 Planning
##### Bio & Platform: Contact Relay Widget & September Sprint Retrospective / Q4 Planning
- **Why**: Conclude the 30-day September sprint by shipping creator inquiry relay forms, reflecting on personal dogfooding velocity, and drafting Q4 priorities within the exact 30-day calendar.
- **Implementation Blueprint**:
  - Create `bio_contact_messages` table (`id uuid primary key default gen_random_uuid()`, `profile_id uuid references profiles(id) on delete cascade not null`, `sender_name text not null`, `sender_email text not null`, `message text not null`, `status text default 'unread'`, `created_at timestamptz default now()`).
  - Enable RLS on `bio_contact_messages` with insert policy for public and select/update policy for profile owner (`auth.uid() = profile.user_id`).
  - Server Action `submitBioContactMessage(profileId, data)` with honeypot spam protection and Upstash Redis IP rate limiting.
  - **Domain Deliverability & Spam Defense**: Transactional emails are strictly relayed `From: inquiries@kytbox.com` with `Reply-To: sender_email` (never spoofing visitor domains to avoid DMARC failure). Enforces message validation (10 to 1,000 chars, max 1 URL) and provides a creator privacy toggle `[ ] Forward inquiries to verified email (Default: In-app inbox only)` to shield Kytbox's transactional sender reputation from blacklist penalties.
  - In-app inbox view under creator dashboard to review and manage inbound inquiries.
  - Compile September 30-Day Retrospective report and draft Q4 priorities 🎉.

---

## 📊 Summary Breakdown

| Category | Days | Primary Deliverables |
| :--- | :---: | :--- |
| 🏎️ **Garage App (`/garage`)** | 7 | Vehicle Profiles & 6-mo Odometer, Checklist & Rules Engine, Service Log & Due Predictor, Tax & SIM Expiry, Fuel Economy & Auto-Sync, Cashflow/List Sync, Garage E2E |
| 💰 **Cashflow App** | 7 | Subscription Matrix & "Safe-to-Spend" on `cashflow_recurring_rules`, Budget Rollover, Multi-Currency Converter, Zero-Signup Shared Expenses (`/split/[token]`), Report Generator, Cashflow E2E, Sprint Audit |
| 📋 **List App** | 7 | Card Custom Colored Labels, Cloud Resource Bookmarks (Zero-Storage), Quick Filter Pills & WIP Limits, 1-Click Trello/Notion Importer, Board Data Exporter (MD/CSV), Public Wishlist Sharing, List E2E |
| 🛡️ **Platform & Bio** | 7 | TOTP 2FA, Cmd+K Quick Actions, Keyboard Shortcuts (`?`), Bento Grid Canvas, Audio Stream Widget, Contact Inbox, Platform E2E |
| 🔧 **Planning & Retrospective** | 2 | Zero-Trust Security Verification (Day 28), September Retrospective & Q4 Planning (Day 30) |

---

## 🔮 Curated Strategic Backlog (Future & Q4 2026+)

> [!NOTE]
> Items here are either deferred until scale demands them (Monetization, Bank Sync, i18n, Board Collaboration ACL) or reserved for Q4.

---

### 🏎️ Garage App (Backlog)
| Idea | Description | Impact | Effort |
| :--- | :--- | :---: | :---: |
| **Tire Tread & Brake Wear Depth Tracker** | Track millimeter wear depth over time for performance vehicles | 🔥🔥 | ~3h |
| **OBD-II Diagnostic Trouble Code (DTC) Lookup** | Search engine for check engine light fault codes (P0300, etc.) | 🔥🔥🔥 | ~4h |
| **Vehicle Resale Value & Depreciation Estimator** | Mileage-based valuation graph based on market depreciation curves | 🔥🔥 | ~4h |
| **Service Invoice Photo Attachment** | Compressed WebP invoice capture tied to service records | 🔥🔥 | ~3h |

---

### 🔗 Bio App (Backlog)
| Idea | Description | Impact | Effort |
| :--- | :--- | :---: | :---: |
| **Multi-Page Profile Switcher (`alex/design`, `alex/gaming`)** | Multiple bio pages under one account | 🔥🔥 | ~5h |
| **Custom Rich Content Blocks (`FAQ Accordion, Quotes`)** | Formatted markdown and FAQ accordions on bio profile | 🔥🔥 | ~4h |
| **Link Click Visual Heatmap** | Spatial click-density visual overlay showing hotspots on Bento tiles | 🔥🔥🔥 | ~5h |
| **Creator Tip Jar / Donation Widget** | Direct Buy-Me-A-Coffee / tip tile integrated on bio profiles | 🔥🔥🔥 | ~4h |
| **Expiring Story Bubble Header** | 24-hour temporary visual story/update circle on creator avatar | 🔥🔥 | ~4h |

---

### 💰 Cashflow App (Backlog)
| Idea | Description | Impact | Effort |
| :--- | :--- | :---: | :---: |
| **Open Banking Auto-Sync (Plaid / Salt Edge)** | Live read-only bank transaction feeds for automated bookkeeping | 🔥🔥🔥 | ~8h |
| **Net Worth Tracker (with Bank Sync)** | Automatic asset/liability ledger once bank connections are active | 🔥🔥🔥 | ~5h |
| **AI Voice / Natural Language Expense Capture** | "Spent $14 on lunch at Chipotle" voice-to-entry transcription | 🔥🔥🔥 | ~5h |
| **Debt Snowball & Avalanche Payoff Planner** | Mathematical debt payoff scheduler comparing interest savings | 🔥🔥 | ~4h |

---

### 📋 List App (Backlog)
| Idea | Description | Impact | Effort |
| :--- | :--- | :---: | :---: |
| **Board Collaboration & ACL Permissions (`Viewer | Editor`)** | Real-time multi-user board sharing when team users join | 🔥🔥🔥 | ~6h |
| **Card Comments & Real-Time Activity Stream** | Asynchronous card discussion threads | 🔥🔥 | ~4h |
| **Two-Way Google / Apple Calendar Sync** | Push card deadlines and reminders directly to external calendar apps | 🔥🔥🔥 | ~5h |
| **Visual Timeline / Gantt View** | Multi-day spanning milestone bars across a zoomable timeline | 🔥🔥 | ~6h |

---

### 🏗️ Platform, Growth & Monetization (Backlog)
| Idea | Description | Impact | Effort |
| :--- | :--- | :---: | :---: |
| **Public Community Roadmap & Voting (`/roadmap`)** | User-facing feature voting board when active user volume warrants it | 🔥🔥 | ~4h |
| **Multi-Language Framework (`next-intl`)** | Internationalization when non-English user adoption justifies it | 🔥🔥 | ~8h |
| **Viral Referral Perks Engine** | "Invite 3 friends, unlock exclusive themes and pro badges" | 🔥🔥🔥 | ~5h |
| **Lemon Squeezy MoR Billing & `/pricing`** | Pro subscription checkout ($2/mo or $10/year) when organic scale warrants it | 🔥🔥🔥 | ~8h |
| **Native Mobile PWA Shell (Capacitor)** | Direct deployment to Apple App Store and Google Play Store | 🔥🔥🔥 | ~8h |

---

_Last Updated: September 3, 2026_
