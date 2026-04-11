"""
Backend API Tests for P2 Features - Alif Amin Academy
Tests: Teacher Schedule Management, Student Booking Calendar, Join Class functionality
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://amin-env-secure.preview.emergentagent.com')

# Test session tokens
ADMIN_SESSION_TOKEN = "admin_test_session_1768310525539"
STUDENT_SESSION_TOKEN = "student_test_session_1768310525563"
TEACHER_SESSION_TOKEN = "teacher_test_session_1768311556649"

# Test data
TEACHER_ID = "teacher_001"
STUDENT_ID = "student_test_1768016297531"


class TestTeacherDashboard:
    """Teacher Dashboard endpoint tests"""
    
    def test_teacher_dashboard_with_teacher_token(self):
        """Test /api/teachers/dashboard works for teacher users"""
        response = requests.get(
            f"{BASE_URL}/api/teachers/dashboard",
            headers={"Authorization": f"Bearer {TEACHER_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "teacher" in data
        assert "todays_classes" in data
        assert "completed_this_month" in data
        assert "estimated_earnings" in data
        
        # Verify teacher data
        assert data["teacher"]["teacher_id"] == TEACHER_ID
        assert "hourly_rate" in data["teacher"]
        assert "meet_link" in data["teacher"]
        
    def test_teacher_dashboard_with_student_token(self):
        """Test /api/teachers/dashboard returns 403 for non-teacher users"""
        response = requests.get(
            f"{BASE_URL}/api/teachers/dashboard",
            headers={"Authorization": f"Bearer {STUDENT_SESSION_TOKEN}"}
        )
        assert response.status_code == 403
        
    def test_teacher_dashboard_without_token(self):
        """Test /api/teachers/dashboard returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/teachers/dashboard")
        assert response.status_code == 401


