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

## Hotfix 7.4: Advanced Logic, Filtering & Admin Controls (Feb 2026)

**Bug 1 — Table Filtering & KPI Accuracy (P0):** Added missing `status` query parameter to `/api/admin/users/all` MongoDB filter. Aligned KPI stats to count from `db.users` collection (same source as table) instead of `db.students`/`db.teachers` for mathematical consistency.

**Bug 2 — Impersonation "Snitch" (P0):** Modified `/api/auth/me` to detect impersonation sessions (`imp_*` token prefix) and inject `onboarding_completed: true` into the response, preventing the onboarding guard from overwriting JWT claims.

**Bug 3 — WebRTC Lobby Media Init (P1):** Merged device enumeration and preview stream creation into a single sequential effect. The initial `getUserMedia` stream is reused directly as the preview (no stop→re-request round-trip), ensuring camera/mic are live on mount.

**Feature 1 — Hard Delete User (P1):** Added `DELETE /api/admin/users/{user_id}` endpoint that cascades removal across users, students, teachers, wallets, transactions, progress, bookings, sessions, and availability. Added red "Delete Permanently" action in the User Management dropdown with a severe confirmation modal.

## Hotfix 7.5: Lean Bulk Actions & Component Fix (Feb 2026)

**Feature 1 — Bulk Delete Users (P0):** Added checkbox column (with Select All) to User Management table. Red "Delete Selected ({count})" bar appears above table when items are selected. `POST /api/admin/users/bulk-delete` accepts array of user_ids and cascades removal across all collections. Rows removed from state instantly on success.

**Bug 1 — Student Lobby Media (P0):** Rewrote GreenRoom media initialization into 3 clean effects: (1) device enumeration (unconditional for all non-admin users), (2) stream creation on any device/toggle change (no `initialMount` skip pattern), (3) dedicated `stream → videoRef.srcObject` sync effect. Previous split-effect + initialMount.ref pattern caused race conditions where students never got their srcObject set.

## Batch 8: Production Launch Infrastructure (Feb 2026)

**Feature 1 — Billplz Payment Gateway (P0):** Created `payment_routes.py` with:
- `POST /api/payments/billplz/create-bill` — creates a Billplz bill via their REST API (sandbox/production toggle), stores pending payment in `pending_payments` collection, returns `bill_url` for frontend redirect.
- `POST /api/payments/billplz/callback` — server-to-server webhook with HMAC-SHA256 X-Signature verification. On verified `paid=true`, credits `student_wallets` and writes transactions.
- `GET /api/payments/billplz/redirect` — handles user redirect back from Billplz, verifies payment, credits wallet (idempotent), redirects to `/student/wallet?payment=success|failed`.
- Frontend: WalletPage top-up now tries Billplz first; falls back to mock Stripe if Billplz returns 503 (not configured). Handles `?payment=success` redirect param with toast notification.
- Env keys: `BILLPLZ_API_KEY`, `BILLPLZ_COLLECTION_ID`, `BILLPLZ_X_SIGNATURE_KEY`, `BILLPLZ_SANDBOX`.

**Feature 2 — GCS File Pipeline (P0):** Updated `upload_routes.py` with:
- Lazy-initialized GCS client using `GCS_BUCKET_NAME` and `GCS_CREDENTIALS_JSON` from env.
- Video and certificate upload endpoints now try GCS first (public URL), fall back to local `/uploads` directory if GCS is not configured or fails.
- Env keys: `GCS_BUCKET_NAME`, `GCS_CREDENTIALS_JSON`.

**Feature 3 — SMTP Email Execution (P1):** Updated `_send_email()` in `admin_routes.py`:
- Uses `smtplib.SMTP` with STARTTLS on port 587 (configurable via `SMTP_HOST`, `SMTP_PORT`).
- Falls back to console log simulation if `SMTP_EMAIL`/`SMTP_PASSWORD` not set.
- Teacher approval/rejection emails now physically sent when SMTP is configured.

## Hotfix 8.1: Dynamic Credential Hydration with Fallback (Feb 2026)

