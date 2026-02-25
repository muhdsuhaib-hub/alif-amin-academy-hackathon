"""
Test Suite for Virtual Classroom Module - Batch 2

Tests:
- POST /api/classroom/livekit/token - LiveKit token generation
- WebSocket /api/classroom/ws/{room_id} - Real-time sync
- POST /api/classroom/session/{id}/recording/toggle - Recording control
- Batch 1 regression tests

Author: Testing Agent
"""

import pytest
import requests
import os
import uuid
import json
import asyncio
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://quran-sync-live.preview.emergentagent.com').rstrip('/')
WS_BASE = BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')

# Test credentials
TEST_PASSWORD = "Test123!"


class TestLiveKitTokenGeneration:
    """Test POST /api/classroom/livekit/token - generates LiveKit JWT token"""
    
    teacher_token = None
    student_token = None
    
    @pytest.fixture(autouse=True, scope='class')
    def setup_users(self, request):
        """Register test users for LiveKit tests"""
        # Register teacher
        teacher_email = f"test_lk_teacher_{uuid.uuid4().hex[:6]}@test.com"
        teacher_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": teacher_email,
            "password": TEST_PASSWORD,
            "full_name": "Test LiveKit Teacher",
            "role": "teacher"
        })
        if teacher_resp.status_code == 200:
            request.cls.teacher_token = teacher_resp.json().get('session_token')
            print(f"✓ Teacher registered: {teacher_email}")
        else:
            print(f"Teacher reg failed: {teacher_resp.status_code} - {teacher_resp.text}")
        
        # Register student
        student_email = f"test_lk_student_{uuid.uuid4().hex[:6]}@test.com"
        student_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": student_email,
            "password": TEST_PASSWORD,
            "full_name": "Test LiveKit Student",
            "role": "student"
        })
        if student_resp.status_code == 200:
            request.cls.student_token = student_resp.json().get('session_token')
            print(f"✓ Student registered: {student_email}")
        else:
            print(f"Student reg failed: {student_resp.status_code} - {student_resp.text}")
        
        yield
    
    def test_livekit_token_requires_auth(self):
        """POST /api/classroom/livekit/token without auth returns 401"""
        payload = {"room_name": "test_room_123"}
        resp = requests.post(f"{BASE_URL}/api/classroom/livekit/token", json=payload)
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ LiveKit token requires auth (401)")
    
    def test_livekit_token_requires_room_name(self):
        """POST /api/classroom/livekit/token without room_name returns 400"""
        if not self.teacher_token:
            pytest.skip("No teacher token")
        
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/livekit/token", json={}, headers=headers)
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"
        print("✓ LiveKit token requires room_name (400)")
    
    def test_livekit_token_teacher_success(self):
        """POST /api/classroom/livekit/token for teacher returns valid JWT with server_url"""
        if not self.teacher_token:
            pytest.skip("No teacher token")
        
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        payload = {"room_name": f"room_{uuid.uuid4().hex[:8]}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/livekit/token", json=payload, headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        # Validate response structure
        assert 'token' in data, "Response should have 'token'"
        assert 'server_url' in data, "Response should have 'server_url'"
        assert 'identity' in data, "Response should have 'identity'"
        assert 'name' in data, "Response should have 'name'"
        assert 'is_teacher' in data, "Response should have 'is_teacher'"
        
        # Validate token format (JWT has 3 parts separated by .)
        token = data['token']
        assert token.count('.') == 2, f"Token should be JWT format, got: {token[:50]}..."
        
        # Validate server_url format
        assert data['server_url'].startswith('wss://'), f"server_url should be WSS, got: {data['server_url']}"
        
        # Validate is_teacher for teacher role
        assert data['is_teacher'] == True, "Teacher should have is_teacher=True"
        
        print(f"✓ LiveKit token generated for teacher")
        print(f"  server_url: {data['server_url']}")
        print(f"  identity: {data['identity']}")
        print(f"  is_teacher: {data['is_teacher']}")
    
    def test_livekit_token_student_success(self):
        """POST /api/classroom/livekit/token for student returns valid JWT"""
        if not self.student_token:
            pytest.skip("No student token")
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        payload = {"room_name": f"room_{uuid.uuid4().hex[:8]}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/livekit/token", json=payload, headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert 'token' in data, "Response should have 'token'"
        assert data['is_teacher'] == False, "Student should have is_teacher=False"
        
        print(f"✓ LiveKit token generated for student (is_teacher=False)")


class TestWebSocketConnection:
    """Test WebSocket /api/classroom/ws/{room_id} - real-time sync"""
    
    def test_websocket_connect_and_room_state(self):
        """WebSocket connects and receives ROOM_STATE on join"""
        import asyncio
        
        async def ws_test():
            try:
                import websockets
                room_id = f"test_room_{uuid.uuid4().hex[:8]}"
                ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
                
                print(f"  Connecting to: {ws_url}")
                
                async with websockets.connect(ws_url, ping_timeout=10) as ws:
                    # Should receive ROOM_STATE immediately on connect
                    msg = await asyncio.wait_for(ws.recv(), timeout=5)
                    data = json.loads(msg)
                    
                    assert data.get('type') == 'ROOM_STATE', f"Expected ROOM_STATE, got: {data.get('type')}"
                    assert 'page' in data, "ROOM_STATE should have 'page'"
                    assert 'highlights' in data, "ROOM_STATE should have 'highlights'"
                    assert 'recording' in data, "ROOM_STATE should have 'recording'"
                    
                    print(f"  ✓ ROOM_STATE received: page={data['page']}, highlights={len(data['highlights'])}")
                    return True
                    
            except Exception as e:
                print(f"  WebSocket test error: {e}")
                return False
        
        result = asyncio.get_event_loop().run_until_complete(ws_test())
        assert result, "WebSocket test failed"
        print("✓ WebSocket connect and ROOM_STATE verified")
    
    def test_websocket_page_change_broadcast(self):
        """WebSocket broadcasts PAGE_CHANGE events between connections"""
        import asyncio
        
        async def ws_broadcast_test():
            try:
                import websockets
                room_id = f"test_room_{uuid.uuid4().hex[:8]}"
                ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
                
                async with websockets.connect(ws_url, ping_timeout=10) as ws1:
                    # Clear initial ROOM_STATE
                    await asyncio.wait_for(ws1.recv(), timeout=5)
                    
                    async with websockets.connect(ws_url, ping_timeout=10) as ws2:
                        # Clear initial ROOM_STATE for ws2
                        await asyncio.wait_for(ws2.recv(), timeout=5)
                        
                        # ws1 sends PAGE_CHANGE
                        await ws1.send(json.dumps({
                            "type": "PAGE_CHANGE",
                            "page": 42
                        }))
                        
                        # ws2 should receive it
                        msg = await asyncio.wait_for(ws2.recv(), timeout=5)
                        data = json.loads(msg)
                        
                        assert data.get('type') == 'PAGE_CHANGE', f"Expected PAGE_CHANGE, got: {data.get('type')}"
                        assert data.get('page') == 42, f"Expected page=42, got: {data.get('page')}"
                        
                        print(f"  ✓ PAGE_CHANGE broadcast: page={data['page']}")
                        return True
                        
            except Exception as e:
                print(f"  PAGE_CHANGE test error: {e}")
                return False
        
        result = asyncio.get_event_loop().run_until_complete(ws_broadcast_test())
        assert result, "PAGE_CHANGE broadcast test failed"
        print("✓ WebSocket PAGE_CHANGE broadcast verified")
    
    def test_websocket_pointer_move(self):
        """WebSocket handles POINTER_MOVE events"""
        import asyncio
        
        async def ws_pointer_test():
            try:
                import websockets
                room_id = f"test_room_{uuid.uuid4().hex[:8]}"
                ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
                
                async with websockets.connect(ws_url, ping_timeout=10) as ws1:
                    await asyncio.wait_for(ws1.recv(), timeout=5)  # ROOM_STATE
                    
                    async with websockets.connect(ws_url, ping_timeout=10) as ws2:
                        await asyncio.wait_for(ws2.recv(), timeout=5)  # ROOM_STATE
                        
                        # ws1 sends POINTER_MOVE
                        await ws1.send(json.dumps({
                            "type": "POINTER_MOVE",
                            "x": 50.5,
                            "y": 75.2
                        }))
                        
                        # ws2 should receive it
                        msg = await asyncio.wait_for(ws2.recv(), timeout=5)
                        data = json.loads(msg)
                        
                        assert data.get('type') == 'POINTER_MOVE', f"Expected POINTER_MOVE, got: {data.get('type')}"
                        assert data.get('x') == 50.5, f"Expected x=50.5, got: {data.get('x')}"
                        assert data.get('y') == 75.2, f"Expected y=75.2, got: {data.get('y')}"
                        
                        print(f"  ✓ POINTER_MOVE received: x={data['x']}, y={data['y']}")
                        return True
                        
            except Exception as e:
                print(f"  POINTER_MOVE test error: {e}")
                return False
        
        result = asyncio.get_event_loop().run_until_complete(ws_pointer_test())
        assert result, "POINTER_MOVE test failed"
        print("✓ WebSocket POINTER_MOVE verified")
    
    def test_websocket_highlight_sync(self):
        """WebSocket handles HIGHLIGHT events and syncs to all"""
        import asyncio
        
        async def ws_highlight_test():
            try:
                import websockets
                room_id = f"test_room_{uuid.uuid4().hex[:8]}"
                ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
                
                async with websockets.connect(ws_url, ping_timeout=10) as ws1:
                    await asyncio.wait_for(ws1.recv(), timeout=5)  # ROOM_STATE
                    
                    # Send HIGHLIGHT
                    await ws1.send(json.dumps({
                        "type": "HIGHLIGHT",
                        "verseKey": "1:1",
                        "color": "rgba(250, 204, 21, 0.35)"
                    }))
                    
                    # ws1 should receive HIGHLIGHT_SYNC (broadcasts to all including sender)
                    msg = await asyncio.wait_for(ws1.recv(), timeout=5)
                    data = json.loads(msg)
                    
                    assert data.get('type') == 'HIGHLIGHT_SYNC', f"Expected HIGHLIGHT_SYNC, got: {data.get('type')}"
                    assert 'highlights' in data, "HIGHLIGHT_SYNC should have 'highlights'"
                    assert len(data['highlights']) == 1, f"Expected 1 highlight, got: {len(data['highlights'])}"
                    assert data['highlights'][0]['verseKey'] == '1:1', "Highlight should have verseKey=1:1"
                    
                    print(f"  ✓ HIGHLIGHT_SYNC received: {len(data['highlights'])} highlights")
                    return True
                    
            except Exception as e:
                print(f"  HIGHLIGHT test error: {e}")
                return False
        
        result = asyncio.get_event_loop().run_until_complete(ws_highlight_test())
        assert result, "HIGHLIGHT test failed"
        print("✓ WebSocket HIGHLIGHT sync verified")
    
    def test_websocket_navigate_event(self):
        """WebSocket handles NAVIGATE events (Surah/Juz navigation)"""
        import asyncio
        
        async def ws_navigate_test():
            try:
                import websockets
                room_id = f"test_room_{uuid.uuid4().hex[:8]}"
                ws_url = f"{WS_BASE}/api/classroom/ws/{room_id}"
                
                async with websockets.connect(ws_url, ping_timeout=10) as ws1:
                    await asyncio.wait_for(ws1.recv(), timeout=5)  # ROOM_STATE
                    
                    async with websockets.connect(ws_url, ping_timeout=10) as ws2:
                        await asyncio.wait_for(ws2.recv(), timeout=5)  # ROOM_STATE
                        
                        # ws1 sends NAVIGATE (should broadcast as PAGE_CHANGE)
                        await ws1.send(json.dumps({
                            "type": "NAVIGATE",
                            "page": 100  # Jump to page 100 (Juz 5 area)
                        }))
                        
                        # ws2 should receive PAGE_CHANGE
                        msg = await asyncio.wait_for(ws2.recv(), timeout=5)
                        data = json.loads(msg)
                        
                        assert data.get('type') == 'PAGE_CHANGE', f"Expected PAGE_CHANGE, got: {data.get('type')}"
                        assert data.get('page') == 100, f"Expected page=100, got: {data.get('page')}"
                        
                        print(f"  ✓ NAVIGATE -> PAGE_CHANGE: page={data['page']}")
                        return True
                        
            except Exception as e:
                print(f"  NAVIGATE test error: {e}")
                return False
        
        result = asyncio.get_event_loop().run_until_complete(ws_navigate_test())
        assert result, "NAVIGATE test failed"
        print("✓ WebSocket NAVIGATE event verified")


class TestRecordingToggle:
    """Test POST /api/classroom/session/{id}/recording/toggle - recording control"""
    
    teacher_token = None
    student_token = None
    session_id = None
    meet_link_slug = None
    
    @pytest.fixture(autouse=True, scope='class')
    def setup_users_and_session(self, request):
        """Create teacher, student, and a test session"""
        # Register teacher
        teacher_email = f"test_rec_teacher_{uuid.uuid4().hex[:6]}@test.com"
        teacher_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": teacher_email,
            "password": TEST_PASSWORD,
            "full_name": "Test Recording Teacher",
            "role": "teacher"
        })
        if teacher_resp.status_code == 200:
            data = teacher_resp.json()
            request.cls.teacher_token = data.get('session_token')
            request.cls.teacher_user_id = data.get('user', {}).get('user_id')
        
        # Register student
        student_email = f"test_rec_student_{uuid.uuid4().hex[:6]}@test.com"
        student_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": student_email,
            "password": TEST_PASSWORD,
            "full_name": "Test Recording Student",
            "role": "student"
        })
        if student_resp.status_code == 200:
            data = student_resp.json()
            request.cls.student_token = data.get('session_token')
        
        # Create a test session
        if request.cls.teacher_token:
            now = datetime.now(timezone.utc)
            headers = {"Authorization": f"Bearer {request.cls.teacher_token}"}
            session_resp = requests.post(f"{BASE_URL}/api/classroom/sessions/create", json={
                "teacher_id": "teacher_test_rec",
                "student_id": "student_test_rec",
                "start_time_utc": now.isoformat(),
                "end_time_utc": (now + timedelta(hours=1)).isoformat()
            }, headers=headers)
            
            if session_resp.status_code == 200:
                data = session_resp.json()
                request.cls.session_id = data.get('session_id')
                request.cls.meet_link_slug = data.get('meet_link_slug')
                print(f"✓ Test session created: {request.cls.session_id}")
        
        yield
    
    def test_recording_toggle_requires_auth(self):
        """POST /api/classroom/session/{id}/recording/toggle requires auth"""
        if not self.session_id:
            pytest.skip("No session created")
        
        resp = requests.post(f"{BASE_URL}/api/classroom/session/{self.session_id}/recording/toggle",
                           json={"action": "start"})
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        print("✓ Recording toggle requires auth (401)")
    
    def test_recording_toggle_student_forbidden(self):
        """POST /api/classroom/session/{id}/recording/toggle forbids students"""
        if not self.session_id or not self.student_token:
            pytest.skip("No session or student token")
        
        headers = {"Authorization": f"Bearer {self.student_token}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/session/{self.session_id}/recording/toggle",
                           json={"action": "start"}, headers=headers)
        
        assert resp.status_code == 403, f"Expected 403 for student, got {resp.status_code}"
        print("✓ Student cannot toggle recording (403)")
    
    def test_recording_toggle_teacher_start(self):
        """POST /api/classroom/session/{id}/recording/toggle for teacher starts with visible=true"""
        if not self.session_id or not self.teacher_token:
            pytest.skip("No session or teacher token")
        
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/session/{self.session_id}/recording/toggle",
                           json={"action": "start"}, headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert data.get('action') == 'start', f"Expected action=start, got: {data.get('action')}"
        assert data.get('visible') == True, f"Teacher recording should be visible=True, got: {data.get('visible')}"
        assert data.get('session_id') == self.session_id, "session_id should match"
        
        print(f"✓ Teacher recording started: visible={data['visible']}")
    
    def test_recording_toggle_teacher_stop(self):
        """POST /api/classroom/session/{id}/recording/toggle for teacher stops recording"""
        if not self.session_id or not self.teacher_token:
            pytest.skip("No session or teacher token")
        
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/session/{self.session_id}/recording/toggle",
                           json={"action": "stop"}, headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        
        assert data.get('action') == 'stop', f"Expected action=stop, got: {data.get('action')}"
        
        print(f"✓ Teacher recording stopped")
    
    def test_recording_toggle_nonexistent_session(self):
        """POST /api/classroom/session/{bad_id}/recording/toggle returns 404"""
        if not self.teacher_token:
            pytest.skip("No teacher token")
        
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/session/nonexistent_session_xyz/recording/toggle",
                           json={"action": "start"}, headers=headers)
        
        assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
        print("✓ Nonexistent session returns 404")