class TestTeacherAvailability:
    """Teacher Availability endpoint tests"""
    
    def test_get_teacher_availability(self):
        """Test GET /api/teachers/{teacher_id}/availability returns slots"""
        response = requests.get(f"{BASE_URL}/api/teachers/{TEACHER_ID}/availability")
        assert response.status_code == 200
        data = response.json()
        
        # Verify it's a list
        assert isinstance(data, list)
        
        # If slots exist, verify structure
        if len(data) > 0:
            slot = data[0]
            assert "slot_id" in slot
            assert "teacher_id" in slot
            assert "start_time_utc" in slot
            assert "end_time_utc" in slot
            assert "is_booked" in slot
            
    def test_create_availability_as_teacher(self):
        """Test POST /api/teachers/{teacher_id}/availability creates slot"""
        # Create a future time slot
        future_date = datetime.utcnow() + timedelta(days=30)
        start_time = future_date.replace(hour=10, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=1)
        
        response = requests.post(
            f"{BASE_URL}/api/teachers/{TEACHER_ID}/availability",
            headers={
                "Authorization": f"Bearer {TEACHER_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={
                "start_time_utc": start_time.isoformat() + "Z",
                "end_time_utc": end_time.isoformat() + "Z",
                "recurring": False,
                "recurrence_pattern": None
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "message" in data
        assert "slot_id" in data
        assert data["message"] == "Availability created"
        
    def test_create_availability_as_student_fails(self):
        """Test POST /api/teachers/{teacher_id}/availability fails for students"""
        future_date = datetime.utcnow() + timedelta(days=31)
        start_time = future_date.replace(hour=10, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=1)
        
        response = requests.post(
            f"{BASE_URL}/api/teachers/{TEACHER_ID}/availability",
            headers={
                "Authorization": f"Bearer {STUDENT_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={
                "start_time_utc": start_time.isoformat() + "Z",
                "end_time_utc": end_time.isoformat() + "Z",
                "recurring": False,
                "recurrence_pattern": None
            }
        )
        assert response.status_code == 403


class TestBrowseTeachers:
    """Browse Teachers endpoint tests"""
    
    def test_get_teachers_list(self):
        """Test GET /api/teachers returns list of active teachers"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        assert response.status_code == 200
        data = response.json()
        
        # Verify it's a list
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify teacher structure
        teacher = data[0]
        assert "teacher_id" in teacher
        assert "user_id" in teacher
        assert "hourly_rate" in teacher
        assert "rating" in teacher
        assert "user" in teacher
        
        # Verify user data is included
        assert "name" in teacher["user"]
        assert "email" in teacher["user"]
        
    def test_get_single_teacher(self):
        """Test GET /api/teachers/{teacher_id} returns teacher details"""
        response = requests.get(f"{BASE_URL}/api/teachers/{TEACHER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify teacher data
        assert data["teacher_id"] == TEACHER_ID
        assert "bio" in data
        assert "hourly_rate" in data
        assert "meet_link" in data
        assert "specializations" in data
        assert "years_experience" in data
        assert "user" in data
        
    def test_get_nonexistent_teacher(self):
        """Test GET /api/teachers/{teacher_id} returns 404 for invalid ID"""
        response = requests.get(f"{BASE_URL}/api/teachers/nonexistent_teacher_123")
        assert response.status_code == 404


class TestStudentBooking:
    """Student Booking endpoint tests"""
    
    def test_student_dashboard_returns_student_id(self):
        """Test /api/students/dashboard returns student_id for booking"""
        response = requests.get(
            f"{BASE_URL}/api/students/dashboard",
            headers={"Authorization": f"Bearer {STUDENT_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify student data includes student_id
        assert "student" in data
        assert "student_id" in data["student"]
        assert data["student"]["student_id"] == STUDENT_ID
        
    def test_create_booking_as_student(self):
        """Test POST /api/bookings creates a booking"""
        # Get an available slot first
        avail_response = requests.get(f"{BASE_URL}/api/teachers/{TEACHER_ID}/availability")
        assert avail_response.status_code == 200
        slots = avail_response.json()
        
        if len(slots) == 0:
            pytest.skip("No available slots to book")
            
        slot = slots[0]
        
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            headers={
                "Authorization": f"Bearer {STUDENT_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={
                "student_id": STUDENT_ID,
                "teacher_id": TEACHER_ID,
                "start_time_utc": slot["start_time_utc"],
                "end_time_utc": slot["end_time_utc"],
                "booking_type": "trial"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify booking response
        assert "message" in data
        assert "booking_id" in data
        assert "meet_link" in data
        assert data["message"] == "Booking created"
        
    def test_create_booking_without_auth_fails(self):
        """Test POST /api/bookings fails without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/bookings",
            headers={"Content-Type": "application/json"},
            json={
                "student_id": STUDENT_ID,
                "teacher_id": TEACHER_ID,
                "start_time_utc": "2026-01-15T10:00:00Z",
                "end_time_utc": "2026-01-15T11:00:00Z",
                "booking_type": "trial"
            }
        )
        assert response.status_code == 401


class TestJoinClass:
    """Join Class functionality tests"""
    
    def test_booking_includes_meet_link(self):
        """Test that bookings include Google Meet link"""
        response = requests.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {STUDENT_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # If there are bookings, verify meet_link is present
        if len(data) > 0:
            booking = data[0]
            assert "meet_link" in booking
            # Meet link should be from teacher profile
            
    def test_teacher_has_meet_link(self):
        """Test that teacher profile includes meet_link"""
        response = requests.get(f"{BASE_URL}/api/teachers/{TEACHER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "meet_link" in data
        assert data["meet_link"] is not None
        assert "meet.google.com" in data["meet_link"]


class TestAdminDashboard:
    """Admin Dashboard endpoint tests"""
    
    def test_admin_stats(self):
        """Test /api/admin/stats returns comprehensive stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify stats structure
        assert "total_users" in data
        assert "total_students" in data
        assert "total_teachers" in data
        assert "total_bookings" in data
        assert "new_signups_today" in data
        assert "new_signups_week" in data
        assert "bookings_this_month" in data
        assert "revenue_mtd" in data
        assert "conversion_rate" in data
        
    def test_admin_users_list(self):
        """Test /api/admin/users returns users list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify user structure
        user = data[0]
        assert "user_id" in user
        assert "email" in user
        assert "role" in user
        
    def test_admin_users_filter_by_role(self):
        """Test /api/admin/users can filter by role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?role=teacher",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should be teachers
        for user in data:
            assert user["role"] == "teacher"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
