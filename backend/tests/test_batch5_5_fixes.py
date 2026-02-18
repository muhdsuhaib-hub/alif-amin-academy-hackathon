"""
Batch 5.5 Fixes - Backend API Tests

Tests for 4 critical fixes:
1. Revenue/Pricing Logic - 15min=RM15, 30min=RM30, 60min=RM60
2. Commission Tier Logic - New 40%, Rated 35%, Elite 30%
3. Teacher Dashboard Data - tier info, wallet, commission rate
4. Profile Update Endpoints - return updated document
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCommissionServicePricing:
    """Test that session pricing is correct: 15min=RM15, 30min=RM30, 60min=RM60"""
    
    def test_api_accessible(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Alif Amin Academy API"
        print("✓ API is accessible")
    
    def test_commission_tiers_endpoint(self):
        """Test GET /api/commission/tiers returns correct values"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        assert response.status_code == 200
        data = response.json()
        
        # Verify tiers structure
        assert "tiers" in data
        tiers = data["tiers"]
        
        # Find each tier by level
        tier_by_level = {t["tier_level"]: t for t in tiers}
        
        # Test New tier - 40%
        assert "new" in tier_by_level
        assert tier_by_level["new"]["commission_rate"] == 0.40
        assert tier_by_level["new"]["name"] == "New Tutor"
        print("✓ New tier: 40% commission")
        
        # Test Rated tier - 35%
        assert "rated" in tier_by_level
        assert tier_by_level["rated"]["commission_rate"] == 0.35
        assert tier_by_level["rated"]["name"] == "Rated Tutor"
        print("✓ Rated tier: 35% commission")
        
        # Test Elite tier - 30%
        assert "elite" in tier_by_level
        assert tier_by_level["elite"]["commission_rate"] == 0.30
        assert tier_by_level["elite"]["name"] == "Elite Tutor"
        print("✓ Elite tier: 30% commission")
    
    def test_session_pricing_15min(self):
        """Test 15-minute session price = RM15"""
        response = requests.get(f"{BASE_URL}/api/commission/pricing/15")
        assert response.status_code == 200
        data = response.json()
        assert data["base_price"] == 15.0
        assert data["duration_minutes"] == 15
        print("✓ 15-minute session = RM15")
    
    def test_session_pricing_30min(self):
        """Test 30-minute session price = RM30"""
        response = requests.get(f"{BASE_URL}/api/commission/pricing/30")
        assert response.status_code == 200
        data = response.json()
        assert data["base_price"] == 30.0
        assert data["duration_minutes"] == 30
        print("✓ 30-minute session = RM30")
    
    def test_session_pricing_60min(self):
        """Test 60-minute session price = RM60"""
        response = requests.get(f"{BASE_URL}/api/commission/pricing/60")
        assert response.status_code == 200
        data = response.json()
        assert data["base_price"] == 60.0
        assert data["duration_minutes"] == 60
        print("✓ 60-minute session = RM60")


class TestCommissionCalculation:
    """Test commission calculation for different tiers"""
    
    def test_calculate_split_new_tutor(self):
        """New tutor (40% platform fee) for 30min session"""
        response = requests.get(f"{BASE_URL}/api/commission/calculate?session_price=30&tier_level=new")
        assert response.status_code == 200
        data = response.json()
        
        # Platform gets 40% = RM12, Tutor gets 60% = RM18
        assert data["session_price"] == 30
        assert data["commission_rate"] == 0.40
        assert data["platform_commission"] == 12.0
        assert data["tutor_payout"] == 18.0
        print("✓ New tutor 30min: Platform RM12, Tutor RM18")
    
    def test_calculate_split_rated_tutor(self):
        """Rated tutor (35% platform fee) for 30min session"""
        response = requests.get(f"{BASE_URL}/api/commission/calculate?session_price=30&tier_level=rated")
        assert response.status_code == 200
        data = response.json()
        
        # Platform gets 35% = RM10.5, Tutor gets 65% = RM19.5
        assert data["session_price"] == 30
        assert data["commission_rate"] == 0.35
        assert data["platform_commission"] == 10.5
        assert data["tutor_payout"] == 19.5
        print("✓ Rated tutor 30min: Platform RM10.5, Tutor RM19.5")
    
    def test_calculate_split_elite_tutor(self):
        """Elite tutor (30% platform fee) for 30min session"""
        response = requests.get(f"{BASE_URL}/api/commission/calculate?session_price=30&tier_level=elite")
        assert response.status_code == 200
        data = response.json()
        
        # Platform gets 30% = RM9, Tutor gets 70% = RM21
        assert data["session_price"] == 30
        assert data["commission_rate"] == 0.30
        assert data["platform_commission"] == 9.0
        assert data["tutor_payout"] == 21.0
        print("✓ Elite tutor 30min: Platform RM9, Tutor RM21")


