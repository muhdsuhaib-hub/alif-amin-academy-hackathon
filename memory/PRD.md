# Alif Amin Academy — PRD

## Original Problem Statement
Build a premium, enterprise-grade 1-on-1 Quran tutoring platform (EdTech). Features include student/teacher/admin roles, Google OAuth, booking engine, credit wallet, virtual classroom (LiveKit), interactive Quran (Mushaf), and teacher CRM.

## Architecture
- **Frontend:** React 18, Tailwind CSS, Shadcn UI, LiveKit React SDK
- **Backend:** FastAPI, Motor (MongoDB async), Pydantic
- **Database:** MongoDB
- **Real-time:** LiveKit (WebRTC A/V), FastAPI WebSockets (Quran sync)
- **Auth:** Google OAuth (Emergent-managed)
- **External APIs:** Quran.com V4 (proxied), LiveKit Cloud
- **File Storage:** Local uploads (structured for GCS migration)

## Core Requirements
1. Student: Browse teachers, book sessions, manage wallet (credits), track progress
2. Teacher: Manage availability, view students, track earnings, upload credentials
3. Admin: Manage users, approve teachers, view financials, create manual bookings
4. Virtual Classroom: LiveKit video, interactive Quran (word-level), real-time sync
5. Booking Engine: Credit-based, overlap prevention, timezone-aware

## What's Been Implemented

### Batch 1-4: Foundation
- Google OAuth, role-based routing, student/teacher/admin onboarding
- Teacher approval workflow, availability calendar
- Credit wallet system (paid + bonus credits, FIFO deduction)
- Booking engine with overlap prevention
- Admin dashboard (users, financials, calendar, support tickets)

### Batch 5: Functional Repairs
- 5.5: Teacher revenue, availability, profile fixes
- 5.6: Student calendar status, teacher query, profile state fixes
- 5.7: Financial integrity repair (7 regressions), data migration
- 5.8: Virtual Classroom overhaul (Green Room, A/V, control dock)
- 5.8.1: Booking flow rescue (24h time dropdown, strict validation)
- 5.8.2: Timezone fix (local→UTC), Join Class unlocked (today = joinable), Admin booking sync

### Epic 3: Interactive Mushaf & Real-Time Sync (COMPLETE)
- Backend proxy for Quran.com V4 API with MongoDB caching
- KFGQPC Uthmanic Script HAFS font loaded via @font-face
- Word-level interactive DOM (each word = clickable `<span>`)
- WebSocket sync: HIGHLIGHT_WORD, NAVIGATE, CLEAR_HIGHLIGHTS
- Green Room "Test Speaker" (Web Audio API)
- Teacher "Tajweed Highlighter" tool

### Batch 6: Teacher CRM & Profile Uploads (COMPLETE — Feb 20, 2026)

**Epic 1: My Students CRM Page**
- Backend: Aggregates unique students from `class_sessions` + `bookings`
- Returns: name, picture, reading level, total sessions, last session date, progress scores, session notes
- Frontend: Premium table view with search, right-side slide-out drawer
- Drawer: Progress bars (Fluency/Tajweed/Makhraj), session notes with scores

**Epic 2: Teacher Profile Uploads**
- Backend: File upload endpoints for video intro (50MB) and certificates (10MB)
- Static file serving for uploaded media
- Certificate CRUD (upload multiple, delete individual)
- Frontend: Drag-and-drop upload zones with XHR progress bars
- Existing uploads displayed with view/delete actions
- Note: Files stored locally (structured for GCS migration when credentials available)

## Mocked/Placeholder Features
- Stripe payment processing
- Cloud recording (button exists, no API connected)
- Avatar photo upload (toast placeholder)

## Prioritized Backlog

### P0 (Waiting on User UAT)
- Manual UAT of Batch 6 features

### P1 (Next)
- Admin Observer Mode verification (code exists, needs validation)
- GCS migration when credentials provided

### P2 (Future)
- Real Stripe payments
- Cloud recording integration
- Admin Report Card Generator
- SMS/WhatsApp notifications
- Comprehensive Admin UI enhancements
- Blur Background toggle for A/V
