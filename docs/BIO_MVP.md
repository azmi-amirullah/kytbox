# 🎯 Bio MVP: Minimum Viable Product Checklist

This document benchmarks Kytbox Bio against industry standards (Linktree, Beacons, Stan.store) and tracks our progress toward a "Market Ready" V1 status.

## 📊 Market Benchmarking

| Feature Pillar    | Standard (Linktree) | Creator (Beacons) | **Kytbox (MVP)**                       |
| :---------------- | :------------------ | :---------------- | :------------------------------------- |
| **Organization**  | Flat List           | Flat List         | **Nested Folders** (Differentiator)    |
| **Discovery**     | Scrolling           | Scrolling         | **Sticky Search Bar** (Differentiator) |
| **Customization** | Presets Only        | Full Control      | **Hybrid** (Presets + CSS Variables)   |
| **Analytics**     | Clicks/Views        | Clicks/Sales      | Clicks/Referrers                       |
| **Monetization**  | Redirection         | Tip Jar / Store   | Redirection (Only)                     |

---

## ✅ MVP Checklist: Feature Coverage

### 1. Core Profile & Identity

- [x] **Unique Username URL**: `ukit.com/{username}`.
- [x] **Profile Header**: Avatar, Display Name, and Bio text.
- [x] **Social Icons Row**: Dedicated grid for Instagram, TikTok, Twitter, etc.
- [x] **SEO Basics**: Dynamic page titles and meta descriptions.

### 2. Link Management

- [x] **Unlimited Links**: No artificial caps on entries.
- [x] **Visibility Toggles**: Hide links without deleting them (useful for seasonal promos).
- [x] **Drag-and-Drop Reordering**: Mobile-optimized sorting logic.
- [x] **Open Protocol Support**: Support for `mailto:`, `tel:`, and `sms:`.

### 3. Advanced UX (Kytbox Advantage)

- [x] **Nested Directories**: Folders for cleaner categorization (e.g., "My Gear", "Latest Videos").
- [x] **Slide Transitions**: Native-app feel with iOS-style "drill-down" animations.
- [x] **Sticky Search**: Fast discovery for high-volume creator profiles.
- [x] **Link Highlighting**: Pulsing/Glowing animations for priority referral links.

### 4. Customization & Branding

- [x] **Premium Presets**: Curated high-performance themes (Solid/Gradient).
- [x] **Custom Theme Engine**: Real-time hex color customization for pro users.
- [x] **Concentric Geometry**: Buttons shapes (Rounded, Square, Pill, Leaf) matching parent borders.
- [x] **1:1 Dashboard Preview**: Live phone preview that perfectly matches the public view.

### 5. Analytics & Insights

- [x] **Real-time Clicks**: Server-side tracking via Supabase RPC.
- [x] **Referrer Breakdown**: Identify if traffic comes from IG, TikTok, or Direct.
- [x] **Time-Series Charts**: Multi-range (24h, 7d, 30d, Lifetime) visual trends.

---

## 🔲 Missing for "Launch Ready" (V1)

While the core engine is robust, we lack these "standard" table-stakes features for a competitive 2026 launch:

1. **Lead Capture / Email Newsletter** 🔲
   - _Requirement_: A block to collect emails (integrated with Mailchimp/ConvertKit or internal DB).
   - _Impact_: High. Creators prioritize building direct lists over social followers.

2. **Content Embedding (YouTube/Twitch/Spotify)** 🔲
   - _Requirement_: Embed videos or players directly on the bio page via iFrame.
   - _Impact_: Medium. Keeps users on the page longer.

3. **Advanced SEO Metadata Editor** 🔲
   - _Requirement_: Custom OG images and descriptions per profile.
   - _Impact_: High (Pro Feature). Critical for affiliate marketing SEO.

4. **Internal QR Code Generator** 🔲
   - _Requirement_: Generate a branded QR code for the profile URL inside the dashboard.
   - _Impact_: Low/Medium. Important for offline marketing (business cards/stickers).

---

## 🚀 V1 Status: **90% Launch Ready**

Kytbox Bio is technically superior to a basic Linktree due to **Folders** and **Search**, but it lacks the **Monetization/Lead Gen** depth of Beacons.

### 🧠 Strategic Recommendation

**Feature Gate vs. Feature Build**: Before building "Lead Capture," implement the `canAccess()` gate. This allows us to launch a "Free" version of the current features and immediately market "Custom Themes" and "Advanced Analytics" as Pro upgrades to fund further development of Lead Gen tools.
