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

## Backlog

### P0 (Awaiting UAT)
- Manual UAT of Hotfix 8.4 (Billplz verbose errors, GCS public uploads)

### P1
- WhatsApp notifications integration
- SMTP credentials configuration

### P2
- Cloud recording integration (Start Recording button)
- Admin Report Card PDF export
- Blur Background toggle in A/V settings
- SMS notifications
