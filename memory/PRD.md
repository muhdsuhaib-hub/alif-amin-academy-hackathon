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

## Key API Endpoints
- `GET /api/students/dashboard-data` — Comprehensive student dashboard
- `GET /api/teacher/dashboard-data` — Teacher dashboard + tier + earnings
- `POST /api/teacher/request-payout` — Submit payout request
- `PUT /api/teacher/update-profile` — Update teacher professional info
- `POST /api/booking/availability/bulk` — Save weekly availability slots
- `GET /api/booking/teacher-students/{id}` — Teacher's student list
- `GET /api/booking/teacher-availability/{id}` — Teacher availability slots
- `POST /api/support` — Create support ticket
- `POST /api/wallet/topup/custom` — Custom credit top-up (RM 15/credit)

## DB Collections
users, students, teachers, bookings, availability_slots, class_sessions, student_progress, student_wallets, wallet_transactions, teacher_wallets, teacher_transactions, payout_requests, notifications, wallet_packages, support_tickets, system_settings

## Backlog
- **P0:** Class Streak tracker (fire icon in header, consecutive days)
- **P1:** Real Stripe payment integration
- **P1:** GCS file uploads (profile pictures, video intro, certificates)
- **P2:** PDF Report Card Generator
- **P2:** SMS/WhatsApp notifications (Twilio)
- **P2:** Final responsive verification pass across all breakpoints

## Mocked Services
- Stripe payment processing (student wallet top-up)
- Teacher payout bank transfers (saved to DB, no actual transfer)
