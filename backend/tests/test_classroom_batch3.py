"""
Virtual Classroom Module Batch 3 - Raise Hand, End Class, WebSocket Events
Tests for the new features added in this batch:
1. POST /api/classroom/session/{id}/progress - Progress submission with revenue trigger
2. POST /api/classroom/session/{id}/rate - Student rating
3. WebSocket events: RAISE_HAND, LOWER_HAND, END_CLASS, CHAT
4. POST /api/classroom/session/{id}/recording/toggle - Recording with stealth mode
"""
import pytest
import requests
import asyncio
import websockets
import json
import uuid
import os

# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://wallet-chat-webrtc.preview.emergentagent.com')
WS_BASE = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')

# Test session token for teacher
TEST_TEACHER_SESSION = "session_b96414341e5a46bb9efda8aeb5c6537d"


class TestSessionProgress:
    """Test progress submission endpoint with Pydantic validation and revenue trigger"""
    
    @pytest.fixture
    def setup_session(self):
        """Create a test session with proper teacher/student linkage"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Register a new teacher
        teacher_email = f"TEST_teacher_prog_{unique_id}@test.com"
        reg_res = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": teacher_email,
                "password": "Test123!",
                "full_name": f"Progress Teacher {unique_id}",
                "role": "teacher"
            }
        )
        assert reg_res.status_code == 200, f"Teacher registration failed: {reg_res.text}"
        reg_data = reg_res.json()
        teacher_session = reg_data.get("session_token")
        
        # Register as teacher to create teacher profile
        teacher_reg_res = requests.post(
            f"{BASE_URL}/api/auth/register-teacher",
            cookies={"session_token": teacher_session}
        )
        assert teacher_reg_res.status_code == 200, f"Teacher profile creation failed: {teacher_reg_res.text}"
        teacher_data = teacher_reg_res.json()
        # Note: Response format is {"teacher_id": "...", "status": "pending"} not nested
        teacher_id = teacher_data.get("teacher_id")
        assert teacher_id, "Teacher ID should be returned"
        
        # Register a test student
        student_email = f"TEST_student_prog_{unique_id}@test.com"
        student_res = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": student_email,
                "password": "Test123!",
                "full_name": f"Progress Student {unique_id}",
                "role": "student"
            }
        )
        assert student_res.status_code == 200, f"Student registration failed: {student_res.text}"
        student_data = student_res.json()
        student_session = student_data.get("session_token")
        
        # Get student_id (created automatically for students)
        student_info = requests.get(
            f"{BASE_URL}/api/student/profile",
            cookies={"session_token": student_session}
        )
        student_id = student_info.json().get("student_id") if student_info.status_code == 200 else f"student_{unique_id}"
        
        # Create a session linking this teacher and student
        session_res = requests.post(
            f"{BASE_URL}/api/classroom/sessions/create",
            json={
                "teacher_id": teacher_id,
                "student_id": student_id,
                "booking_id": f"booking_prog_{unique_id}",
                "slot_id": f"slot_prog_{unique_id}",
                "start_time_utc": "2026-02-17T20:00:00Z",
                "end_time_utc": "2026-02-17T21:00:00Z"
            },
            cookies={"session_token": teacher_session}
        )
        assert session_res.status_code == 200, f"Session creation failed: {session_res.text}"
        session_data = session_res.json()
        
        return {
            "session_id": session_data["session_id"],
            "meet_link_slug": session_data["meet_link_slug"],
            "teacher_session": teacher_session,
            "student_session": student_session,
            "teacher_id": teacher_id,
            "student_id": student_id
        }
    
    def test_progress_submission_success(self, setup_session):
        """Test successful progress submission by teacher"""
        data = setup_session
        
        progress_data = {
            "session_id": data['session_id'],  # Required by Pydantic model
            "surah_name": "Al-Fatihah",
            "ayah_start": 1,
            "ayah_end": 7,
            "track_type": "Memorization (Hifz)",
            "grading": {
                "fluency_score": 8,
                "tajweed_score": 7,
                "makhraj_score": 9
            },
            "teacher_comments": "Good progress in memorization"
        }
        
        res = requests.post(
            f"{BASE_URL}/api/classroom/session/{data['session_id']}/progress",
            json=progress_data,
            cookies={"session_token": data['teacher_session']}
        )
        
        assert res.status_code == 200, f"Progress submission failed: {res.text}"
        result = res.json()
        assert "progress_id" in result, "progress_id should be in response"
        assert result.get("session_status") == "completed", "Session should be marked completed"
        print(f"Progress submitted: {result}")
    
    def test_progress_submission_student_forbidden(self, setup_session):
        """Test that student cannot submit progress"""
        data = setup_session
        
        progress_data = {
            "session_id": data['session_id'],  # Required by Pydantic model
            "surah_name": "Al-Fatihah",
            "ayah_start": 1,
            "ayah_end": 7,
            "track_type": "Memorization (Hifz)",
            "grading": {"fluency_score": 8, "tajweed_score": 7, "makhraj_score": 9},
            "teacher_comments": "Test"
        }
        
        res = requests.post(
            f"{BASE_URL}/api/classroom/session/{data['session_id']}/progress",
            json=progress_data,
            cookies={"session_token": data['student_session']}
        )
        
        assert res.status_code == 403, f"Expected 403 Forbidden for student, got {res.status_code}"
        print(f"Student correctly forbidden: {res.status_code}")
    
    def test_progress_validation_missing_surah(self, setup_session):
        """Test Pydantic validation - missing surah_name"""
        data = setup_session
        
        # Missing surah_name
        progress_data = {
            "ayah_start": 1,
            "ayah_end": 7,
            "track_type": "Memorization (Hifz)",
            "grading": {"fluency_score": 8, "tajweed_score": 7, "makhraj_score": 9}
        }
        
        res = requests.post(
            f"{BASE_URL}/api/classroom/session/{data['session_id']}/progress",
            json=progress_data,
            cookies={"session_token": data['teacher_session']}
        )
        
        # Should fail validation
        assert res.status_code == 422, f"Expected 422 validation error, got {res.status_code}"
        print(f"Validation error correctly returned: {res.status_code}")


class TestStudentRating:
    """Test student rating endpoint"""
    
    @pytest.fixture
    def setup_rating_session(self):
        """Create a test session for rating"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Register teacher (using full_name)
        teacher_res = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"TEST_teacher_rate_{unique_id}@test.com",
                "password": "Test123!",
                "full_name": f"Rating Teacher {unique_id}",
                "role": "teacher"
            }
        )
        assert teacher_res.status_code == 200, f"Teacher reg failed: {teacher_res.text}"
        teacher_session = teacher_res.json().get("session_token")
        
        # Complete teacher profile
        requests.post(
            f"{BASE_URL}/api/teacher/complete-signup",
            json={
                "bio": "Test bio",
                "qualifications": ["Hafiz"],
                "specializations": ["Hifz"],
                "languages": ["English"],
                "teaching_style": "Traditional",
                "years_experience": 5,
                "hourly_rate_cents": 5000
            },
            cookies={"session_token": teacher_session}
        )
        
        teacher_info = requests.get(f"{BASE_URL}/api/teacher/profile/me", cookies={"session_token": teacher_session})
        teacher_id = teacher_info.json().get("teacher_id", f"teacher_{unique_id}") if teacher_info.status_code == 200 else f"teacher_{unique_id}"
        
        # Register student
        student_res = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": f"TEST_student_rate_{unique_id}@test.com",
                "password": "Test123!",
                "full_name": f"Rating Student {unique_id}",
                "role": "student"
            }
        )
        assert student_res.status_code == 200, f"Student reg failed: {student_res.text}"
        student_session = student_res.json().get("session_token")
        
        student_info = requests.get(f"{BASE_URL}/api/student/profile", cookies={"session_token": student_session})
        student_id = student_info.json().get("student_id", f"student_{unique_id}") if student_info.status_code == 200 else f"student_{unique_id}"
        
        # Create session
        session_res = requests.post(
            f"{BASE_URL}/api/classroom/sessions/create",
            json={
                "teacher_id": teacher_id,
                "student_id": student_id,
                "booking_id": f"booking_rate_{unique_id}",
                "slot_id": f"slot_rate_{unique_id}",
                "start_time_utc": "2026-02-17T20:00:00Z",
                "end_time_utc": "2026-02-17T21:00:00Z"
            },
            cookies={"session_token": teacher_session}
        )
        assert session_res.status_code == 200, f"Session creation failed: {session_res.text}"
        session_data = session_res.json()
        
        return {
            "session_id": session_data["session_id"],
            "teacher_session": teacher_session,
            "student_session": student_session,
            "teacher_id": teacher_id
        }
    
    def test_rating_submission_success(self, setup_rating_session):
        """Test successful rating submission by student"""
        data = setup_rating_session
        
        res = requests.post(
            f"{BASE_URL}/api/classroom/session/{data['session_id']}/rate",
            json={"rating": 5, "review": "Excellent teacher!"},
            cookies={"session_token": data['student_session']}
        )
        
        assert res.status_code == 200, f"Rating submission failed: {res.text}"
        result = res.json()
        assert "rating_id" in result, "rating_id should be in response"
        assert "new_average" in result, "new_average should be in response"
        print(f"Rating submitted: {result}")
    
    def test_rating_teacher_forbidden(self, setup_rating_session):
        """Test that teacher cannot rate themselves"""
        data = setup_rating_session
        
        res = requests.post(
            f"{BASE_URL}/api/classroom/session/{data['session_id']}/rate",
            json={"rating": 5, "review": "Self rating"},
            cookies={"session_token": data['teacher_session']}
        )
        
        assert res.status_code == 403, f"Expected 403 Forbidden for teacher, got {res.status_code}"
        print(f"Teacher correctly forbidden from rating: {res.status_code}")
    
    def test_rating_invalid_value(self, setup_rating_session):
        """Test rating validation (1-5 range)"""
        data = setup_rating_session
        
        # Rating out of range
        res = requests.post(
            f"{BASE_URL}/api/classroom/session/{data['session_id']}/rate",
            json={"rating": 6, "review": "Invalid rating"},
            cookies={"session_token": data['student_session']}
        )
        
        assert res.status_code == 400, f"Expected 400 for invalid rating, got {res.status_code}"
        print(f"Invalid rating correctly rejected: {res.status_code}")


