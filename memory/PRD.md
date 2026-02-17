# Alif Amin Academy - Product Requirements Document

## Original Problem Statement
Build a web-based platform for an online Quran Academy named "Alif Amin Academy". The platform connects students with qualified Quran teachers for 1-on-1 video lessons.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, lucide-react, framer-motion, @tanstack/react-query
- **Backend:** FastAPI (Python), MongoDB (motor)
- **Auth:** JWT Email/Password + Custom Google OAuth 2.0
- **Realtime/Video (Planned):** LiveKit (WebRTC), FastAPI WebSockets
- **Arabic Font:** Amiri (Google Fonts)

## Core Features
- **User Roles:** Student/Parent, Teacher, Super Admin
- **Authentication:** Google OAuth and Email/Password login
- **Dashboards:** Role-based dashboards (Admin, Teacher, Student)
- **Financial System:** Credit-based wallet, tiered commissions, tutor earnings with withdrawal workflow
- **Booking System:** Pop-up modal for booking sessions with auto ClassSession creation
- **Virtual Classroom Module:** Digital Mushaf, real-time sync, student progress tracking

## What's Been Implemented

### UI/UX Redesign (COMPLETE - Feb 2026)
- Full Apple-inspired design system with standardized tokens
- Centralized component library (Card, Button, Badge, Modal, Spinner, DataTable, Input, Select)
- All pages and components refactored (Landing, Auth, Onboarding, Admin/Student/Teacher Dashboards)

### Virtual Classroom Module - Batch 1 (COMPLETE - Feb 2026)
- **Phase 1 (Clean Slate):** Removed old ClassroomTools with inline Mushaf mock
- **Phase 2 (Database Models):** ClassSession, StudentProgress, InteractiveActivity models added
- **Phase 3 (Booking Logic & Calendar Sync):**
  - GET /api/classroom/next-class with is_joinable flag (5-min early join window)
  - Auto ClassSession creation when booking is made (with meet_link_slug UUID)
  - Session CRUD: create, get details, go-live, progress submission, rating
  - Admin session monitoring endpoint
  - Interactive activities CRUD (admin)
- **Phase 4 (Digital Mushaf Engine):**
  - Quran API service using api.quran.com/api/v4 with page-based pagination (1-604)
  - react-query pre-fetching (next 2 pages) for zero-lag page turns
  - DigitalMushaf component with RTL Arabic rendering (Amiri font)
  - Floating glassmorphism Teacher Toolbar (pointer, highlighter, page nav)
  - QuranNavigator drawer (Surah search, Page input, Juz grid)
  - Keyboard navigation (arrow keys)
  - Fullscreen mode

### Existing Features
- Admin Dashboard with real data (KPI trends, charts)
- Student onboarding flow (3-step questionnaire)
- Teacher signup and approval workflow
- Wallet and earnings management
- Booking and cancellation system with credit deductions
- Commission tier system (New/Rated/Elite)

## Bug Fixes
- **P0 Onboarding Redirect Bug (FIXED):** Stale closure in handleAnswer
- **MongoDB ObjectId Serialization (FIXED):** _id removed after insert_one in auth/register

## Mocked Integrations
- Stripe payment processing (backend mock endpoints ready)
- Tutor withdrawal payouts (workflow exists, no real money transfer)
- File storage for teacher profile media

## In Progress: Virtual Classroom Module - Batch 2
- **Phase 5:** WebSocket real-time sync (pointer/page/highlight sync) + LiveKit video
- **Phase 6:** Full classroom UI (split view layout, control bar, chat)

## Upcoming Tasks (P1)
- **Batch 3:** Phase 7 (End Class flow + revenue connection) + Phase 8 (Student dashboard progress, Admin reports)
- Implement real Stripe Payments
- File storage for teacher profiles

## Future Tasks (P2)
- Google Meet API Integration
- Twilio SMS/WhatsApp Notifications
- PDF Report Card Generator

## Key Credentials
- LiveKit: wss://alif-amin-web-app-ubmi3yue.livekit.cloud
- GCS Bucket: alif-amin-recordings
- Admin emails: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
