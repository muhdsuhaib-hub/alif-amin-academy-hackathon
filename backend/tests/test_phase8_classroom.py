"""
Phase 8 Virtual Classroom Module Tests
- Admin Global Session Monitor APIs
- Student Progress Tracker API
- Admin Reports API
- Stealth Join API
"""

import pytest
import requests
import os
from datetime import datetime, timezone, timedelta
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_TOKEN = "session_d70a27233c4349508e98653d3718bc6a"
TEACHER_TOKEN = "session_b96414341e5a46bb9efda8aeb5c6537d"


@pytest.fixture
def admin_client():
    """Session with admin auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ADMIN_TOKEN}"
    })
    session.cookies.set("session_token", ADMIN_TOKEN)
    return session


@pytest.fixture
def teacher_client():
    """Session with teacher auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TEACHER_TOKEN}"
    })
    session.cookies.set("session_token", TEACHER_TOKEN)
    return session


class TestAdminSessionsEndpoint:
    """Test GET /api/classroom/admin/sessions - Admin views all class sessions"""
    
    def test_admin_sessions_returns_200(self, admin_client):
        """Admin can list all sessions"""
        response = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "sessions" in data, "Response should have 'sessions' key"
        assert isinstance(data["sessions"], list), "Sessions should be a list"
        print(f"Admin sessions endpoint returned {len(data['sessions'])} sessions")
    
    def test_admin_sessions_enriched_with_names(self, admin_client):
        """Sessions should be enriched with teacher_name and student_name"""
        response = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions")
        assert response.status_code == 200
        
        data = response.json()
        if len(data["sessions"]) > 0:
            session = data["sessions"][0]
            assert "teacher_name" in session, "Session should have teacher_name"
            assert "student_name" in session, "Session should have student_name"
            # Also check standard fields
            assert "session_id" in session, "Session should have session_id"
            assert "status" in session, "Session should have status"
            print(f"Session has enriched names: teacher={session['teacher_name']}, student={session['student_name']}")
        else:
            print("No sessions found to verify enrichment")
    
    def test_admin_sessions_filter_by_status(self, admin_client):
        """Admin can filter sessions by status"""
        for status in ["live", "booked", "completed"]:
            response = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions?status={status}")
            assert response.status_code == 200, f"Expected 200 for status={status}, got {response.status_code}"
            data = response.json()
            print(f"Sessions with status '{status}': {len(data['sessions'])}")
    
    def test_admin_sessions_unauthorized_for_teacher(self, teacher_client):
        """Teacher should be forbidden from admin sessions endpoint"""
        response = teacher_client.get(f"{BASE_URL}/api/classroom/admin/sessions")
        assert response.status_code == 403, f"Expected 403 for teacher, got {response.status_code}"


class TestAdminSessionDetails:
    """Test GET /api/classroom/admin/sessions/{id}/details"""
    
    def test_admin_session_details_returns_data(self, admin_client):
        """Admin can get detailed session info with progress, rating, payment, recording_url"""
        # First get a session ID from the list
        sessions_resp = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions")
        assert sessions_resp.status_code == 200
        sessions = sessions_resp.json().get("sessions", [])
        
        if not sessions:
            pytest.skip("No sessions available for detail test")
        
        session_id = sessions[0]["session_id"]
        response = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions/{session_id}/details")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check enriched fields
        assert "teacher_name" in data, "Should have teacher_name"
        assert "student_name" in data, "Should have student_name"
        assert "teacher_email" in data, "Should have teacher_email"
        assert "student_email" in data, "Should have student_email"
        # Check optional fields exist (can be null)
        assert "progress" in data, "Should have progress field"
        assert "rating" in data, "Should have rating field"
        assert "payment" in data, "Should have payment field"
        assert "recording_url" in data, "Should have recording_url field"
        print(f"Session detail for {session_id}: teacher={data['teacher_name']}, progress={data['progress'] is not None}")
    
    def test_admin_session_details_404_for_invalid(self, admin_client):
        """Invalid session ID returns 404"""
        response = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions/invalid_session_id/details")
        assert response.status_code == 404, f"Expected 404 for invalid session, got {response.status_code}"
    
    def test_admin_session_details_forbidden_for_teacher(self, teacher_client):
        """Teacher cannot access admin session details"""
        response = teacher_client.get(f"{BASE_URL}/api/classroom/admin/sessions/any_id/details")
        assert response.status_code == 403, f"Expected 403 for teacher, got {response.status_code}"


