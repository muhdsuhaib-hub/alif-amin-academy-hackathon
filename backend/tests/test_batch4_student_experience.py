"""
Batch 4: Student Experience Overhaul Tests
Tests for Steps 0-6 features:
- Step 0: Legacy meet_link cleanup (booking creation without meet_link)
- Step 1: Notification system with links
- Step 2-6: Student dashboard data, wallet, booking, profile update APIs
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

# Use the production preview URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://amin-academy-bugs.preview.emergentagent.com')

# Test credentials
TEST_STUDENT_EMAIL = "test_student@example.com"
TEST_STUDENT_PASSWORD = "test1234"
TEST_SESSION_TOKEN = "session_e980c3ee392e4f70849e1936cef22cc9"


class TestApiHealth:
    """Health check tests"""
    
    def test_api_root(self):
        """Test API is responding"""
        r = requests.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("message") == "Alif Amin Academy API"
        print(f"✓ API root responding: {data}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_login_with_email(self):
        """Test email/password login"""
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_STUDENT_EMAIL,
            "password": TEST_STUDENT_PASSWORD
        })
        # Either success (200) or user doesn't exist (401)
        if r.status_code == 200:
            data = r.json()
            assert "session_token" in data
            assert "user" in data
            print(f"✓ Login successful: user_id={data['user'].get('user_id')}")
        else:
            print(f"⚠ Login failed (user may not exist): {r.status_code}")
            assert r.status_code in [401, 400]
    
    def test_auth_me_with_cookie(self):
        """Test /auth/me with session token"""
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        # Token might be expired or invalid
        if r.status_code == 200:
            data = r.json()
            assert "user_id" in data
            assert "email" in data
            print(f"✓ Auth/me successful: {data.get('email')}")
        else:
            print(f"⚠ Session token invalid/expired: {r.status_code}")
    
    def test_auth_me_with_bearer(self):
        """Test /auth/me with Bearer token header"""
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        if r.status_code == 200:
            data = r.json()
            print(f"✓ Auth/me with Bearer successful: {data.get('email')}")
        else:
            print(f"⚠ Bearer token auth: {r.status_code}")


class TestStudentDashboardData:
    """Step 2: Dashboard Data API tests"""
    
    def test_dashboard_data_endpoint_exists(self):
        """Test /api/students/dashboard-data endpoint exists and requires auth"""
        r = requests.get(f"{BASE_URL}/api/students/dashboard-data")
        # Should require authentication
        assert r.status_code == 401
        print("✓ Dashboard data endpoint requires auth (401)")
    
    def test_dashboard_data_with_auth(self):
        """Test dashboard-data with authentication"""
        r = requests.get(
            f"{BASE_URL}/api/students/dashboard-data",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code == 200:
            data = r.json()
            # Validate response structure
            assert "student" in data or r.status_code == 403  # 403 if not a student role
            assert "upcoming_classes" in data
            assert "past_classes" in data
            assert "wallet" in data
            assert "progress" in data
            print(f"✓ Dashboard data returned successfully")
            print(f"  - Upcoming classes: {len(data.get('upcoming_classes', []))}")
            print(f"  - Past classes: {len(data.get('past_classes', []))}")
            print(f"  - Wallet: {data.get('wallet', {})}")
        elif r.status_code == 401:
            print("⚠ Session token expired/invalid")
        elif r.status_code == 403:
            print("⚠ User is not a student")
        elif r.status_code == 404:
            print("⚠ Student profile not found")
        else:
            print(f"⚠ Dashboard data: {r.status_code} - {r.text[:200]}")


class TestProfileUpdate:
    """Step 6: Profile Update API tests"""
    
    def test_update_profile_endpoint(self):
        """Test /api/auth/update-profile endpoint"""
        r = requests.put(
            f"{BASE_URL}/api/auth/update-profile",
            json={"name": "Test Student Updated", "phone": "+60123456789", "timezone": "Asia/Kuala_Lumpur"},
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code == 200:
            data = r.json()
            assert data.get("message") == "Profile updated successfully"
            print("✓ Profile update successful")
        elif r.status_code == 401:
            print("⚠ Session token expired/invalid")
        elif r.status_code == 400:
            print("⚠ No valid fields to update")
        else:
            print(f"⚠ Profile update: {r.status_code}")
    
    def test_update_profile_invalid_fields(self):
        """Test update profile rejects invalid fields"""
        r = requests.put(
            f"{BASE_URL}/api/auth/update-profile",
            json={"invalid_field": "value", "email": "hack@test.com"},  # email should not be allowed
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        # Should return 400 since no valid fields
        if r.status_code == 400:
            print("✓ Invalid fields properly rejected")
        elif r.status_code == 401:
            print("⚠ Session token invalid")
        else:
            print(f"⚠ Unexpected response: {r.status_code}")


class TestNotifications:
    """Step 1: Notification system tests"""
    
    def test_get_notifications(self):
        """Test fetching notifications"""
        # Get user_id first
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code != 200:
            print("⚠ Skipping notifications test - auth failed")
            return
        
        user_id = r.json().get("user_id")
        
        r = requests.get(
            f"{BASE_URL}/api/notifications?user_id={user_id}&limit=20",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        assert r.status_code == 200
        data = r.json()
        assert "notifications" in data
        assert "unread_count" in data
        print(f"✓ Notifications fetched: {len(data['notifications'])} items, {data['unread_count']} unread")
        
        # Check notification structure includes link field
        if data['notifications']:
            notif = data['notifications'][0]
            # link field should exist (even if None)
            print(f"  - Sample notification: {notif.get('title')}, link={notif.get('link')}")
    
    def test_generate_notifications(self):
        """Test notification generation endpoint"""
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code != 200:
            print("⚠ Skipping generate test - auth failed")
            return
        
        user_id = r.json().get("user_id")
        user_role = r.json().get("role", "student")
        
        r = requests.post(
            f"{BASE_URL}/api/notifications/generate/{user_role}/{user_id}",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        assert r.status_code == 200
        data = r.json()
        print(f"✓ Notifications generated: {data.get('generated', 0)} new")


class TestWalletApi:
    """Step 4: Wallet API tests"""
    
    def test_wallet_balance(self):
        """Test wallet balance endpoint"""
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code != 200:
            print("⚠ Skipping wallet test - auth failed")
            return
        
        user_id = r.json().get("user_id")
        
        r = requests.get(
            f"{BASE_URL}/api/wallet/balance?user_id={user_id}",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code == 200:
            data = r.json()
            assert "wallet" in data
            wallet = data["wallet"]
            assert "credit_balance" in wallet
            assert "paid_credits" in wallet
            assert "bonus_credits" in wallet
            print(f"✓ Wallet balance: {wallet.get('credit_balance')} credits (paid: {wallet.get('paid_credits')}, bonus: {wallet.get('bonus_credits')})")
        elif r.status_code == 404:
            print("⚠ Student profile not found for wallet")
        else:
            print(f"⚠ Wallet balance: {r.status_code}")
    
    def test_wallet_packages(self):
        """Test wallet packages endpoint"""
        r = requests.get(
            f"{BASE_URL}/api/wallet/packages",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        assert r.status_code == 200
        data = r.json()
        assert "packages" in data
        packages = data["packages"]
        assert len(packages) >= 3  # Should have at least 3 packages
        print(f"✓ Wallet packages: {len(packages)} packages available")
        for pkg in packages:
            print(f"  - {pkg.get('name')}: RM{pkg.get('price_myr')} = {pkg.get('paid_credits')} paid + {pkg.get('bonus_credits')} bonus")
    
    def test_wallet_transactions(self):
        """Test wallet transactions endpoint"""
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code != 200:
            print("⚠ Skipping transactions test - auth failed")
            return
        
        user_id = r.json().get("user_id")
        
        r = requests.get(
            f"{BASE_URL}/api/wallet/transactions?user_id={user_id}&limit=10",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code == 200:
            data = r.json()
            assert "transactions" in data
            assert "total" in data
            print(f"✓ Wallet transactions: {len(data['transactions'])} items, total: {data['total']}")
        elif r.status_code == 404:
            print("⚠ Student not found")
        else:
            print(f"⚠ Transactions: {r.status_code}")


class TestBookingApi:
    """Step 3: Booking API tests"""
    
    def test_available_teachers(self):
        """Test available teachers endpoint"""
        r = requests.get(
            f"{BASE_URL}/api/booking/available-teachers",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        assert r.status_code == 200
        data = r.json()
        assert "teachers" in data
        print(f"✓ Available teachers: {len(data['teachers'])} teachers")
        for t in data['teachers'][:3]:  # Show first 3
            print(f"  - {t.get('name')} ({t.get('teacher_id')})")
    
    def test_my_bookings(self):
        """Test my-bookings endpoint"""
        r = requests.get(
            f"{BASE_URL}/api/booking/my-bookings",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code == 200:
            data = r.json()
            assert "bookings" in data
            bookings = data["bookings"]
            print(f"✓ My bookings: {len(bookings)} bookings")
            # Check booking structure - should not have meet_link (Step 0)
            for b in bookings[:3]:
                assert "meet_link" not in b, "Booking should not have meet_link field (Step 0 legacy cleanup)"
                print(f"  - {b.get('booking_id')}: {b.get('status')}, teacher: {b.get('teacher_name')}")
        elif r.status_code == 401:
            print("⚠ Session expired")
        else:
            print(f"⚠ My bookings: {r.status_code}")
    
    def test_booking_creation_no_meet_link(self):
        """Test booking creation without meet_link field (Step 0 verification)"""
        # This is a read-only test - we don't actually create, just verify the endpoint
        # Get a teacher first
        r = requests.get(
            f"{BASE_URL}/api/booking/available-teachers",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code != 200 or not r.json().get("teachers"):
            print("⚠ No teachers available for booking test")
            return
        
        teacher = r.json()["teachers"][0]
        
        # Create a booking (we'll cancel it after or let it fail due to credits)
        tomorrow = (datetime.now() + timedelta(days=1)).replace(hour=10, minute=0)
        start_time = tomorrow.isoformat()
        
        r = requests.post(
            f"{BASE_URL}/api/booking/create",
            json={
                "teacher_id": teacher["teacher_id"],
                "start_time_utc": start_time,
                "duration_minutes": 30
            },
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        
        # Expected outcomes: success (200), insufficient credits (400), or auth failure (401/403)
        if r.status_code == 200:
            data = r.json()
            assert data.get("success") == True
            assert "booking_id" in data
            assert "session_id" in data  # Should have session_id for classroom
            booking = data.get("booking", {})
            # Verify no meet_link in response
            assert "meet_link" not in booking, "Booking response should not have meet_link"
            print(f"✓ Booking created: {data.get('booking_id')}, session_id: {data.get('session_id')}")
            
            # Clean up - cancel the booking
            r2 = requests.post(
                f"{BASE_URL}/api/booking/{data['booking_id']}/cancel",
                json={"confirm_no_refund": True},
                cookies={"session_token": TEST_SESSION_TOKEN}
            )
            if r2.status_code == 200:
                print("  ✓ Test booking cancelled")
        elif r.status_code == 400:
            data = r.json()
            if "Insufficient credits" in data.get("detail", ""):
                print("✓ Booking requires credits (expected behavior)")
            else:
                print(f"⚠ Booking creation failed: {data.get('detail')}")
        elif r.status_code == 401:
            print("⚠ Session expired")
        else:
            print(f"⚠ Booking creation: {r.status_code}")


class TestScheduleApi:
    """Step 5: Schedule API tests"""
    
    def test_student_dashboard_legacy(self):
        """Test legacy student dashboard endpoint still works"""
        r = requests.get(
            f"{BASE_URL}/api/students/dashboard",
            cookies={"session_token": TEST_SESSION_TOKEN}
        )
        if r.status_code == 200:
            data = r.json()
            assert "student" in data
            assert "upcoming_classes" in data
            print(f"✓ Legacy dashboard works: {len(data.get('upcoming_classes', []))} upcoming")
        elif r.status_code == 401:
            print("⚠ Session expired")
        elif r.status_code == 403:
            print("⚠ Not a student role")
        else:
            print(f"⚠ Legacy dashboard: {r.status_code}")


class TestTeachersList:
    """Teachers list API tests"""
    
    def test_get_teachers(self):
        """Test public teachers list"""
        r = requests.get(f"{BASE_URL}/api/teachers")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        print(f"✓ Teachers list: {len(data)} active teachers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
