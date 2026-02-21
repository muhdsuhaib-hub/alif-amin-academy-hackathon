# Alif Amin Academy — PRD

## Original Problem Statement
Build a premium, enterprise-grade 1-on-1 Quran tutoring platform (EdTech). Features include student/teacher/admin roles, Google OAuth, booking engine, credit wallet, virtual classroom (LiveKit), interactive Quran (Mushaf), teacher CRM, and world-class admin dashboard.

## Architecture
- **Frontend:** React 18, Tailwind CSS, Shadcn UI, LiveKit React SDK
- **Backend:** FastAPI, Motor (MongoDB async), Pydantic
- **Database:** MongoDB
- **Real-time:** LiveKit (WebRTC A/V), FastAPI WebSockets (Quran sync)
- **Auth:** Google OAuth (Emergent-managed)
- **External APIs:** Quran.com V4 (proxied), LiveKit Cloud
- **File Storage:** Local uploads (structured for GCS migration)

## What's Been Implemented

### Foundation (Batches 1-5)
- Google OAuth, role-based routing, onboarding
- Teacher approval workflow, availability calendar
- Credit wallet (FIFO), booking engine with overlap prevention
- Admin dashboard, commission tiers, financial tracking
- Multiple hotfix batches for data integrity, timezone, booking flow

### Epic 3: Interactive Mushaf & Real-Time Sync (COMPLETE)
- Backend proxy for Quran.com V4 API with caching
- KFGQPC Uthmanic font, word-level interactive DOM
- WebSocket sync: HIGHLIGHT_WORD, NAVIGATE, CLEAR_HIGHLIGHTS
- Green Room "Test Speaker", Teacher Tajweed Highlighter

### Hotfix 5.8.2: Timezone & Access Rescue (COMPLETE)
- Fixed UTC+8 timezone bug (local time → UTC conversion)
- Unlocked "Join Class" button for today's classes
- Fixed admin ghost bookings (class_sessions creation)

### Batch 6: Teacher CRM & Profile Uploads (COMPLETE)
- My Students CRM page with table view + right-side drawer
- Teacher profile uploads (video intro 50MB + certificates 10MB)
- Drag-and-drop upload zones with XHR progress bars

### Batch 7: World-Class Admin UI & God-Mode Tools (COMPLETE — Feb 20, 2026)

**Patch 1: Student View of Teacher Media**
- Added `playsInline` to video player in BookingModal
- Added certificates display with clickable links

**Epic 1: Responsive Shell & Navigation**
- Fixed LayoutShell with `h-screen overflow-y-auto` for proper scrolling
- Mobile sidebar already implemented (hamburger menu)
- All data tables wrapped in `overflow-x-auto`

**Epic 2: Command Center Overview**
- Responsive KPI cards (grid-cols-2 → lg:grid-cols-4) — all clickable
- Replaced useless charts with "Today's Live Sessions" list with real names
- Financial snapshot showing Deferred Revenue, Recognized Revenue, Tutor Payable
- Commission tier distribution with evaluation trigger

**Epic 3: God-Mode User Management**
- Paginated user table with Role & Status filters + search
- Action menu per user: Login As (impersonation), Edit, Suspend/Activate
- Impersonation: saves admin token, creates target session, floating red "Return to Admin" banner
- Edit modal with wallet adjustment (add/deduct credits with reason)
- Global ImpersonationBanner in App.js (shows on all pages)

**Epic 4: Financial Data Integrity & Finance Dashboard**
- Separated: Deferred Revenue (Liability), Recognized Revenue (Profit), Tutor Payable
- Session Economics breakdown with real database aggregation
- Wallet Liability table with credits/monetary breakdown
- All figures from real MongoDB queries (not mocked)

**Epic 5: Content Library Manager**
- CRUD for learning_activities collection
- Fields: Title, Type (Quiz/Flashcard/Tajweed Match), JSON Payload, Description
- Admin UI with create/edit modal and delete with confirmation

**Epic 6: Admin Settings**
- Settings page for Billplz, GCS, WhatsApp API keys
- Keys masked after saving (first 4 + last 4 chars visible)
- Security notice banner
- Stored in admin_settings MongoDB collection

## Mocked/Placeholder Features
- Stripe payment processing
- Cloud recording (button exists, no API)
- Avatar photo upload

## Backlog

### P0 (Awaiting User UAT)
- Manual UAT of Batch 7 (Admin Dashboard overhaul)

### P1 (Next)
- GCS migration when credentials provided
- Real Billplz payment integration
- WhatsApp notifications

### P2 (Future)
- Cloud recording integration
- Admin Report Card Generator (PDF export)
- Blur Background toggle for A/V
- SMS notifications
