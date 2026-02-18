"""
Backend API Tests for Alif Amin Academy
Tests authentication, role-based access, and dashboard endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://student-overhaul-v4.preview.emergentagent.com')

# Test session tokens created in MongoDB
ADMIN_SESSION_TOKEN = "admin_test_session_1768310525539"
STUDENT_SESSION_TOKEN = "student_test_session_1768310525563"


class TestHealthCheck:
    """Basic API health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Alif Amin Academy" in data["message"]


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me without authentication returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        
    def test_auth_me_with_invalid_token(self):
        """Test /api/auth/me with invalid token returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401
        
    def test_auth_me_admin_user(self):
        """Test /api/auth/me returns correct admin user data"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify admin user data
        assert data["email"] == "muhdsuhaib@gmail.com"
        assert data["role"] == "admin"
        assert "user_id" in data
        assert "name" in data
        
    def test_auth_me_student_user(self):
        """Test /api/auth/me returns correct student user data"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {STUDENT_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify student user data
        assert data["email"] == "test.student@example.com"
        assert data["role"] == "student"
        assert "user_id" in data


class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    def test_admin_stats_with_admin_token(self):
        """Test /api/admin/stats works for admin users"""
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
        assert "conversion_rate" in data
        
    def test_admin_stats_with_student_token(self):
        """Test /api/admin/stats returns 403 for non-admin users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {STUDENT_SESSION_TOKEN}"}
        )
        assert response.status_code == 403
        
    def test_admin_stats_without_token(self):
        """Test /api/admin/stats returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        
    def test_admin_users_with_admin_token(self):
        """Test /api/admin/users works for admin users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify users list
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check user structure
        first_user = data[0]
        assert "user_id" in first_user
        assert "email" in first_user
        assert "role" in first_user


class TestStudentEndpoints:
    """Student-specific endpoint tests"""
    
    def test_student_dashboard_with_student_token(self):
        """Test /api/students/dashboard works for student users"""
        response = requests.get(
            f"{BASE_URL}/api/students/dashboard",
            headers={"Authorization": f"Bearer {STUDENT_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "student" in data
        assert "upcoming_classes" in data
        assert "past_classes" in data
        
        # Verify student data
        assert data["student"]["user_id"] == "test-student-1768016297500"
        
    def test_student_dashboard_with_admin_token(self):
        """Test /api/students/dashboard returns 403 for admin users"""
        response = requests.get(
            f"{BASE_URL}/api/students/dashboard",
            headers={"Authorization": f"Bearer {ADMIN_SESSION_TOKEN}"}
        )
        # Admin should get 403 as they are not a student
        assert response.status_code == 403
        
    def test_student_dashboard_without_token(self):
        """Test /api/students/dashboard returns 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/students/dashboard")
        assert response.status_code == 401


class TestTeacherEndpoints:
    """Teacher-related endpoint tests"""
    
    def test_get_teachers_list(self):
        """Test /api/teachers returns list of teachers"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        assert response.status_code == 200
        data = response.json()
        
        # Verify teachers list
        assert isinstance(data, list)
        
        # If teachers exist, verify structure
        if len(data) > 0:
            teacher = data[0]
            assert "teacher_id" in teacher
            assert "user_id" in teacher
            assert "user" in teacher


class TestOnboardingEndpoints:
    """Onboarding endpoint tests"""
    
    def test_complete_onboarding_without_token(self):
        """Test /api/auth/complete-onboarding returns 401 without authentication"""
        response = requests.post(
            f"{BASE_URL}/api/auth/complete-onboarding",
            json={"level": "beginner", "preference": "fixed"}
        )
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