**Refactor — Shared Credential Resolver:** Created `credentials.py` with `get_credential(db_key, env_key)` async helper. Reads encrypted values from `admin_settings` collection (Fernet decryption) first, falls back to `os.environ.get()`. Convenience wrappers: `get_billplz_config()`, `get_gcs_config()`, `get_smtp_config()`.

**Refactor 1 — Dynamic GCS:** `upload_routes.py` now calls `get_gcs_config()` per-upload (no global cache). If DB has `gcs_bucket_name` + `gcs_credentials_json`, uses `Client.from_service_account_info(json.loads(...))`. Falls back to `.env`, then local storage.

**Refactor 2 — Dynamic SMTP:** `_send_email()` in `admin_routes.py` is now `async`, calls `get_smtp_config()` for DB-first SMTP credentials. All call sites updated to `await`.

**Refactor 3 — Dynamic Billplz:** `payment_routes.py` uses `await get_billplz_config()` in all 3 endpoints (create-bill, callback, redirect). Removed old sync `_get_billplz_config()`.

## Hotfix 8.2: UAT Polish & Edge Case Resolution (Feb 2026)

**Fix 1 — Settings PIN Cancel (P1):** PIN modal cancel now redirects to `/admin/dashboard` instead of leaving user on empty Settings page.

**Fix 2 — Conditional Teacher Media (P1):** BookingModal teacher profile now validates `video_intro` is a real URL (starts with `http` or `/`) and checks certificates array has entries with valid URLs before rendering.

**Fix 3 — Remove Mock Payment (P0):** Stripped mock Stripe auto-credit fallback from WalletPage. Top-up now exclusively uses Billplz. If Billplz fails/unconfigured, shows error toast — never auto-credits.

**Fix 4 — GCS JSON Parsing (P0):** Added `.strip()` and wrapping-quote removal before `json.loads()`. Added explicit `print()` logging for JSON parse errors, credential project_id, and bucket init status.

**Fix 5 — Graceful Security Redirects (P2):** ProtectedRoute no longer logs out unauthorized users. Students hitting `/admin` are redirected to `/student/dashboard`, teachers to `/teacher/dashboard`.

**Fix 6 — Masked Password Overwrites (P1):** Backend PUT `/settings` now skips values that are empty, whitespace-only, or `"********"` via `.strip()` check. Credential resolver also strips whitespace from decrypted values.

### Hotfix 8.3: Frontend API Wiring & Defensive Rendering (Feb 2026)

**Fix 1 — SCORCHED-EARTH: Hard-Wire Billplz (P0):** Completely removed all mock/custom top-up code from `WalletPage.js`. Removed `confirmCustomTopup`, `topupMode`, `customQuantity` state, the "Custom Amount" mode toggle, and the "demo mode" disclaimer. The only top-up path is now: select a package → POST `/api/payments/billplz/create-bill` → redirect to `bill_url`. Error toasts on failure.

**Fix 2 — Hydrate & Fallback Teacher Media (P1):** Backend `GET /api/booking/available-teachers` now includes `video_intro` and `certificates` in teacher response payload. Added `onError` handler on the `<video>` element in `BookingModal.js` that replaces the broken player with a "temporarily unavailable" fallback. Added defensive `.filter(c => c.url)` on certificates array and `data-testid` attributes for both containers.

### Hotfix 8.4: Payment Debugging & Public Media (Feb 2026)

**Fix 1 — Verbose Billplz Error Handling (P0):** Backend `POST /api/payments/billplz/create-bill` now parses the exact Billplz API error response and returns it as a `400 Bad Request` with `detail: "Billplz API Error: <reason>"`. Added `except HTTPException: raise` to prevent the catch-all from swallowing structured errors. Frontend toast now shows the actual backend error message via `.catch(() => ({}))` safe parsing.

**Fix 2 — Auto-Public GCS Uploads (P1):** Moved `blob.make_public()` outside the try/except in `_upload_to_gcs()`. Upload failures still fall back to local storage, but `make_public()` failures now propagate loudly so IAM/bucket policy misconfiguration is caught immediately.

### Hotfix 8.5: Remove Legacy ACL & Expose Raw Payment Errors (Feb 2026)

