# Haryana Enterprises — PRD

## Original Problem Statement
A comprehensive web portal for **Haryana Enterprises** (Kagdana, Sirsa) — a **private, Government-approved rooftop solar vendor**. Bilingual (Hindi/English), dark-glassmorphism theme.

## Current Positioning (Feb 2026 rebrand)
> **Haryana Enterprises is a private business, NOT a government portal.**
> It provides rooftop solar consultation, site survey, installation assistance and general information on government solar schemes.

## Core Requirements (POST-COMPLIANCE REBRAND)
1. Site must NOT resemble a government portal — no "Apply Now", "Portal Login", "Government Registration", "System Status" pill, or fake tracking flows.
2. **No login/register/dashboard/admin** in public UI (files retained but not routed).
3. Only a single **Solar Enquiry form** collects data — Name, Mobile, Email, Service, Message. Never Aadhaar/PAN/bank/OTP/passwords.
4. **Solar Calculator** must display "Indicative Estimate" label + full disclaimer.
5. Government scheme content is informational only; must include disclaimers pointing to official sources (pmsuryaghar.gov.in, mnre.gov.in).
6. Solar financing content: "does not guarantee loan approval" disclaimer mandatory.
7. **Vacancies** section (FreeJobAlert scraper) must remain fully functional and PROMINENT (for students).
8. Direct-API attack surface closed: `/solar/apply`, `/loan/apply`, `/csc/apply`, `/irrigation/apply` all return HTTP 410 Gone.

## Architecture
- **Frontend**: React + Tailwind (dark glassmorphism), React Router, i18n Hindi/English
- **Backend**: FastAPI + Motor (MongoDB) + APScheduler (vacancy scraper every 6h) + BeautifulSoup
- **Email**: DEV mode (console log) — real SMTP not configured

## Key Routes
- `/` Home (hero → services → vacancies preview → stats → why → testimonials → calculator → schemes info → CTA)
- `/enquiry` Solar Enquiry form
- `/services` Rooftop Solar Services (6 cards)
- `/vacancies`, `/vacancies/:id` Job Alerts (from FreeJobAlert.com)
- `/about`, `/contact`, `/faq`, `/gallery`, `/notices`, `/downloads`
- Redirects: `/login`, `/register`, `/solar/apply`, `/loan/apply`, `/csc`, `/irrigation`, `/dashboard`, `/status` → mapped to compliant pages

## Key API Endpoints
- `POST /api/enquiry` → `{id, ref_no: "ENQ-xxxxxxxx", ok}` — the only application endpoint
- `POST /api/contact` → contact form
- `GET  /api/vacancies?limit=N` → list vacancies (from scraper)
- `GET  /api/vacancies/{id}` → full article with structured data
- `POST /api/subscribe`, `POST /api/unsubscribe` → job-alert subscription
- `GET  /api/notices`, `/api/faqs`, `/api/downloads`
- `POST /api/{solar,loan,csc,irrigation}/apply` → **HTTP 410 Gone** (compliance)

## MongoDB Collections
- `enquiries` — new compliant enquiries (name/mobile/email/service/message + ref_no)
- `vacancies` — scraped FreeJobAlert data
- `vacancy_subscriptions` — email subscribers
- `notices`, `faqs`, `downloads`, `contacts`
- `solar_applications`, `loan_applications`, `csc_requests`, `irrigation_applications` — legacy (endpoints now blocked; kept for admin history if ever re-enabled)

## Implementation Log (Feb 2026)
### Iteration 5 (compliance rebrand)
- Removed all portal/govt-look language & "Apply Now" CTAs
- Removed public login/register/dashboard/admin (kept file stubs)
- Added new `/api/enquiry` endpoint + `Enquiry.jsx` page
- Blocked `/api/{solar,loan,csc,irrigation}/apply` with HTTP 410
- Added `VacanciesPreview` section on Home page (shows 6 latest jobs)
- Added compliance disclaimers to SolarCalculator, SchemesInfo, Services, About
- Reseeded notices, FAQs, downloads with compliant informational content
- Updated Footer tagline & links; updated Header nav
- Testing agent report: `/app/test_reports/iteration_5.json` (100% pass)


## Changelog — Feb 2026
- **Feb 2026 — Admin panel Phase 2.1 (Manual Job Posts)** (verified by testing_agent iter19, backend 100%, frontend 100%)
  - New CRUD endpoints under `/api/admin/vacancies` (list / POST / PUT / DELETE) protected by `require_admin`. Manual entries carry `source: "manual"` and a synthetic `url: "internal://manual/{uuid}"` so they never collide with the scraper.
  - Scraper refresh + startup state/category backfill both skip `source=="manual"` — admin's edits are authoritative and preserved through auto-refresh.
  - Detail endpoint skips external lazy-fetch for manual entries (their `content_html` is populated from admin description at creation, and `detail_fetched_at` is stamped).
  - New admin UI at `/admin/vacancies` — list table with edit/delete row actions, slide-over Create/Edit form (title, org, category, mode, state, qualification, last date, apply URL, description). New sidebar link + AdminHome card.
  - VacancyDetail shows a prominent "Apply Now" block (data-testid `vacancy-manual-apply`) when `apply_url` is set on a manual entry.
