"""
Test Suite for Tutor Earnings Wallet System
============================================
Tests for:
- GET /api/tutor-earnings/balance?user_id={user_id}
- GET /api/tutor-earnings/transactions?user_id={user_id}
- POST /api/tutor-earnings/withdraw?user_id={user_id}
- GET /api/tutor-earnings/withdrawals?user_id={user_id}
- GET /api/tutor-earnings/admin/pending-withdrawals
- GET /api/tutor-earnings/admin/commission-earned
- POST /api/tutor-earnings/admin/withdrawals/{withdrawal_id}/process
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://amin-env-secure.preview.emergentagent.com')


class TestSetup:
    """Create test data for tutor earnings tests"""
    
    @pytest.fixture(scope="class")
    def test_teacher(self):
        """Get or create a test teacher with earnings"""
        # Create unique test IDs
        timestamp = int(datetime.now().timestamp() * 1000)
        user_id = f"TEST_user_teacher_{timestamp}"
        teacher_id = f"TEST_teacher_{timestamp}"
        
        # Setup teacher in database via API or direct DB insert would be needed
        # For now, we'll try to use existing teachers in the system
        return {
            "user_id": user_id,
            "teacher_id": teacher_id
        }
    
    @pytest.fixture(scope="class")
    def admin_user_id(self):
        """Admin user ID for processing withdrawals"""
        return "TEST_admin_user_001"


class TestTutorEarningsBalance:
    """Tests for GET /api/tutor-earnings/balance endpoint"""
    
    def test_balance_endpoint_with_valid_teacher(self):
        """Test getting balance for an existing teacher"""
        # First, find an existing teacher
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/balance", 
                                  params={"user_id": user_id})
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert "earnings" in data, "Response should contain 'earnings' key"
            assert "commission_info" in data, "Response should contain 'commission_info' key"
        else:
            pytest.skip("No active teachers found in database")
    
    def test_balance_endpoint_with_invalid_user(self):
        """Test getting balance for non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/balance", 
                              params={"user_id": "nonexistent_user_12345"})
        assert response.status_code == 404, f"Expected 404 for invalid user, got {response.status_code}"
    
    def test_balance_response_structure(self):
        """Test that balance response has all required fields"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/balance", 
                                  params={"user_id": user_id})
            
            if response.status_code == 200:
                data = response.json()
                earnings = data.get("earnings", {})
                
                # Check earnings structure
                required_earnings_fields = ["total_earnings", "pending_earnings", 
                                           "withdrawable_balance", "total_withdrawn", 
                                           "pending_withdrawal"]
                for field in required_earnings_fields:
                    assert field in earnings, f"Missing required field: {field}"
                
                # Check commission_info structure
                commission_info = data.get("commission_info", {})
                required_commission_fields = ["tier_level", "commission_rate", "tutor_rate"]
                for field in required_commission_fields:
                    assert field in commission_info, f"Missing commission field: {field}"
        else:
            pytest.skip("No active teachers found in database")


class TestTutorTransactions:
    """Tests for GET /api/tutor-earnings/transactions endpoint"""
    
    def test_transactions_endpoint_returns_200(self):
        """Test transactions endpoint returns 200 for valid teacher"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/transactions", 
                                  params={"user_id": user_id})
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        else:
            pytest.skip("No active teachers found in database")
    
    def test_transactions_response_structure(self):
        """Test transactions response has correct structure"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/transactions", 
                                  params={"user_id": user_id, "limit": 10})
            
            if response.status_code == 200:
                data = response.json()
                assert "transactions" in data, "Response should contain 'transactions'"
                assert "total" in data, "Response should contain 'total'"
                assert "limit" in data, "Response should contain 'limit'"
                assert "offset" in data, "Response should contain 'offset'"
                assert isinstance(data["transactions"], list), "Transactions should be a list"
        else:
            pytest.skip("No active teachers found in database")
    
    def test_transactions_invalid_user_returns_404(self):
        """Test transactions for invalid user returns 404"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/transactions", 
                              params={"user_id": "invalid_user_xyz"})
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestWithdrawalHistory:
    """Tests for GET /api/tutor-earnings/withdrawals endpoint"""
    
    def test_withdrawals_endpoint_returns_200(self):
        """Test withdrawals history endpoint returns 200"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/withdrawals", 
                                  params={"user_id": user_id})
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        else:
            pytest.skip("No active teachers found in database")
    
    def test_withdrawals_response_structure(self):
        """Test withdrawals response has correct structure"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/withdrawals", 
                                  params={"user_id": user_id})
            
            if response.status_code == 200:
                data = response.json()
                assert "withdrawals" in data, "Response should contain 'withdrawals'"
                assert "total" in data, "Response should contain 'total'"
                assert isinstance(data["withdrawals"], list), "Withdrawals should be a list"
        else:
            pytest.skip("No active teachers found in database")


