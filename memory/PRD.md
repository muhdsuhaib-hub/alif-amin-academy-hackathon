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

### ✅ P0 - Critical (COMPLETED)
- [x] User authentication via Custom Google OAuth 2.0
- [x] **Email/Password Authentication**
  - [x] Email registration with password
  - [x] Email login with password
  - [x] Email existence check API
  - [x] Password hashing with bcrypt
- [x] Role-based redirections (Admin → /admin/dashboard, Student → /student/dashboard, Teacher → /teacher/dashboard)
- [x] **Profile Registration for New Students**
  - [x] After onboarding, redirects to profile form
  - [x] Collects: Full Name, Email, Phone (with country code), Password
  - [x] Phone number is mandatory with country code dropdown (170+ countries)
  - [x] Phone input only allows numbers (no spaces/dashes)
  - [x] Reading level stored in student profile from onboarding
- [x] Onboarding flow for new users
- [x] Admin access for specific emails (muhdsuhaib@gmail.com, hello.alifamin@gmail.com)
- [x] Admin Dashboard UI with functional backend connections
- [x] **Credit Wallet System (Updated Feb 13, 2026)**
  - [x] Credit-based payment system (1 credit = 15 mins)
  - [x] **Top-up packages with Marketing Bonus Credits:**
    - RM100 → 9 credits (8 paid + 1 bonus)
    - RM300 → 27 credits (24 paid + 3 bonus)
    - RM500 → 46 credits (40 paid + 6 bonus)
  - [x] **Separate Paid and Bonus Credits tracking**
    - Paid credits represent real money purchased
    - Bonus credits are marketing incentives
  - [x] **Credit Deduction Rules:**
    - Deduct paid credits first, then bonus credits
    - Track deduction type in transaction history (topup_paid, topup_bonus, session_deduction)
  - [x] **Commission Calculation from Base Session Price:**
    - 15 min = RM15
    - 30 min = RM27
    - 60 min = RM50
    - Ignores effective per-credit value for tutor payout
  - [x] **Bonus Credit Expiry (12 months)**
    - Bonus credits tracked in batches with expiry dates
    - FIFO deduction from oldest batches first
    - Admin endpoint to run expiry job
  - [x] Wallet balance tracking with transaction history
  - [x] Server-side credit deduction validation
  - [x] Stripe-compatible payment structure with webhooks (MOCKED)
  - [x] Prevent negative balance
  - [x] **Credit Liability Tracking (Admin Dashboard)**
    - Total paid credits outstanding
    - Total bonus credits outstanding
    - Estimated tutor payout exposure (credits × RM15 × 80%)
    - Platform commission potential (credits × RM15 × 20%)
    - Total top-up revenue collected
    - Historical usage (sessions completed, payouts made)
  - [x] **Revenue Recognition Tracking (Admin Dashboard)**
    - Cash collected (from student top-ups)
    - Platform commission earned (only from COMPLETED sessions)
    - Tutor payable amount (paid vs pending breakdown)
    - Deferred revenue calculation (cash collected - revenue recognized)
    - Accounting summary (gross revenue, net platform revenue, marketing cost)
    - Revenue recognition policy notice
    - Last 30 days comparison data
  - [x] **Tiered Commission Engine**
    - Level 1 (New Tutor): 30% platform commission (default)
    - Level 2 (Rated Tutor): 25% commission (4.5+ rating, 20+ reviews)
    - Level 3 (Elite Tutor): 20% commission (100+ sessions, 4.7+ rating)
    - Downgrade rule: If rating < 4.3 → revert to 30%
    - Server-side commission calculation (prevents manipulation)
    - Monthly tier evaluation job
    - Tier badges displayed on Teacher Dashboard (New/Rated/Elite)
    - Admin Dashboard shows Commission Tier Summary with distribution
    - Tier history tracking for audit