- **Feb 2026 — Admin panel Phase 1 (SEO + Front-page text editor)** (verified by testing_agent iter18, backend 100%, frontend 100%)
  - Hidden admin panel at `/admin` — no public nav link. Login at `/admin/login` using existing JWT (admin@haryanaenterprises.com / Admin@123). Token stored in localStorage `he_admin_token_v1`.
  - New collection `site_content { key, value, updated_at }` with 8 default keys: `seo:home|vacancies|services|about|contact` and `content:hero|about|contact`. Admin edits partially override defaults.
  - Endpoints: `GET /api/site-content` (public), `GET /api/site-content/{key}` (public), `PUT /api/site-content/{key}` (admin only). Unknown fields silently dropped for safety.
  - `SEO.jsx` now accepts `seoKey` prop and hydrates `<title>`, meta description, keywords from admin-managed content with hardcoded fallbacks.
  - `Home.jsx` hero H1 + tagline now consume `content:hero` via `useContentKey`. `Services.jsx` and `Vacancies.jsx` use `seoKey`.
  - Public Header/Footer hidden on `/admin/*` routes via `ChromeWrap`. Client-side cache in `lib/siteContent.js` — 1 request per full site session, busted after admin saves.
- **Feb 2026 — CORS whitelist hardening** (verified by testing_agent iter17, 100% pass — 15/15 tests)
  - `CORS_ORIGINS` restricted from `*` to 4 whitelisted hosts: hrdigitalservices.in, www.hrdigitalservices.in, haryana-solar-app.emergent.host, rooftop-solar-jobs.preview.emergentagent.com.
- **Feb 2026 — Mobile State fix + Offline-only mode chip + Subtle scrollbar + Poster brand colors** (verified by testing_agent iter15 + iter16, 100% pass)
  - Vacancies: Application Mode row now shows a single toggle chip ("ऑफलाइन फॉर्म") — off means all modes, on means offline. Cleaner UX for the private vendor's core service.
  - Mobile State filter: `.input` font-size bumped to 16px ≤640px screens (prevents iOS focus-zoom) + explicit light-theme `select option` colors so the native picker is readable on iOS/Android.
  - Global scrollbar: switched from solid `#1f2925` to subtle `rgba(148,163,184,0.35)` thumb on transparent track with `scrollbar-width: thin` for Firefox — blends with light-mode design.
  - Poster brand palette: new 8-color palette (navy/emerald/red/orange/purple/teal/magenta/slate) in ShareModal. `<Poster accentColor>` prop recolors header gradient, Last Date InfoCard, QR frame, WhatsApp footer banner and text accents via a `color-mix`-derived brandGradient.
- **Feb 2026 — Result scraper + State filter + Save Vacancy + Poster mobile polish** (verified by testing_agent iter14, backend 100% after category-backfill patch, frontend 100%)
  - Scrapers: switched `result` source URL to `www.freejobalert.com/exam-results/` and use `_cat_from_title` guard so admit_card/result anchors are only accepted when the title matches the page's purpose. Cap raised 800 → 1500. First-time `state` slug is populated for every parsed vacancy.
  - Backend: `/api/vacancies` accepts `?state=<slug>`; `/api/vacancies/stats` returns `by_state`. Startup does an idempotent state + category backfill so historical rows are re-tagged after regex updates.
  - Frontend Vacancies: added a State dropdown (data-testid `vacancies-state-filter`), a per-card state chip, a per-card bookmark toggle (data-testid `vacancy-save-{i}`, backed by localStorage `he_saved_vacancies_v1`), and a "Saved (N)" filter chip (data-testid `vacancies-saved-only-toggle`).
  - Poster ShareModal: preview now uses CSS `transform: scale(...)` with a wrapper of the exact scaled dimensions (previously used `zoom`, which caused text offset when html-to-image captured on Safari/Firefox). Reduced modal padding on mobile so the poster fits without horizontal scroll.
- **Feb 2026 — Vacancy filter + light-mode contrast fixes** (verified by testing_agent iter13, 100% pass)
  - `GET /api/vacancies?category=haryana` now does broader $or match (title/organization/post_name/row_text) so all Haryana-relevant vacancies surface, not just those tagged `category=haryana`.
  - `mode=other` filter now matches `application_mode` null OR missing (previously only null).
  - `GET /api/vacancies/stats` now returns `by_mode.other` and a broader `haryana` count so UI counters are accurate (total == online + offline + other).
  - Light-mode CSS: divider above "Application Mode" filter lightened to #e2e8f0; `text-amber-400` accent darkened to #78350f; added readable overrides for text-slate-600/700/800, text-white/60-80, text-yellow-400/500, text-red-400.


## Backlog (P1 → P2)
- **P1** Emergent production deployment blocked (`await_phishing` filter) — pending support team whitelisting
- **P1** Connect custom domain `hrdigitalservices.in` (blocked on deploy)
- **P2** Real SMTP setup (SendGrid/Resend) for enquiry auto-response emails
- **P2** Rate limit `POST /api/enquiry` (public unauth endpoint)
- **P2** Split `backend/server.py` into routers (currently 1170+ lines)
- **P3** Fix legacy `tests/test_code_review_fixes.py` failing tests (Mongo env mocking)

## Compliance Guardrails (enforced)
- We **never** collect Aadhaar, PAN, bank details, OTP or passwords
- Never claim "guaranteed" loan approval or fixed subsidy amounts
- Government-scheme content always paired with a "verify at official sources" disclaimer
- Site clearly disclaims "private business, not a government portal"

## Credentials
Public UI has **no login**. Admin routes (`/admin/*`) still exist on backend for legacy data access but no longer linked from UI. See `/app/memory/test_credentials.md`.