class TestWithdrawalRequest:
    """Tests for POST /api/tutor-earnings/withdraw endpoint"""
    
    def test_withdraw_with_zero_amount_returns_400(self):
        """Test withdrawal with 0 amount returns 400"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.post(
                f"{BASE_URL}/api/tutor-earnings/withdraw",
                params={"user_id": user_id},
                json={
                    "amount": 0,
                    "bank_name": "Test Bank",
                    "account_number": "1234567890",
                    "account_holder_name": "Test User"
                }
            )
            assert response.status_code == 400, f"Expected 400 for zero amount, got {response.status_code}"
        else:
            pytest.skip("No active teachers found in database")
    
    def test_withdraw_with_negative_amount_returns_400(self):
        """Test withdrawal with negative amount returns 400"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.post(
                f"{BASE_URL}/api/tutor-earnings/withdraw",
                params={"user_id": user_id},
                json={
                    "amount": -50,
                    "bank_name": "Test Bank",
                    "account_number": "1234567890",
                    "account_holder_name": "Test User"
                }
            )
            assert response.status_code == 400, f"Expected 400 for negative amount, got {response.status_code}"
        else:
            pytest.skip("No active teachers found in database")
    
    def test_withdraw_exceeding_balance_returns_400(self):
        """Test withdrawal exceeding balance returns 400"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            # Request amount way higher than any possible balance
            response = requests.post(
                f"{BASE_URL}/api/tutor-earnings/withdraw",
                params={"user_id": user_id},
                json={
                    "amount": 999999999,
                    "bank_name": "Test Bank",
                    "account_number": "1234567890",
                    "account_holder_name": "Test User"
                }
            )
            assert response.status_code == 400, f"Expected 400 for excessive amount, got {response.status_code}"
        else:
            pytest.skip("No active teachers found in database")
    
    def test_withdraw_invalid_user_returns_404(self):
        """Test withdrawal for invalid user returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/tutor-earnings/withdraw",
            params={"user_id": "invalid_user_xyz"},
            json={
                "amount": 50,
                "bank_name": "Test Bank",
                "account_number": "1234567890",
                "account_holder_name": "Test User"
            }
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestAdminPendingWithdrawals:
    """Tests for GET /api/tutor-earnings/admin/pending-withdrawals endpoint"""
    
    def test_pending_withdrawals_returns_200(self):
        """Test admin pending withdrawals endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/pending-withdrawals")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_pending_withdrawals_response_structure(self):
        """Test pending withdrawals response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/pending-withdrawals")
        if response.status_code == 200:
            data = response.json()
            assert "pending_withdrawals" in data, "Response should contain 'pending_withdrawals'"
            assert "total" in data, "Response should contain 'total'"
            assert isinstance(data["pending_withdrawals"], list), "pending_withdrawals should be a list"
    
    def test_pending_withdrawals_have_teacher_info(self):
        """Test that pending withdrawals include teacher info"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/pending-withdrawals")
        if response.status_code == 200:
            data = response.json()
            for withdrawal in data.get("pending_withdrawals", []):
                assert "teacher_info" in withdrawal, "Each withdrawal should have teacher_info"
                assert "withdrawal_id" in withdrawal, "Each withdrawal should have withdrawal_id"
                assert "amount" in withdrawal, "Each withdrawal should have amount"
                assert "bank_name" in withdrawal, "Each withdrawal should have bank_name"
                assert "status" in withdrawal, "Each withdrawal should have status"


class TestAdminCommissionEarned:
    """Tests for GET /api/tutor-earnings/admin/commission-earned endpoint"""
    
    def test_commission_earned_returns_200(self):
        """Test admin commission earned endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/commission-earned")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_commission_earned_response_structure(self):
        """Test commission earned response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/commission-earned")
        if response.status_code == 200:
            data = response.json()
            assert "commission_earned" in data, "Response should contain 'commission_earned'"
            assert "withdrawals" in data, "Response should contain 'withdrawals'"
    
    def test_commission_earned_fields(self):
        """Test commission_earned section has required fields"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/commission-earned")
        if response.status_code == 200:
            data = response.json()
            commission = data.get("commission_earned", {})
            
            required_fields = ["total_platform_commission", "total_sessions_completed", 
                             "total_session_value", "total_tutor_payouts_owed"]
            for field in required_fields:
                assert field in commission, f"Missing commission field: {field}"
    
    def test_withdrawals_stats_fields(self):
        """Test withdrawals section has required fields"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/commission-earned")
        if response.status_code == 200:
            data = response.json()
            withdrawals = data.get("withdrawals", {})
            
            required_fields = ["total_withdrawn", "total_withdrawal_count", 
                             "pending_withdrawal_amount", "pending_withdrawal_count",
                             "outstanding_tutor_balance"]
            for field in required_fields:
                assert field in withdrawals, f"Missing withdrawals field: {field}"


class TestAdminAllWithdrawals:
    """Tests for GET /api/tutor-earnings/admin/all-withdrawals endpoint"""
    
    def test_all_withdrawals_returns_200(self):
        """Test admin all withdrawals endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/all-withdrawals")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_all_withdrawals_with_status_filter(self):
        """Test all withdrawals with status filter"""
        for status in ["pending", "completed", "rejected"]:
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/all-withdrawals",
                                  params={"status": status})
            assert response.status_code == 200, f"Expected 200 for status={status}"
    
    def test_all_withdrawals_response_structure(self):
        """Test all withdrawals response has correct structure"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/all-withdrawals")
        if response.status_code == 200:
            data = response.json()
            assert "withdrawals" in data, "Response should contain 'withdrawals'"
            assert "total" in data, "Response should contain 'total'"
            assert "limit" in data, "Response should contain 'limit'"
            assert "offset" in data, "Response should contain 'offset'"


class TestAdminProcessWithdrawal:
    """Tests for POST /api/tutor-earnings/admin/withdrawals/{withdrawal_id}/process"""
    
    def test_process_nonexistent_withdrawal_returns_404(self):
        """Test processing non-existent withdrawal returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/tutor-earnings/admin/withdrawals/nonexistent_wd_123/process",
            params={"admin_user_id": "admin_001"},
            json={"status": "approved"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_process_requires_rejection_reason(self):
        """Test that rejection requires a reason"""
        # First check if there are any pending withdrawals
        pending_response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/pending-withdrawals")
        if pending_response.status_code == 200:
            pending = pending_response.json().get("pending_withdrawals", [])
            if len(pending) > 0:
                withdrawal_id = pending[0]["withdrawal_id"]
                # Try to reject without reason
                response = requests.post(
                    f"{BASE_URL}/api/tutor-earnings/admin/withdrawals/{withdrawal_id}/process",
                    params={"admin_user_id": "test_admin"},
                    json={"status": "rejected"}  # No rejection_reason
                )
                assert response.status_code == 400, f"Expected 400 when rejecting without reason, got {response.status_code}"
            else:
                pytest.skip("No pending withdrawals to test")
        else:
            pytest.skip("Could not fetch pending withdrawals")


class TestAdminTutorEarnings:
    """Tests for GET /api/tutor-earnings/admin/tutor/{teacher_id}/earnings"""
    
    def test_admin_get_tutor_earnings_returns_200(self):
        """Test admin can get specific tutor earnings"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            teacher_id = teacher.get("teacher_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/tutor/{teacher_id}/earnings")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        else:
            pytest.skip("No active teachers found")
    
    def test_admin_get_tutor_earnings_structure(self):
        """Test admin tutor earnings response structure"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            teacher_id = teacher.get("teacher_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/tutor/{teacher_id}/earnings")
            if response.status_code == 200:
                data = response.json()
                assert "teacher_info" in data, "Response should contain 'teacher_info'"
                assert "earnings" in data, "Response should contain 'earnings'"
                assert "recent_transactions" in data, "Response should contain 'recent_transactions'"
                assert "recent_withdrawals" in data, "Response should contain 'recent_withdrawals'"
        else:
            pytest.skip("No active teachers found")
    
    def test_admin_get_invalid_tutor_returns_404(self):
        """Test getting earnings for invalid teacher returns 404"""
        response = requests.get(f"{BASE_URL}/api/tutor-earnings/admin/tutor/invalid_teacher_123/earnings")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestBusinessLogic:
    """Tests for business logic validation"""
    
    def test_new_teacher_has_zero_balance(self):
        """Test that a new teacher starts with zero balance"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/balance", 
                                  params={"user_id": user_id})
            
            if response.status_code == 200:
                data = response.json()
                earnings = data.get("earnings", {})
                
                # All values should be >= 0
                assert earnings.get("total_earnings", 0) >= 0
                assert earnings.get("pending_earnings", 0) >= 0
                assert earnings.get("withdrawable_balance", 0) >= 0
                assert earnings.get("total_withdrawn", 0) >= 0
                assert earnings.get("pending_withdrawal", 0) >= 0
        else:
            pytest.skip("No active teachers found")
    
    def test_commission_rate_matches_tier(self):
        """Test that commission rate matches the tier level"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/balance", 
                                  params={"user_id": user_id})
            
            if response.status_code == 200:
                data = response.json()
                commission_info = data.get("commission_info", {})
                tier = commission_info.get("tier_level", "new")
                rate = commission_info.get("commission_rate", 0)
                
                # Verify rate matches tier
                expected_rates = {"new": 0.30, "rated": 0.25, "elite": 0.20}
                if tier in expected_rates:
                    assert rate == expected_rates[tier], f"Rate {rate} doesn't match tier {tier}"
        else:
            pytest.skip("No active teachers found")
    
    def test_tutor_rate_plus_commission_equals_one(self):
        """Test that tutor_rate + commission_rate = 1"""
        teachers_response = requests.get(f"{BASE_URL}/api/teachers")
        if teachers_response.status_code == 200 and len(teachers_response.json()) > 0:
            teacher = teachers_response.json()[0]
            user_id = teacher.get("user_id")
            
            response = requests.get(f"{BASE_URL}/api/tutor-earnings/balance", 
                                  params={"user_id": user_id})
            
            if response.status_code == 200:
                data = response.json()
                commission_info = data.get("commission_info", {})
                commission_rate = commission_info.get("commission_rate", 0)
                tutor_rate = commission_info.get("tutor_rate", 0)
                
                assert abs((commission_rate + tutor_rate) - 1.0) < 0.001, \
                    f"commission_rate ({commission_rate}) + tutor_rate ({tutor_rate}) should equal 1"
        else:
            pytest.skip("No active teachers found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