**Fix 1 — Remove blob.make_public() (P0):** Deleted `blob.make_public()` from `_upload_to_gcs()` in `upload_routes.py`. Bucket uses Uniform Bucket-Level Access; IAM policies handle public read globally. Upload failures still fall back to local storage.

**Fix 2 — Expose Raw Billplz Error in UI (P0):** Frontend `WalletPage.js` now logs `console.error("RAW BILLPLZ ERROR:", ...)` and displays the exact backend `detail` or `error` string in the toast — no hardcoded fallback. Network-level failures show `e.message`.

### Hotfix 8.6: Billplz Production URL & Basic Auth Formatting (Feb 2026)

**Fix 1 — Force Production URL (P0):** Hardcoded `https://www.billplz.com/api/v3` in `create-bill` route, bypassing the `sandbox` flag which defaulted to `true` and was sending production keys to `billplz-sandbox.com`.

**Fix 2 — Enforce Clean Basic Auth (P0):** Added explicit `api_key.strip()` before passing to `httpx auth=(key, "")` to guard against trailing whitespace/newlines from DB decryption.

### Hotfix 8.7: Custom Top-Up Integration (Feb 2026)

**Fix 1 — Frontend Custom Amount UI (P1):** Re-introduced custom top-up section below packages in the top-up modal. Numeric input (1–100 credits), live RM price calculation at RM 15/credit, separate "Confirm Custom Top Up" button. Selecting a package clears custom input and vice versa. Both flows use the same Billplz `create-bill` endpoint.

**Fix 2 — Backend Dynamic Payload (P1):** `CreateBillRequest` now accepts optional `custom_credits` (int) alongside `package_id`. When `custom_credits` is provided, price is calculated as `credits × RM 15`, description is set to "Custom Top Up", and the pending payment record stores `pkg_id = "custom_{N}"`. Production URL and Basic Auth formatting from 8.6 remain untouched.

### Production Release 9.4: Enterprise WebRTC, Financial BI, UI/UX Overhaul (Feb 2026)

**Phase A — Financial Integrity & Teacher Polish:**

**#5 — Dynamic Net Earnings Rate (P1):** IncomeCreditCard in `EarningsWallet.js` now dynamically calculates net take-home from `tier.commission_rate` (60%/65%/70%). Hidden platform fee; replaced with positive "You earn X%" pill. TierWidget also shows dynamic net rate.

**#6 — ACID Payout Requests (P0):** `POST /api/teacher/request-payout` now uses MongoDB transactions (`client.start_session()`) for atomic balance verification + deduction + payout record creation. Falls back to sequential writes if transactions are unavailable. Reads from `tutor_earnings.withdrawable_balance` (single source of truth).

**#10 — Teacher Analytics Charts (P1):** New `GET /api/teacher/analytics` endpoint returns daily earnings (30d, gap-filled) and rating trend (last 10 reviews). Frontend renders Recharts LineCharts in DashboardOverview.

**#11 — Teacher Dashboard Modernization (P1):** Complete rewrite of `DashboardOverview.js` with skeleton loaders, improved empty state with illustration and CTA, modernized card layouts with drop shadows, consistent spacing.

**#12 — Earning History Pagination (P1):** Converted transaction list to structured HTML `<table>` with explicit numbered page buttons (1, 2, 3... Prev/Next).

**#13 — Header Nav Fix (P1):** Fixed "My Profile" dropdown in `LayoutShell.js` from `onNavigateTab('account')` to `onNavigateTab('profile')`.

**Phase B — Admin BI & Session Monitoring:**

**#7 — Session History Aggregation (P1):** New `GET /api/admin/sessions/history` with server-side pagination (limit/offset), status filtering, and teacher/student name enrichment. `SessionMonitor.js` rewritten with live sessions panel + paginated history table.

**#8 — Master Calendar View (P1):** `BookingCalendar.js` rewritten as full CSS Grid monthly calendar. Day cells show color-coded booking dots. Click-to-expand day detail panel. Month navigation with today highlight.

**#9 — Admin BI Charts (P1):** New `GET /api/admin/revenue/chart-data` aggregation pipeline (daily/monthly grouping). `FinancialReports.js` rewritten with Recharts BarChart for Gross Revenue vs Net Profit, metric cards, and session economics breakdown.


