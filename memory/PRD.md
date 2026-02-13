# Alif Amin Academy - Product Requirements Document

## Overview
Alif Amin Academy is a web-based platform for online Quran learning, connecting students with qualified Quran teachers for 1-on-1 video lessons operating on an 'Academy Model'.

## Core Requirements

### User Roles
1. **Student/Parent** - Learn Quran through personalized 1-on-1 lessons
2. **Teacher** - Teach Quran and manage availability
3. **Super Admin** - Manage platform operations, users, finances

### Tech Stack
- **Frontend**: React, Tailwind CSS, Framer Motion, Recharts, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB with Motor async driver
- **Authentication**: Custom Google OAuth 2.0 + Email/Password with role-based access

---

## Implementation Status

### Completed P0 - Critical
- [x] User authentication (Google OAuth + Email/Password)
- [x] Role-based dashboards (Admin, Teacher, Student)
- [x] Admin access for specific emails
- [x] Credit Wallet System (paid + bonus credits, FIFO deduction, 12-month expiry)
- [x] Tiered Commission Engine (New/Rated/Elite tiers)
- [x] Tutor Earnings Wallet (balance tracking, withdrawal requests, admin approval)
- [x] **Booking System (NEW - Feb 13, 2026)**
  - [x] Fixed-duration bookings: 15 min (1 credit), 30 min (2 credits), 60 min (4 credits)
  - [x] Credit deduction on booking creation (paid credits first, then bonus)
  - [x] Booking cancellation with 24-hour refund policy
  - [x] Booking edit (change date/time, duration, teacher with credit adjustment)
  - [x] Available teachers endpoint
  - [x] Bookings appear in student dashboard and My Schedule
  - [x] Teacher notifications on booking/cancellation

### Completed P1 - High Priority
- [x] Admin Dashboard (user management, financial reports, teacher approvals, withdrawals)
- [x] Notification System (bell component, auto-generation, mark as read)
- [x] Complete Student Dashboard with modular components
- [x] Teacher Dashboard with all features
- [x] **Full StudentDashboard.js Refactoring (COMPLETED Feb 13, 2026)**
  - [x] Main file: 170 lines (from original 1437 lines)
  - [x] Extracted: DashboardHome, MySchedule, AccountPage, BookingModal, CancelBookingDialog, EditBookingModal, WalletPage
- [x] **Hourly Rate Removal (COMPLETED Feb 13, 2026)**
  - [x] Removed hourly_rate from Teacher model, all backend routes, seed data, and notifications
  - [x] Payroll now uses session_payment_records (actual tutor payouts) instead of hourly_rate × hours
  - [x] Payroll table shows Commission Tier instead of Hourly Rate/Hours columns
  - [x] Teacher profile form no longer has hourly rate input
  - [x] BrowseTeachers and BookClass pages updated to show credits instead of RM rates
  - [x] DB migration ran to remove hourly_rate from 7 existing teacher documents
  - [x] Trials Expiring Soon: Shows student names + emails (not IDs), removed Level indicator
  - [x] Revenue Recognition: Removed descriptive subheadings from revenue cards
  - [x] Replaced hardcoded mock chart data with real DB-backed data (user growth, revenue trend, attendance)
  - [x] Replaced hardcoded KPI trend percentages with real calculated trends
  - [x] Added auth protection to subscriptions/overview and revenue/recognition endpoints

### Completed Refactoring
- [x] Commission Service Module (`/app/backend/services/commission_service.py`)
- [x] TeacherDashboard.js refactored (1838 → 249 lines)
- [x] StudentDashboard.js fully refactored (1437 → 170 lines)
- [x] Booking routes extracted to `/app/backend/booking_routes.py`

### P3 - Future Tasks (NOT STARTED)
- [ ] Real Stripe Payment Integration
- [ ] Real Bank Transfer Integration
- [ ] Google Meet API for automatic link generation
- [ ] Email/WhatsApp notifications (SendGrid/Twilio)
- [ ] Digital Mushaf real-time Live Pointer (WebSockets)
- [ ] S3/Cloud storage for teacher videos and certificates
- [ ] PDF Student Report Card generator

---

## Architecture

### Database Collections
- `users`, `teachers`, `students`, `availability_slots`, `bookings`, `lessons`
- `progress`, `progress_logs`, `support_tickets`, `user_sessions`, `notifications`
- `student_wallets`, `wallet_transactions`, `bonus_credit_batches`, `payment_intents`
- `session_payment_records`, `tutor_earnings`, `tutor_earnings_transactions`, `withdrawal_requests`

### Key API Endpoints
- `/api/auth/*` - Authentication
- `/api/booking/create` - Create booking with credit deduction (NEW)
- `/api/booking/my-bookings` - Get student's bookings (NEW)
- `/api/booking/{id}/cancel` - Cancel with 24h policy (NEW)
- `/api/booking/{id}/edit` - Edit booking (NEW)
- `/api/booking/available-teachers` - Get active teachers (NEW)
- `/api/wallet/*` - Wallet operations
- `/api/commission/*` - Commission tier management
- `/api/tutor-earnings/*` - Tutor earnings wallet
- `/api/admin/*` - Admin operations

### File Structure
```
/app/
├── backend/
│   ├── server.py
│   ├── models.py
│   ├── booking_routes.py          # NEW
│   ├── wallet_routes.py
│   ├── commission_routes.py
│   ├── tutor_earnings_routes.py
│   ├── admin_routes.py
│   ├── notification_routes.py
│   └── services/commission_service.py
├── frontend/src/
│   ├── App.js
│   ├── pages/
│   │   ├── StudentDashboard.js    # 170 lines (refactored)
│   │   ├── TeacherDashboard.js    # 249 lines (refactored)
│   │   └── AdminDashboard.js
│   └── components/
│       ├── student/
│       │   ├── DashboardHome.js   # NEW
│       │   ├── MySchedule.js      # NEW
│       │   ├── AccountPage.js     # NEW
│       │   ├── BookingModal.js    # NEW
│       │   ├── CancelBookingDialog.js # NEW
│       │   ├── EditBookingModal.js    # NEW
│       │   ├── WalletPage.js
│       │   └── index.js
│       ├── teacher/ (7 components)
│       └── admin/
```

---

## Booking System Details

### Credit Costs
| Duration | Credits | Base Price (RM) |
|----------|---------|----------------|
| 15 min   | 1       | RM15           |
| 30 min   | 2       | RM27           |
| 60 min   | 4       | RM50           |

### Cancellation Policy
- **24+ hours before class**: Full credit refund to wallet
- **Less than 24 hours**: No refund (confirmation required from student)

### Edit Booking
- Can change: date/time, duration, teacher
- Duration change: credits adjusted automatically (charge more or refund)

---

## Mocked Features
- **Stripe Payment Processing** - topup/confirm works without real Stripe
- **Bank Transfer for Withdrawals** - marks as completed without actual transfer
- **"Join Class" Button** - UI placeholder, no real video conferencing
- **File Storage** - Upload UI only, no cloud storage

## Test Accounts
- **Admin**: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
- **Test Student**: test@example.com / password
- **Teachers**: Holegate, Kedai Kopi Ah Yek, Test Teacher Notif (via Google OAuth)

---

*Last Updated: February 13, 2026*
