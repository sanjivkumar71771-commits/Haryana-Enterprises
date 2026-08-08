# HARYANA ENTERPRISES — PRD

## Business
- HARYANA ENTERPRISES · 200 Mtr From Bus Stand, Begu–Bhadra Road, Kagdana, Sirsa, Haryana
- Phone 8167862016 · WhatsApp 8168762016 · haryanaenterpriseskagdana@gmail.com

## Stack (as-built)
- React 19 + Tailwind + shadcn + AOS + FontAwesome + jsPDF (client-side PDF)
- FastAPI + Motor (async MongoDB) + bcrypt + PyJWT + httpx (Emergent OAuth)
- MongoDB — `haryana_enterprises` DB
- Auth: dual — JWT httpOnly cookies for email/password + session_token cookies for Emergent Google OAuth

## Implemented — Iteration 3 (30 Jul 2026) — Google OAuth + Admin + Calculator
### Google OAuth (Emergent-managed, no more demo stub)
- Backend: POST `/api/auth/session` calls `https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data` and upserts user by email, stores session_token in `user_sessions` with 7-day expiry, sets httpOnly session_token cookie
- Auth helper now checks session_token OR JWT access_token
- Frontend: AuthCallback route (detected synchronously via `location.hash`) exchanges `session_id` and lands on /dashboard
- Login page "Continue with Google" button redirects to `https://auth.emergentagent.com/?redirect=<origin>/dashboard`
- AuthContext skips /auth/me when returning from OAuth callback

### Admin Panel
- Backend: all routes gated by `require_admin` dependency
  - GET `/api/admin/stats` — user, solar, loan, contact counts + pending/approved breakdown
  - GET `/api/admin/users` — full user list (no password_hash)
  - GET `/api/admin/solar` and `/api/admin/loan` — all applications
  - GET `/api/admin/contacts` — contact messages
  - PATCH `/api/admin/solar/{ref_no}/status` and `/api/admin/loan/{ref_no}/status` — update status (submitted/under_review/approved/rejected)
  - POST `/api/admin/notices` and DELETE `/api/admin/notices/{id}` — notice CMS
- Frontend: `/admin` route with tabs (Overview / Users / Solar / Loan / Contacts / Notices), stats cards, editable status dropdowns, notice CMS form

### Solar Savings Calculator
- Live widget on Home page with sliders (monthly bill + roof area)
- Computes: recommended kW, cost, PM Surya Ghar subsidy (₹30k/60k/78k slabs), net investment, monthly & yearly savings, payback years, 25-year lifetime savings, CO₂ reduction
- Direct CTA to Solar Apply

### User-id migration
- All users now have `user_id` UUID field (new pattern from Emergent playbook)
- Legacy users backfilled at startup
- get_current_user accepts both ObjectId sub and user_id sub

## Testing
- Backend: **40/40 tests passing** (iteration_2 report + updated tests)
- All admin auth gates verified (401 without auth, 403 for non-admin, 200 for admin)
- User_id UUID flow end-to-end verified
- Logout clears both JWT and session_token cookies + session db record

## Test Credentials
- Admin: `admin@haryanaenterprises.com` / `Admin@123` (role=admin)
- User: `user@test.com` / `Test@123` (role=user)
- Google: real Emergent Google Auth flow — no test credentials

## Backlog
### P1
- SMTP email confirmations on application submission (Resend/SendGrid)
- Document upload for loan/solar applications (Aadhaar/PAN/bank statement)
- Chart.js analytics charts on admin dashboard
- Password reset email flow
### P2
- WhatsApp OTP / SMS notifications (Twilio)
- Brute-force lockout on `/auth/login`
- CSV / Excel export from admin tables
- Chatbot / consultation booking widget


## Implemented — Iteration 5 (08 Aug 2026) — Vacancies self-hosted detail + Scraper fix
### FreeJobAlert scraper — Bug fix
- Old scraper picked the first `<a>` inside every `<tr>`, capturing "Get Details" as title
- Rewrote `backend/scrapers.py` `_parse_row()` to map the 7-column layout: td1=organization, td2=post_name, td3=qualification, td5=last_date, and pull the URL from the last anchor
- New fields persisted: `organization`, `post_name`, `qualification`, `post_date_text`, `last_date_text`, `category` (adds "medical")
- Swapped dead `/upcoming-sarkari-naukri/` (404) with `/sarkari-naukri/`
- 250 real vacancies with clean titles like "PNB — Local Bank Officer – 545 Posts"

### Users no longer leave the site
- Detail article scraper `fetch_article_detail(url)` extracts heading, description, important action links (apply / notification PDF / official website) and cleaned `content_html` from `.entry-content`
- Strips ads, telegram/newsletter self-promo, and internal freejobalert.com nav
- Backend `GET /api/vacancies/{id}` lazy-scrapes on first view and caches for 24h
- New `/vacancies/:id` route + `VacancyDetail.jsx` renders: header (badges + urgency), quick-facts grid, colored action-link cards, and full article inside `.vacancy-article` styled block
- Vacancy list cards now navigate internally via `<Link>` (Apply link only appears inside the detail page)

### UI enhancements
- Qualification dropdown filter (10th / 12th / ITI / Diploma / Graduate / B.Tech / PG)
- Organization + qualification chips on every card
- Days-remaining indicator with red urgency (≤3 days), "closed" state for expired
- Bilingual (Hindi/English) on detail page + share button

### Backend
- `list_vacancies` accepts `qualification` filter and searches org/post_name too
- `doc_public` serializes all datetime fields (not just `created_at`)

## Backlog (updated)
### P0
- (none)
### P1
- Railway deployment guidance (guide in /app/DEPLOY_GUIDE.md, user requested zero-to-live walkthrough)
- Email/WhatsApp alert subscription for new vacancies
### P2
- Save/bookmark vacancy for logged-in users
- Deep vacancy search filters (state, salary range)
- Brute-force lockout, CSV export