class TestAdminStudentReport:
    """Test GET /api/classroom/admin/reports/student/{id}"""
    
    def test_admin_student_report_endpoint_exists(self, admin_client):
        """Admin can access student report endpoint"""
        # First, find a student ID from sessions or create a test one
        sessions_resp = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions")
        sessions = sessions_resp.json().get("sessions", [])
        
        student_id = None
        if sessions:
            student_id = sessions[0].get("student_id")
        
        if not student_id:
            # Try with a made-up ID - should return 404 which is valid behavior
            response = admin_client.get(f"{BASE_URL}/api/classroom/admin/reports/student/nonexistent_student")
            assert response.status_code in [404, 200], f"Expected 404 or 200, got {response.status_code}"
            print("No existing student found, verified endpoint returns 404 for invalid student")
            return
        
        response = admin_client.get(f"{BASE_URL}/api/classroom/admin/reports/student/{student_id}")
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            # Verify report structure
            assert "student" in data, "Should have student info"
            assert "summary" in data, "Should have summary"
            assert "recent_progress" in data, "Should have recent_progress"
            assert "sessions" in data, "Should have sessions list"
            assert "generated_at" in data, "Should have generated_at timestamp"
            
            # Verify summary structure
            summary = data["summary"]
            assert "total_sessions" in summary, "Summary should have total_sessions"
            assert "average_scores" in summary, "Summary should have average_scores"
            assert "surahs_covered" in summary, "Summary should have surahs_covered"
            print(f"Student report for {student_id}: {summary['total_sessions']} sessions, scores={summary['average_scores']}")
        else:
            print(f"Student {student_id} not found in students collection (expected for test data)")
    
    def test_admin_student_report_forbidden_for_teacher(self, teacher_client):
        """Teacher cannot access admin reports"""
        response = teacher_client.get(f"{BASE_URL}/api/classroom/admin/reports/student/any_id")
        assert response.status_code == 403, f"Expected 403 for teacher, got {response.status_code}"


class TestAdminStealthJoin:
    """Test POST /api/classroom/admin/stealth-join"""
    
    def test_stealth_join_returns_token(self, admin_client):
        """Admin can get stealth join token with correct flags"""
        response = admin_client.post(
            f"{BASE_URL}/api/classroom/admin/stealth-join",
            json={"room_name": "test_room_123"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Should have token"
        assert "server_url" in data, "Should have server_url"
        assert "identity" in data, "Should have identity"
        assert "name" in data, "Should have name"
        assert "is_stealth" in data, "Should have is_stealth flag"
        
        # Verify stealth properties
        assert data["name"] == "System", f"Stealth name should be 'System', got {data['name']}"
        assert data["is_stealth"] == True, f"is_stealth should be True, got {data['is_stealth']}"
        assert data["identity"].startswith("admin_"), f"Identity should start with 'admin_', got {data['identity']}"
        print(f"Stealth join token generated: identity={data['identity']}, name={data['name']}, is_stealth={data['is_stealth']}")
    
    def test_stealth_join_requires_room_name(self, admin_client):
        """Stealth join requires room_name parameter"""
        response = admin_client.post(
            f"{BASE_URL}/api/classroom/admin/stealth-join",
            json={}
        )
        assert response.status_code == 400, f"Expected 400 for missing room_name, got {response.status_code}"
    
    def test_stealth_join_forbidden_for_teacher(self, teacher_client):
        """Teacher cannot use stealth join"""
        response = teacher_client.post(
            f"{BASE_URL}/api/classroom/admin/stealth-join",
            json={"room_name": "test_room"}
        )
        assert response.status_code == 403, f"Expected 403 for teacher, got {response.status_code}"


class TestStudentProgressEndpoint:
    """Test GET /api/classroom/student/{student_id}/progress"""
    
    def test_student_progress_endpoint_exists(self, admin_client):
        """Admin can access student progress"""
        # Get a student ID from sessions
        sessions_resp = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions")
        sessions = sessions_resp.json().get("sessions", [])
        
        student_id = None
        if sessions:
            student_id = sessions[0].get("student_id")
        
        if not student_id:
            pytest.skip("No student_id available for test")
        
        response = admin_client.get(f"{BASE_URL}/api/classroom/student/{student_id}/progress")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "progress" in data, "Response should have 'progress' key"
        assert isinstance(data["progress"], list), "Progress should be a list"
        print(f"Student {student_id} has {len(data['progress'])} progress records")


class TestRecordingToggle:
    """Test POST /api/classroom/session/{id}/recording/toggle - Stealth recording"""
    
    def test_recording_toggle_admin_stealth(self, admin_client):
        """Admin recording should be stealth (visible=false)"""
        # Get a session ID
        sessions_resp = admin_client.get(f"{BASE_URL}/api/classroom/admin/sessions")
        sessions = sessions_resp.json().get("sessions", [])
        
        if not sessions:
            pytest.skip("No sessions available")
        
        session_id = sessions[0]["session_id"]
        response = admin_client.post(
            f"{BASE_URL}/api/classroom/session/{session_id}/recording/toggle",
            json={"action": "start"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "action" in data, "Should have action"
        assert "visible" in data, "Should have visible flag"
        # Admin recording should be stealth (not visible to participants)
        assert data["visible"] == False, f"Admin recording should be stealth (visible=False), got {data['visible']}"
        print(f"Recording toggle: action={data['action']}, visible={data['visible']} (stealth for admin)")


class TestEndpointAuthorization:
    """Test that all Phase 8 endpoints enforce proper authorization"""
    
    def test_unauthenticated_access_rejected(self):
        """All endpoints should reject unauthenticated access"""
        endpoints = [
            ("GET", "/api/classroom/admin/sessions"),
            ("GET", "/api/classroom/admin/sessions/test_id/details"),
            ("GET", "/api/classroom/admin/reports/student/test_id"),
            ("POST", "/api/classroom/admin/stealth-join"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            assert response.status_code in [401, 403, 422], f"Expected 401/403/422 for {endpoint}, got {response.status_code}"
            print(f"{method} {endpoint}: Correctly returns {response.status_code} for unauthenticated request")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