- [x] **Tutor Earnings Wallet System (NEW - Feb 13, 2026)**
  - [x] **Balance Tracking:**
    - Total earnings (lifetime, after commission)
    - Pending earnings (from recent sessions)
    - Withdrawable balance (available for withdrawal)
    - Pending withdrawal (amount in pending requests)
    - Total withdrawn (lifetime withdrawn)
  - [x] **Withdrawal Request System:**
    - Bank selection (Maybank, CIMB, RHB, Public Bank, PayPal, Wise)
    - Account number and holder name
    - Minimum/maximum validation
    - Duplicate pending request prevention
  - [x] **Admin Approval Workflow:**
    - View pending withdrawal requests with tutor info
    - Approve (mark as paid) or Reject with reason
    - Admin notes for internal tracking
    - Withdrawal history with status filter
  - [x] **Payout History:**
    - Transaction history for tutors (earnings, withdrawals)
    - Withdrawal history with status tracking
  - [x] **Commission Pre-deducted:**
    - Commission deducted before earnings credited to wallet
    - Uses dynamic tier-based commission rates
  - [x] **Admin Commission Tracking:**
    - Total platform commission earned
    - Outstanding tutor balance
    - Pending vs completed withdrawals

### ✅ P1 - High Priority (COMPLETED)
- [x] Admin Dashboard functionality
  - [x] User Management (CRUD operations, search, filter by role/status/date)
  - [x] **User Export to CSV/Excel** - All profile fields included
  - [x] Master Calendar (view bookings, manual booking creation)
  - [x] Financial Reports (revenue, MRR, payroll)
  - [x] Support Tickets (create, update status)
  - [x] Subscription Management (pause, resume, cancel, extend trial)
  - [x] **Credit Liability Tracker Widget** - Financial exposure reporting
  - [x] **Withdrawals Management Tab** - View/approve/reject tutor withdrawals
- [x] **Notification System for All Platforms**
  - [x] Notification Bell component in Student/Teacher/Admin dashboards
  - [x] Automatic notifications generated based on user role
  - [x] Mark as read (individual and all)
  - [x] Unread count badge on bell icon
- [x] **Complete Student Dashboard Redesign**
  - [x] Modern, responsive layout with collapsible sidebar
  - [x] Main dashboard with Next Class widget, Quick Book, Recent History
  - [x] My Schedule page with monthly calendar and agenda view
  - [x] **Wallet Page with Paid/Bonus Credit Display**
    - [x] Total credits with paid/bonus breakdown
    - [x] Top-up packages showing paid + bonus credits
    - [x] Transaction history with transaction type indicators
    - [x] "Expires in 12 months" info for bonus credits

### ✅ P2 - Medium Priority (COMPLETED)
- [x] Teacher Portal: Schedule Management
  - [x] View today's classes
  - [x] Add availability slots (date, time, recurring option)
  - [x] View existing availability with booking status
- [x] Student Portal: Interactive Booking
  - [x] Browse teachers with profiles and ratings
  - [x] View teacher availability
  - [x] Book classes (trial or paid)
- [x] Classroom: Join Class button
  - [x] Google Meet link displayed for upcoming classes
  - [x] Visual indication when class is joinable
- [x] **Teacher Signup Flow**
  - [x] Selecting "Teacher" in onboarding redirects to `/teacher-signup`
  - [x] Teacher signup page with Google login
  - [x] Teacher profile created with pending approval status
  - [x] Pending approval banner in teacher dashboard
  - [x] Dashboard hides stats/tabs until approved
- [x] **Admin Teacher Approvals**
  - [x] "Approvals" tab in Admin Dashboard
  - [x] List pending teachers with approve/reject buttons
  - [x] Approve sets is_active=true and approval_status='approved'
  - [x] Reject reverts user role and sets rejection reason
- [x] **Comprehensive Teacher Dashboard**
  - [x] Header with Online/Offline status toggle and notifications
  - [x] Metric cards: Total Earnings (with Withdraw), Active Students, Classes Today, Rating
  - [x] Student Reading Tracker with expandable Quick Log form
  - [x] Quick Log: Surah/Book, Ayat/Page range, Fluency Rating, Tajweed Comments
  - [x] Today's Schedule sidebar with Edit Availability modal
  - [x] This Month stats summary
  - [x] Fixed footer with "Enter Live Classroom" CTA
- [x] **Teacher Platform Sidebar Navigation**
  - [x] Sidebar with Dashboard, Earnings Wallet, Availability, Classroom Tools, Student Management, Profile
  - [x] **Earnings Wallet (UPDATED - Connected to Backend)**: 
    - [x] Real-time balance from backend API
    - [x] Withdrawable balance, pending withdrawal, total withdrawn stats
    - [x] Commission tier display with progress to next tier
    - [x] Withdrawal request form with bank details
    - [x] Transaction history from backend
    - [x] Withdrawal history with status
  - [x] **Availability Calendar**: Date range selection, time slots, auto timezone converter, quick time slot presets
  - [x] **Classroom Tools**: Digital Mushaf with Uthmani script (604 pages, 114 surahs, 30 juz), Live pointer, Lesson Notes per student
  - [x] **Student Management**: Active/Warning/Inactive stats, Student List table with Full Name, Email, Reading Level columns, Last lesson indicator, Send Reminder button, Report Card PDF generator
  - [x] **Profile Management**: Editable bio, hourly rate, Google Meet link, specialties tags, Video intro upload, Ijazah/Certificate upload

