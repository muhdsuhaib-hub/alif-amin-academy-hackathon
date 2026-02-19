# Alif Amin Academy - Product Requirements Document

## Overview
Online Quran Academy connecting students with qualified teachers for 1-on-1 video lessons.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, react-query, livekit-client, recharts
- **Backend:** FastAPI, motor (async MongoDB), Pydantic, WebSockets, livekit-server-sdk
- **Database:** MongoDB
- **Auth:** JWT-based + Google OAuth
- **Cloud:** Google Cloud Storage, LiveKit

## Design Standard: "Apple-Islamic"
- Background: `bg-slate-50` (off-white, never pure white for pages)
- Glassmorphism: `bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm`
- Primary: `emerald-700/600` | Secondary (Premium): `amber-600/100`
- Typography: `text-slate-900` headings, `text-slate-500` secondary
- Rounding: `rounded-3xl` containers, `rounded-2xl` cards

## Completed Features

### Phases 1-8: Virtual Classroom (Complete)
- LiveKit video/audio, WebSocket sync, Digital Mushaf, progress reporting, admin monitoring

### Batch 4: Student Experience Overhaul (Complete - Feb 18, 2026)
- Steps 0-7: Legacy cleanup, Global Header, Dashboard Home, Booking Wizard, Wallet, Schedule, Account, Progress

### Batch 4 Punch List (Complete - Feb 18, 2026)
- Removed "Settings" from profile dropdown
- Built Contact Support modal + POST /api/support + support_tickets collection
- Added Custom Top-Up (RM 15/credit) in wallet alongside packages

### Batch 5: Teacher Experience Overhaul (Complete - Feb 18, 2026)
- **Step 0:** Legacy cleanup — deleted ClassroomTools.js, TeacherSidebar.js, removed sticky footer
- **Step 1:** Commission tiers updated — New (40%), Rated (35%), Elite (30%), seeded to system_settings
- **Step 2:** Teacher Dashboard Home — Hero (Next Class/Empty), Tier progress widget, Earnings (Gold), Overview stats
- **Step 3:** Availability Manager — Weekly grid, 30-min slots, click-to-toggle (Green/Gray/Red), bulk save
- **Step 4:** Earnings Wallet — Income Digital Credit Card, Request Payout modal (Bank Name/Account/Holder)
- **Step 5:** My Students — Table with Name/Level/Status, detail drawer with scores + past notes
- **Step 6:** Profile Settings — Personal info, specialty tags, bio, credentials upload placeholders

### Batch 5.5: Functional Repairs (Complete - Feb 19, 2026)
- **Fix 1 (P0) Revenue Loop:** Made `credit_tutor_earnings` atomic with MongoDB transaction support (fallback to sequential). Correct flow: Gross Value → Platform Fee deduction → Net Income to teacher wallet + admin_revenue record
- **Fix 2 (P1) Availability Manager:** Fixed booked sessions overlay (changed from student-only `/booking/my-bookings` to role-aware `/bookings`), fixed timezone consistency using local date formatting
- **Fix 3 (P1) Profile Amnesia:** Wired `onUserUpdate` callback from `ProtectedRoute` → `TeacherDashboard` → `ProfileManagement`, backend now returns updated documents on profile save
- **Fix 4 (P0) Platform Fee Logic:** Verified and confirmed correct pricing (15min=RM15, 30min=RM30, 60min=RM60) and tier thresholds (New <20 sessions=40%, Rated >=20+4.5★=35%, Elite >=100+4.7★=30%)

### Batch 5.6: Student Logic & UX Repair (Complete - Feb 19, 2026)
- **Fix 1 (P0) Calendar Status:** Dynamic status in ScheduleCard — Completed (green), Missed (red/gray for past scheduled), Upcoming (blue for future). Calendar dots match.
- **Fix 2 (P0) Booking Availability:** `GET /api/booking/available-teachers` now requires `date` + `time` params. Performs strict intersection on `availability_slots`. Empty list if no teacher has that slot. No fallback to "show all."
- **Fix 3 (P1) Teacher Quick View:** Eye icon in booking Step 2 opens glassmorphism Teacher Card modal with bio, video intro (hidden if empty), specialties, tier badge, and "Select This Teacher" button. No navigation away from booking flow.
- **Fix 4 (P1) Student Profile State & Phone:** `onUserUpdate` wired through `ProtectedRoute` → `StudentDashboard` → `AccountPage`. Phone input replaced with `react-phone-input-2` (default: Malaysia +60, flags, auto-format).