class TestTierThresholds:
    """Test tier evaluation thresholds"""
    
    def test_tier_eval_new(self):
        """New tier: < 20 sessions"""
        response = requests.get(
            f"{BASE_URL}/api/commission/evaluate-tier?sessions=5&rating=4.0&reviews=3"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tier_level"] == "new"
        assert data["commission_rate"] == 0.40
        print("✓ 5 sessions = New tier")
    
    def test_tier_eval_rated(self):
        """Rated tier: >= 20 sessions AND >= 4.5 rating"""
        response = requests.get(
            f"{BASE_URL}/api/commission/evaluate-tier?sessions=25&rating=4.6&reviews=20"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tier_level"] == "rated"
        assert data["commission_rate"] == 0.35
        print("✓ 25 sessions + 4.6 rating = Rated tier")
    
    def test_tier_eval_elite(self):
        """Elite tier: >= 100 sessions AND >= 4.7 rating"""
        response = requests.get(
            f"{BASE_URL}/api/commission/evaluate-tier?sessions=120&rating=4.8&reviews=100"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tier_level"] == "elite"
        assert data["commission_rate"] == 0.30
        print("✓ 120 sessions + 4.8 rating = Elite tier")
    
    def test_tier_not_rated_with_low_rating(self):
        """High sessions but low rating should stay at new"""
        response = requests.get(
            f"{BASE_URL}/api/commission/evaluate-tier?sessions=50&rating=4.3&reviews=30"
        )
        assert response.status_code == 200
        data = response.json()
        # Rating 4.3 doesn't meet 4.5 threshold for Rated
        assert data["tier_level"] == "new"
        print("✓ 50 sessions + 4.3 rating = New tier (rating too low)")


class TestTeacherAuthAndDashboard:
    """Test teacher authentication and dashboard data"""
    
    @pytest.fixture
    def teacher_session(self):
        """Create or login test teacher"""
        test_email = f"test_teacher_batch55_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "TestPassword123!"
        
        # Register as teacher
        register_data = {
            "email": test_email,
            "password": test_password,
            "full_name": "Test Teacher Batch55",
            "phone": "+60123456789",
            "role": "teacher"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=register_data
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "session_token": data["session_token"],
                "user": data["user"],
                "email": test_email,
                "password": test_password
            }
        elif response.status_code == 400:
            # Already exists, try login
            login_response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": test_email, "password": test_password}
            )
            if login_response.status_code == 200:
                data = login_response.json()
                return {
                    "session_token": data["session_token"],
                    "user": data["user"],
                    "email": test_email,
                    "password": test_password
                }
        
        pytest.skip("Could not create/login teacher")
    
    def test_teacher_dashboard_data(self, teacher_session):
        """Test GET /api/teacher/dashboard-data returns correct tier info"""
        headers = {"Cookie": f"session_token={teacher_session['session_token']}"}
        response = requests.get(
            f"{BASE_URL}/api/teacher/dashboard-data",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify teacher object exists
        assert "teacher" in data
        
        # Verify tier info
        assert "tier" in data
        tier = data["tier"]
        assert "level" in tier
        assert "name" in tier
        assert "commission_rate" in tier
        
        # New teacher should have new tier
        assert tier["level"] == "new"
        assert tier["commission_rate"] == 0.40
        assert tier["name"] == "New Tutor"
        print(f"✓ Dashboard-data returns tier info: {tier['name']} ({tier['commission_rate']*100}%)")
        
        # Verify wallet info
        assert "wallet" in data
        wallet = data["wallet"]
        assert "balance" in wallet
        assert "total_earned" in wallet
        assert "total_withdrawn" in wallet
        print("✓ Dashboard-data returns wallet info")
        
        # Verify month stats
        assert "month_stats" in data
        print("✓ Dashboard-data returns month stats")
    
    def test_teacher_bookings_endpoint(self, teacher_session):
        """Test GET /api/bookings returns teacher's bookings"""
        headers = {"Cookie": f"session_token={teacher_session['session_token']}"}
        response = requests.get(
            f"{BASE_URL}/api/bookings",
            headers=headers
        )
        
        # Should return 200 even if empty
        assert response.status_code == 200
        # Returns array or object with bookings
        data = response.json()
        print(f"✓ /api/bookings returns data for teacher: {type(data)}")


class TestProfileUpdateEndpoints:
    """Test that profile update endpoints return updated data"""
    
    @pytest.fixture
    def authenticated_session(self):
        """Create authenticated test user"""
        test_email = f"test_user_profile_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "TestPassword123!"
        
        register_data = {
            "email": test_email,
            "password": test_password,
            "full_name": "Test User Profile",
            "phone": "+60123456789",
            "role": "teacher"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=register_data
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "session_token": data["session_token"],
                "user": data["user"]
            }
        
        pytest.skip("Could not create test user")
    
    def test_auth_update_profile_returns_updated_user(self, authenticated_session):
        """PUT /api/auth/update-profile should return updated user document"""
        headers = {
            "Cookie": f"session_token={authenticated_session['session_token']}",
            "Content-Type": "application/json"
        }
        
        # Update with gender field
        update_data = {
            "name": "Updated Name Batch55",
            "phone": "+60987654321",
            "gender": "male"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/auth/update-profile",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify updated user is returned
        assert "user" in data
        user = data["user"]
        assert user["name"] == "Updated Name Batch55"
        assert user["phone"] == "+60987654321"
        assert user["gender"] == "male"
        print("✓ PUT /api/auth/update-profile returns updated user with gender field")
    
    def test_teacher_update_profile_returns_updated_teacher(self, authenticated_session):
        """PUT /api/teacher/update-profile should return updated teacher document"""
        headers = {
            "Cookie": f"session_token={authenticated_session['session_token']}",
            "Content-Type": "application/json"
        }
        
        update_data = {
            "bio": "Test bio for batch 5.5",
            "specializations": ["Tajweed", "Hifz"],
            "years_experience": 5
        }
        
        response = requests.put(
            f"{BASE_URL}/api/teacher/update-profile",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify updated teacher is returned
        assert "teacher" in data
        teacher = data["teacher"]
        assert teacher["bio"] == "Test bio for batch 5.5"
        assert "Tajweed" in teacher["specializations"]
        print("✓ PUT /api/teacher/update-profile returns updated teacher document")


class TestAvailabilityBulk:
    """Test availability bulk endpoint"""
    
    @pytest.fixture
    def teacher_session(self):
        """Create or login test teacher for availability tests"""
        test_email = f"test_avail_teacher_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "TestPassword123!"
        
        register_data = {
            "email": test_email,
            "password": test_password,
            "full_name": "Test Availability Teacher",
            "role": "teacher"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=register_data
        )
        
        if response.status_code == 200:
            data = response.json()
            # Get teacher_id from dashboard data
            headers = {"Cookie": f"session_token={data['session_token']}"}
            dashboard_response = requests.get(
                f"{BASE_URL}/api/teacher/dashboard-data",
                headers=headers
            )
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                return {
                    "session_token": data["session_token"],
                    "teacher_id": dashboard_data.get("teacher", {}).get("teacher_id")
                }
        
        pytest.skip("Could not create teacher for availability tests")
    
    def test_bulk_availability_save(self, teacher_session):
        """Test POST /api/booking/availability/bulk saves slots"""
        if not teacher_session.get("teacher_id"):
            pytest.skip("No teacher_id available")
        
        headers = {
            "Cookie": f"session_token={teacher_session['session_token']}",
            "Content-Type": "application/json"
        }
        
        from datetime import datetime, timedelta
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())  # Monday
        week_start_str = week_start.strftime('%Y-%m-%d')
        
        # Create test slots
        slots = [
            {"date": week_start_str, "start_time": "09:00", "end_time": "09:30"},
            {"date": week_start_str, "start_time": "09:30", "end_time": "10:00"},
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/booking/availability/bulk",
            json={
                "teacher_id": teacher_session["teacher_id"],
                "week_start": week_start_str,
                "slots": slots
            },
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"✓ Bulk availability saved {data.get('count', 0)} slots")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
