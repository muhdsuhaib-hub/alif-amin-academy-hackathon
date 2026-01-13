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
- **Authentication**: Emergent-managed Google OAuth with role-based access

---

## Implementation Status

### ✅ P0 - Critical (COMPLETED)
- [x] User authentication via Google OAuth
- [x] Role-based redirections (Admin → /admin/dashboard, Student → /student/dashboard, Teacher → /teacher/dashboard)
- [x] Onboarding flow for new users
- [x] Admin access for specific emails (muhdsuhaib@gmail.com, hello.alifamin@gmail.com)
- [x] Admin Dashboard UI with functional backend connections

### ✅ P1 - High Priority (COMPLETED)
- [x] Admin Dashboard functionality
  - [x] User Management (CRUD operations, search, filter)
  - [x] Master Calendar (view bookings, manual booking creation)
  - [x] Financial Reports (revenue, MRR, payroll)
  - [x] Support Tickets (create, update status)
  - [x] Subscription Management (pause, resume, cancel, extend trial)

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

### 🔜 P3 - Future Tasks (NOT STARTED)
- [ ] **Integrations**
  - [ ] Billplz payment integration
  - [ ] Google Meet API for automatic link generation
  - [ ] Email notifications (SendGrid/Resend)
  - [ ] WhatsApp notifications (Twilio)
- [ ] **Digital Mushaf**
  - [ ] Integrated Quran reader in classroom
  - [ ] Teacher annotations capability
- [ ] **Teacher Payroll**
  - [ ] Teacher payment portal
  - [ ] Payment history and earnings tracking
- [ ] **Read Tracker**
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
- `support_tickets` - Support requests
- `user_sessions` - Authentication sessions

### Key API Endpoints
- `/api/auth/*` - Authentication (session-data, me, logout, complete-onboarding)
- `/api/teachers/*` - Teacher operations and availability
- `/api/bookings` - Booking management
- `/api/students/dashboard` - Student dashboard data
- `/api/admin/*` - Admin operations (users, stats, finance, support)

---

## File Structure
```
/app/
├── backend/
│   ├── server.py          # Main FastAPI app
│   ├── models.py          # Pydantic/Beanie models
│   ├── admin_routes.py    # Admin API endpoints
│   └── seed_data.py       # Initial data seeding
├── frontend/
│   └── src/
│       ├── App.js         # Main routing
│       ├── pages/         # Page components
│       │   ├── Landing.js
│       │   ├── Onboarding.js
│       │   ├── StudentDashboard.js
│       │   ├── TeacherDashboard.js
│       │   ├── AdminDashboard.js
│       │   ├── BrowseTeachers.js
│       │   └── BookClass.js
│       └── components/
│           └── admin/     # Admin dashboard components
└── tests/
    ├── test_auth_and_roles.py
    └── test_p2_features.py
```

---

## Test Accounts
- **Admin**: muhdsuhaib@gmail.com, hello.alifamin@gmail.com
- **Test Student**: test.student@example.com
- **Teachers**: ustaz.ahmad@alilm.com, ustazah.fatimah@alilm.com, ustaz.muhammad@alilm.com

---

*Last Updated: January 13, 2026*
