# Alif Amin Academy - Product Requirements Document

## Original Problem Statement
Build a web-based platform for an online Quran Academy named "Alif Amin Academy". The platform connects students with qualified Quran teachers for 1-on-1 video lessons.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, lucide-react, @tanstack/react-query, livekit-client, @livekit/components-react
- **Backend:** FastAPI (Python), MongoDB (motor), livekit-api, websockets
- **Auth:** JWT Email/Password + Custom Google OAuth 2.0
- **Realtime:** FastAPI WebSockets (pointer/page/highlight/hand/chat/end-class sync)
- **Video:** LiveKit WebRTC (wss://alif-amin-web-app-ubmi3yue.livekit.cloud)
- **Arabic Font:** Amiri (Google Fonts)

## What's Been Implemented

### UI/UX Redesign (COMPLETE)
- Full Apple-inspired design system with standardized tokens
- All pages and components refactored

### Virtual Classroom Module - Batch 1 (COMPLETE)
- Phase 1: Clean slate
- Phase 2: ClassSession, StudentProgress, InteractiveActivity models (Pydantic validated)
- Phase 3: 9 classroom API endpoints + auto ClassSession on booking
- Phase 4: Digital Mushaf Engine (604-page, react-query prefetch, QuranNavigator, Toolbar)

### Virtual Classroom Module - Batch 2 (COMPLETE)
- Phase 5: LiveKit video integration + WebSocket real-time sync (pointer/page/highlight)
- Phase 6: Apple-style classroom UI (75/25 split, glassmorphism, control bar)

### Phase 7: End Class + Revenue (COMPLETE - Feb 2026)
- **Session Report Modal (Teacher):** Mandatory form — Surah select (114 surahs), Ayah range, Track type (Hifz/Murajaah/Nazra), Grading sliders (fluency/tajweed/makhraj 1-10), Teacher notes
- **Revenue Trigger:** On progress submission → session marked completed → wallet deduction → teacher earnings credited (commission-tiered)
- **Rate Teacher Modal (Student):** 5-star rating with gold hover + review textarea → updates teacher cumulative average
- **END_CLASS WebSocket event:** Teacher ends → student receives notification → rating modal auto-shows

### Raise Hand Feature (COMPLETE - Feb 2026)
- Student ControlBar: Raise/Lower Hand button with golden highlight
- WebSocket: RAISE_HAND/LOWER_HAND events broadcast to all participants
- Teacher UI: Floating glassmorphism toast notification, hand count badge in top bar
- Video tiles: Golden glowing border when hand is raised, hand icon next to name
- Both teacher and student can lower hand

### Existing Features
- Admin/Student/Teacher Dashboards, Wallet/credit system, Booking/cancellation
- Commission tiers, Google OAuth + Email/Password auth, Onboarding flow

## Collections
- class_sessions, student_progress, activities, session_ratings, session_payment_records

## In Progress: Phase 8 — Progress Tracker + Admin Monitor
- Student "My Progress Tracker" widget (line chart/progress bars for grading scores)
- Admin Global Session Monitor (live rooms list, "Join Stealth" button, "Stealth Record" toggle)
- Admin session detail view with recording playback

## Upcoming (P1)
- Real Stripe payments, File storage

## Future (P2)
- Google Meet API, Twilio notifications, PDF report cards

## Key Credentials
- LiveKit: wss://alif-amin-web-app-ubmi3yue.livekit.cloud (keys in backend/.env)
- GCS: alif-amin-recordings
- Admin emails: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
