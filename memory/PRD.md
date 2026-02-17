# Alif Amin Academy - Product Requirements Document

## Original Problem Statement
Build a web-based platform for an online Quran Academy named "Alif Amin Academy". The platform connects students with qualified Quran teachers for 1-on-1 video lessons.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, lucide-react, @tanstack/react-query, livekit-client, @livekit/components-react
- **Backend:** FastAPI (Python), MongoDB (motor), livekit-api
- **Auth:** JWT Email/Password + Custom Google OAuth 2.0
- **Realtime:** FastAPI WebSockets (pointer/page/highlight sync, chat)
- **Video:** LiveKit WebRTC (wss://alif-amin-web-app-ubmi3yue.livekit.cloud)
- **Arabic Font:** Amiri (Google Fonts)

## What's Been Implemented

### UI/UX Redesign (COMPLETE - Feb 2026)
- Full Apple-inspired design system with standardized tokens
- Centralized component library
- All pages and components refactored

### Virtual Classroom Module - Batch 1 (COMPLETE)
- Phase 1: Clean slate, removed old classroom code
- Phase 2: ClassSession, StudentProgress, InteractiveActivity models (Pydantic validated, Motor raw)
- Phase 3: 9 classroom API endpoints (next-class, CRUD, progress, ratings, admin, activities)
- Phase 4: Digital Mushaf Engine (604-page Madani, react-query prefetch, QuranNavigator, Teacher Toolbar)

### Virtual Classroom Module - Batch 2 (COMPLETE - Feb 2026)
- **Phase 5: Real-Time Sync + LiveKit Video**
  - LiveKit token generation endpoint (POST /api/classroom/livekit/token)
  - WebSocket sync at /api/classroom/ws/{room_id} — events: ROOM_STATE, POINTER_MOVE (50ms throttle), PAGE_CHANGE, HIGHLIGHT_SYNC, NAVIGATE, CHAT
  - Recording toggle endpoint with stealth mode (admin visible:false)
  - Teacher pointer/page/highlight broadcast to student in real-time
- **Phase 6: Apple-Style Classroom UI**
  - 75/25 split layout (desktop): Left = Mushaf Stage, Right = Video Strip
  - Mobile: Video strip stacked on top, Mushaf below
  - Glassmorphism toolbar/control bar (backdrop-blur-xl, rounded-3xl)
  - VideoStrip with participant tiles (LiveKitRoom integration)
  - ControlBar: Mic, Camera, End Class + Recording indicator (blinking red dot, visibility-aware)
  - Chat panel (side panel toggle)
  - QuranNavigator drawer (teacher-only)
  - Full route: /classroom/:sessionId (protected, all roles)
  - Dashboard "Join" buttons now navigate to /classroom/:sessionId

### Existing Features
- Admin Dashboard, Student Dashboard, Teacher Dashboard
- Wallet/credit system, booking/cancellation, commission tiers
- Google OAuth + Email/Password auth, onboarding flow

## Collections Used
- `class_sessions`, `student_progress`, `activities`, `session_ratings`

## Bug Fixes (This Session)
- MongoDB ObjectId serialization in auth/register
- User role parsing in ClassroomPage (/api/auth/me returns flat object, not {user:...})

## Mocked Integrations
- Stripe payment processing
- File storage (teacher profile media)
- Recording file storage (GCS Signed URLs - endpoint exists, no actual upload)

## In Progress: Batch 3 (Phases 7-8)
- Phase 7: "End Class" flow — session report modal, revenue trigger, student rating
- Phase 8: Student progress dashboard, Admin session monitor with stealth recording, PDF reports

## Upcoming (P1)
- Real Stripe payments
- File storage for teacher profiles

## Future (P2)
- Google Meet API, Twilio notifications, PDF report cards

## Key Credentials
- LiveKit: wss://alif-amin-web-app-ubmi3yue.livekit.cloud (API key/secret in backend/.env)
- GCS Bucket: alif-amin-recordings
- Admin emails: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
