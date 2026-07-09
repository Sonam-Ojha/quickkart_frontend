# QuickKart — Full-Stack Project Documentation

> **Primary user-facing documentation:** See [DOCUMENTATION.html](DOCUMENTATION.html) — a fully styled, visual HTML guide (Hindi + English) covering every admin → customer site data flow, step-by-step instructions, and the Rider Module. Read that file first for the "what goes where" mapping. This CLAUDE.md covers the code architecture and developer-facing details.

## Project Overview

**QuickKart** is a quick-commerce (10–30 min delivery) platform similar to Blinkit/Zepto. It has three distinct client applications backed by a single Node.js + MySQL API:

| App | Repo | Purpose |
|-----|------|---------|
| Admin Panel (Web) | `quickkart_frontend` | Internal ops dashboard for managing orders, catalog, riders, etc. |
| Customer App (Web) | `quickkart_customer` | Customer-facing storefront |
| Rider App (Mobile/Web) | `Jhatpat-mobile-application` | Delivery rider order-management app |

---

## Local Development Ports

| App | Port | URL |
|-----|------|-----|
| Backend API | 4000 | `http://localhost:4000` |
| Admin Panel (this repo) | 5173 (Vite dev) | `http://localhost:5173` |
| Customer Web App | 3001 | `http://localhost:3001` |
| Rider App | 3002 | `http://localhost:3002` |

---

## Admin → Customer Site: Key Mappings (from DOCUMENTATION.html)

| Admin Action | Field/Setting | Customer Page | Where it Shows |
|---|---|---|---|
| Banner (section=hero) | title, image, deeplink | /home | Top hero carousel |
| Banner (section=promo) | emoji, title, bg_type | /home | Colored promo tiles grid |
| Category (root, no parent) | name, icon | /category | Category grid + left sidebar |
| Category child of "Fresh" | parentId=Fresh | /fresh | Left subcategory rail |
| Product (tag=deal) | tag | /home | 🔥 Deal of the Day section |
| Product (tag=bestseller) | tag | /home | ⭐ Best Sellers section |
| Product (tag=new) | tag | /home | 🆕 New Arrivals section |
| Product (no tag) | — | /home | All Products tab grid |
| Product in "Fresh" category | category_id | /home + /fresh | Fresh Deals section |
| Coupon add | code, type, value | /cart | Coupon input → discount in bill |
| Settings: footer_tagline | string | Every page | Footer logo tagline |
| Settings: support_phone/email | string | Every page | Footer contact section |
| Settings: company_address | string | Every page | Footer address |
| Settings: delivery_fee | integer | /cart | Bill Details delivery fee row |
| Settings: free_delivery_threshold | integer | /cart | "Add ₹X for free delivery" |
| Settings: handling_charge | integer | /cart | Bill Details handling charge |

**"Fresh" special rule:** Any category named exactly `"Fresh"` (case-insensitive) at root level — its children automatically appear in the `/fresh` page sidebar.

---

## Backend — `quickkart_backend`

