# PearlSky — User Manual

![PearlSky — Private Jets Flying Empty Daily](images/1.jpeg)

> **Fly Exclusive. Pay Smart.**
> The 1st Empty Leg Platform in Asia — last-minute private jet flights at a fraction of charter rates, sourced from 20+ operators across the Region.

---

## 📖 Table of Contents

1. [What is PearlSky?](#1--what-is-pearlsky)
2. [Demo Accounts — Quick Login](#2--demo-accounts--quick-login)
3. [The Three User Types](#3--the-three-user-types)
4. [👤 User Flow — Browse & Book a Flight](#4--user-flow--browse--book-a-flight)
5. [👤 User Flow — Your Dashboard](#5--user-flow--your-dashboard)
6. [✈️ Operator Flow — Manage Your Fleet](#6-️-operator-flow--manage-your-fleet)
7. [🖼️ How to Add Jet Images (Important!)](#7-️-how-to-add-jet-images-important)
8. [✈️ Operator Flow — List Empty Legs & Bookings](#8-️-operator-flow--list-empty-legs--bookings)
9. [👑 Admin Flow — System Operations](#9--admin-flow--system-operations)
10. [💡 Tips, Troubleshooting & FAQ](#10--tips-troubleshooting--faq)

---

## 1. 🌐 What is PearlSky?

PearlSky is an empty-leg aggregator. When private jets fly empty between charters (a *repositioning leg*), operators offer those seats at deep discounts — sometimes **50–70% off** standard charter pricing. PearlSky turns those wasted flights into bookable inventory across the **Asia-Pacific region**.

| Region | Major Hubs Covered |
|---|---|
| 🇸🇬 Southeast Asia | Singapore · Bangkok · Kuala Lumpur · Jakarta · Manila · HCM · Bali · Phuket |
| 🇨🇳 Greater China | Hong Kong · Shanghai · Beijing · Taipei · Macau |
| 🇯🇵 Northeast Asia | Tokyo · Seoul |
| 🇮🇳 South Asia | Mumbai · Delhi · Bangalore |
| 🇦🇪 Middle East | Dubai |

**Live URL:** [https://pearlsky.onrender.com](https://pearlsky.onrender.com)

---

## 2. 🔑 Demo Accounts — Quick Login

> Free-tier note: the first request after 15 minutes idle takes ~30 seconds to wake the server. The database resets on every redeploy.

| Role | Email | Password | What you can do |
|---|---|---|---|
| 👑 **SuperAdmin** | `admin@pearlsky.com` | `Admin@123` | Manage all operators, coupons, view system-wide stats |
| ✈️ **Operator** | `operator1@pearlsky.com` | `Operator@123` | Manage **Marina Bay Aviation**'s 10 jets and empty legs |
| 👤 **User** | `user1@pearlsky.com` | `User@123` | Browse and book flights · starts with **$2,000 credits** |

> Want more operators? Use `operator2@pearlsky.com` … `operator5@pearlsky.com` (all `Operator@123`).
> Want more users? `user2@pearlsky.com` … `user5@pearlsky.com` (all `User@123`).

---

## 3. 🎭 The Three User Types

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   👤  USER      │   │   ✈️  OPERATOR  │   │  👑  ADMIN      │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ • Search legs   │   │ • Manage jets   │   │ • All operators │
│ • Book flights  │   │ • List empty    │   │ • All bookings  │
│ • View dashbrd  │   │   legs          │   │ • Coupons       │
│ • Use credits   │   │ • Confirm /     │   │ • Toggle active │
│ • Refer friends │   │   reject books  │   │ • System KPIs   │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## 4. 👤 User Flow — Browse & Book a Flight

### Step 1 — Land on the Home Page

Navigate to **https://pearlsky.onrender.com**. You'll see:

- 🟡 **Hero badge:** *"1st Empty Leg Platform in Asia"*
- 🏷️ **Tagline:** *"Fly Exclusive. Pay Smart."*
- 🔍 **Search card:** Origin · Destination · Date · Passengers
- 📋 **Featured empty legs** scrolling below

![Private Jet Hero](https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Embraer_505_Phenom_300%2C_Aerojet_JP7625910.jpg/1200px-Embraer_505_Phenom_300%2C_Aerojet_JP7625910.jpg)

### Step 2 — Search

In the search card:

| Field | What to do |
|---|---|
| **From** | Pick an Asian city — Singapore, Tokyo, Hong Kong, Mumbai, Dubai, etc. |
| **To** | Pick a destination |
| **Departure** | Pick a date (legs are listed for the next 30 days) |
| **Passengers** | Defaults to 1 |

Click **"Search Flights"** ➜ you're taken to `/flights`.

### Step 3 — Browse Search Results

Each result card shows:

```
┌────────────────────────────────────────────┐
│  [Jet Image]   Singapore (SIN) → Dubai (DXB)│
│                Mon, May 15 · 7h 0m          │
│                Phenom 300E · 7 seats avail  │
│                Marina Bay Aviation          │
│                                             │
│                                  $11,880    │
│                                             │
│                       [ View Details →   ]  │
└────────────────────────────────────────────┘
```

> 💡 **Tip:** Use the filters in the side panel — filter by jet category (Light / SuperMidsize / UltraLong), price range, or operator.

### Step 4 — View Flight Detail (with Image Gallery)

Click any card. You land on `/flights/:id` with three columns:

#### 🖼️ Image Gallery (Top-Left)
- **Main image** — large hero shot of the jet
- **Thumbnails** — click to swap the main image
- Each jet has **3-4 model-specific photos** (real exterior + cabin interior shots from Wikimedia Commons)

![Phenom 300 cabin](https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Embraer_Phenom_300_cabin%2C_EBACE_2019_%28EB190435%2C_cropped%29.jpg/1200px-Embraer_Phenom_300_cabin%2C_EBACE_2019_%28EB190435%2C_cropped%29.jpg)
*Example: real Phenom 300E cabin interior shown for any Phenom 300E listing*

#### ℹ️ Aircraft Details (Below Gallery)
- Category · Tail Number · Year · Seats · Range · Speed
- Amenities chips: 🛜 WiFi · 🍽️ Catering · 🛏️ Bedroom
- Description paragraph
- Operator info ("Verified Operator" badge)

#### 💰 Booking Card (Right)
- Route badges: **SIN ✈️ DXB**
- Departure date/time
- Total price (single line, all-in — no tax breakout)
- **[ Book Now ]** button

### Step 5 — Login or Register

Clicking **"Book Now"** triggers an authentication check. If you're not signed in:

| You have an account | You're new |
|---|---|
| Click **Login** in the navbar → enter email + password | Click **Register** → fill in name, email, password, phone |
| Demo: `user1@pearlsky.com` / `User@123` | New users get a **$500 signup bonus** (configurable) and a unique **referral code** |

### Step 6 — Booking Flow (5 Steps)

You're now at `/booking/:id`. The flow is a **Material stepper** with 5 stages:

#### 📋 Step 1 — Flight Summary
Confirm the route, jet, date and total fee. Click **Continue**.

#### 👥 Step 2 — Passengers
Add passenger details (name, age, ID number). The number of rows is capped at **available seats**.

#### 🎟️ Step 3 — Discounts (Coupons + Credits)
- **Apply Coupon:** type a code (try `WELCOME500`, `SAVE10`, `SUMMER25`, `EARLY15`, `ASIATRIP`, `BUSINESS1K`, `PEARL2K`, `WEEKEND300`)
- **Use Credits:** drag the slider to apply some/all of your credit balance
- See the running total update live: Base – Discount – Credits = **Total Payable**

#### 📜 Step 4 — Policy
Review the operator's cancellation & refund terms. Tick the agreement checkbox.

#### 💳 Step 5 — Payment
- **Mock gateway** (configurable via `Payment:Mode` env var). Click **"Pay $X,XXX"**.
- Backend processes → booking confirmed instantly OR flagged for operator approval (depends on jet's `confirmationMode`)

### Step 7 — Booking Confirmation

You're redirected to `/booking/confirmation/:bookingRef` with:

- ✅ Big green **CONFIRMED** badge (or 🟡 PENDING if manual approval)
- Booking reference number
- Route summary
- Discounts/credits applied
- **Total Paid**
- Buttons: **Download Invoice** · **View My Bookings**

A confirmation email is also sent (if SMTP is configured — currently disabled on Render free tier).

---

## 5. 👤 User Flow — Your Dashboard

Click your avatar in the navbar → **My Dashboard** → land on `/dashboard`. Tabs:

### 🎫 My Bookings
Table of all your bookings (Confirmed / Pending / Cancelled / Completed). Click any row to see full details.

### 💰 Credits
- Current balance (e.g. `$2,000`)
- Earned vs. Redeemed totals
- **Transaction log** — every credit movement (welcome bonus, referral reward, redemption, refund)

### 🔔 Notifications
- New empty-leg alerts (for cities/jets you follow)
- Booking status changes
- Operator messages
- "Mark all as read" button

### 🔍 Saved Searches
- Save a search query (e.g. "BLR → SIN, any date")
- Get notified when a matching empty leg appears

### ⭐ Jet Subscriptions
- Subscribe to a specific jet (e.g. *Marina Bay Aviation Phenom 300E*)
- Receive instant alert when that jet posts a new empty leg

### 👥 Referrals
- Your unique code (e.g. `USR1JFLX`)
- Total people referred & credits earned per referral

---

## 6. ✈️ Operator Flow — Manage Your Fleet

Login as an operator → automatically routed to `/operator`.

### 6.1 — Operator Dashboard Overview

Top of the page shows KPI cards:

| Metric | Description |
|---|---|
| **Total Jets** | Aircraft in your fleet |
| **Active Empty Legs** | Currently bookable |
| **Total Bookings** | All-time |
| **Pending Confirmations** | Bookings awaiting your approval |
| **Total Revenue** | All-time gross |

Below: a **Recent Bookings** table.

### 6.2 — My Jets Tab

```
┌──────────────────────────────────────────────────┐
│  My Jets                          [ + Add Jet ]  │
├──────────────────────────────────────────────────┤
│  Model              Tail        Seats  Status    │
│  ──────────────────────────────────────────────  │
│  Embraer Phenom 300E   9V-HN031   8    Active   │
│  Pilatus PC-24         9V-AB034   8    Active   │
│  ...                                             │
└──────────────────────────────────────────────────┘
```

#### Adding a New Jet

Click **[ + Add Jet ]** → a form panel opens with these fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| **Manufacturer** | text | ✅ | e.g. "Embraer", "Gulfstream" |
| **Model Name** | text | ✅ | e.g. "Phenom 300E" |
| **Category** | select | ✅ | VeryLight · Light · Midsize · SuperMidsize · Heavy · UltraLong |
| **Tail Number** | text | ✅ | e.g. "9V-PSA042" — your country's registry prefix |
| **Year of Manufacture** | number | ✅ | 1990 – current year |
| **Seating Capacity** | number | ✅ | Min 1 |
| **Range (km)** | number | ✅ | Min 100 |
| **Speed (km/h)** | number | ✅ | Min 100 |
| **Description** | textarea | optional | Marketing copy |
| **Base Price ($)** | number | ✅ | Hourly rate |
| **Confirmation Mode** | select | ✅ | Instant or ManualApproval |
| **🛜 Has WiFi** | checkbox | optional | |
| **🍽️ Has Catering** | checkbox | optional | |
| **🛏️ Has Bedroom** | checkbox | optional | |

Click **[ Create ]**. The jet appears in your table.

> ⚠️ **No image upload field exists in this UI.** Newly created jets will appear with **no images** in the gallery on the public flight detail page. To add images, see [Section 7](#7-️-how-to-add-jet-images-important).

#### Editing or Deleting a Jet

- Click any row → **[ Edit ]** opens the same form pre-filled
- **[ Delete ]** removes the jet (cascades to its empty legs)

---

## 7. 🖼️ How to Add Jet Images (Important!)

This is the section the UI doesn't make obvious. There are **3 supported ways** to attach images to jets, depending on whether you're seeding the demo or running production.

![Luxury Cabin](images/2.jpeg)

### 🅰️ Method A — Edit `seed-data/jets.json` (Recommended for the Demo)

**When to use:** you're running PearlSky as a free-tier demo on Render. The DB resets on every redeploy, so seed data is the source of truth.

#### The Image Schema

Each jet record in `seed-data/jets.json` has an `images` array:

```json
{
  "id": 1,
  "manufacturer": "Embraer",
  "modelName": "Phenom 300E",
  "tailNumber": "9V-HN031",
  "mainImageUrl": "https://upload.wikimedia.org/.../1200px-Phenom_300.jpg",
  "interiorImageUrl": "https://upload.wikimedia.org/.../1200px-Phenom_300_cabin.jpg",
  "images": [
    {
      "url": "https://upload.wikimedia.org/.../exterior.jpg",
      "isInterior": false,
      "displayOrder": 0,
      "caption": "Phenom 300 on tarmac"
    },
    {
      "url": "https://upload.wikimedia.org/.../cabin.jpg",
      "isInterior": true,
      "displayOrder": 1,
      "caption": "Cabin interior"
    },
    {
      "url": "https://upload.wikimedia.org/.../in-flight.jpg",
      "isInterior": false,
      "displayOrder": 2,
      "caption": "In flight"
    }
  ],
  "basePrice": 3100,
  ...
}
```

#### Step-by-Step

1. **Open** [`seed-data/jets.json`](seed-data/jets.json)
2. **Find the jet** by `id` or `tailNumber`
3. **Add or replace** the `images` array — at least 3 entries
4. Each entry needs:
   - `url` — full HTTPS image URL (must return 200 OK)
   - `isInterior` — `true` for cabin/cockpit shots, `false` for exterior
   - `displayOrder` — 0, 1, 2, ... (lower numbers shown first)
   - `caption` — short descriptive text
5. **Update** `mainImageUrl` (the headline exterior) and `interiorImageUrl` (the headline interior) to match the first ext + first int in the array
6. **Save the file**, commit & push to GitHub:
   ```bash
   git add seed-data/jets.json
   git commit -m "Add images for jet #42"
   git push origin main
   ```
7. **Wait ~7 minutes** — Render auto-redeploys, the DB is wiped and re-seeded with the new images

#### Where to Source Royalty-Free Jet Images

| Source | URL Pattern | Best for |
|---|---|---|
| **Wikimedia Commons** | `https://upload.wikimedia.org/wikipedia/commons/thumb/X/XX/Filename.jpg/1200px-Filename.jpg` | Real model-specific photos (Phenom, Gulfstream, etc.) |
| **Unsplash** | `https://images.unsplash.com/photo-XXXX?w=1200&q=80` | Generic luxury aviation aesthetic |
| **Your own CDN** | Anything you control | Brand-consistent imagery |

> 🔍 **How to find a Wikimedia jet photo:**
> 1. Search Wikipedia for the jet model (e.g. *Bombardier Global 6000*)
> 2. Click any image on the page
> 3. Copy the URL of the *full-resolution preview* — looks like `upload.wikimedia.org/wikipedia/commons/thumb/.../1200px-….jpg`
> 4. Wikimedia requires a User-Agent header, but browsers send one by default — works in production

#### Quick Bulk-Update Script

We ship a generator at [`seed-data/.gen/generate-seed.mjs`](seed-data/.gen/generate-seed.mjs) that:

- Reads [`seed-data/jet-images-curated.json`](seed-data/jet-images-curated.json) — keyed by model name
- Distributes images across all jets of that model
- Regenerates `jets.json`, `empty-legs.json`, `coupons.json`

To use:

```bash
# 1) Edit jet-images-curated.json — add images for each model
# 2) Regenerate seed files:
node seed-data/.gen/generate-seed.mjs

# 3) Commit and push (will trigger Render redeploy)
git add seed-data/
git commit -m "Refresh jet images"
git push origin main
```

### 🅱️ Method B — Direct Database Insert (Production)

**When to use:** you're running with a persistent Postgres database (paid Render tier or your own infra), and you want to add images to a single jet without redeploying.

The schema:

```sql
INSERT INTO "JetImages" ("JetId", "ImageUrl", "IsInterior", "DisplayOrder", "Caption")
VALUES
  (42, 'https://example.com/jet-42-ext-1.jpg',  false, 0, 'Front 3/4 view'),
  (42, 'https://example.com/jet-42-int-1.jpg',  true,  1, 'Cabin facing forward'),
  (42, 'https://example.com/jet-42-int-2.jpg',  true,  2, 'Galley & lavatory');
```

The frontend gallery automatically picks them up from the next API call — no rebuild required.

### 🅲 Method C — Build a Proper Image Upload UI (Future Enhancement)

The current operator UI doesn't have image upload — it's a **demo limitation**, not a backend one. The data model fully supports it (`JetImage` entity with `Url`, `IsInterior`, `DisplayOrder`, `Caption` columns; `ICollection<JetImage>` on Jet entity).

To add a proper upload flow:

1. Add an `image upload` field group to the `jetForm` in [`operator-dashboard.component.ts`](frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.ts)
2. Add `[HttpPost("jets/{id}/images")]` endpoint in [`OperatorController.cs`](src/EmptyLegs.API/Controllers/OperatorController.cs) that accepts `multipart/form-data`
3. Store uploaded files to:
   - **Local disk** for development (`wwwroot/uploads/jets/<jetId>/`)
   - **S3 / Azure Blob / Cloudinary** for production
4. Insert a row into `JetImages` table with the resulting URL

Estimated effort: ~4 hours including testing. Tell your developer when ready.

---

## 8. ✈️ Operator Flow — List Empty Legs & Bookings

### 8.1 — Empty Legs Tab

Click **Empty Legs** in the operator left nav.

#### Adding a New Empty Leg

Click **[ + Add Empty Leg ]** → form opens:

| Field | Notes |
|---|---|
| **Jet** | Pick from your fleet dropdown |
| **Origin** | City name (e.g. "Singapore") |
| **Origin Code** | IATA (e.g. "SIN") |
| **Destination / Code** | Same |
| **Departure (UTC)** | ISO datetime — `2026-06-15T14:00:00Z` |
| **Arrival (UTC)** | ISO datetime |
| **Available Seats** | Capped at jet's seating capacity |
| **Price ($)** | All-in USD price |
| **Lock Duration (min)** | How long a user's seat is held during booking (default 15) |
| **Notes** | Optional — e.g. "Repositioning flight after charter" |

Click **[ Create ]** → leg appears immediately in the public search.

#### Status Lifecycle

```
Available  →  Booked  →  Completed
   ↓
Blocked (manually paused)
   ↓
Cancelled / Expired
```

### 8.2 — Bookings Tab

Table of all bookings against your fleet, filterable by status.

For jets with `confirmationMode = ManualApproval`, the **PendingConfirmation** badge appears. Click the row → **[ Confirm ]** or **[ Reject ]** buttons. The user is notified via in-app notification + email.

---

## 9. 👑 Admin Flow — System Operations

Login as `admin@pearlsky.com` → routed to `/admin`.

### 9.1 — Dashboard Tab (System KPIs)

```
┌──────────────────────────────────────────────────┐
│  💼 Total Operators       20                      │
│  ✈️  Total Jets            200                    │
│  👥 Total Users           5                       │
│  🎫 Total Bookings        0                       │
│  🟢 Active Empty Legs     48                      │
│  💰 Total Revenue         $0.00                   │
│  📈 Monthly Revenue       $0.00                   │
└──────────────────────────────────────────────────┘
```

### 9.2 — Operators Tab

Table of all operators with revenue, jet count, total bookings, and an **[ Active toggle ]** to suspend/reactivate them.

### 9.3 — Coupons Tab

Click **[ + New Coupon ]** → form:

| Field | Notes |
|---|---|
| **Code** | e.g. `SUMMER25` (uppercase, no spaces) |
| **Description** | Shown to users at checkout |
| **Discount Type** | `Percentage` or `Fixed` |
| **Discount Value** | `25` (for 25%) or `500` (for $500) |
| **Max Uses** | Total redemptions allowed |
| **Expiry Date** | `YYYY-MM-DD` |
| **Min Booking ($)** | Minimum cart total to qualify |

Existing coupons table shows code, type, value, expiry, and uses (e.g. `12 / 500`).

### 9.4 — Bookings Tab

System-wide bookings table with filters by date, operator, status. Drill into any row to view full booking detail (passengers, payment, audit trail).

---

## 10. 💡 Tips, Troubleshooting & FAQ

### Free-Tier Behaviour
| Symptom | Cause | Fix |
|---|---|---|
| First page-load takes ~30s | Free instance was sleeping | Wait it out — subsequent loads are fast |
| My data disappeared after a deploy | Free tier has no persistent disk; SQLite resets on every redeploy | Move to **Render Starter** plan (~$7/mo) for persistent disk, or attach a Postgres instance |
| Coupon shows "expired" today | Demo coupon `EXPIRED` is intentionally past expiry | Try `WELCOME500` or `SAVE10` |

### Demo Coupons (All Active Unless Noted)

| Code | Discount | Min Booking | Notes |
|---|---|---|---|
| `WELCOME500` | $500 off | $3,000 | New-user bonus |
| `SAVE10` | 10% off | $5,000 | Capped at $2,000 |
| `SUMMER25` | 25% off | $10,000 | Capped at $5,000 — expires Sep 30 |
| `BUSINESS1K` | $1,000 off | $8,000 | Business jet bookings |
| `EARLY15` | 15% off | $4,000 | 14-day advance bookings |
| `PEARL2K` | $2,000 off | $15,000 | PearlSky loyalty |
| `ASIATRIP` | 20% off | $6,000 | Intra-Asia routes |
| `WEEKEND300` | $300 off | $2,500 | Weekend departures |
| `EXPIRED` | — | — | ❌ Expired (test data) |
| `MAXUSED` | — | — | ❌ Cap reached (test data) |

### Common Questions

**Q: Where do I find my booking reference?**
A: Top of the booking-confirmation page, also in your `My Bookings` tab on the dashboard.

**Q: Can I cancel a booking?**
A: Read the operator's cancellation policy on the flight detail page. Typically: > 48 hours = 50% refund, < 48 hours = non-refundable.

**Q: What happens if the operator rejects my booking?**
A: Full refund to your credit balance + email + in-app notification. Funds are not charged to your gateway in mock-mode.

**Q: Why are some flights "ManualApproval" and others "Instant"?**
A: It's a per-jet setting. Operators with high-end aircraft (Global 6000, G550) often require approval; light jets are typically instant.

**Q: How do I become an operator?**
A: In production this would be a vetting workflow (KYC, AOC certificate, insurance check). For the demo, just login as `operatorN@pearlsky.com`.

**Q: How are prices calculated?**
A: Empty-leg pricing is `(jet hourly rate × flight hours) × (1 - empty-leg discount)`. The empty-leg discount is typically 30-50% off retail charter rates.

---

## 🎯 You're Ready

Open **[https://pearlsky.onrender.com](https://pearlsky.onrender.com)** and start exploring. If you hit a wall:

- Tag the developer with the URL of the page you were on + a screenshot
- Check the [troubleshooting table above](#free-tier-behaviour)
- Open an issue at the repo: `github.com/pratap215/pearlsky`

---

*PearlSky Private Aviation — Discover the Hidden Sky Gems · Crafted with care for the discerning traveller.*
