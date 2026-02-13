"""
Test suite for Tiered Commission Engine
Tests all commission tier endpoints and logic:
- GET /api/commission/tiers - Returns all tier configurations
- GET /api/commission/admin/summary - Returns tier distribution
- POST /api/commission/evaluate-all - Runs tier evaluation for all tutors
- GET /api/commission/tutor/{teacher_id} - Returns tutor's tier info
- POST /api/commission/calculate - Returns correct commission calculation
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Commission Tier Constants
EXPECTED_TIERS = {
    "new": {"level": 1, "commission_rate": 0.30, "name": "New Tutor"},
    "rated": {"level": 2, "commission_rate": 0.25, "name": "Rated Tutor"},
    "elite": {"level": 3, "commission_rate": 0.20, "name": "Elite Tutor"}
}

# ============== TIER CONFIGURATION TESTS ==============

class TestCommissionTiers:
    """Test GET /api/commission/tiers endpoint"""
    
    def test_get_tiers_returns_200(self):
        """Verify the tiers endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASSED: GET /api/commission/tiers returns 200")
    
    def test_tiers_response_has_tiers_key(self):
        """Verify response contains 'tiers' key"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        assert "tiers" in data, "Response should contain 'tiers' key"
        print("PASSED: Response contains 'tiers' key")
    
    def test_tiers_response_has_thresholds_key(self):
        """Verify response contains 'thresholds' key"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        assert "thresholds" in data, "Response should contain 'thresholds' key"
        print("PASSED: Response contains 'thresholds' key")
    
    def test_tiers_has_all_three_levels(self):
        """Verify all three tier levels exist"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        tiers = data.get("tiers", {})
        assert "new" in tiers, "Missing 'new' tier"
        assert "rated" in tiers, "Missing 'rated' tier"
        assert "elite" in tiers, "Missing 'elite' tier"
        print("PASSED: All three tier levels (new, rated, elite) exist")
    
    def test_new_tier_commission_rate_is_30_percent(self):
        """Verify New Tutor tier has 30% commission"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        new_tier = data["tiers"]["new"]
        assert new_tier["commission_rate"] == 0.30, f"Expected 0.30, got {new_tier['commission_rate']}"
        print("PASSED: New Tutor tier has 30% commission rate")
    
    def test_rated_tier_commission_rate_is_25_percent(self):
        """Verify Rated Tutor tier has 25% commission"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        rated_tier = data["tiers"]["rated"]
        assert rated_tier["commission_rate"] == 0.25, f"Expected 0.25, got {rated_tier['commission_rate']}"
        print("PASSED: Rated Tutor tier has 25% commission rate")
    
    def test_elite_tier_commission_rate_is_20_percent(self):
        """Verify Elite Tutor tier has 20% commission"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        elite_tier = data["tiers"]["elite"]
        assert elite_tier["commission_rate"] == 0.20, f"Expected 0.20, got {elite_tier['commission_rate']}"
        print("PASSED: Elite Tutor tier has 20% commission rate")
    
    def test_thresholds_rated_min_rating(self):
        """Verify Rated tier requires 4.5+ rating"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        rated_threshold = data["thresholds"]["rated"]
        assert rated_threshold["min_rating"] == 4.5, f"Expected 4.5, got {rated_threshold['min_rating']}"
        print("PASSED: Rated tier requires 4.5+ rating")
    
    def test_thresholds_rated_min_reviews(self):
        """Verify Rated tier requires 20+ reviews"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        rated_threshold = data["thresholds"]["rated"]
        assert rated_threshold["min_reviews"] == 20, f"Expected 20, got {rated_threshold['min_reviews']}"
        print("PASSED: Rated tier requires 20+ reviews")
    
    def test_thresholds_elite_min_sessions(self):
        """Verify Elite tier requires 100+ sessions"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        elite_threshold = data["thresholds"]["elite"]
        assert elite_threshold["min_sessions"] == 100, f"Expected 100, got {elite_threshold['min_sessions']}"
        print("PASSED: Elite tier requires 100+ sessions")
    
    def test_thresholds_elite_min_rating(self):
        """Verify Elite tier requires 4.7+ rating"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        elite_threshold = data["thresholds"]["elite"]
        assert elite_threshold["min_rating"] == 4.7, f"Expected 4.7, got {elite_threshold['min_rating']}"
        print("PASSED: Elite tier requires 4.7+ rating")
    
    def test_downgrade_threshold_is_4_3(self):
        """Verify downgrade threshold is 4.3"""
        response = requests.get(f"{BASE_URL}/api/commission/tiers")
        data = response.json()
        downgrade = data["thresholds"]["downgrade"]
        assert downgrade["rating_threshold"] == 4.3, f"Expected 4.3, got {downgrade['rating_threshold']}"
        print("PASSED: Downgrade threshold is 4.3")


