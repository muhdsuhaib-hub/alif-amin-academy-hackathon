# Alif Amin Academy - Product Requirements Document

## Original Problem Statement
Build a web-based platform for an online Quran Academy named "Alif Amin Academy". The platform connects students with qualified Quran teachers for 1-on-1 video lessons.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn UI, lucide-react, framer-motion
- **Backend:** FastAPI (Python), MongoDB (motor/beanie)
- **Auth:** JWT Email/Password + Custom Google OAuth 2.0

## Core Features
- **User Roles:** Student/Parent, Teacher, Super Admin
- **Authentication:** Google OAuth and Email/Password login
- **Dashboards:** Role-based dashboards (Admin, Teacher, Student)
- **Financial System:** Credit-based wallet, tiered commissions, tutor earnings with withdrawal workflow
- **Booking System:** Pop-up modal for booking sessions

## What's Been Implemented
- Full Apple-inspired UI/UX redesign (all pages)
- Admin Dashboard with real data (KPI trends, charts, student names)
- Removal of "hourly rate" system (replaced by session costs + commission tiers)
- Student onboarding flow (3-step questionnaire)
- Teacher signup and approval workflow
- Wallet and earnings management
- Booking and cancellation system
- Google OAuth + Email/Password authentication

## Bug Fixes (Feb 2026)
- **P0 Onboarding Redirect Bug (FIXED):** Stale closure in handleAnswer caused handleComplete to use outdated answers state. Fixed by computing updatedAnswers and passing directly. Added loading state and double-click prevention.

## Mocked Integrations
- Stripe payment processing (backend mock endpoints ready)
- Tutor withdrawal payouts (workflow exists, no real money transfer)
- "Join Class" button functionality
- File storage for teacher profile media

## Upcoming Tasks (P1)
- Implement real Stripe Payments
- Real-time classroom features (Live Pen/Pointer via WebSockets)
- File storage for teacher profiles

## Future Tasks (P2)
- Google Meet API Integration
- Twilio SMS/WhatsApp Notifications
- PDF Report Card Generator
