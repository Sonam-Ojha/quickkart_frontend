---
name: quickkart-project-overview
description: QuickKart is a quick-commerce platform (Blinkit/Zepto-style). Three client apps share one Node/Express/MySQL backend. Full documentation is in quickkart_frontend/CLAUDE.md.
metadata:
  type: project
---

QuickKart is a quick-commerce (10–30 min delivery) platform with three apps: Admin Panel (quickkart_frontend — React/Vite/TS, port 5173), Customer Web (quickkart_customer), Rider App (Jhatpat-mobile-application). All share a single backend (quickkart_backend — Node/Express/Sequelize/MySQL, port 4000).

**Why:** Active development project being built end-to-end by the team.

**How to apply:** `quickkart_frontend/DOCUMENTATION.html` = primary user-facing doc (Hindi+English, visual) — covers all admin→customer mappings, step-by-step guides, and Rider Module. `quickkart_frontend/CLAUDE.md` = developer-facing doc — schema, routes, RBAC, known issues. Reference both before making changes.

Key facts:
- JWT secret falls back to hardcoded string if JWT_SECRET env var is missing (security risk in prod)
- Prices stored as integers (paise/cents) throughout
- 6 admin roles: super_admin, ops_manager, catalog_mgr, marketing, support, finance
- Live Tracking route in nav has no corresponding page yet (known gap)
- FAQs permission incorrectly uses banners.view instead of its own permission key
