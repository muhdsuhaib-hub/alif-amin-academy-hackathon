# Alif Amin Academy - Product Requirements Document

## Overview
Online Quran Academy platform connecting students with qualified teachers for 1-on-1 video lessons.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, react-query, livekit-client, recharts
- **Backend:** FastAPI, motor (async MongoDB), Pydantic, WebSockets, livekit-server-sdk
- **Database:** MongoDB
- **Auth:** JWT-based + Google OAuth
- **Cloud:** Google Cloud Storage (recordings), LiveKit (video)

## Design Standard
"Apple-Islamic" aesthetic:
- Background: `bg-slate-50` (never pure white for page bg)
- Glassmorphism: `bg-white/70 backdrop-blur-xl border border-white/20 shadow-sm`
- Primary: `emerald-700 / emerald-600`
- Secondary (Premium): `amber-600 / amber-100`
- Typography: `text-slate-900` headings, `text-slate-500` secondary
- Rounding: `rounded-3xl` containers, `rounded-2xl` internal cards

## Core Architecture
```
/app/backend/       - FastAPI with motor, Pydantic models
/app/frontend/src/  - React with Tailwind + Shadcn UI
  components/layout/ - LayoutShell (sidebar + header)
  components/student/ - Dashboard, Booking, Wallet, Schedule, Account, Progress
  pages/            - Route-level pages
```

## Key DB Collections
- `users`, `students`, `teachers`, `bookings`, `availability_slots`
- `class_sessions`, `student_progress`, `student_wallets`, `wallet_transactions`
- `notifications`, `wallet_packages`

## Completed Features

### Phase 1-8: Virtual Classroom (Complete)
- LiveKit video/audio integration
- WebSocket real-time sync (pointer, page turns, highlights, raise hand)
- Digital Mushaf with page navigation
- Session progress reporting and teacher revenue calculation
- Admin monitoring dashboard
- GCS recording storage

### Batch 4: Student Experience Overhaul (Complete - Feb 18, 2026)
- **Step 0:** Legacy Google Meet cleanup - all `meet_link` references removed
- **Step 1:** Global Header with Shadcn DropdownMenu profile dropdown, smart notification bell with navigation links
- **Step 2:** Dashboard Home redesign - Smart Hero (countdown/booking prompt), Progress/Wallet/QuickBook widgets
- **Step 3:** Booking Modal 3-step wizard (Configure -> Teacher Selection -> Review & Confirm)
- **Step 4:** Wallet page - Digital Credit Card UI, paginated transaction history, top-up modal with packages
- **Step 5:** Schedule page - Interactive calendar bound to live booking data, session list with join/cancel actions
- **Step 6:** Account Settings - Profile form (name, phone, timezone), password change section
- **Step 7:** Progress Tracker - Score summary cards, trend chart, recent classes list

## API Endpoints
- `POST /api/sessions/create` - Create class session from booking
- `GET /api/sessions/token/{room_name}` - LiveKit access token
- `WS /api/ws/classroom/{session_id}` - Real-time classroom events
- `POST /api/sessions/progress` - Submit student progress
- `GET /api/students/dashboard-data` - Comprehensive dashboard data
- `PUT /api/auth/update-profile` - Update user profile fields
- `GET /api/wallet/balance` - Student wallet balance
- `GET /api/wallet/transactions` - Transaction history
- `POST /api/booking/create` - Create booking

## Backlog
- **P0:** Final responsive verification pass (Step 7)
- **P1:** Real Stripe payment integration (replace mocked flow)
- **P2:** PDF Report Card Generator
- **P2:** SMS/WhatsApp notifications (Twilio)
- **P2:** GCS profile picture upload in Account settings

## Credentials
- Admin: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
- LiveKit: Environment variables (LIVEKIT_URL, LIVEKIT_API_KEY)
- GCS: /app/backend/credentials/gcs-key.json

## Mocked Services
- Stripe payment processing (wallet top-up flow)