### 🔜 P3 - Future Tasks (NOT STARTED)
- [ ] **Real Stripe Payment Integration** - Replace mocked payment confirmation
- [ ] **Real Bank Transfer Integration** - Replace mocked withdrawal approval
- [ ] **Connect Booking to Wallet** - Deduct credits on class completion
- [ ] **Integrations**
  - [ ] Billplz/PayPal payment integration for teacher withdrawals
  - [ ] Google Meet API for automatic link generation
  - [ ] Email notifications (SendGrid/Resend)
  - [ ] WhatsApp notifications (Twilio)
- [ ] **Digital Mushaf Enhancements**
  - [ ] Real-time Live Pointer (WebSockets)
  - [ ] Teacher annotations capability
- [ ] **File Storage**
  - [ ] S3/Cloud storage for teacher videos and certificates
- [ ] **PDF Reports**
  - [ ] Student Report Card PDF generator
  - [ ] Visual Surah progress bar
  - [ ] Milestone achievements
- [ ] **Code Refactoring**
  - [ ] Break down TeacherDashboard.js (900+ lines) into smaller components
  - [ ] Break down StudentDashboard.js (1400+ lines) into smaller components

---

## Architecture

### Database Collections
- `users` - User accounts with roles
- `teachers` - Teacher profiles with rates, specializations, commission tier
- `students` - Student profiles with subscription status
- `availability_slots` - Teacher availability
- `bookings` - Class bookings
- `lessons` - Completed lesson records
- `progress` - Student progress tracking
- `progress_logs` - Teacher notes on student progress
- `support_tickets` - Support requests
- `user_sessions` - Authentication sessions
- `notifications` - User notifications
- `student_wallets` - Student credit wallets (paid_credits, bonus_credits)
- `wallet_transactions` - Wallet transaction history
- `bonus_credit_batches` - Bonus credit batches with expiry dates
- `payment_intents` - Payment intent records
- `session_payment_records` - Session payment/commission tracking
- `tutor_earnings` - Tutor earnings wallet (NEW)
- `tutor_earnings_transactions` - Tutor earnings transaction history (NEW)
- `withdrawal_requests` - Tutor withdrawal requests (NEW)

### Key API Endpoints
- `/api/auth/*` - Authentication (register, login, session-data, me, logout, complete-onboarding)
- `/api/auth/google/callback` - Custom Google OAuth callback
- `/api/teachers/*` - Teacher operations and availability
- `/api/bookings` - Booking management
- `/api/students/dashboard` - Student dashboard data
- `/api/admin/*` - Admin operations (users, stats, finance, support, teacher approvals)
- `/api/notifications/*` - Notification management and generation
- `/api/wallet/*` - Wallet operations (balance, packages, topup, transactions, deduct, bonus-credits)
- `/api/commission/*` - Commission tier management
- `/api/tutor-earnings/*` - Tutor earnings wallet operations (NEW)
  - `GET /balance` - Get tutor balance
  - `GET /transactions` - Get transaction history
  - `POST /withdraw` - Create withdrawal request
  - `GET /withdrawals` - Get withdrawal history
  - `GET /admin/pending-withdrawals` - Admin: pending requests
  - `GET /admin/commission-earned` - Admin: commission stats
  - `POST /admin/withdrawals/{id}/process` - Admin: approve/reject

---