### Stack
- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 4
- **ORM:** Sequelize 6 → MySQL 2
- **Auth:** JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`)
- **Dev server:** `nodemon index.js` (port **4000**)
- **Prod start:** `node index.js`

### Entry Points
- `index.js` — bootstraps DB connection, loads all models in dependency order, syncs schema (`alter: { drop: false }`), starts server
- `app.js` — creates Express app, configures CORS, registers all route groups

### CORS Policy
Allows any `localhost` origin (any port) and no-origin requests (mobile/curl). Production origins are blocked — requires update before deploying.

### API Route Groups

```
/api/admin/...     — Admin panel endpoints (protected: authenticate + requireAdmin)
/api/app/...       — Customer app endpoints
/api/rider/...     — Rider app endpoints
```

#### Admin Routes (`/api/admin/`)
| Prefix | Feature |
|--------|---------|
| `/auth` | Login, register admin users |
| `/profile` | Admin profile CRUD |
| `/addresses` | Address management |
| `/users` | Admin user list, invite, edit (super_admin only) |
| `/catalog` | Categories + Products CRUD |
| `/dark-stores` | Dark store CRUD |
| `/inventory` | Stock per product per store |
| `/riders` | Rider CRUD |
| `/customers` | Customer list + detail |
| `/banners` | Banner CRUD |
| `/coupons` | Coupon CRUD |
| `/referrals` | Referral view |
| `/orders` | Order list, detail, status update |
| `/payments` | Payment records |
| `/wallet` | Wallet transaction log |
| `/support` | Support ticket + message management |
| `/dashboard` | KPIs, weekly chart, top products |
| `/faqs` | FAQ CRUD |
| `/settings` | App settings key-value store |

#### Customer Routes (`/api/app/`)
`/auth`, `/home`, `/products`, `/categories`, `/orders`, `/addresses`, `/wallet`, `/coupons`, `/profile`, `/faqs`, `/settings`, `/banners`

#### Rider Routes (`/api/rider/`)

| Method | Endpoint | Auth | Purpose |
|--------|---------|------|---------|
| POST | `/api/rider/auth/login` | Public | Login with mobile + password → JWT |
| GET | `/api/rider/profile` | Rider JWT | Get own profile (name, vehicle, store, stats) |
| PUT | `/api/rider/profile` | Rider JWT | Update name, vehicleType, vehicleNumber |
| PATCH | `/api/rider/profile/toggle-online` | Rider JWT | Toggle online/offline (visible to admin) |
| PATCH | `/api/rider/profile/password` | Rider JWT | Change own password |
| GET | `/api/rider/orders?filter=active\|done` | Rider JWT | List assigned orders |
| GET | `/api/rider/orders/:id` | Rider JWT | Order detail with items, customer, timeline |
| PATCH | `/api/rider/orders/:id/status` | Rider JWT | Update status (only `out_for_delivery` or `delivered`) |
| GET | `/api/rider/orders/earnings` | Rider JWT | Earnings summary (total deliveries, earned, today) |

Rider JWT has `role: "rider"` — rejected by admin middleware. Rider can only update their own assigned orders to `out_for_delivery` or `delivered`.

### Middleware Chain

```
authenticate        — verifies Bearer JWT, attaches req.user
requireAdmin        — ensures role is one of 6 admin roles
requireSuperAdmin   — ensures role is exactly 'super_admin'
```

### Database Models & Schema

All models use `timestamps: true` with snake_case column aliases (`created_at`, `updated_at`). Prices/amounts are stored as integers (paise/cents).

#### `users` table
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AI | |
| name | VARCHAR(100) | |
| email | VARCHAR(150) UNIQUE | |
| password | VARCHAR(255) | bcrypt hash |
| mobile | VARCHAR(15) UNIQUE nullable | |
| avatar | VARCHAR(255) nullable | |
| dob | DATE nullable | |
| role | ENUM | `super_admin`, `ops_manager`, `catalog_mgr`, `marketing`, `support`, `finance`, `user` |
| wallet_balance | INT | default 0 |
| referral_code | VARCHAR(20) UNIQUE nullable | |
| is_active | BOOLEAN | default true |

#### `dark_stores` table
| Column | Type |
|--------|------|
| id | INT PK AI |
| name | VARCHAR(100) |
| address | TEXT |
| city | VARCHAR(80) |
| lat, lng | DECIMAL(9,6) nullable |
| is_active | BOOLEAN |

#### `riders` table
| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AI | |
| name, mobile | VARCHAR | mobile UNIQUE |
| password | VARCHAR(255) nullable | |
| vehicle_type | ENUM | `bike`, `scooter`, `cycle`, `other` |
| vehicle_number | VARCHAR(20) nullable | |
| is_online | BOOLEAN | |
| store_id | FK → dark_stores | |
| rating | DECIMAL(3,2) | default 5.00 |
| total_deliveries, total_earnings | INT | |
| status | ENUM | `active`, `inactive`, `suspended` |

#### `categories` table
`id`, `name`, `image_url`, `sort_order`, `is_active`

#### `products` table
| Column | Type |
|--------|------|
| id | INT PK AI |
| name | VARCHAR(150) |
| category_id | FK → categories |
| brand, unit | VARCHAR nullable |
| mrp, price | INT (paise) |
| image_url | VARCHAR(500) nullable |
| tag | ENUM nullable: `deal`, `bestseller`, `new` |
| is_active | BOOLEAN |

#### `inventory` table
`id`, `product_id` (FK), `store_id` (FK), `stock_qty`
Unique index on `(product_id, store_id)`.

#### `orders` table
| Column | Notes |
|--------|-------|
| customer_id | FK → users |
| store_id | FK → dark_stores |
| rider_id | FK → riders (nullable) |
| address_id | FK → addresses |
| coupon_id | FK → coupons (nullable) |
| status | ENUM: `pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered` / `cancelled` |
| subtotal, delivery_fee, discount, total | INT (paise) |
| cancel_reason | VARCHAR nullable |

#### `order_items` table
`order_id`, `product_id`, `quantity`, `unit_price`, `total`

#### `order_timeline` table
`order_id`, `status`, `note` — append-only log of status transitions

#### `payments` table
`order_id`, `gateway` (razorpay/paytm/phonepe/upi/wallet/cod), `txn_id`, `amount`, `status` (pending/paid/failed/refunded), `refunded_at`

#### `coupons` table
`code` UNIQUE, `type` (flat/percent), `value`, `max_discount`, `min_order`, `usage_limit`, `per_user_limit`, `used_count`, `valid_from`, `valid_to`, `is_active`

#### `banners` table
`title`, `subtitle`, `banner_image`, `section` (hero/promo), `emoji`, `bg_type` (6 color tints), `deeplink`, `sort_order`, `valid_to`, `is_active`

#### `wallet_transactions` table
`user_id`, `type` (credit/debit), `amount`, `source` (refund/referral/manual/order_payment/cashback), `balance_after`, `reference_id`, `reference_type`, `note`

#### `support_tickets` table
`customer_id`, `order_id` (nullable), `category` (delivery/payment/product/account/other), `status` (open/in_progress/resolved)

#### `support_messages` table
Messages inside a ticket with sender/side info.

#### `referrals` table
Tracks referral relationships between users.

#### `addresses` table
Customer delivery addresses linked to `users`.

#### `settings` table
Generic key-value store for app configuration.

#### `faqs` table
FAQ entries with question, answer, category, sort order.

#### `notifications` table
Push notification records (composer-created from admin).

#### `coupon_usage` table
Tracks per-user coupon redemption for per_user_limit enforcement.

### Service Layer Pattern

Each feature has a `src/services/*.service.js` file containing business logic. Controllers are thin — they call service methods and return JSON. This keeps controller files small.

Key services:
- `dashboard.service.js` — parallel Sequelize queries for KPIs, weekly chart (last 7 days), recent orders, top products
- `order.service.js` — list with pagination + post-join search, getById with full includes, `updateStatus` with timeline append, `getStats`
- `auth.service.js` — register (bcrypt hash, role validation), login (JWT with 7d expiry)

---

## Frontend — `quickkart_frontend`

### Stack
- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 5
- **Routing:** React Router DOM v6
- **State:** Zustand 5 (auth store, persisted to localStorage as `qk-admin-auth`)
- **Server state:** TanStack Query v5
- **HTTP:** Axios (instance in `src/lib/api.ts`)
- **UI:** Tailwind CSS v3, Radix UI primitives, Lucide icons, Recharts
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table v8
- **Dev:** `vite` (port 5173), `npm run build` → `dist/`

### Environment
```
VITE_API_BASE_URL=http://localhost:4000   # set in .env
```

### Project Structure

```
src/
├── App.tsx                    # Root — router + QueryClientProvider
├── main.tsx                   # React DOM entry
├── index.css                  # Tailwind base styles
├── lib/
│   ├── api.ts                 # Axios instance with JWT interceptor + 401 redirect
│   └── utils.ts               # cn(), money() helpers
├── store/
│   └── auth.store.ts          # Zustand store: user, token, login, logout, updateUser
├── config/
│   ├── navigation.ts          # NAV_ITEMS array (label, href, icon, permission, children)
│   └── permissions.ts         # ROLE_PERMISSIONS map + hasPermission()
├── hooks/
│   └── usePermission.ts       # can(permission) hook using auth store role
├── routes/
│   └── ProtectedRoute.tsx     # Auth guard + role check + permission check
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx       # Main layout: Sidebar + Topbar + <Outlet>
│   │   ├── Sidebar.tsx        # Collapsible dark sidebar with permission-filtered nav
│   │   └── Topbar.tsx         # Top bar with search, notifications, user avatar
│   ├── common/
│   │   ├── PageHeader.tsx     # Reusable page title + action slot
│   │   └── StatusBadge.tsx    # Colored badge for order/payment statuses
│   └── ui/
│       ├── button.tsx         # Radix Slot-based button variants
│       └── input.tsx          # Styled input wrapper
└── features/                  # Feature-sliced: each folder = one domain
    ├── auth/                  # LoginPage, RegisterPage, api.ts
    ├── dashboard/             # DashboardPage — KPI cards + charts
    ├── orders/                # OrderListPage, api.ts
    ├── catalog/               # CategoryListPage, ProductListPage, api.ts
    ├── inventory/             # InventoryPage, api.ts
    ├── dark-stores/           # DarkStoreListPage, DarkStoreDetailPage, api.ts
    ├── riders/                # RiderListPage, api.ts
    ├── customers/             # CustomerListPage, api.ts
    ├── banners/               # BannerListPage, api.ts
    ├── coupons/               # CouponListPage, api.ts
    ├── referrals/             # ReferralPage, api.ts
    ├── payments/              # PaymentListPage, api.ts
    ├── wallet/                # WalletPage, api.ts
    ├── support/               # SupportPage, api.ts
    ├── notifications/         # NotificationComposer (no separate api.ts)
    ├── reports/               # ReportsPage (no separate api.ts)
    ├── faqs/                  # FaqListPage, api.ts
    ├── settings/              # SettingsPage, api.ts
    ├── profile/               # ProfilePage, api.ts
    └── admin-users/           # AdminUserListPage, InviteAdminModal, EditAdminModal, api.ts
```

### Authentication Flow

1. User submits login form → `POST /api/admin/auth/login`
2. Server returns `{ token, user: { id, name, email, role } }`
3. Zustand `login(user, token)` persists both to localStorage (`qk-admin-auth`)
4. Axios interceptor reads token from store and injects `Authorization: Bearer <token>` on every request
5. On 401 response → `logout()` + redirect to `/login`
6. `ProtectedRoute` checks token existence, validates role is one of 6 admin roles, then checks feature permission

### Role-Based Access Control

Six admin roles with scoped permissions:

| Role | Key Permissions |
|------|----------------|
| `super_admin` | All (`*`) |
| `ops_manager` | orders, tracking, dark_stores, riders, support.edit, customers.view, reports.view |
| `catalog_mgr` | catalog, banners.edit, coupons.edit, reports.view |
| `marketing` | banners, coupons, referrals.view, notifications, customers.view, reports.view |
| `support` | support, orders.view, customers.view |
| `finance` | payments, wallet, referrals.view, reports.view |

Permission strings follow `module.action` format (e.g. `orders.view`, `catalog.*`). `hasPermission()` supports wildcard `*` (super_admin) and module-level wildcards (`catalog.*`).

Sidebar automatically filters nav items based on the current user's role.

### Dashboard Page

Fetches `GET /api/admin/dashboard` and renders:
- 4 KPI cards: Today's Orders, Today's Revenue, Total Customers, Active Riders
- Line chart: Orders per day for last 7 days (Recharts `LineChart`)
- Pie/Donut chart: Today's order status distribution
- Recent Orders table (last 5)
- Top Products by quantity sold (last 5)

### API Layer Pattern

Each feature's `api.ts` exports typed async functions that call the shared `api` Axios instance. Pages use TanStack Query (`useQuery`, `useMutation`) to cache and invalidate data.

---

## Running Locally

### Backend
```bash
cd quickkart_backend
cp .env.example .env          # set DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run dev                    # nodemon on port 4000
```

### Frontend (Admin Panel)
```bash
cd quickkart_frontend
npm install
npm run dev                    # Vite on port 5173
```

Visit `http://localhost:5173` → Login with an admin account.

---

## Known Issues / Observations

1. **JWT_SECRET fallback** — `auth.middleware.js` and `auth.service.js` fall back to the literal string `'my-secret-key'` if `JWT_SECRET` env var is missing. This must be set in production.
2. **CORS** — `app.js` allows all `localhost` origins. Needs explicit production origin allowlist before deployment.
3. **Search post-join** — `order.service.js` applies customer search filter after DB query, not at the SQL level. For large datasets this won't filter the full table — only the current page.
4. **Prices as integers** — amounts are stored as integers (paise). Ensure the `money()` utility divides correctly for display (currently wraps `toLocaleString`).
5. **`sequelize.sync({ alter: { drop: false } })`** — runs on every startup. Safe for development; switch to migrations for production.
6. **Live Tracking route** (`/tracking`) is listed in nav config but has no corresponding page or route registered in `App.tsx` — it will fall through to the 404 redirect.
7. **FAQs permission** — FAQs nav item is gated by `banners.view` permission (likely should be its own `faqs.view` permission).