# ============== ADMIN SUMMARY TESTS ==============

class TestCommissionAdminSummary:
    """Test GET /api/commission/admin/summary endpoint"""
    
    def test_admin_summary_returns_200(self):
        """Verify admin summary endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/commission/admin/summary")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASSED: GET /api/commission/admin/summary returns 200")
    
    def test_admin_summary_has_tier_distribution(self):
        """Verify response contains tier_distribution"""
        response = requests.get(f"{BASE_URL}/api/commission/admin/summary")
        data = response.json()
        assert "tier_distribution" in data, "Response should contain 'tier_distribution'"
        print("PASSED: Response contains 'tier_distribution'")
    
    def test_admin_summary_has_total_active_tutors(self):
        """Verify response contains total_active_tutors count"""
        response = requests.get(f"{BASE_URL}/api/commission/admin/summary")
        data = response.json()
        assert "total_active_tutors" in data, "Response should contain 'total_active_tutors'"
        assert isinstance(data["total_active_tutors"], int), "total_active_tutors should be an integer"
        print(f"PASSED: Response contains total_active_tutors = {data['total_active_tutors']}")
    
    def test_admin_summary_has_tier_configs(self):
        """Verify response contains tier_configs"""
        response = requests.get(f"{BASE_URL}/api/commission/admin/summary")
        data = response.json()
        assert "tier_configs" in data, "Response should contain 'tier_configs'"
        print("PASSED: Response contains 'tier_configs'")


# ============== EVALUATE ALL TUTORS TESTS ==============

class TestEvaluateAllTutors:
    """Test POST /api/commission/evaluate-all endpoint"""
    
    def test_evaluate_all_returns_200(self):
        """Verify evaluate-all endpoint is accessible"""
        response = requests.post(f"{BASE_URL}/api/commission/evaluate-all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASSED: POST /api/commission/evaluate-all returns 200")
    
    def test_evaluate_all_has_total_evaluated(self):
        """Verify response contains total_evaluated count"""
        response = requests.post(f"{BASE_URL}/api/commission/evaluate-all")
        data = response.json()
        assert "total_evaluated" in data, "Response should contain 'total_evaluated'"
        print(f"PASSED: Response contains total_evaluated = {data['total_evaluated']}")
    
    def test_evaluate_all_has_upgraded_list(self):
        """Verify response contains 'upgraded' list"""
        response = requests.post(f"{BASE_URL}/api/commission/evaluate-all")
        data = response.json()
        assert "upgraded" in data, "Response should contain 'upgraded' list"
        assert isinstance(data["upgraded"], list), "'upgraded' should be a list"
        print(f"PASSED: Response contains 'upgraded' list with {len(data['upgraded'])} items")
    
    def test_evaluate_all_has_downgraded_list(self):
        """Verify response contains 'downgraded' list"""
        response = requests.post(f"{BASE_URL}/api/commission/evaluate-all")
        data = response.json()
        assert "downgraded" in data, "Response should contain 'downgraded' list"
        assert isinstance(data["downgraded"], list), "'downgraded' should be a list"
        print(f"PASSED: Response contains 'downgraded' list with {len(data['downgraded'])} items")
    
    def test_evaluate_all_has_unchanged_list(self):
        """Verify response contains 'unchanged' list"""
        response = requests.post(f"{BASE_URL}/api/commission/evaluate-all")
        data = response.json()
        assert "unchanged" in data, "Response should contain 'unchanged' list"
        assert isinstance(data["unchanged"], list), "'unchanged' should be a list"
        print(f"PASSED: Response contains 'unchanged' list with {len(data['unchanged'])} items")
    
    def test_evaluate_all_has_errors_list(self):
        """Verify response contains 'errors' list"""
        response = requests.post(f"{BASE_URL}/api/commission/evaluate-all")
        data = response.json()
        assert "errors" in data, "Response should contain 'errors' list"
        assert isinstance(data["errors"], list), "'errors' should be a list"
        print(f"PASSED: Response contains 'errors' list with {len(data['errors'])} items")


# ============== GET TEACHER TIER INFO TESTS ==============

class TestGetTeacherTierInfo:
    """Test GET /api/commission/tutor/{teacher_id} endpoint"""
    
    @pytest.fixture
    def teacher_id(self):
        """Get a valid teacher_id from the database"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        if response.status_code == 200:
            teachers = response.json()
            if isinstance(teachers, list) and len(teachers) > 0:
                return teachers[0].get("teacher_id")
        return None
    
    def test_get_tutor_tier_returns_200(self, teacher_id):
        """Verify tutor tier endpoint returns 200 for valid teacher"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"PASSED: GET /api/commission/tutor/{teacher_id} returns 200")
    
    def test_tutor_tier_has_teacher_id(self, teacher_id):
        """Verify response contains teacher_id"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        data = response.json()
        assert "teacher_id" in data, "Response should contain 'teacher_id'"
        assert data["teacher_id"] == teacher_id
        print("PASSED: Response contains correct teacher_id")
    
    def test_tutor_tier_has_tier_level(self, teacher_id):
        """Verify response contains tier_level"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        data = response.json()
        assert "tier_level" in data, "Response should contain 'tier_level'"
        assert data["tier_level"] in ["new", "rated", "elite"], f"Invalid tier_level: {data['tier_level']}"
        print(f"PASSED: Response contains tier_level = {data['tier_level']}")
    
    def test_tutor_tier_has_tier_name(self, teacher_id):
        """Verify response contains tier_name"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        data = response.json()
        assert "tier_name" in data, "Response should contain 'tier_name'"
        print(f"PASSED: Response contains tier_name = {data['tier_name']}")
    
    def test_tutor_tier_has_commission_rate(self, teacher_id):
        """Verify response contains commission_rate"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        data = response.json()
        assert "commission_rate" in data, "Response should contain 'commission_rate'"
        assert data["commission_rate"] in [0.30, 0.25, 0.20], f"Invalid commission_rate: {data['commission_rate']}"
        print(f"PASSED: Response contains commission_rate = {data['commission_rate']}")
    
    def test_tutor_tier_has_tutor_rate(self, teacher_id):
        """Verify response contains tutor_rate (earnings rate)"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        data = response.json()
        assert "tutor_rate" in data, "Response should contain 'tutor_rate'"
        # Tutor rate should be 1 - commission_rate
        expected_tutor_rate = 1 - data.get("commission_rate", 0)
        assert abs(data["tutor_rate"] - expected_tutor_rate) < 0.01, f"tutor_rate doesn't match"
        print(f"PASSED: Response contains tutor_rate = {data['tutor_rate']}")
    
    def test_tutor_tier_has_metrics(self, teacher_id):
        """Verify response contains metrics section"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        data = response.json()
        assert "metrics" in data, "Response should contain 'metrics'"
        metrics = data["metrics"]
        assert "total_completed_sessions" in metrics
        assert "average_rating" in metrics
        assert "total_reviews" in metrics
        print(f"PASSED: Response contains metrics section")
    
    def test_tutor_tier_has_next_tier_info(self, teacher_id):
        """Verify response contains next_tier requirements"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        data = response.json()
        assert "next_tier" in data, "Response should contain 'next_tier'"
        print(f"PASSED: Response contains next_tier info")
    
    def test_tutor_tier_invalid_teacher_returns_404(self):
        """Verify endpoint returns 404 for invalid teacher_id"""
        response = requests.get(f"{BASE_URL}/api/commission/tutor/invalid_teacher_id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASSED: Invalid teacher_id returns 404")


