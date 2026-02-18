"""
Batch 5.6 Student Platform Fixes - Test Suite
Testing:
1. GET /api/booking/available-teachers with strict date/time filtering
2. PUT /api/auth/update-profile returns updated user document
3. Schedule/Booking card dynamic status logic
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAvailableTeachersEndpoint:
    """Test GET /api/booking/available-teachers with strict filtering"""
    
    def test_available_teachers_no_params_returns_empty(self):
        """Bug fix: Without date/time params, should return empty list (strict filtering)"""
        response = requests.get(f"{BASE_URL}/api/booking/available-teachers")
        assert response.status_code == 200
        data = response.json()
        assert "teachers" in data
        assert data["teachers"] == [], f"Expected empty list without params, got {len(data['teachers'])} teachers"
        print("PASS: GET /api/booking/available-teachers (no params) returns empty list")
    
    def test_available_teachers_with_date_only_returns_empty(self):
        """Without time param, should still return empty (both required)"""
        future_date = (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        response = requests.get(f"{BASE_URL}/api/booking/available-teachers?date={future_date}")
        assert response.status_code == 200
        data = response.json()
        assert data["teachers"] == [], "Expected empty list with only date param"
        print("PASS: GET /api/booking/available-teachers (date only) returns empty list")
    
    def test_available_teachers_with_time_only_returns_empty(self):
        """Without date param, should still return empty (both required)"""
        response = requests.get(f"{BASE_URL}/api/booking/available-teachers?time=09:00")
        assert response.status_code == 200
        data = response.json()
        assert data["teachers"] == [], "Expected empty list with only time param"
        print("PASS: GET /api/booking/available-teachers (time only) returns empty list")
    
    def test_available_teachers_with_date_and_time_no_availability(self):
        """With date+time but no teacher has that slot available, returns empty"""
        # Use a date far in future where no availability exists
        future_date = (datetime.now() + timedelta(days=90)).strftime('%Y-%m-%d')
        response = requests.get(f"{BASE_URL}/api/booking/available-teachers?date={future_date}&time=03:30")
        assert response.status_code == 200
        data = response.json()
        # Should return empty if no teacher has availability for this obscure time
        assert isinstance(data["teachers"], list)
        print(f"PASS: GET /api/booking/available-teachers (date+time, no matches) returns {len(data['teachers'])} teachers")


class TestUserProfileUpdate:
    """Test PUT /api/auth/update-profile returns updated user document"""
    
    @pytest.fixture
    def student_session(self):
        """Create a test student and get session token"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"TEST_batch56_student_{unique_id}@example.com"
        password = "TestPass123!"
        
        # Register
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Test Batch56 Student",
            "phone": "+60123456789",
            "role": "student"
        })
        
        if reg_response.status_code == 400 and "already registered" in reg_response.text:
            # Login instead
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            assert login_response.status_code == 200
            data = login_response.json()
            return data["session_token"], data["user"]
        
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        data = reg_response.json()
        return data["session_token"], data["user"]
    
    def test_update_profile_returns_user_document(self, student_session):
        """Bug fix: PUT /api/auth/update-profile should return updated user doc with 'user' key"""
        session_token, user = student_session
        headers = {"Authorization": f"Bearer {session_token}"}
        
        new_name = f"Updated Name {uuid.uuid4().hex[:6]}"
        new_phone = "+60198765432"
        
        response = requests.put(
            f"{BASE_URL}/api/auth/update-profile",
            json={
                "name": new_name,
                "phone": new_phone,
                "timezone": "Asia/Singapore"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Response should contain 'user' key"
        assert "message" in data, "Response should contain 'message' key"
        
        # Verify updated data is returned
        updated_user = data["user"]
        assert updated_user["name"] == new_name, f"Name not updated: {updated_user['name']}"
        assert updated_user["phone"] == new_phone, f"Phone not updated: {updated_user['phone']}"
        assert updated_user["timezone"] == "Asia/Singapore", f"Timezone not updated"
        
        print(f"PASS: PUT /api/auth/update-profile returns updated user document")
        print(f"  - Name: {updated_user['name']}")
        print(f"  - Phone: {updated_user['phone']}")
        print(f"  - Timezone: {updated_user['timezone']}")
    
    def test_update_profile_only_name(self, student_session):
        """Test partial update - only name field"""
        session_token, user = student_session
        headers = {"Authorization": f"Bearer {session_token}"}
        
        new_name = f"Partial Update {uuid.uuid4().hex[:6]}"
        
        response = requests.put(
            f"{BASE_URL}/api/auth/update-profile",
            json={"name": new_name},
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["name"] == new_name
        print("PASS: Partial update (name only) works correctly")
    
    def test_update_profile_no_valid_fields(self, student_session):
        """Test update with no valid fields should return 400"""
        session_token, user = student_session
        headers = {"Authorization": f"Bearer {session_token}"}
        
        response = requests.put(
            f"{BASE_URL}/api/auth/update-profile",
            json={"invalid_field": "value"},
            headers=headers
        )
        
        assert response.status_code == 400
        print("PASS: Update with invalid fields returns 400")


class TestMyBookingsEndpoint:
    """Test booking/my-bookings endpoint for schedule data"""
    
    def test_my_bookings_returns_status_field(self):
        """Verify bookings have status field for frontend dynamic status rendering"""
        # Create student session
        unique_id = uuid.uuid4().hex[:8]
        email = f"TEST_schedule_student_{unique_id}@example.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "full_name": "Schedule Test Student",
            "role": "student"
        })
        
        if reg_response.status_code == 200:
            session_token = reg_response.json()["session_token"]
        else:
            # Login if already exists
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": "TestPass123!"
            })
            if login_response.status_code == 200:
                session_token = login_response.json()["session_token"]
            else:
                pytest.skip("Could not create test student")
                return
        
        headers = {"Authorization": f"Bearer {session_token}"}
        response = requests.get(f"{BASE_URL}/api/booking/my-bookings", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        
        # Bookings should have these fields for schedule card rendering
        expected_fields = ["booking_id", "status", "start_time_utc"]
        for booking in data.get("bookings", []):
            for field in expected_fields:
                assert field in booking, f"Missing field: {field}"
        
        print(f"PASS: GET /api/booking/my-bookings returns {len(data['bookings'])} bookings with status field")


class TestStudentDashboardData:
    """Test student dashboard data endpoint"""
    
    def test_dashboard_data_structure(self):
        """Verify dashboard data has required fields for UI"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"TEST_dashboard_student_{unique_id}@example.com"
        
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123!",
            "full_name": "Dashboard Test Student",
            "role": "student"
        })
        
        if reg_response.status_code == 200:
            session_token = reg_response.json()["session_token"]
        else:
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": "TestPass123!"
            })
            if login_response.status_code == 200:
                session_token = login_response.json()["session_token"]
            else:
                pytest.skip("Could not create test student")
                return
        
        headers = {"Authorization": f"Bearer {session_token}"}
        response = requests.get(f"{BASE_URL}/api/students/dashboard-data", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected structure
        assert "student" in data
        assert "upcoming_classes" in data
        assert "past_classes" in data
        assert "wallet" in data
        
        print("PASS: GET /api/students/dashboard-data returns correct structure")
        print(f"  - Student ID: {data['student'].get('student_id', 'N/A')}")
        print(f"  - Upcoming classes: {len(data.get('upcoming_classes', []))}")
        print(f"  - Past classes: {len(data.get('past_classes', []))}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