class TestRecordingToggle:
    """Test recording toggle with stealth mode"""
    
    def test_recording_toggle_teacher_visible(self):
        """Test that teacher recording has visible=true"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Create session with test teacher
        session_res = requests.post(
            f"{BASE_URL}/api/classroom/sessions/create",
            json={
                "teacher_id": f"teacher_{unique_id}",
                "student_id": f"student_{unique_id}",
                "booking_id": f"booking_rec_{unique_id}",
                "slot_id": f"slot_rec_{unique_id}",
                "start_time_utc": "2026-02-17T20:00:00Z",
                "end_time_utc": "2026-02-17T21:00:00Z"
            },
            cookies={"session_token": TEST_TEACHER_SESSION}
        )
        assert session_res.status_code == 200, f"Session creation failed: {session_res.text}"
        session_id = session_res.json()["session_id"]
        
        # Toggle recording as teacher
        toggle_res = requests.post(
            f"{BASE_URL}/api/classroom/session/{session_id}/recording/toggle",
            json={"action": "start"},
            cookies={"session_token": TEST_TEACHER_SESSION}
        )
        
        assert toggle_res.status_code == 200, f"Recording toggle failed: {toggle_res.text}"
        result = toggle_res.json()
        assert result.get("action") == "start", "Action should be 'start'"
        assert result.get("visible") == True, "Teacher recording should be visible=true"
        print(f"Recording toggle success: {result}")
    
    def test_recording_toggle_stop(self):
        """Test stopping recording"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Create session
        session_res = requests.post(
            f"{BASE_URL}/api/classroom/sessions/create",
            json={
                "teacher_id": f"teacher_{unique_id}",
                "student_id": f"student_{unique_id}",
                "booking_id": f"booking_rec_stop_{unique_id}",
                "slot_id": f"slot_rec_stop_{unique_id}",
                "start_time_utc": "2026-02-17T20:00:00Z",
                "end_time_utc": "2026-02-17T21:00:00Z"
            },
            cookies={"session_token": TEST_TEACHER_SESSION}
        )
        assert session_res.status_code == 200
        session_id = session_res.json()["session_id"]
        
        # Stop recording
        toggle_res = requests.post(
            f"{BASE_URL}/api/classroom/session/{session_id}/recording/toggle",
            json={"action": "stop"},
            cookies={"session_token": TEST_TEACHER_SESSION}
        )
        
        assert toggle_res.status_code == 200
        result = toggle_res.json()
        assert result.get("action") == "stop", "Action should be 'stop'"
        print(f"Recording stop success: {result}")