### Hotfix 9.5: UAT Feedback & Logic Polish (Feb 2026)

**#1 — Hide Gross Revenue:** Removed "Gross Generated" metric from Teacher Financial Snapshot card. Teachers only see Net Income + dynamic "You earn X%" pill.

**#2 — Transaction History Merge:** Renamed "Earnings History" to "Transaction History". Table now shows merged feed of session earnings (green) and withdrawals (red) from `tutor_earnings_transactions`.

**#3 — Payout Pipeline Fix:** ACID payout now inserts a withdrawal record into `tutor_earnings_transactions` (for merged feed) and increments `total_withdrawn` in `tutor_earnings` atomically. Admin's pending withdrawal table populated via `payout_requests` collection.

**#4 — Teacher Analytics Date Filters:** `GET /api/teacher/analytics` accepts `start_date`/`end_date` params. Frontend has filter bar: Last 30 Days | This Month | This Year | Custom Range (date picker pair + Apply). Rating trend chart renders with `connectNulls` for sparse data.

**#5 — Admin Financial BI Date Filters:** `GET /api/admin/revenue/chart-data` accepts `start_date`/`end_date` params. Frontend has matching filter bar: Last 30 Days | This Month | This Year | Custom Range with Apply button.

**#6 — Auto-Refresh Next Class:** Added 30s background polling in `TeacherDashboard.js` via `setInterval` on `fetchDashboardData()`. No hard refresh needed when students book.

**#7 — Admin Session Monitor Filters:** Added Teacher dropdown, Date picker, and Clear button to session history. Added "View Report" button that opens a session report modal with summary, tajweed notes, progress, homework, and metadata.

**#8 — Ghost Live Class Cleanup:** New `POST /api/admin/sessions/cleanup-stale` endpoint. Finds bookings stuck in live/scheduled past `end_time + 60min`, transitions to "completed" (if report exists) or "abandoned". Exposed as "Cleanup Stale Sessions" button in Admin Session Monitor.


### Emergency Hotfix 9.6: Financial Leak & Advanced BI Grouping (Feb 2026)

**#1 — Payout Collection Fix (P0):** Rewired `POST /api/teacher/request-payout` to insert into `withdrawal_requests` (not `payout_requests`) with correct field names (`withdrawal_id`, `account_holder_name`). Admin's WithdrawalManagement now correctly surfaces pending withdrawals.

**#2 — Transaction History Withdrawal Rendering:** Frontend now recognizes both `withdrawal` and `withdrawal_request` transaction types for red negative display in the merged Transaction History table.

**#3 — Ghost Buster Logic Fix:** Changed status match to case-insensitive regex `^(live|scheduled)$`. Extended cutoff to 2 hours. Added `try/except` for ISO date parsing. Logs each auto-cleaned session.

**#4 — View Report Button:** Already present in SessionMonitor from Hotfix 9.5 (verified).

**#5 — Rating Trend Fallback:** Backend now falls back to `session_reports` collection (checking `rating` and `average_rating` fields) when `reviews` collection has no data for the teacher.

**#6 — Yearly Grouping:** Added `year` option to `group_by` parameter in `GET /api/admin/revenue/chart-data`. Backend uses `substr_len=4` for yearly aggregation. Frontend toggle includes "Yearly" button.

**#7 — Modern AreaChart:** Replaced `BarChart` with smooth `AreaChart` using gradient fills (`url(#gradGross)`, `url(#gradNet)`). Two smooth lines for Gross Revenue (emerald) and Net Profit (amber). Interactive hover tooltip with exact RM values. Clean Stripe-style appearance.


### Hotfix 9.8: Critical Logic Refinements & Admin Financial Override (Feb 2026)

**#1 — Rejected Math Bug:** `total_withdrawn` on Teacher dashboard now calculated via aggregation pipeline filtering ONLY `status: approved/completed` from `withdrawal_requests`. No longer includes rejected/pending.

**#2 — Auto-Refresh Polling:** 15s `setInterval` polling on Admin WithdrawalManagement and Teacher EarningsWallet (fetches fresh txn data + wallet metrics).