class TestBatch1Regression:
    """Regression tests for Batch 1 APIs"""
    
    user_token = None
    
    @pytest.fixture(autouse=True, scope='class')
    def setup_auth(self, request):
        """Setup authentication"""
        email = f"test_regression_{uuid.uuid4().hex[:6]}@test.com"
        resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "full_name": "Test Regression User",
            "role": "student"
        })
        if resp.status_code == 200:
            request.cls.user_token = resp.json().get('session_token')
        yield
    
    def test_next_class_api_still_works(self):
        """GET /api/classroom/next-class still works (Batch 1 regression)"""
        if not self.user_token:
            pytest.skip("No token")
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        resp = requests.get(f"{BASE_URL}/api/classroom/next-class", headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert 'session' in data, "Response should have 'session' key"
        print("✓ Batch 1: /api/classroom/next-class works")
    
    def test_activities_list_still_works(self):
        """GET /api/classroom/activities still works (Batch 1 regression)"""
        if not self.user_token:
            pytest.skip("No token")
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        resp = requests.get(f"{BASE_URL}/api/classroom/activities", headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert 'activities' in data, "Response should have 'activities' key"
        print("✓ Batch 1: /api/classroom/activities works")
    
    def test_session_create_still_works(self):
        """POST /api/classroom/sessions/create still works (Batch 1 regression)"""
        if not self.user_token:
            pytest.skip("No token")
        
        now = datetime.now(timezone.utc)
        headers = {"Authorization": f"Bearer {self.user_token}"}
        resp = requests.post(f"{BASE_URL}/api/classroom/sessions/create", json={
            "teacher_id": "teacher_regression_test",
            "student_id": "student_regression_test",
            "start_time_utc": (now + timedelta(hours=2)).isoformat(),
            "end_time_utc": (now + timedelta(hours=3)).isoformat()
        }, headers=headers)
        
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert 'session_id' in data, "Response should have 'session_id'"
        assert 'meet_link_slug' in data, "Response should have 'meet_link_slug'"
        print(f"✓ Batch 1: /api/classroom/sessions/create works - {data['session_id']}")


class TestAPIHealthCheck:
    """Basic API health checks"""
    
    def test_api_root(self):
        """GET /api/ returns API info"""
        resp = requests.get(f"{BASE_URL}/api/")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get('message') == 'Alif Amin Academy API'
        print("✓ API root endpoint healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