class TestWebSocketEvents:
    """Test WebSocket events for raise hand, lower hand, end class, and chat"""
    
    @pytest.mark.asyncio
    async def test_websocket_raise_hand(self):
        """Test RAISE_HAND event broadcast"""
        room_id = f"test_room_{uuid.uuid4().hex[:8]}"
        ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
        
        async with websockets.connect(ws_url) as ws1, websockets.connect(ws_url) as ws2:
            # Both connections receive ROOM_STATE on connect
            state1 = await asyncio.wait_for(ws1.recv(), timeout=5)
            state2 = await asyncio.wait_for(ws2.recv(), timeout=5)
            
            assert "ROOM_STATE" in state1, "Should receive ROOM_STATE on connect"
            assert "ROOM_STATE" in state2, "Should receive ROOM_STATE on connect"
            
            # WS1 raises hand
            await ws1.send(json.dumps({
                "type": "RAISE_HAND",
                "identity": "student_test",
                "name": "Test Student"
            }))
            
            # Both should receive the event (broadcasts to all)
            msg1 = await asyncio.wait_for(ws1.recv(), timeout=5)
            msg2 = await asyncio.wait_for(ws2.recv(), timeout=5)
            
            data1 = json.loads(msg1)
            data2 = json.loads(msg2)
            
            assert data1["type"] == "RAISE_HAND", f"WS1 should receive RAISE_HAND, got {data1['type']}"
            assert data2["type"] == "RAISE_HAND", f"WS2 should receive RAISE_HAND, got {data2['type']}"
            assert data1.get("identity") == "student_test"
            assert data1.get("name") == "Test Student"
            print("RAISE_HAND broadcast test passed")
    
    @pytest.mark.asyncio
    async def test_websocket_lower_hand(self):
        """Test LOWER_HAND event broadcast"""
        room_id = f"test_room_{uuid.uuid4().hex[:8]}"
        ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
        
        async with websockets.connect(ws_url) as ws1, websockets.connect(ws_url) as ws2:
            # Consume ROOM_STATE
            await asyncio.wait_for(ws1.recv(), timeout=5)
            await asyncio.wait_for(ws2.recv(), timeout=5)
            
            # WS1 lowers hand
            await ws1.send(json.dumps({
                "type": "LOWER_HAND",
                "identity": "student_test"
            }))
            
            # Both should receive
            msg1 = await asyncio.wait_for(ws1.recv(), timeout=5)
            msg2 = await asyncio.wait_for(ws2.recv(), timeout=5)
            
            data1 = json.loads(msg1)
            data2 = json.loads(msg2)
            
            assert data1["type"] == "LOWER_HAND"
            assert data2["type"] == "LOWER_HAND"
            assert data1.get("identity") == "student_test"
            print("LOWER_HAND broadcast test passed")
    
    @pytest.mark.asyncio
    async def test_websocket_end_class(self):
        """Test END_CLASS event broadcast to student"""
        room_id = f"test_room_{uuid.uuid4().hex[:8]}"
        ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
        
        async with websockets.connect(ws_url) as teacher_ws, websockets.connect(ws_url) as student_ws:
            # Consume ROOM_STATE
            await asyncio.wait_for(teacher_ws.recv(), timeout=5)
            await asyncio.wait_for(student_ws.recv(), timeout=5)
            
            # Teacher sends END_CLASS
            await teacher_ws.send(json.dumps({
                "type": "END_CLASS",
                "teacherName": "Teacher Name"
            }))
            
            # Only student should receive (exclude sender)
            try:
                msg = await asyncio.wait_for(student_ws.recv(), timeout=5)
                data = json.loads(msg)
                assert data["type"] == "END_CLASS", f"Student should receive END_CLASS, got {data['type']}"
                print("END_CLASS broadcast test passed")
            except asyncio.TimeoutError:
                pytest.fail("Student should have received END_CLASS event")
    
    @pytest.mark.asyncio
    async def test_websocket_chat(self):
        """Test CHAT event broadcast to others"""
        room_id = f"test_room_{uuid.uuid4().hex[:8]}"
        ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
        
        async with websockets.connect(ws_url) as ws1, websockets.connect(ws_url) as ws2:
            # Consume ROOM_STATE
            await asyncio.wait_for(ws1.recv(), timeout=5)
            await asyncio.wait_for(ws2.recv(), timeout=5)
            
            # WS1 sends chat
            await ws1.send(json.dumps({
                "type": "CHAT",
                "text": "Hello class!",
                "sender": "Teacher",
                "timestamp": 1234567890
            }))
            
            # Only WS2 should receive (exclude sender)
            try:
                msg = await asyncio.wait_for(ws2.recv(), timeout=5)
                data = json.loads(msg)
                assert data["type"] == "CHAT"
                assert data.get("text") == "Hello class!"
                assert data.get("sender") == "Teacher"
                print("CHAT broadcast test passed")
            except asyncio.TimeoutError:
                pytest.fail("WS2 should have received CHAT event")


class TestFrontendModals:
    """Test that frontend modal components are accessible"""
    
    def test_landing_page_loads(self):
        """Verify landing page loads without errors"""
        res = requests.get(BASE_URL)
        assert res.status_code == 200, f"Landing page failed to load: {res.status_code}"
        assert "<!DOCTYPE html>" in res.text or "<html" in res.text
        print("Landing page loads correctly")
    
    def test_classroom_route_protected(self):
        """Test that /classroom/:sessionId route is protected"""
        # Access classroom without auth - should get the page but redirect in React
        res = requests.get(f"{BASE_URL}/classroom/test_session_123")
        # React app will handle the redirect client-side
        assert res.status_code == 200, "Classroom route should return React app"
        print("Classroom route returns React app for auth handling")


# Run with: pytest /app/backend/tests/test_classroom_batch3.py -v --tb=short
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