**#3 — Ghost Buster Broadened:** Query fetches ALL sessions with `status: $in: ["Live","live","LIVE","Scheduled","scheduled"]` without date filter in DB query. Time comparison done in Python memory: `elapsed > 2 hours` from `start_time_utc` or `created_at`.

**#4 — Pagination Always Visible:** Changed `totalPages > 1` to `totalPages >= 1` + added smart 7-page windowing for large page counts.

**#5-7 — Secure Admin Balance Adjust:** New `POST /api/admin/finance/adjust-tutor-balance` endpoint. Accepts `user_id`, `amount` (+/-), `description`, `admin_pin`. PIN verified via bcrypt against admin user's `admin_pin_hash`. ACID atomic: updates `withdrawable_balance` + inserts `admin_adjustment` ledger record.

**#8-10 — Admin UI "Adjust Balance":** New dropdown action on teacher rows in UserManagement. Secure modal with Amount, Reason. PIN entry uses the shared PIN Modal component (same as student wallet adjust).

**#11 — Teacher Ledger Recognition:** Transaction History now parses `admin_adjustment` type. Positive amounts green, negative red, "Admin Adjustment" sub-label in blue.

### Hotfix 9.9: PIN Crash Fix, Automated Sweeper & Real-Time Sync (Feb 2026)

**#1 — 500 Crash Fix (P0):** Rewrote `POST /api/admin/finance/adjust-tutor-balance` PIN validation. Removed faulty custom logic (checking `admin_settings` collection for plaintext PIN). Now uses bcrypt verification against admin user's `admin_pin_hash` — same proven pattern as student wallet adjust in `admin_routes.py`. Added input validation try/except wrapper.

**#2 — Automated Stale Session Sweeper (P0):** Removed manual `POST /api/admin/sessions/cleanup-stale` endpoint and its "Cleanup Stale Sessions" UI button. Replaced with a true background `asyncio` task launched on FastAPI startup that runs every 5 minutes. **Strict timing (no grace period):** sessions go `live` when `start_time <= now < end_time`, and transition to `completed` (report exists) or `missed` the exact minute `now >= end_time`. Updates both `bookings` and `class_sessions` collections for instant sync.

**#3 — Frontend PIN Modal Fix (P0):** Fixed fatal React `ReferenceError: setAdjustPin is not defined`. Rebuilt the "Adjust Teacher Balance" modal as a self-contained component with properly defined `adjustPin`/`setAdjustPin` state, inline PIN field, and direct API call. No longer depends on the shared PIN modal flow.

**#4 — Omni-Role Real-Time Sync (P1):** Added 30s history polling to Admin SessionMonitor (alongside existing 15s live session polling). Teacher DashboardOverview and Student DashboardHome already had 30s auto-refresh. Status changes from the background sweeper now reflect across all roles without manual page refreshes.

## Backlog

### P0 (Awaiting UAT)
- Manual UAT of Hotfix 9.9

### Hotfix 9.10: Ledger Polish, Flicker Fix & Description Format (Feb 2026)

**#1 — Stop UI Flicker:** Teacher Transaction History was remounting with a spinner every 15s. Added `silent` flag to `fetchTransactions()` — background polls skip `setLoading(true)`, so the DOM stays stable. Only initial load and manual page changes show the spinner.

**#2 — +RM 0.00 Approval Bug Fixed:** Removed the `add_earnings_transaction` call when admin approves a withdrawal. No new `withdrawal_approved` ledger entry is created. Instead, the original `withdrawal_request` transaction's description is updated in-place to: `"Approved Withdrawal [RM X.00: Mon DD, YYYY]"`.

**#3 — Text Wrapping:** Removed `truncate max-w-[200px]` from the Description column in the Transaction History table. Replaced with `break-words max-w-[280px]` so full descriptions wrap naturally.

### Hotfix 9.12: UI Teardown — Live Sessions Removed (Feb 2026)

**#1 — Command Center "Today's Sessions" removed:** Removed the live sessions card from AdminDashboard overview. Stopped `fetchLiveSessions` polling. `LiveSessionRow` component preserved in code.

