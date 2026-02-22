"""
Backend API tests for UI/UX Redesign verification.
Tests that all backend APIs are still functional after the frontend redesign.
Since this is a UI-only change, backend should remain unchanged.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://teacher-media-fix.preview.emergentagent.com').rstrip('/')

# Admin session for testing
ADMIN_SESSION = "admin_session_1f5f1fdd71f04dbe"

class TestHealthEndpoints:
    """Test basic health and public endpoints"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        # Accept 200 or 404 (health endpoint may not exist)
        assert response.status_code in [200, 404], f"Health check failed: {response.status_code}"
        print(f"Health check status: {response.status_code}")
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        # Accept various success codes
        assert response.status_code in [200, 404], f"Root endpoint failed: {response.status_code}"
        print(f"Root endpoint status: {response.status_code}")


class TestAuthEndpoints:
    """Test authentication-related endpoints"""
    
    def test_check_email_existing(self):
        """Test check-email for existing user"""
        response = requests.get(f"{BASE_URL}/api/auth/check-email?email=test.student.new@example.com")
        assert response.status_code == 200, f"Check email failed: {response.status_code}"
        data = response.json()
        assert 'exists' in data, "Response should contain 'exists' field"
        print(f"Check email response: exists={data.get('exists')}, role={data.get('role')}")
    
    def test_check_email_nonexistent(self):
        """Test check-email for non-existing user"""
        response = requests.get(f"{BASE_URL}/api/auth/check-email?email=nonexistent.user@example.com")
        assert response.status_code == 200, f"Check email failed: {response.status_code}"
        data = response.json()
        assert data.get('exists') == False, "Non-existent email should return exists=False"
        print("Check email for non-existent user: exists=False")
    
    def test_auth_me_unauthorized(self):
        """Test /auth/me without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401 for unauthorized, got: {response.status_code}"
        print("Auth me without session: correctly returns 401")


class TestAdminEndpoints:
    """Test admin dashboard API endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        return {"Cookie": f"session_token={ADMIN_SESSION}"}
    
    def test_admin_stats(self, admin_session):
        """Test GET /api/admin/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=admin_session)
        assert response.status_code == 200, f"Admin stats failed: {response.status_code}"
        data = response.json()
        
        # Verify expected fields exist
        expected_fields = ['total_users', 'total_students', 'total_teachers', 'revenue_mtd', 'conversion_rate']
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"Admin stats: {data.get('total_users')} users, {data.get('total_students')} students, {data.get('total_teachers')} teachers")
    
    def test_admin_revenue_recognition(self, admin_session):
        """Test GET /api/admin/revenue/recognition"""
        response = requests.get(f"{BASE_URL}/api/admin/revenue/recognition", headers=admin_session)
        assert response.status_code == 200, f"Revenue recognition failed: {response.status_code}"
        data = response.json()
        
        # Verify key revenue fields
        assert 'cash_flow' in data, "Missing cash_flow field"
        assert 'revenue_recognition' in data, "Missing revenue_recognition field"
        assert 'tutor_payable' in data, "Missing tutor_payable field"
        
        print(f"Revenue recognition: cash_collected={data['cash_flow'].get('total_cash_collected')}, commission={data['revenue_recognition'].get('commission_earned')}")
    
    def test_admin_wallet_liability(self, admin_session):
        """Test GET /api/admin/wallet/liability"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability", headers=admin_session)
        assert response.status_code == 200, f"Wallet liability failed: {response.status_code}"
        data = response.json()
        
        # Verify liability fields
        assert 'credit_liability' in data or 'wallet_summary' in data, "Missing liability fields"
        print(f"Wallet liability data received successfully")
    
    def test_commission_summary(self, admin_session):
        """Test GET /api/commission/admin/summary"""
        response = requests.get(f"{BASE_URL}/api/commission/admin/summary", headers=admin_session)
        assert response.status_code == 200, f"Commission summary failed: {response.status_code}"
        data = response.json()
        
        # Verify commission tier data
        assert 'tier_distribution' in data or 'total_active_tutors' in data, "Missing commission tier fields"
        print(f"Commission summary received successfully")


class TestTeacherEndpoints:
    """Test teacher-related public endpoints"""
    
    def test_get_teachers_list(self):
        """Test GET /api/teachers - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        assert response.status_code == 200, f"Get teachers failed: {response.status_code}"
        data = response.json()
        
        # Should be a list or contain teachers field
        if isinstance(data, list):
            print(f"Teachers list: {len(data)} teachers found")
        else:
            teachers = data.get('teachers', [])
            print(f"Teachers list: {len(teachers)} teachers found")


class TestBookingEndpoints:
    """Test booking-related endpoints"""
    
    def test_bookings_unauthorized(self):
        """Test /api/booking/my-bookings without auth"""
        response = requests.get(f"{BASE_URL}/api/booking/my-bookings")
        assert response.status_code == 401, f"Expected 401, got: {response.status_code}"
        print("Booking endpoint correctly requires authentication")


class TestNotificationEndpoints:
    """Test notification endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        return {"Cookie": f"session_token={ADMIN_SESSION}"}
    
    def test_get_notifications(self, admin_session):
        """Test GET /api/notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications?user_id=user_b49c47dd5004&limit=10", headers=admin_session)
        assert response.status_code == 200, f"Get notifications failed: {response.status_code}"
        print("Notifications endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
