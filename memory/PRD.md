# Alif Amin Academy — PRD

## Original Problem Statement
Premium, enterprise-grade 1-on-1 Quran tutoring platform (EdTech). Google OAuth, booking engine, credit wallet, virtual classroom (LiveKit), interactive Quran (Mushaf), teacher CRM, and world-class admin command center.

## Architecture
- **Frontend:** React 18, Tailwind CSS, Shadcn UI, LiveKit React SDK
- **Backend:** FastAPI, Motor (MongoDB async), Pydantic, bcrypt, Fernet encryption
- **Database:** MongoDB
- **Real-time:** LiveKit (WebRTC A/V), FastAPI WebSockets (Quran sync)
- **Auth:** Google OAuth + Admin PIN (bcrypt salted)
- **Encryption:** Fernet AES for API keys at rest
- **External APIs:** Quran.com V4 (proxied), LiveKit Cloud

## What's Been Implemented

### Foundation (Batches 1-5)
- Google OAuth, role-based routing, onboarding
- Teacher approval workflow, availability calendar
- Credit wallet (FIFO), booking engine with overlap prevention
- Admin dashboard, commission tiers, financial tracking
- Multiple hotfix batches for integrity

### Epic 3: Interactive Mushaf & Real-Time Sync
- Backend proxy for Quran.com V4 API with caching
- KFGQPC Uthmanic font, word-level interactive DOM
- WebSocket sync: HIGHLIGHT_WORD, NAVIGATE, CLEAR_HIGHLIGHTS

### Batch 6: Teacher CRM & Profile Uploads
- My Students CRM page with table + right-side drawer
- Teacher profile uploads (video 50MB + certificates 10MB)

### Batch 7: World-Class Admin UI & God-Mode Tools
- Command Center with clickable KPIs, live sessions, financial snapshot
- God-Mode: Impersonate, Edit, Suspend, Wallet Adjust
- Content Library CRUD, Admin Settings with encryption

### Hotfix 7.1: Comprehensive UAT Resolution (Feb 21, 2026)

**Bug 1 — Pagination:** Admin tables (Users, Sessions, Approvals) + student Recent Classes paginated (10/page admin, 5/page student)

**Bug 2 — Approvals State Refresh:** Approve/Reject instantly removes teacher row from React state

**Bug 3 — Secure Wallet Adjustment:** 6-digit Admin PIN (bcrypt hashed, salt round 10). PIN modal gates wallet adjustments. Auto-creates wallet if missing.

**Bug 4 — Financial Data:** KPI renamed "Net Revenue" = Recognized Revenue. Finance page pulls real aggregations.

**Bug 5 — Impersonation Fix:** Token now includes `onboarding_completed: true` to bypass onboarding redirect.

**Bug 6 — Join Class Reverted:** 5-minute-before time lock restored (was temporarily "today = joinable").

**Bug 7 — Active Session Visibility:** Backend now fetches classes started up to 2h ago. useCountdown keeps class visible until start_time + duration passes.

**Feature 1 — Application Emails:** SMTP integration via smtplib. Approval + Rejection email templates with teacher name and custom reason. Falls back to console logging if SMTP creds missing.

**Feature 2 — Visual Activity Builder:** No raw JSON. Dynamic visual forms for Quiz (Q + 4 options + correct answer), Flashcard (front/back), Tajweed Match, Pronunciation Drill, Word Tracing, Doa Practice, Hadith Practice. Auto-compiles to JSON payload.

**Feature 3 — Student Teacher Media:** BookingModal shows `<video playsInline>` + certificate links with FileText icons.

**Enhancement 1 — Encrypted Settings Vault:** PIN gate on settings page (create or verify). All API keys encrypted with Fernet AES before MongoDB storage. Backend never returns decrypted values (returns "********"). "Add Custom Key" for arbitrary integrations.

## Mocked/Placeholder
- Stripe payments, Cloud recording, Avatar photo upload
- SMTP emails logged to console (no SMTP_EMAIL/SMTP_PASSWORD in env)

## Backlog

### P0 (Awaiting UAT)
- Manual UAT of Hotfix 7.1

### P1
- Real Billplz/Stripe payments
- GCS migration for file storage
- WhatsApp notifications
- SMTP credentials configuration

### P2
- Cloud recording integration
- Admin Report Card PDF export
- Blur Background toggle
- SMS notifications
