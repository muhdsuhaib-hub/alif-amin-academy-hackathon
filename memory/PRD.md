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
- **Authentication**: Emergent-managed Google OAuth + Email/Password with role-based access

---

## Implementation Status

### ✅ P0 - Critical (COMPLETED)
- [x] User authentication via Google OAuth
- [x] **Email/Password Authentication**
  - [x] Email registration with password
  - [x] Email login with password
  - [x] Email existence check API
  - [x] Password hashing with bcrypt
- [x] Role-based redirections (Admin → /admin/dashboard, Student → /student/dashboard, Teacher → /teacher/dashboard)
- [x] **Profile Registration for New Students**
  - [x] After onboarding, redirects to profile form
  - [x] Collects: Full Name, Email, Phone, Password
  - [x] Shows onboarding preferences (Level, Schedule)
  - [x] Creates student profile with all data
- [x] Onboarding flow for new users
- [x] Admin access for specific emails (muhdsuhaib@gmail.com, hello.alifamin@gmail.com)
- [x] Admin Dashboard UI with functional backend connections

### ✅ P1 - High Priority (COMPLETED)
- [x] Admin Dashboard functionality
  - [x] User Management (CRUD operations, search, filter by role/status/date)
  - [x] **User Export to CSV/Excel** - All profile fields included
  - [x] Master Calendar (view bookings, manual booking creation)
  - [x] Financial Reports (revenue, MRR, payroll)
  - [x] Support Tickets (create, update status)
  - [x] Subscription Management (pause, resume, cancel, extend trial)
- [x] **Notification System for All Platforms**
  - [x] Notification Bell component in Student/Teacher/Admin dashboards
  - [x] Automatic notifications generated based on user role
  - [x] Mark as read (individual and all)
  - [x] Unread count badge on bell icon

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
  - [x] **Earnings Wallet**: Balance display, Withdraw button with bank selection (Maybank/CIMB/PayPal/Wise), Transaction history
  - [x] **Availability Calendar**: Date range selection, time slots, auto timezone converter, quick time slot presets
  - [x] **Classroom Tools**: Digital Mushaf with Uthmani script (604 pages, 114 surahs, 30 juz), Live pointer, Lesson Notes per student
  - [x] **Student Management**: Active/Warning/Inactive stats, Last lesson indicator, Send Reminder button, Report Card PDF generator
  - [x] **Profile Management**: Editable bio, hourly rate, Google Meet link, specialties tags, Video intro upload, Ijazah/Certificate upload

### 🔜 P3 - Future Tasks (NOT STARTED)
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

---

## Architecture

### Database Collections
- `users` - User accounts with roles
- `teachers` - Teacher profiles with rates, specializations
- `students` - Student profiles with subscription status
- `availability_slots` - Teacher availability
- `bookings` - Class bookings
- `lessons` - Completed lesson records
- `progress` - Student progress tracking
- `progress_logs` - Teacher notes on student progress
- `support_tickets` - Support requests
- `user_sessions` - Authentication sessions
- `notifications` - User notifications

### Key API Endpoints
- `/api/auth/*` - Authentication (register, login, session-data, me, logout, complete-onboarding)
- `/api/teachers/*` - Teacher operations and availability
- `/api/bookings` - Booking management
- `/api/students/dashboard` - Student dashboard data
- `/api/admin/*` - Admin operations (users, stats, finance, support, teacher approvals)
- `/api/notifications/*` - Notification management and generation

---

## File Structure
```
/app/
├── backend/
│   ├── server.py              # Main FastAPI app
│   ├── models.py              # Pydantic models (includes Notification)
│   ├── admin_routes.py        # Admin API endpoints
│   ├── notification_routes.py # Notification API endpoints (NEW)
│   └── tests/
│       └── test_notifications_and_admin.py
├── frontend/
│   └── src/
│       ├── App.js             # Main routing
│       ├── pages/             # Page components
│       │   ├── Landing.js
│       │   ├── Onboarding.js
│       │   ├── Auth.js        # Unified login/signup page
│       │   ├── StudentDashboard.js
│       │   ├── TeacherDashboard.js
│       │   ├── AdminDashboard.js
│       │   ├── BrowseTeachers.js
│       │   └── BookClass.js
│       └── components/
│           ├── NotificationBell.js    # Reusable notification component (NEW)
│           └── admin/
│               ├── UserManagement.js  # With CSV export
│               ├── TeacherApprovals.js
│               └── ...
└── memory/
    └── PRD.md
```

---

## Notification Types
- **Students**: upcoming_class, no_upcoming_class, booking_confirmed, booking_cancelled
- **Teachers**: upcoming_class, leave_note_reminder, earning_credited, withdrawal_request
- **Admins**: teacher_pending, new_registration, class_reschedule, withdrawal_request

---

## Test Accounts
- **Admin**: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
- **Test Student**: test.student@example.com
- **Teachers**: ustaz.ahmad@alilm.com, ustazah.fatimah@alilm.com, ustaz.muhammad@alilm.com

---

*Last Updated: January 27, 2026*