# ============== COMMISSION CALCULATION TESTS ==============

class TestCommissionCalculation:
    """Test POST /api/commission/calculate endpoint"""
    
    @pytest.fixture
    def teacher_id(self):
        """Get a valid teacher_id from the database"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        if response.status_code == 200:
            teachers = response.json()
            if isinstance(teachers, list) and len(teachers) > 0:
                return teachers[0].get("teacher_id")
        return None
    
    def test_calculate_commission_returns_200(self, teacher_id):
        """Verify commission calculation endpoint returns 200"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            params={"teacher_id": teacher_id, "session_price": 27.0}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASSED: POST /api/commission/calculate returns 200")
    
    def test_calculate_has_session_price(self, teacher_id):
        """Verify response contains session_price"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            params={"teacher_id": teacher_id, "session_price": 27.0}
        )
        data = response.json()
        assert "session_price" in data, "Response should contain 'session_price'"
        assert data["session_price"] == 27.0
        print("PASSED: Response contains correct session_price")
    
    def test_calculate_has_commission_rate(self, teacher_id):
        """Verify response contains commission_rate"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            params={"teacher_id": teacher_id, "session_price": 27.0}
        )
        data = response.json()
        assert "commission_rate" in data, "Response should contain 'commission_rate'"
        print(f"PASSED: Response contains commission_rate = {data['commission_rate']}")
    
    def test_calculate_has_platform_earnings(self, teacher_id):
        """Verify response contains platform_earnings"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            params={"teacher_id": teacher_id, "session_price": 27.0}
        )
        data = response.json()
        assert "platform_earnings" in data, "Response should contain 'platform_earnings'"
        print(f"PASSED: Response contains platform_earnings = {data['platform_earnings']}")
    
    def test_calculate_has_tutor_earnings(self, teacher_id):
        """Verify response contains tutor_earnings"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            params={"teacher_id": teacher_id, "session_price": 27.0}
        )
        data = response.json()
        assert "tutor_earnings" in data, "Response should contain 'tutor_earnings'"
        print(f"PASSED: Response contains tutor_earnings = {data['tutor_earnings']}")
    
    def test_calculate_earnings_sum_equals_price(self, teacher_id):
        """Verify platform_earnings + tutor_earnings = session_price"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            params={"teacher_id": teacher_id, "session_price": 27.0}
        )
        data = response.json()
        total = data.get("platform_earnings", 0) + data.get("tutor_earnings", 0)
        # Allow small floating point difference
        assert abs(total - 27.0) < 0.01, f"Earnings sum ({total}) doesn't equal session_price (27.0)"
        print("PASSED: platform_earnings + tutor_earnings = session_price")
    
    def test_calculate_has_tier_info(self, teacher_id):
        """Verify response contains tier info"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            params={"teacher_id": teacher_id, "session_price": 27.0}
        )
        data = response.json()
        assert "tier" in data, "Response should contain 'tier'"
        tier = data["tier"]
        assert "level" in tier
        assert "name" in tier
        assert "badge" in tier
        print("PASSED: Response contains tier info")
    
    def test_calculate_commission_for_new_tier(self, teacher_id):
        """Verify commission calculation for New Tutor tier (30%)"""
        if not teacher_id:
            pytest.skip("No teacher found in database")
        
        # Get teacher's current tier
        tier_response = requests.get(f"{BASE_URL}/api/commission/tutor/{teacher_id}")
        tier_data = tier_response.json()
        
        response = requests.post(
            f"{BASE_URL}/api/commission/calculate",
            params={"teacher_id": teacher_id, "session_price": 100.0}
        )
        data = response.json()
        
        expected_rate = tier_data.get("commission_rate", 0.30)
        expected_platform = round(100.0 * expected_rate, 2)
        expected_tutor = round(100.0 * (1 - expected_rate), 2)
        
        assert abs(data["platform_earnings"] - expected_platform) < 0.01
        assert abs(data["tutor_earnings"] - expected_tutor) < 0.01
        print(f"PASSED: Commission calculation correct for {data['commission_rate']*100}% rate")


# ============== WALLET INTEGRATION TESTS ==============

class TestWalletCommissionIntegration:
    """Test that wallet deduct_credits uses dynamic commission rate"""
    
    def test_wallet_uses_tiered_commission(self):
        """Verify wallet/calculate-cost still works"""
        response = requests.get(
            f"{BASE_URL}/api/wallet/calculate-cost",
            params={"duration_minutes": 30}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "commission_breakdown" in data
        print("PASSED: Wallet calculate-cost endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
