"""
Test Teacher Signup Flow
Tests the new teacher signup feature:
1. Selecting 'Teacher' in onboarding redirects to /teacher-signup page
2. POST /api/auth/register-teacher creates teacher profile with pending approval status
3. Teacher dashboard shows pending approval banner for new teachers
4. Teacher dashboard hides stats and tabs for pending teachers
"""

import pytest
import requests
import os
from datetime import datetime, timezone, timedelta
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestTeacherRegistrationEndpoint:
    """Tests for /api/auth/register-teacher endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a fresh test user for each test"""
        self.test_user_id = f"test-teacher-reg-{uuid.uuid4().hex[:8]}"
        self.test_session_token = f"test_session_{uuid.uuid4().hex[:12]}"
        
        # Create test user in database via mongosh
        import subprocess
        create_user_script = f"""
        use('test_database');
        db.users.insertOne({{
            user_id: '{self.test_user_id}',
            email: 'test.teacher.{uuid.uuid4().hex[:8]}@example.com',
            name: 'Test Teacher Registration User',
            role: 'student',
            picture: 'https://via.placeholder.com/150',
            timezone: 'UTC',
            created_at: new Date()
        }});
        db.user_sessions.insertOne({{
            user_id: '{self.test_user_id}',
            session_token: '{self.test_session_token}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        """
        subprocess.run(['mongosh', '--quiet', '--eval', create_user_script], capture_output=True)
        
        yield
        
        # Cleanup after test
        cleanup_script = f"""
        use('test_database');
        db.users.deleteOne({{user_id: '{self.test_user_id}'}});
        db.user_sessions.deleteMany({{user_id: '{self.test_user_id}'}});
        db.teachers.deleteMany({{user_id: '{self.test_user_id}'}});
        """
        subprocess.run(['mongosh', '--quiet', '--eval', cleanup_script], capture_output=True)
    
    def test_register_teacher_without_auth_returns_401(self):
        """Test that register-teacher endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/register-teacher")
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Not authenticated" in data["detail"]
    
    def test_register_teacher_creates_pending_profile(self):
        """Test that register-teacher creates a teacher profile with pending status"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register-teacher",
            headers={"Authorization": f"Bearer {self.test_session_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "message" in data
        assert "teacher_id" in data
        assert "status" in data
        
        # Verify status is pending
        assert data["status"] == "pending"
        assert "Teacher registration submitted" in data["message"]
        
        # Verify teacher profile in database
        import subprocess
        verify_script = f"""
        use('test_database');
        const teacher = db.teachers.findOne({{user_id: '{self.test_user_id}'}});
        print(JSON.stringify(teacher));
        """
        result = subprocess.run(['mongosh', '--quiet', '--eval', verify_script], capture_output=True, text=True)
        
        # Parse the teacher document
        import json
        teacher_data = json.loads(result.stdout.strip())
        
        assert teacher_data["approval_status"] == "pending"
        assert teacher_data["is_active"] == False
        assert teacher_data["hourly_rate"] == 50  # Default rate
    
    def test_register_teacher_updates_user_role(self):
        """Test that register-teacher updates user role to teacher"""
        # First register as teacher
        response = requests.post(
            f"{BASE_URL}/api/auth/register-teacher",
            headers={"Authorization": f"Bearer {self.test_session_token}"}
        )
        assert response.status_code == 200
        
        # Verify user role was updated
        import subprocess
        verify_script = f"""
        use('test_database');
        const user = db.users.findOne({{user_id: '{self.test_user_id}'}});
        print(user.role);
        """
        result = subprocess.run(['mongosh', '--quiet', '--eval', verify_script], capture_output=True, text=True)
        
        assert result.stdout.strip() == "teacher"
    
    def test_register_teacher_already_registered_returns_existing(self):
        """Test that registering again returns existing teacher profile"""
        # First registration
        response1 = requests.post(
            f"{BASE_URL}/api/auth/register-teacher",
            headers={"Authorization": f"Bearer {self.test_session_token}"}
        )
        assert response1.status_code == 200
        teacher_id_1 = response1.json().get("teacher_id")
        
        # Second registration attempt
        response2 = requests.post(
            f"{BASE_URL}/api/auth/register-teacher",
            headers={"Authorization": f"Bearer {self.test_session_token}"}
        )
        assert response2.status_code == 200
        data = response2.json()
        
        # Should return existing teacher info
        assert "Already registered as teacher" in data.get("message", "")
        assert "teacher" in data


class TestTeacherDashboardPendingState:
    """Tests for teacher dashboard with pending approval state"""
    
    def test_teacher_dashboard_returns_pending_status(self):
        """Test that teacher dashboard returns approval_status for pending teachers"""
        # Use the test session created earlier
        response = requests.get(
            f"{BASE_URL}/api/teachers/dashboard",
            headers={"Authorization": "Bearer teacher_signup_test_1768313099097"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify teacher data includes approval status
        assert "teacher" in data
        assert "approval_status" in data["teacher"]
        assert data["teacher"]["approval_status"] == "pending"
        assert data["teacher"]["is_active"] == False
    
    def test_approved_teacher_dashboard_shows_active_status(self):
        """Test that approved teacher dashboard shows active status"""
        response = requests.get(
            f"{BASE_URL}/api/teachers/dashboard",
            headers={"Authorization": "Bearer teacher_test_session_1768311556649"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify teacher is active
        assert "teacher" in data
        assert data["teacher"]["is_active"] == True


class TestTeacherSignupIntegration:
    """Integration tests for the full teacher signup flow"""
    
    def test_full_teacher_signup_flow(self):
        """Test the complete teacher signup flow from registration to dashboard"""
        # Create a new test user
        test_user_id = f"test-full-flow-{uuid.uuid4().hex[:8]}"
        test_session_token = f"test_flow_session_{uuid.uuid4().hex[:12]}"
        
        import subprocess
        create_user_script = f"""
        use('test_database');
        db.users.insertOne({{
            user_id: '{test_user_id}',
            email: 'test.flow.{uuid.uuid4().hex[:8]}@example.com',
            name: 'Test Full Flow User',
            role: 'student',
            picture: 'https://via.placeholder.com/150',
            timezone: 'UTC',
            created_at: new Date()
        }});
        db.user_sessions.insertOne({{
            user_id: '{test_user_id}',
            session_token: '{test_session_token}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        """
        subprocess.run(['mongosh', '--quiet', '--eval', create_user_script], capture_output=True)
        
        try:
            # Step 1: Register as teacher
            register_response = requests.post(
                f"{BASE_URL}/api/auth/register-teacher",
                headers={"Authorization": f"Bearer {test_session_token}"}
            )
            assert register_response.status_code == 200
            register_data = register_response.json()
            assert register_data["status"] == "pending"
            
            # Step 2: Access teacher dashboard
            dashboard_response = requests.get(
                f"{BASE_URL}/api/teachers/dashboard",
                headers={"Authorization": f"Bearer {test_session_token}"}
            )
            assert dashboard_response.status_code == 200
            dashboard_data = dashboard_response.json()
            
            # Verify pending state
            assert dashboard_data["teacher"]["approval_status"] == "pending"
            assert dashboard_data["teacher"]["is_active"] == False
            
            # Step 3: Verify user role is now teacher
            me_response = requests.get(
                f"{BASE_URL}/api/auth/me",
                headers={"Authorization": f"Bearer {test_session_token}"}
            )
            assert me_response.status_code == 200
            me_data = me_response.json()
            assert me_data["role"] == "teacher"
            
        finally:
            # Cleanup
            cleanup_script = f"""
            use('test_database');
            db.users.deleteOne({{user_id: '{test_user_id}'}});
            db.user_sessions.deleteMany({{user_id: '{test_user_id}'}});
            db.teachers.deleteMany({{user_id: '{test_user_id}'}});
            """
            subprocess.run(['mongosh', '--quiet', '--eval', cleanup_script], capture_output=True)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
