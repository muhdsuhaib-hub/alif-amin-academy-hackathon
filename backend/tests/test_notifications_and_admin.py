"""
Test suite for Notification System and Admin User Management APIs
Tests:
1. Notification API endpoints (GET, POST, PUT, DELETE)
2. Notification generation for students, teachers, admins
3. Admin user management with filtering and export
"""

import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from previous iteration
ADMIN_SESSION_TOKEN = "admin_test_session_1768310525539"
STUDENT_SESSION_TOKEN = "student_test_session_new_1768313309866"
STUDENT_USER_ID = "test-student-new-1768313309866"
TEACHER_SESSION_TOKEN = "teacher_test_session_1768311556649"
TEACHER_USER_ID = "user_teacher001"


class TestNotificationAPI:
    """Test notification endpoints"""
    
    def test_get_notifications_without_user_id(self):
        """GET /api/notifications without user_id should return error or empty"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        # Should require user_id parameter
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print("PASSED: GET /api/notifications without user_id returns error")
    
    def test_get_notifications_with_user_id(self):
        """GET /api/notifications?user_id={id} returns notifications array"""
        response = requests.get(f"{BASE_URL}/api/notifications?user_id={STUDENT_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response should have 'notifications' key"
        assert "unread_count" in data, "Response should have 'unread_count' key"
        assert isinstance(data["notifications"], list), "notifications should be a list"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        print(f"PASSED: GET /api/notifications returns {len(data['notifications'])} notifications, {data['unread_count']} unread")
    
    def test_generate_student_notifications(self):
        """POST /api/notifications/generate/student/{user_id} generates notifications"""
        response = requests.post(f"{BASE_URL}/api/notifications/generate/student/{STUDENT_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have 'message' key"
        assert "generated" in data, "Response should have 'generated' key"
        print(f"PASSED: POST /api/notifications/generate/student - generated {data.get('generated', 0)} notifications")
    
    def test_generate_teacher_notifications(self):
        """POST /api/notifications/generate/teacher/{user_id} generates notifications"""
        response = requests.post(f"{BASE_URL}/api/notifications/generate/teacher/{TEACHER_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have 'message' key"
        print(f"PASSED: POST /api/notifications/generate/teacher - {data.get('message')}")
    
    def test_generate_admin_notifications(self):
        """POST /api/notifications/generate/admin/{user_id} generates notifications"""
        # Use admin user ID
        admin_user_id = "admin_user_001"  # This may need to be adjusted
        response = requests.post(f"{BASE_URL}/api/notifications/generate/admin/{admin_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have 'message' key"
        print(f"PASSED: POST /api/notifications/generate/admin - {data.get('message')}")
    
    def test_create_custom_notification(self):
        """POST /api/notifications creates a custom notification"""
        notification_data = {
            "user_id": STUDENT_USER_ID,
            "title": "Test Notification",
            "message": "This is a test notification from automated testing",
            "notification_type": "system"
        }
        response = requests.post(
            f"{BASE_URL}/api/notifications",
            json=notification_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "notification_id" in data, "Response should have 'notification_id'"
        self.__class__.test_notification_id = data["notification_id"]
        print(f"PASSED: POST /api/notifications created notification {data['notification_id']}")
    
    def test_mark_notification_as_read(self):
        """PUT /api/notifications/{id}/read marks notification as read"""
        # First create a notification to mark as read
        notification_data = {
            "user_id": STUDENT_USER_ID,
            "title": "Test Read Notification",
            "message": "This notification will be marked as read",
            "notification_type": "system"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/notifications",
            json=notification_data,
            headers={"Content-Type": "application/json"}
        )
        assert create_response.status_code == 200
        notification_id = create_response.json()["notification_id"]
        
        # Mark as read
        response = requests.put(f"{BASE_URL}/api/notifications/{notification_id}/read")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have 'message' key"
        print(f"PASSED: PUT /api/notifications/{notification_id}/read - {data['message']}")
    
    def test_mark_all_notifications_read(self):
        """PUT /api/notifications/mark-all-read marks all notifications as read"""
        response = requests.put(f"{BASE_URL}/api/notifications/mark-all-read?user_id={STUDENT_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have 'message' key"
        print(f"PASSED: PUT /api/notifications/mark-all-read - {data['message']}")
    
    def test_delete_notification(self):
        """DELETE /api/notifications/{id} deletes a notification"""
        # First create a notification to delete
        notification_data = {
            "user_id": STUDENT_USER_ID,
            "title": "Test Delete Notification",
            "message": "This notification will be deleted",
            "notification_type": "system"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/notifications",
            json=notification_data,
            headers={"Content-Type": "application/json"}
        )
        assert create_response.status_code == 200
        notification_id = create_response.json()["notification_id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/notifications/{notification_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have 'message' key"
        print(f"PASSED: DELETE /api/notifications/{notification_id} - {data['message']}")


class TestAdminUserManagement:
    """Test admin user management endpoints"""
    
    def test_get_all_users_without_auth(self):
        """GET /api/admin/users/all without auth should work (no auth required on this endpoint)"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all")
        # This endpoint doesn't require auth based on the code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data, "Response should have 'users' key"
        assert "total" in data, "Response should have 'total' key"
        assert "page" in data, "Response should have 'page' key"
        assert "pages" in data, "Response should have 'pages' key"
        print(f"PASSED: GET /api/admin/users/all returns {data['total']} total users")
    
    def test_filter_users_by_role_student(self):
        """GET /api/admin/users/all?role=student filters by student role"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all?role=student")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        # Verify all returned users are students
        for user in data["users"]:
            assert user.get("role") == "student", f"Expected role 'student', got {user.get('role')}"
        print(f"PASSED: GET /api/admin/users/all?role=student returns {len(data['users'])} students")
    
    def test_filter_users_by_role_teacher(self):
        """GET /api/admin/users/all?role=teacher filters by teacher role"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all?role=teacher")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        # Verify all returned users are teachers
        for user in data["users"]:
            assert user.get("role") == "teacher", f"Expected role 'teacher', got {user.get('role')}"
        print(f"PASSED: GET /api/admin/users/all?role=teacher returns {len(data['users'])} teachers")
    
    def test_filter_users_by_role_admin(self):
        """GET /api/admin/users/all?role=admin filters by admin role"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all?role=admin")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        # Verify all returned users are admins
        for user in data["users"]:
            assert user.get("role") == "admin", f"Expected role 'admin', got {user.get('role')}"
        print(f"PASSED: GET /api/admin/users/all?role=admin returns {len(data['users'])} admins")
    
    def test_search_users_by_name(self):
        """GET /api/admin/users/all?search=test searches by name"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all?search=test")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        print(f"PASSED: GET /api/admin/users/all?search=test returns {len(data['users'])} users")
    
    def test_search_users_by_email(self):
        """GET /api/admin/users/all?search=@example searches by email"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all?search=@example")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        print(f"PASSED: GET /api/admin/users/all?search=@example returns {len(data['users'])} users")
    
    def test_filter_users_by_date_range(self):
        """GET /api/admin/users/all with date_from and date_to filters by date"""
        # Use a wide date range to ensure we get results
        date_from = "2024-01-01T00:00:00"
        date_to = "2027-12-31T23:59:59"
        
        response = requests.get(f"{BASE_URL}/api/admin/users/all?date_from={date_from}&date_to={date_to}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        print(f"PASSED: GET /api/admin/users/all with date range returns {len(data['users'])} users")
    
    def test_pagination(self):
        """GET /api/admin/users/all with page and limit parameters"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all?page=1&limit=5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        assert len(data["users"]) <= 5, f"Expected max 5 users, got {len(data['users'])}"
        assert data["page"] == 1, f"Expected page 1, got {data['page']}"
        print(f"PASSED: GET /api/admin/users/all?page=1&limit=5 returns {len(data['users'])} users on page {data['page']}")
    
    def test_combined_filters(self):
        """GET /api/admin/users/all with multiple filters"""
        response = requests.get(f"{BASE_URL}/api/admin/users/all?role=student&page=1&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        # Verify all returned users are students
        for user in data["users"]:
            assert user.get("role") == "student"
        print(f"PASSED: Combined filters (role=student, page=1, limit=10) returns {len(data['users'])} users")


class TestOnboardingFlow:
    """Test onboarding to profile registration flow"""
    
    def test_check_email_endpoint(self):
        """GET /api/auth/check-email checks if email exists"""
        # Test with non-existing email
        response = requests.get(f"{BASE_URL}/api/auth/check-email?email=nonexistent@test.com")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "exists" in data, "Response should have 'exists' key"
        assert data["exists"] == False, "Non-existent email should return exists=False"
        print("PASSED: GET /api/auth/check-email returns exists=False for non-existent email")
    
    def test_check_email_existing(self):
        """GET /api/auth/check-email for existing email"""
        # Test with admin email
        response = requests.get(f"{BASE_URL}/api/auth/check-email?email=muhdsuhaib@gmail.com")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "exists" in data, "Response should have 'exists' key"
        # This email may or may not exist depending on seed data
        print(f"PASSED: GET /api/auth/check-email for admin email - exists={data['exists']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