### Batch 5.7: Financial & Data Integrity Repair (Complete - Feb 19, 2026)
- **Fix 1 (P0) Financial Math:** Executed DB migration script — corrected base_session_price from 27→30, wallet from RM 16.20→RM 18.00 (30min, 40% fee). Formula: Gross = Credits * RM 15, Net = Gross * (1 - fee%)
- **Fix 2 (P0) Financial Snapshot Widget:** Premium glassmorphism "Financial Snapshot" card — Net Income in text-3xl bold emerald, Gross in muted text-sm. Removed redundant "classes" count
- **Fix 3 (P0) Name Synchronization:** Transactions endpoint resolves live student names via `student_id` $lookup on users collection. Stored `student_id` + `duration_minutes` in every future transaction
- **Fix 4 (P1) Progress & Stats:** Migration fixed `total_classes=1` for active teacher. TierWidget shows "Progress to Rated Tutor (1/20)". StatsWidget reads real `rating` from DB
- **Fix 5 (P2) Earnings History:** Format: "[Student Name] - [Duration] min session" + "+ RM X.XX". Pagination: 10 items per page with Previous/Next controls
- **Fix 6 (P2) Payout Validation:** Max validator against wallet balance. Red "Insufficient funds" error when amount exceeds balance. Submit disabled when invalid
- **Fix 7 (P2) Teacher Phone Input:** Replaced with `react-phone-input-2` (Malaysia +60 default, flags, auto-formatting)

### Batch 5.8 Epic 4+2: Virtual Classroom Overhaul (Complete - Feb 19, 2026)
- **Epic 4 (P0) A/V Core & Green Room:**
  - Pre-Call Lobby (Green Room): Camera preview, mic level meter (bouncing green bars via Web Audio API), device selection, mandatory "Join Now" button (bypasses browser autoplay)
  - Zero Audio Fix: Added `RoomAudioRenderer` inside LiveKitRoom (was completely missing)
  - A/V Settings Modal: Camera/Mic/Speaker device selection via gear icon
  - Network Quality Indicators: ConnectionBadge on video tiles (signal bars)
  - Recording Placeholder: Toast "Recording initialized" for teachers
- **Epic 2 (P0) Premium EdTech Layout:**
  - Centralized Control Dock: Floating glassmorphism bottom bar (Mic, Camera, Settings, Raise Hand, Quran Nav, Chat, Record, End Class)
  - Desktop: Dark theme, Quran maximized center stage, video tiles stacked in 20% right sidebar
  - Chat as slide-out drawer: Video tiles compress (never hidden), chat overlays on mobile
  - Mobile-First: Video row pinned top, Quran fills viewport, icon-only dock bottom
- **Epic 1 (P0) Admin Observer Mode:**
  - Pre-join modal: "Join as Observer" (invisible, A/V blocked) or "Join as Participant"
  - Observer filtered from video grid, banner shows "invisible to participants"
  - End Class routes admin to `/admin/dashboard` (not logout)

## Key API Endpoints
- `GET /api/students/dashboard-data` — Comprehensive student dashboard
- `GET /api/teacher/dashboard-data` — Teacher dashboard + tier + earnings
- `POST /api/teacher/request-payout` — Submit payout request
- `PUT /api/teacher/update-profile` — Update teacher professional info (returns updated teacher doc)
- `PUT /api/auth/update-profile` — Update user info incl. gender (returns updated user doc)
- `POST /api/booking/availability/bulk` — Save weekly availability slots
- `GET /api/booking/teacher-students/{id}` — Teacher's student list
- `GET /api/booking/teacher-availability/{id}` — Teacher availability slots
- `POST /api/support` — Create support ticket
- `POST /api/wallet/topup/custom` — Custom credit top-up (RM 15/credit)
- `GET /api/booking/available-teachers?date=&time=` — Strict availability-filtered teacher list
- `GET /api/bookings` — Role-aware bookings (teacher sees their bookings)

## Commission System
- **New Tutor (40%):** < 20 completed sessions
- **Rated Tutor (35%):** >= 20 sessions AND >= 4.5 avg rating
- **Elite Tutor (30%):** >= 100 sessions AND >= 4.7 avg rating
- **Downgrade threshold:** Rating drops below 4.3 → back to New
- **Session Pricing:** 1 Credit = RM 15 (15min=RM15, 30min=RM30, 60min=RM60)
- **Revenue flow (atomic):** Student wallet deduction → Session payment record → Teacher earnings credit + Admin revenue record + Transaction history

## DB Collections
users, students, teachers, bookings, availability_slots, class_sessions, student_progress, student_wallets, wallet_transactions, tutor_earnings, tutor_earnings_transactions, admin_revenue, session_payment_records, withdrawal_requests, notifications, wallet_packages, support_tickets, system_settings

## Upcoming Tasks (P0/P1)
- **Batch 5.8 Epic 1:** Admin Observer Mode routing refinement (most logic already implemented)
- **Batch 5.8 Epic 3:** Interactive Mushaf (Quran.com V4 API, word-level DOM, Tajweed highlight, Surah navigation fix)
- **My Students Page:** Build teacher UI to list students and view past session notes/performance
- **Teacher Profile Uploads:** GCS uploads for video introductions and PDF/Image certificates
- **Final Responsive Verification:** Mobile-perfect for both Student and Teacher platforms

## Backlog (P2)
- Real Stripe payment integration
- Admin Report Card Generator
- SMS/WhatsApp notifications (Twilio)
- Admin UI for support tickets, revenue, and system settings

## Mocked Services
- Stripe payment processing (student wallet top-up)
- Teacher payout bank transfers (saved to DB, no actual transfer)
