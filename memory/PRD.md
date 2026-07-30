# HARYANA ENTERPRISES — Product Requirements Document (PRD)

## Original Problem Statement
Build a full-stack website + application system for **HARYANA ENTERPRISES** (Kagdana, Sirsa, Haryana), a solar & loan services provider, with the look and feel of https://ekharid.haryanafood.gov.in — a government-style Haryana e-services portal. Bilingual Hindi/English. Modules requested: Website, Solar Module (PM Surya Ghar, Rooftop Solar, Subsidy Info, Installation), Loan Module (Application, Status Tracking, Document Upload), User Panel, Admin Panel.

## Business Info (baked in)
- **Name:** HARYANA ENTERPRISES
- **Address:** 200 Mtr From Bus Stand, Begu–Bhadra Road, Kagdana, Sirsa, Haryana
- **Phone:** 8167862016   **WhatsApp:** 8168762016
- **Email:** haryanaenterpriseskagdana@gmail.com

## Tech Stack (as-built, replacing Laravel per platform constraint)
- Frontend: React 19 + Tailwind + shadcn + AOS + FontAwesome + react-icons + react-fast-marquee + jsPDF
- Backend: FastAPI + Motor (MongoDB async) + bcrypt + PyJWT
- Database: MongoDB (`haryana_enterprises` DB)
- Auth: JWT httpOnly cookies + demo Google login stub
- PDF: client-side jsPDF + jspdf-autotable
- Language: Bilingual (Hindi / English) via I18nContext toggle in top bar

## User Personas
- **Home Owner** — wants rooftop solar / PM Surya Ghar subsidy
- **Farmer** — KUSUM / agri loan queries
- **Business Owner** — commercial solar + business loan
- **Registered Applicant** — tracks status in dashboard, downloads PDF acknowledgment

## Core Requirements (Static)
- Government-portal look: tri-band strip, top info bar, sticky navbar, hero slider, scrolling notice marquee, quick services, latest updates, download forms, stats strip, testimonials, CTA, footer
- Bilingual toggle from top bar
- User can submit Solar / Loan application (public — no login required)
- Authenticated users see all their applications in dashboard with PDF download
- Public status lookup by ref no.

## Implemented (v1.1 — 30 Jul 2026) — Design overhaul to match Haryana NIC portal
- Redesigned entire chrome to match https://haryanafood.gov.in / ekharid.haryanafood.gov.in visual language:
  - Accessibility strip (Skip to content, Screen Reader, Sitemap, font A-/A/A+, dark theme toggle, हिंदी/English, Login/Register)
  - Emblem header with Ashoka national emblem + brand + toll-free number + PM Surya Ghar tricolor badge
  - Tricolor accent strips (saffron/white/green)
  - Sticky green navigation bar with orange bottom border, uppercase links
  - Red "Latest News" marquee tag with animated NEW badges
  - Two-column layout: main content + right sidebar (Notice Board, Quick Links, Downloads, Consultation)
  - Tabbed panel (Latest Updates / Helpline / News/Press)
  - NIC-style panels with green headers and gradient
  - Partner logos strip (Digital India / MyGov / India.gov.in / PMIndia)
  - Tricolor footer band, dark green footer

## Implemented (v1 — 30 Jul 2026)
### Backend endpoints (`/api/*`)
- Auth: `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/google` (demo)
- Solar: `/solar/apply`, `/solar/my`
- Loan:  `/loan/apply`, `/loan/my`
- Public: `/contact`, `/notices`, `/faqs`, `/downloads`, `/status/{ref_no}`
- Auto-seed: admin, test user, 5 notices, 5 FAQs, 4 downloads

### Frontend pages
- `/` Home (hero, notice ticker, quick services, stats, latest updates, downloads, why-choose, testimonials, CTA)
- `/about`, `/services`, `/gallery`, `/notices`, `/downloads`, `/faq`, `/contact`
- `/solar/apply`, `/loan/apply` (with EMI calculator)
- `/status?ref=` public tracking
- `/login`, `/register` (JWT + demo Google button)
- `/dashboard` (protected) — stats cards, tabbed Solar/Loan tables, jsPDF download per application

### Testing
- Backend: 24/24 tests passed (iteration_1.json)

## Deferred / Backlog
- **P0** — Real Google OAuth (currently a demo stub posting fixed profile)
- **P0** — Admin Panel (dashboard, users, applications list, notices/gallery CMS, reports)
- **P1** — Real SMTP email notifications on submission (Resend/SendGrid)
- **P1** — Document upload for loan applications (Aadhaar / PAN / bank statement)
- **P1** — Dark mode toggle
- **P2** — Chart.js analytics widgets on admin dashboard
- **P2** — WhatsApp OTP or SMS notifications (Twilio)
- **P2** — Password reset via email
- **P2** — Brute-force lockout on `/auth/login`

## Seeded Credentials
See `/app/memory/test_credentials.md`.