**#2 — Session Monitor "Live Now" removed:** Removed the green "Live Now" card from SessionMonitor. Stopped the 15s `fetchLive` polling. History polling (30s) retained. `handleStealthJoin` and `handleStealthRecord` WebRTC functions preserved intact for rebuild.

### Hotfix 9.13: Bulletproof Live Sessions Rebuild (Feb 2026)

**#1 — Backend Strict Time Enforcement:** Both `GET /api/classroom/admin/sessions?status=live` and `GET /api/admin/overview/live-sessions` now compute `end_time = start_time + duration` server-side. If `now >= end_time`, the session is auto-transitioned to `completed`/`missed` and excluded. Duration resolved from booking, not hardcoded. `end_time_utc` and `duration_minutes` included in response.

**#2 — Silent Client-Side Clock:** Both `SessionMonitor.js` and `AdminDashboard.js` use a `currentTime` state ticked every 10s. No DOM remount.

**#3 — UI Restored with Stealth Join/Record wired.**

### Hotfix 9.14: Early Access, Math Fix & True Stealth (Feb 2026)

**#1 — 5-Minute Early Access:** Frontend time filter updated to `now >= (start - 5min) && now < end` on both SessionMonitor and AdminDashboard. Backend left strict (no grace period for auto-transition), only frontend shows sessions 5 min early.

**#2 — 60-Minute Hardcode Bug Fixed:** Backend `admin_list_sessions` now resolves `duration_minutes` from the associated booking document (not from `class_sessions` which doesn't store it). Frontend uses `end_time_utc` from the API response directly instead of computing from `duration_minutes`.

**#3 — Classroom Link Fix:** `LiveSessionRow` in AdminDashboard now uses `meet_link_slug || session_id` for the classroom URL, not `booking_id`.

**#4 — True Stealth Mode:** Admin observer now joins via `POST /api/classroom/admin/stealth-join` which issues a restricted LiveKit token (`can_publish=false`, identity `admin_{user_id}`, name "System"). `VideoStrip` and `MobileVideoRow` filter out any participant with `admin_` prefix identity — making admin 100% invisible to teacher/student on ALL clients. Chat input disabled for observers.

### Hotfix 9.17: Ultimate UI/API Simplification (Feb 2026)

**#1 — Frontend Teardown:** Deleted "Today's Sessions" widget from AdminDashboard.js (including `LiveSessionRow`, `fetchLiveSessions`, `currentTime` clock). Deleted green "Live Now" section from SessionMonitor.js (including `liveSessions` state, `fetchLive`, `currentTime` clock). Zero separate live-data polling.

**#2 — Backend Cleanup:** Deleted `GET /api/admin/overview/live-sessions` endpoint from admin_routes.py. Dead code removed.

**#3 — Session History Integration:** WebRTC Stealth Join and Record buttons injected into the Actions column of the master Session History table. For `scheduled` or `live` rows: shows Stealth + Record buttons (using preserved `handleStealthJoin`/`handleStealthRecord`). For `completed`/`cancelled`/`abandoned`: shows View Report button or "-". No clocks, no time math — pure status-based visibility.

**#4 — History API Enriched:** `GET /api/admin/sessions/history` now returns `session_id` and `meet_link_slug` per booking (via `class_sessions` lookup), enabling WebRTC access directly from history rows.

**#5 — Live Filter Added:** Added "Live" to the status filter bar in Session Monitor, so admins can filter to only live sessions when needed.

### Hotfix 9.18: Prevent Premature Session Expiration (Feb 2026)

**Root Cause:** Both `GET /api/students/dashboard-data` and `GET /api/teacher/dashboard-data` queried bookings with `"status": "scheduled"` only. When the background sweeper transitioned a session from `scheduled` → `live`, the session vanished from both dashboards.

**#1 — Backend Fix:** Changed both queries to `"status": {"$in": ["scheduled", "live"]}` so live/in-progress sessions remain in the `upcoming_classes` payload until they complete or are missed.

**#2 — Frontend Fix:** Changed duration fallback from `|| 60` to `|| 30` in both Student `DashboardHome.js` and Teacher `DashboardOverview.js` active-class filters. Fixed Student's `useCountdown` to pass actual `booking.duration_minutes` instead of defaulting to 60.