## File Structure
```
/app/
├── backend/
│   ├── server.py              # Main FastAPI app
│   ├── models.py              # Pydantic models (User, StudentWallet, TutorEarnings, etc.)
│   ├── admin_routes.py        # Admin API endpoints
│   ├── notification_routes.py # Notification API endpoints
│   ├── wallet_routes.py       # Student wallet API endpoints
│   ├── commission_routes.py   # Commission tier API endpoints (uses service module)
│   ├── tutor_earnings_routes.py # Tutor earnings wallet API endpoints
│   ├── services/              # Modular service layer (NEW)
│   │   ├── __init__.py
│   │   └── commission_service.py  # Standalone commission calculation service
│   └── tests/
│       ├── test_notifications_and_admin.py
│       ├── test_wallet_system.py
│       └── test_tutor_earnings.py
├── frontend/
│   └── src/
│       ├── App.js             # Main routing
│       ├── pages/             # Page components (refactored to smaller files)
│       │   ├── Landing.js
│       │   ├── Onboarding.js
│       │   ├── Auth.js
│       │   ├── StudentDashboard.js  # ~1000 lines (reduced from 1437)
│       │   ├── TeacherDashboard.js  # ~250 lines (reduced from 1838)
│       │   ├── AdminDashboard.js
│       │   ├── BrowseTeachers.js
│       │   └── BookClass.js
│       └── components/
│           ├── NotificationBell.js
│           ├── teacher/       # Teacher dashboard components (NEW)
│           │   ├── index.js
│           │   ├── TeacherSidebar.js
│           │   ├── EarningsWallet.js
│           │   ├── AvailabilityCalendar.js
│           │   ├── ClassroomTools.js
│           │   ├── StudentManagement.js
│           │   ├── ProfileManagement.js
│           │   └── DashboardOverview.js
│           ├── student/       # Student dashboard components (NEW)
│           │   ├── index.js
│           │   ├── StudentSidebar.js
│           │   ├── StudentHeader.js
│           │   └── WalletPage.js
│           └── admin/
│               ├── UserManagement.js
│               ├── TeacherApprovals.js
│               ├── WithdrawalManagement.js
│               └── ...
└── memory/
    └── PRD.md
```

---

## Wallet System Details

### Top-up Packages (Updated Feb 13, 2026)
| Top Up | Paid Credits | Bonus | Total Credits |
|--------|-------------|-------|---------------|
| RM100  | 8           | +1    | 9 credits     |
| RM300  | 24          | +3    | 27 credits    |
| RM500  | 40          | +6    | 46 credits    |

### Commission Tiers (Tutor Payout Rates)
| Tier         | Commission | Tutor Rate | Requirements                    |
|--------------|-----------|------------|---------------------------------|
| New Tutor    | 30%       | 70%        | Default for all new tutors      |
| Rated Tutor  | 25%       | 75%        | 4.5+ rating, 20+ reviews        |
| Elite Tutor  | 20%       | 80%        | 100+ sessions, 4.7+ rating      |

### Session Pricing (Base)
| Duration | Base Price | Commission (varies) | Example Tutor Payout (New) |
|----------|-----------|--------------------|-----------------------------|
| 15 min   | RM15      | RM4.50 (30%)       | RM10.50                     |
| 30 min   | RM27      | RM8.10 (30%)       | RM18.90                     |
| 60 min   | RM50      | RM15 (30%)         | RM35                        |

### Transaction Types
- `topup_paid` - Paid credits from top-up
- `topup_bonus` - Bonus credits from top-up
- `session_deduction` - Credits used for a session
- `refund_paid` / `refund_bonus` - Credit refunds
- `bonus_reward` - Promotional bonus credits
- `bonus_expired` - Expired bonus credits

### Tutor Earnings Transaction Types
- `session_earning` - Earnings from completed session (after commission)
- `withdrawal_request` - Withdrawal request created
- `withdrawal_approved` - Withdrawal paid out
- `withdrawal_rejected` - Withdrawal rejected (funds returned)
- `pending_to_available` - Pending earnings become available
- `adjustment` - Manual adjustment by admin

---

## Notification Types
- **Students**: upcoming_class, no_upcoming_class, booking_confirmed, booking_cancelled
- **Teachers**: upcoming_class, leave_note_reminder, earning_credited, withdrawal_request
- **Admins**: teacher_pending, new_registration, class_reschedule, withdrawal_request

---

## Test Accounts
- **Admin**: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
- **Test Student**: test@example.com / password: password
- **Teachers**: ustaz.ahmad@alilm.com, ustazah.fatimah@alilm.com, ustaz.muhammad@alilm.com

---

## Mocked Features
- **Stripe Payment Processing** - `/api/wallet/topup/confirm` immediately confirms without real Stripe integration
- **Bank Transfer for Withdrawals** - Withdrawal approval marks as 'completed' without actual bank transfer
- **"Join Class" Button** - UI placeholder, not connected to real video conferencing
- **File Storage** - Teacher profile videos and certificates upload UI only

---

*Last Updated: February 13, 2026*
