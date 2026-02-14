# Alif Amin Academy - Product Requirements Document

## Overview
**Platform:** Online Quran Academy - 1-on-1 video lessons connecting students with qualified Quran teachers.

**Tech Stack:** React + Tailwind CSS + Shadcn UI (Frontend) | FastAPI + MongoDB (Backend)

**User Roles:** Student/Parent, Teacher, Super Admin

## Authentication
- [x] JWT-based Email/Password login
- [x] Google OAuth 2.0 (with x-forwarded-host fix for ingress)
- [x] Role-based routing (Student, Teacher, Admin dashboards)

## Completed Features

### Core Infrastructure
- [x] Full auth system (login, register, Google OAuth, sessions)
- [x] Role-based dashboards with sidebar navigation
- [x] Notification system (bell, auto-generation, mark as read)

### Student Features
- [x] Student Dashboard (home, schedule, wallet, account tabs)
- [x] Booking System (create, edit, cancel with 24hr refund policy)
- [x] Credit-based wallet with top-up packages
- [x] Browse teachers and book classes

### Teacher Features
- [x] Teacher Dashboard (overview, availability, classroom, students, earnings, profile)
- [x] Teacher registration with admin approval workflow
- [x] Commission-based earnings wallet with withdrawal workflow
- [x] Tiered commission system (New 30%, Rated 25%, Elite 20%)

### Admin Features
- [x] Admin Dashboard with tab navigation (Overview, Approvals, Users, Bookings, Withdrawals, Subscriptions, Finance, Support)
- [x] Real-time KPI stats with trend percentages from DB
- [x] Chart data (user growth, revenue trend, attendance) from real DB queries
- [x] Trial students show names/emails (not IDs)
- [x] Revenue recognition without subheading descriptions
- [x] Auth protection on all admin endpoints
- [x] Teacher payroll uses session_payment_records (not hourly_rate)
- [x] Commission tier display in payroll table

### Hourly Rate Removal (Feb 13, 2026)
- [x] Removed from Teacher model, all backend routes, seed data, notifications
- [x] Platform uses fixed credit-based pricing (RM15/credit)
- [x] DB migration removed hourly_rate from existing teacher documents

### Apple-Inspired UI/UX Redesign (Feb 14, 2026)
- [x] Inter font system (replacing Cal Sans / Great Kingdom)
- [x] Glassmorphism navigation (backdrop-blur-xl on navbars, sidebars, modals)
- [x] Apple-card component system (subtle shadows, rounded-2xl, hover elevation)
- [x] Pill-shaped buttons with active:scale animation
- [x] Soft neutral color palette (FBFBFD background, gray-200 borders)
- [x] Stagger children animations for cards
- [x] Mobile bottom tab navigation for Student and Teacher dashboards
- [x] Clean segmented control tab navigation for Admin Dashboard
- [x] Glassmorphism notification dropdown
- [x] Redesigned Auth page with split layout
- [x] Redesigned Landing page with minimal Apple aesthetic
- [x] Updated Onboarding flow with clean option cards
- [x] All existing functionality preserved (verified 100% backend + frontend tests)

## Upcoming Tasks (P1)
- Implement real Stripe Payments (replace mocked wallet logic)
- Real-time Classroom Features (Live Pen/Pointer for Digital Mushaf)
- File Storage (teacher profile videos, verification certificates)

## Future Tasks (P2)
- Google Meet API Integration (auto-generate class links)
- Notifications (Twilio SMS/WhatsApp)
- PDF Report Card Generator

## Mocked/Placeholder Features
- Stripe payment processing (mock endpoints exist)
- Tutor withdrawal payouts (workflow exists, no real transfer)
- "Join Class" button (no video integration yet)
- File storage for teacher media

## Key API Endpoints
- `POST /api/auth/login` - Email/password login
- `GET /api/auth/google/login` - Google OAuth flow
- `POST /api/booking/create` - Create session (deducts credits)
- `PUT /api/booking/edit/{id}` - Edit session (adjusts credits)
- `DELETE /api/booking/cancel/{id}` - Cancel (24hr refund rule)
- `GET /api/admin/stats` - Dashboard stats with trends + charts
- `GET /api/admin/revenue/recognition` - Revenue accounting
- `GET /api/admin/finance/payroll` - Teacher payroll

## Design System
- **Font:** Inter (300-700 weights)
- **Primary:** #0F3D2E (deep green)
- **Accent:** #C8A951 (gold)
- **Background:** #FBFBFD
- **Cards:** apple-card (bg-white rounded-2xl shadow-apple)
- **Buttons:** apple-btn-primary (rounded-full, active:scale-[0.97])
- **Glass:** backdrop-blur-xl + bg-white/70-80 + border-gray-200/60
