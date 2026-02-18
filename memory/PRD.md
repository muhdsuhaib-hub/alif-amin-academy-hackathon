# Alif Amin Academy - Product Requirements Document

## Original Problem Statement
Build a web-based platform for an online Quran Academy named "Alif Amin Academy". The platform connects students with qualified Quran teachers for 1-on-1 video lessons with a full virtual classroom module.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, lucide-react, @tanstack/react-query, livekit-client, @livekit/components-react, recharts
- **Backend:** FastAPI (Python), MongoDB (motor), livekit-api, websockets
- **Auth:** JWT Email/Password + Custom Google OAuth 2.0
- **Realtime:** FastAPI WebSockets (pointer/page/highlight/hand/chat/end-class sync)
- **Video:** LiveKit WebRTC (wss://alif-amin-web-app-ubmi3yue.livekit.cloud)

## ALL 8 PHASES — COMPLETE

### Phase 1: Clean Slate
- Removed old classroom/WebRTC code, fresh unified architecture

### Phase 2: Database Architecture
- ClassSession, StudentProgress, InteractiveActivity models (Pydantic validated, raw Motor)
- Collections: class_sessions, student_progress, activities, session_ratings, session_payment_records

### Phase 3: Booking Logic & Calendar Sync
- Auto ClassSession creation on booking (with UUID meet_link_slug)
- GET /api/classroom/next-class with is_joinable flag (5-min early join window)
- 9 classroom CRUD endpoints

### Phase 4: Digital Mushaf Engine
- api.quran.com/api/v4 with 604-page Madani pagination
- react-query pre-fetching (next 2 pages), QuranNavigator (Surah/Page/Juz)
- Floating glassmorphism Teacher Toolbar (pointer, highlighter, page nav, fullscreen)

### Phase 5: Real-Time Sync & LiveKit Video
- LiveKit token generation, WebSocket sync (POINTER_MOVE, PAGE_CHANGE, HIGHLIGHT_SYNC, CHAT, RAISE_HAND, LOWER_HAND, END_CLASS)
- Pointer throttled at 50ms, recording toggle with stealth mode

### Phase 6: Apple-Style Classroom UI
- 75/25 split layout (Desktop), stacked (Mobile)
- Glassmorphism toolbar/control bar (backdrop-blur-xl, rounded-3xl)
- VideoStrip with participant tiles, ChatPanel, Recording indicator (visibility-aware)

### Phase 7: End Class & Revenue
- Session Report Modal (mandatory): Surah, Ayah range, Track type, Grading sliders 1-10, Notes
- Revenue trigger: progress → session complete → wallet deduction → teacher earnings
- Rate Teacher Modal: 5-star + review → cumulative average update
- Raise Hand: golden glow border, teacher toast, WS broadcast

### Phase 8: Progress & Monitoring
- Student Progress Tracker: Score trend line chart (recharts), avg scores, recent classes
- Admin Session Monitor: Live sessions list, Stealth Join (muted/no camera/name="System"), Stealth Record (visible=false), Session history table, Detail modal (progress/rating/payment/recording)
- Admin Student Report: GET /api/classroom/admin/reports/student/{id} — aggregated JSON for PDF generation
- Session playback: recording_url accessible in admin detail view

## Bug Fixes (All Sessions)
- MongoDB ObjectId serialization in auth/register
- User role parsing in ClassroomPage
- Pydantic session_id optional for progress
- StudentDashboard wrong API endpoint for student_id

## Mocked Integrations
- Stripe payment processing (backend mock endpoints ready)
- File storage (teacher profile media)
- GCS recording storage (recording_url field exists, no actual upload)

## Upcoming (P1)
- Real Stripe Payments integration
- GCS file upload for recordings/certificates
- PDF Report Card generator

## Future (P2)
- Google Meet API integration
- Twilio SMS/WhatsApp notifications
- Advanced analytics dashboard

## Key Credentials
- LiveKit: wss://alif-amin-web-app-ubmi3yue.livekit.cloud (keys in backend/.env)
- GCS Bucket: alif-amin-recordings
- Admin emails: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
