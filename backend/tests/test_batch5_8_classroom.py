"""
Batch 5.8 Virtual Classroom Overhaul - Backend API Tests
Tests: GET /api/classroom/session/{id}, POST /api/classroom/livekit/token, 
       and related classroom endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test tokens created via mongosh
STUDENT_TOKEN = "test_classroom_session_1771524516467"
TEACHER_TOKEN = "test_teacher_session_1771524516495"
ADMIN_TOKEN = "test_admin_session_1771524516501"
SESSION_ID = "cs_test_1771524516517"
MEET_LINK_SLUG = "test-room-1771524516517"


class TestClassroomSessionEndpoint:
    """Tests for GET /api/classroom/session/{id} endpoint"""

    def test_get_session_details_as_teacher(self):
        """Teacher can fetch session details"""
        response = requests.get(
            f"{BASE_URL}/api/classroom/session/{SESSION_ID}",
            headers={"Authorization": f"Bearer {TEACHER_TOKEN}"},
            timeout=10
        )
        print(f"GET session as teacher: {response.status_code} - {response.text[:200]}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "session_id" in data, "Response should contain session_id"
        assert data["session_id"] == SESSION_ID
        assert "teacher_name" in data, "Response should contain teacher_name"
        assert "student_name" in data, "Response should contain student_name"
        assert "meet_link_slug" in data, "Response should contain meet_link_slug"
        print(f"Session details: teacher={data.get('teacher_name')}, student={data.get('student_name')}")

    def test_get_session_details_as_student(self):
        """Student can fetch session details for their own session"""
        response = requests.get(
            f"{BASE_URL}/api/classroom/session/{SESSION_ID}",
            headers={"Authorization": f"Bearer {STUDENT_TOKEN}"},
            timeout=10
        )
        print(f"GET session as student: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["session_id"] == SESSION_ID

    def test_get_session_details_as_admin(self):
        """Admin can fetch any session details"""
        response = requests.get(
            f"{BASE_URL}/api/classroom/session/{SESSION_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            timeout=10
        )
        print(f"GET session as admin: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    def test_get_session_details_unauthenticated(self):
        """Unauthenticated request should fail"""
        response = requests.get(
            f"{BASE_URL}/api/classroom/session/{SESSION_ID}",
            timeout=10
        )
        print(f"GET session unauthenticated: {response.status_code}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_get_session_not_found(self):
        """Non-existent session should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/classroom/session/nonexistent_session_id",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            timeout=10
        )
        print(f"GET non-existent session: {response.status_code}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestLiveKitTokenEndpoint:
    """Tests for POST /api/classroom/livekit/token endpoint"""

    def test_generate_token_as_teacher(self):
        """Teacher can generate LiveKit token"""
        response = requests.post(
            f"{BASE_URL}/api/classroom/livekit/token",
            headers={
                "Authorization": f"Bearer {TEACHER_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"room_name": MEET_LINK_SLUG},
            timeout=10
        )
        print(f"POST livekit/token as teacher: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "token" in data, "Response should contain token"
        assert "server_url" in data, "Response should contain server_url"
        assert "identity" in data, "Response should contain identity"
        assert "name" in data, "Response should contain name"
        assert data.get("is_teacher") == True, "is_teacher should be True for teacher"
        print(f"LiveKit token generated for: {data.get('name')} ({data.get('identity')})")

    def test_generate_token_as_student(self):
        """Student can generate LiveKit token"""
        response = requests.post(
            f"{BASE_URL}/api/classroom/livekit/token",
            headers={
                "Authorization": f"Bearer {STUDENT_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"room_name": MEET_LINK_SLUG},
            timeout=10
        )
        print(f"POST livekit/token as student: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "token" in data
        assert data.get("is_teacher") == False, "is_teacher should be False for student"

    def test_generate_token_as_admin(self):
        """Admin can generate LiveKit token"""
        response = requests.post(
            f"{BASE_URL}/api/classroom/livekit/token",
            headers={
                "Authorization": f"Bearer {ADMIN_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"room_name": MEET_LINK_SLUG},
            timeout=10
        )
        print(f"POST livekit/token as admin: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    def test_generate_token_missing_room_name(self):
        """Token request without room_name should fail"""
        response = requests.post(
            f"{BASE_URL}/api/classroom/livekit/token",
            headers={
                "Authorization": f"Bearer {TEACHER_TOKEN}",
                "Content-Type": "application/json"
            },
            json={},
            timeout=10
        )
        print(f"POST livekit/token without room_name: {response.status_code}")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"

    def test_generate_token_unauthenticated(self):
        """Unauthenticated token request should fail"""
        response = requests.post(
            f"{BASE_URL}/api/classroom/livekit/token",
            headers={"Content-Type": "application/json"},
            json={"room_name": MEET_LINK_SLUG},
            timeout=10
        )
        print(f"POST livekit/token unauthenticated: {response.status_code}")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestGoLiveEndpoint:
    """Tests for POST /api/classroom/session/{id}/go-live endpoint"""

    def test_go_live_as_teacher(self):
        """Teacher can mark session as live"""
        response = requests.post(
            f"{BASE_URL}/api/classroom/session/{SESSION_ID}/go-live",
            headers={"Authorization": f"Bearer {TEACHER_TOKEN}"},
            timeout=10
        )
        print(f"POST go-live as teacher: {response.status_code} - {response.text[:200]}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "live", "Session should be marked as live"

    def test_go_live_as_student(self):
        """Student cannot mark session as live"""
        response = requests.post(
            f"{BASE_URL}/api/classroom/session/{SESSION_ID}/go-live",
            headers={"Authorization": f"Bearer {STUDENT_TOKEN}"},
            timeout=10
        )
        print(f"POST go-live as student: {response.status_code}")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


class TestNextClassEndpoint:
    """Tests for GET /api/classroom/next-class endpoint"""

    def test_next_class_as_teacher(self):
        """Teacher can get next class info"""
        response = requests.get(
            f"{BASE_URL}/api/classroom/next-class",
            headers={"Authorization": f"Bearer {TEACHER_TOKEN}"},
            timeout=10
        )
        print(f"GET next-class as teacher: {response.status_code} - {response.text[:300]}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Session may or may not be returned depending on timing
        if data.get("session"):
            assert "teacher_name" in data["session"]
            assert "student_name" in data["session"]
            assert "is_joinable" in data

    def test_next_class_as_student(self):
        """Student can get next class info"""
        response = requests.get(
            f"{BASE_URL}/api/classroom/next-class",
            headers={"Authorization": f"Bearer {STUDENT_TOKEN}"},
            timeout=10
        )
        print(f"GET next-class as student: {response.status_code}")
        assert response.status_code == 200


class TestAuthMeEndpoint:
    """Test /api/auth/me to verify auth works"""

    def test_auth_me_student(self):
        """Student can call /api/auth/me"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {STUDENT_TOKEN}"},
            timeout=10
        )
        print(f"GET auth/me as student: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("user", data).get("role") == "student"

    def test_auth_me_teacher(self):
        """Teacher can call /api/auth/me"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEACHER_TOKEN}"},
            timeout=10
        )
        print(f"GET auth/me as teacher: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("user", data).get("role") == "teacher"

    def test_auth_me_admin(self):
        """Admin can call /api/auth/me"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            timeout=10
        )
        print(f"GET auth/me as admin: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("user", data).get("role") == "admin"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
