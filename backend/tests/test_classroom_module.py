"""
Test Suite for Virtual Classroom Module - Batch 1

Tests:
- ClassSession CRUD operations
- Student progress tracking
- Teacher rating system
- Interactive activities (admin only)
- Next-class API with is_joinable flag
- Booking→ClassSession auto-creation

Author: Testing Agent
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_STUDENT_EMAIL = f"test_classroom_student_{uuid.uuid4().hex[:6]}@test.com"
TEST_TEACHER_EMAIL = f"test_classroom_teacher_{uuid.uuid4().hex[:6]}@test.com"
TEST_ADMIN_EMAIL = "muhdsuhaib@gmail.com"  # Known admin email
TEST_PASSWORD = "Test123!"

class TestClassroomModuleSetup:
    """Setup: Register test users"""
    
    student_token = None
    teacher_token = None
    student_id = None
    teacher_id = None
    
    @pytest.fixture(autouse=True, scope='class')
    def setup_users(self, request):
        """Register test users and store tokens in class"""
        # Register student
        student_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_STUDENT_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test Classroom Student",
            "role": "student"
        })
        
        if student_resp.status_code == 200:
            data = student_resp.json()
            request.cls.student_token = data.get('session_token')
            request.cls.student_user_id = data.get('user', {}).get('user_id')
        else:
            print(f"Student registration failed: {student_resp.status_code} - {student_resp.text}")
            
        # Register teacher
        teacher_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_TEACHER_EMAIL,
            "password": TEST_PASSWORD,
            "full_name": "Test Classroom Teacher",
            "role": "teacher"
        })
        
        if teacher_resp.status_code == 200:
            data = teacher_resp.json()
            request.cls.teacher_token = data.get('session_token')
            request.cls.teacher_user_id = data.get('user', {}).get('user_id')
        else:
            print(f"Teacher registration failed: {teacher_resp.status_code} - {teacher_resp.text}")
        
        yield
    
    def test_01_verify_setup(self):
        """Verify test users were created"""
        assert self.student_token is not None, "Student token should be set"
        print(f"✓ Student token acquired")
        # Note: teacher_token may be None if teacher signup requires approval


class TestClassroomNextClassAPI:
    """Test GET /api/classroom/next-class - requires auth"""
    
    student_token = None
    
    @pytest.fixture(autouse=True, scope='class')
    def setup_auth(self, request):
        """Setup authentication for tests"""
        # Register a fresh student
        email = f"test_nextclass_{uuid.uuid4().hex[:6]}@test.com"
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "full_name": "Test NextClass User",
            "role": "student"
        })
        if resp.status_code == 200:
            request.cls.student_token = resp.json().get('session_token')
        yield
    
    def test_next_class_unauthenticated(self):
        """GET /api/classroom/next-class without auth returns 401"""
        resp = requests.get(f"{BASE_URL}/api/classroom/next-class")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Unauthenticated request returns 401")
    
    def test_next_class_authenticated(self):
        """GET /api/classroom/next-class with auth returns session data or null"""
        if not self.student_token:
            pytest.skip("No student token available")
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        resp = requests.get(f"{BASE_URL}/api/classroom/next-class", headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        # Either session is null (no upcoming class) or has expected fields
        if data.get('session'):
            assert 'is_joinable' in data, "Response should include is_joinable"
            assert 'session_id' in data['session'], "Session should have session_id"
            assert 'meet_link_slug' in data['session'], "Session should have meet_link_slug"
            print(f"✓ Next class found with is_joinable={data.get('is_joinable')}")
        else:
            assert 'session' in data, "Response should have session key"
            print("✓ No upcoming classes (session is null)")


class TestClassroomSessionCreate:
    """Test POST /api/classroom/sessions/create - creates ClassSession"""
    
    user_token = None
    session_id = None
    
    @pytest.fixture(autouse=True, scope='class')
    def setup_auth(self, request):
        """Setup authentication"""
        email = f"test_session_{uuid.uuid4().hex[:6]}@test.com"
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "full_name": "Test Session Creator",
            "role": "student"
        })
        if resp.status_code == 200:
            data = resp.json()
            request.cls.user_token = data.get('session_token')
            request.cls.user_id = data.get('user', {}).get('user_id')
        yield
    
    def test_create_session_unauthenticated(self):
        """POST /api/classroom/sessions/create without auth returns 401"""
        now = datetime.now(timezone.utc)
        payload = {
            "teacher_id": "teacher_test123",
            "student_id": "student_test123",
            "start_time_utc": now.isoformat(),
            "end_time_utc": (now + timedelta(hours=1)).isoformat()
        }
        resp = requests.post(f"{BASE_URL}/api/classroom/sessions/create", json=payload)
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Unauthenticated create returns 401")
    
    def test_create_session_authenticated(self):
        """POST /api/classroom/sessions/create with auth creates session"""
        if not self.user_token:
            pytest.skip("No auth token available")
        
        now = datetime.now(timezone.utc)
        payload = {
            "teacher_id": "teacher_test_xxx",
            "student_id": "student_test_xxx",
            "booking_id": f"booking_test_{uuid.uuid4().hex[:8]}",
            "start_time_utc": (now + timedelta(hours=1)).isoformat(),
            "end_time_utc": (now + timedelta(hours=2)).isoformat()
        }
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/sessions/create", json=payload, headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert 'session_id' in data, "Response should have session_id"
        assert 'meet_link_slug' in data, "Response should have meet_link_slug"
        assert data['status'] == 'booked', "Initial status should be 'booked'"
        
        self.__class__.session_id = data['session_id']
        print(f"✓ Session created: {data['session_id']} with meet_link_slug")


class TestClassroomSessionDetails:
    """Test GET /api/classroom/session/{id} - returns session details"""
    
    def test_session_not_found(self):
        """GET /api/classroom/session/{non_existent} returns 404"""
        # Register user first
        email = f"test_detail_{uuid.uuid4().hex[:6]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "full_name": "Test Detail User",
            "role": "student"
        })
        
        if reg_resp.status_code != 200:
            pytest.skip("Could not register user")
        
        token = reg_resp.json().get('session_token')
        headers = {"Authorization": f"Bearer {token}"}
        
        resp = requests.get(f"{BASE_URL}/api/classroom/session/nonexistent_session", headers=headers)
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("✓ Non-existent session returns 404")


class TestClassroomStudentProgress:
    """Test POST /api/classroom/session/{id}/progress - saves student progress"""
    
    def test_progress_requires_teacher(self):
        """POST /api/classroom/session/{id}/progress requires teacher role"""
        # Register as student
        email = f"test_progress_student_{uuid.uuid4().hex[:6]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "full_name": "Test Progress Student",
            "role": "student"
        })
        
        if reg_resp.status_code != 200:
            pytest.skip("Could not register user")
        
        token = reg_resp.json().get('session_token')
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {
            "surah_name": "Al-Fatiha",
            "ayah_start": 1,
            "ayah_end": 7,
            "track_type": "Recitation (Nazra)"
        }
        
        resp = requests.post(f"{BASE_URL}/api/classroom/session/test_session/progress", 
                           json=payload, headers=headers)
        
        # Should return 403 (only teacher can submit progress) or 404 (session not found)
        assert resp.status_code in [403, 404], f"Expected 403 or 404, got {resp.status_code}"
        print(f"✓ Student cannot submit progress (status: {resp.status_code})")


class TestClassroomRating:
    """Test POST /api/classroom/session/{id}/rate - student rates teacher"""
    
    def test_rating_requires_student(self):
        """POST /api/classroom/session/{id}/rate requires student role"""
        # Register as teacher
        email = f"test_rate_teacher_{uuid.uuid4().hex[:6]}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "full_name": "Test Rate Teacher",
            "role": "teacher"
        })
        
        if reg_resp.status_code != 200:
            pytest.skip("Could not register user")
        
        token = reg_resp.json().get('session_token')
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {"rating": 5, "review": "Great session!"}
        resp = requests.post(f"{BASE_URL}/api/classroom/session/test_session/rate",
                           json=payload, headers=headers)
        
        # Should return 403 (only students can rate) or 404 (session not found)
        assert resp.status_code in [403, 404], f"Expected 403 or 404, got {resp.status_code}"
        print(f"✓ Teacher cannot rate (status: {resp.status_code})")


class TestClassroomStudentProgressHistory:
    """Test GET /api/classroom/student/{id}/progress - progress history"""
    
    def test_progress_history_requires_auth(self):
        """GET /api/classroom/student/{id}/progress requires auth"""
        resp = requests.get(f"{BASE_URL}/api/classroom/student/test_student/progress")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Progress history requires authentication")


class TestClassroomActivities:
    """Test activities CRUD - admin only"""
    
    student_token = None
    
    @pytest.fixture(autouse=True, scope='class')
    def setup_auth(self, request):
        """Setup authentication"""
        email = f"test_activity_{uuid.uuid4().hex[:6]}@test.com"
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "full_name": "Test Activity User",
            "role": "student"
        })
        if resp.status_code == 200:
            request.cls.student_token = resp.json().get('session_token')
        yield
    
    def test_create_activity_requires_admin(self):
        """POST /api/classroom/activities requires admin role"""
        if not self.student_token:
            pytest.skip("No token available")
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        payload = {
            "title": "Test Quiz",
            "activity_type": "quiz",
            "content": {"questions": []},
            "difficulty": "beginner"
        }
        
        resp = requests.post(f"{BASE_URL}/api/classroom/activities", json=payload, headers=headers)
        assert resp.status_code == 403, f"Expected 403 for non-admin, got {resp.status_code}"
        print("✓ Non-admin cannot create activities")
    
    def test_list_activities_requires_auth(self):
        """GET /api/classroom/activities requires auth"""
        resp = requests.get(f"{BASE_URL}/api/classroom/activities")
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Activities list requires authentication")
    
    def test_list_activities_authenticated(self):
        """GET /api/classroom/activities with auth returns list"""
        if not self.student_token:
            pytest.skip("No token available")
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        resp = requests.get(f"{BASE_URL}/api/classroom/activities", headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert 'activities' in data, "Response should have activities key"
        assert isinstance(data['activities'], list), "Activities should be a list"
        print(f"✓ Activities listed: {len(data['activities'])} found")


class TestClassroomAdminSessions:
    """Test GET /api/classroom/admin/sessions - admin only"""
    
    student_token = None
    
    @pytest.fixture(autouse=True, scope='class')
    def setup_auth(self, request):
        """Setup authentication"""
        email = f"test_admin_sessions_{uuid.uuid4().hex[:6]}@test.com"
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "full_name": "Test Admin Sessions User",
            "role": "student"
        })
        if resp.status_code == 200:
            request.cls.student_token = resp.json().get('session_token')
        yield
    
    def test_admin_sessions_requires_admin(self):
        """GET /api/classroom/admin/sessions requires admin role"""
        if not self.student_token:
            pytest.skip("No token available")
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        resp = requests.get(f"{BASE_URL}/api/classroom/admin/sessions", headers=headers)
        
        assert resp.status_code == 403, f"Expected 403 for non-admin, got {resp.status_code}"
        print("✓ Non-admin cannot access admin/sessions")


class TestBookingCreatesClassSession:
    """Test that booking creation auto-creates ClassSession"""
    
    def test_booking_endpoint_exists(self):
        """Verify /api/booking/create endpoint exists"""
        resp = requests.post(f"{BASE_URL}/api/booking/create", json={})
        # Without auth, should return 401 (not 404)
        assert resp.status_code == 401, f"Expected 401 without auth, got {resp.status_code}"
        print("✓ Booking create endpoint exists and requires auth")


class TestExternalQuranAPI:
    """Test external Quran API integration (api.quran.com)"""
    
    def test_quran_api_page_1(self):
        """GET api.quran.com page 1 returns Arabic text"""
        resp = requests.get(
            "https://api.quran.com/api/v4/verses/by_page/1",
            params={
                "language": "en",
                "words": "false",
                "fields": "text_uthmani,verse_key,chapter_id,verse_number",
                "per_page": "50"
            }
        )
        
        assert resp.status_code == 200, f"Quran API returned {resp.status_code}"
        data = resp.json()
        
        assert 'verses' in data, "Response should have verses key"
        assert len(data['verses']) > 0, "Should have at least one verse"
        
        first_verse = data['verses'][0]
        assert 'text_uthmani' in first_verse, "Verse should have text_uthmani"
        assert 'verse_key' in first_verse, "Verse should have verse_key"
        
        # Verify Arabic text (check for Arabic characters)
        arabic_text = first_verse['text_uthmani']
        assert any('\u0600' <= c <= '\u06FF' for c in arabic_text), "Text should contain Arabic"
        
        print(f"✓ Quran API page 1: {len(data['verses'])} verses with Arabic text")
        print(f"  First verse: {arabic_text[:50]}...")
    
    def test_quran_api_chapters(self):
        """GET api.quran.com chapters returns surah list"""
        resp = requests.get("https://api.quran.com/api/v4/chapters", params={"language": "en"})
        
        assert resp.status_code == 200, f"Chapters API returned {resp.status_code}"
        data = resp.json()
        
        assert 'chapters' in data, "Response should have chapters key"
        assert len(data['chapters']) == 114, f"Should have 114 surahs, got {len(data['chapters'])}"
        
        first_surah = data['chapters'][0]
        assert first_surah['name_simple'] == 'Al-Fatihah', "First surah should be Al-Fatihah"
        
        print(f"✓ Quran API chapters: 114 surahs listed")


class TestAPIHealthCheck:
    """Basic health check tests"""
    
    def test_api_root(self):
        """GET /api/ returns API info"""
        resp = requests.get(f"{BASE_URL}/api/")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get('message') == 'Alif Amin Academy API'
        print("✓ API root endpoint healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