### Phase C.1: UTC Server-Side Synchronized Classroom Timer (Feb 2026)

**#1 — Backend Payload:** `GET /api/classroom/session/{id}` now returns `server_time_utc` (ISO 8601), `end_time_utc` (computed from booking `duration_minutes` + `start_time_utc`), and `duration_minutes`. Single source of truth.

**#2 — Drift-Corrected Timer Hook:** `useServerTimer(session)` calculates `clockOffset = server_time_utc - local_time` once on load. A 1-second `setInterval` computes `true_now = Date.now() + offset`, then `remaining = end_time_utc - true_now`. Immune to local clock tampering.

**#3 — UI Timer:** `ClassroomTimer` renders MM:SS countdown in the classroom header. White when >5min, amber when <=5min, red when <=1min, "Time Expired" at 00:00. Identical across Student, Teacher, and Observer.

### Phase C.2: WebSocket Interactive Activity Push (Feb 2026)

**#1 — Content Library API:** `GET /api/content-library` — teacher-accessible read endpoint that returns active `learning_activities`. Reuses admin's existing CRUD collection.

**#2 — Teacher Activities UI:** "Activities" (Layers icon) button added to ControlDock next to Book icon, visible only for teachers. Opens `ActivitiesBrowser` drawer listing available content from the library.

**#3 — WebSocket Broadcast:** When teacher selects an activity, `ACTIVITY_START` message (with full activity JSON payload) broadcasts to all room clients via existing WS relay. `ACTIVITY_CLOSE` removes it.

**#4 — Activity Overlay:** `ActivityOverlay` renders over the video viewport on all clients. Displays activity title, description, and questions with options. Teacher has "Close Activity" button; students and observers view passively.

### Hotfix C.2.2: Dynamic Activity Sync & Two-Way Live Grading (Feb 2026)

**#1 — WS Sync Fixed:** Added `ACTIVITY_START`, `ACTIVITY_CLOSE`, and `ACTIVITY_ANSWER` handlers to the backend WS `elif` chain in `classroom_routes.py`. Messages now broadcast to all room participants.

**#2 — Dynamic Activity Renderer:** `ActivityOverlay` renders based on `activity_type`: Quiz (interactive MCQ), Hadith/Doa/Word Tracing (Arabic text + translation), Tajweed Match (concept + examples). Unknown types show JSON fallback.

**#3 — Two-Way Live Grading:** Students click quiz options → `ACTIVITY_ANSWER` WS event sent. Teacher's overlay listens for `ACTIVITY_ANSWER` and shows student's selection: green if correct, red if incorrect (compared against `q.correct` field).

### Phase C.3: Connection Heartbeats, Presence Overlay & Keep-Alive (Feb 2026)

**#1 — Debounced Presence Hook:** `useDebouncedDisconnect(participant)` wraps LiveKit's `useConnectionQualityIndicator`. When quality drops to `Lost`, a 3-second `setTimeout` starts. If it fires, `isDisconnected = true`. If quality recovers to any other state, the timer is instantly cleared. Prevents false alarms from micro-stutters.

**#2 — Reconnecting Overlay:** When `isDisconnected` is true for a remote peer, their video tile gets `blur-sm` + an absolute overlay with spinner + "Connection Lost / Waiting to reconnect..." text. Styled with `bg-gray-900/80 backdrop-blur-sm`.

**#3 — WebSocket Keep-Alive:** Client sends `{ type: "PING" }` every 15 seconds. Backend responds with `{ type: "PONG" }` without broadcasting. Prevents WS timeout disconnections.

### P1 (Earlier Issues)
- "View Report" button rendering verification (code exists, depends on session_report data)
- Teacher Transaction History pagination (code exists with `totalPages >= 1`)

### P1 (Phase C: WebRTC Engine — separate release)
- Resilient Cloud Recording with GCS Signed URLs and media chunking
- UTC Server-Side Timer with 10s WebSocket sync
- WebSocket Heartbeat & Presence (pingInterval/pingTimeout, peer_disconnected)
- WebSocket Activity Push (content library → classroom overlay)

### P2
- WhatsApp notifications integration
- Admin Report Card PDF export
- Blur Background toggle in A/V settings
- SMS notifications
