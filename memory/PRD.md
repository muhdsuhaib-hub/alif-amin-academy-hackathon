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

## Hotfix 7.2: Critical Regressions & Data Sync (Feb 2026)

**Bug 1 — Student Wallet Crash (P0):** Fixed `getAmountColor` null check on `transaction_type` — was calling `.includes()` on undefined when admin-created transactions used different field names.

**Bug 2 — Teacher Auto-Approval Bypass (P0):** Added teacher profile creation in email registration (`POST /api/auth/register`) with `is_active: false`, `approval_status: 'pending'`. Previously teachers registered with no profile, defaulting to active.

**Bug 3 — KPI & Finance Mismatches (P0):** Added `pending_approvals` count to `/api/admin/stats`. Fixed student count to only include active/trial subscriptions. Fixed FinancialReports key mismatches (`session_economics` → `session_summary`, `total_paid_credits` → `total_paid_credits_outstanding`, `wallets_with_balance` moved to `wallet_summary`).

**Bug 4 — Wallet Adjustment Failure (P1):** Fixed backend to use `student_wallets` collection (was `wallets`). Fixed transaction field names to match wallet_routes convention (`transaction_type`, `credit_amount`). Hidden wallet adjustment UI for non-student users.

**Bug 5 — Impersonation Onboarding Trap (P1):** Changed impersonation handler to navigate with `location.state` user data instead of `window.location.reload()`, ensuring `ProtectedRoute` uses injected user (with `onboarding_completed: true`) without calling `/api/auth/me`.

**Bug 6 — "Starts in Ended" UI Glitch (P2):** Added client-side filter to exclude ended classes from "Next Session" hero in both student and teacher dashboards. Fixed countdown text from "Starts in Class ended" to "Class Ended".

**Bug 7 — Settings Vault Edits (P2):** Added `PUT /api/admin/settings/custom-key/{key_name}` and `DELETE /api/admin/settings/custom-key/{key_name}` endpoints (PIN-gated). Added inline Edit/Delete buttons for each custom key in the Settings Vault UI.

**Bug 8 — Pre-Call Lobby Mic Toggle Crash (P0):** Added safety checks in `MicLevelMeter`: validates stream has audio tracks before creating AudioContext, wraps `createMediaStreamSource` in try/catch, uses `cancelled` flag to prevent state updates after cleanup, properly disconnects source on unmount.

## Hotfix 7.3: Critical Logic & Data Sync Surgery (Feb 2026)

**Bug 1 — Ghost Data on Users & Approvals (P0):** Removed duplicate `/admin/users/all` endpoint from server.py (admin_routes.py version retained with auth + enrichment). Fixed approvals endpoint response key from `pending_teachers` to `teachers`. Flattened user data into teacher objects (`user_name`, `user_email`).

**Bug 2 — Vanishing Classroom (P0):** Fixed student `/api/students/dashboard-data` backend cutoff from `now.isoformat()` to `(now - 2h).isoformat()`, matching teacher endpoint. In-progress classes now persist in both dashboards until full duration elapses.

**Bug 3 — Impersonation Landing Page Redirect (P1):** Reverted from `navigate()` (React Router, doesn't reset app state) to `window.location.href` for hard browser redirect to correct dashboard.

**Bug 4 — Teacher Auto-Approval Bypass (P1):** Added frontend route guard in TeacherDashboard.js. Pending teachers see a locked "Application Under Review" screen and cannot access Availability, Earnings, or My Students tabs.

**Bug 5 — Wallet Adjustment Bonus Credits (P1):** Split wallet modal into separate "Paid Credits" and "Bonus Credits" inputs. Backend `POST /api/admin/users/wallet-adjust` now accepts `amount` (paid) + `bonus_amount` fields and updates both independently. Response includes `new_paid_credits`, `new_bonus_credits`, `new_credit_balance`.

## Backlog

### P0 (Awaiting UAT)
- Manual UAT of Hotfix 7.2

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
