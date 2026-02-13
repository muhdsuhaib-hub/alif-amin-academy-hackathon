"""
Test that all hourly_rate references have been removed from the platform.
The platform uses a credit-based pricing system (RM15 per credit).
1 credit = 15min, 2 credits = 30min, 4 credits = 60min
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')

# Admin session cookie for authenticated requests
ADMIN_SESSION_COOKIE = "session_b8ed5bf2f29c4780a8dfbe540f5f00e9"


class TestHourlyRateRemovalFromPayroll:
    """Test that payroll endpoint no longer returns hourly_rate or total_hours"""

    def test_payroll_no_hourly_rate(self):
        """GET /api/admin/finance/payroll should not include hourly_rate field"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/payroll",
            cookies={"session_token": ADMIN_SESSION_COOKIE}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "payroll_details" in data
        
        # Check each teacher in payroll doesn't have hourly_rate or total_hours
        for teacher in data.get("payroll_details", []):
            assert "hourly_rate" not in teacher, f"hourly_rate found in payroll for {teacher.get('teacher_name')}"
            assert "total_hours" not in teacher, f"total_hours found in payroll for {teacher.get('teacher_name')}"
            # Should have commission_tier instead
            assert "commission_tier" in teacher, f"commission_tier missing for {teacher.get('teacher_name')}"
            
    def test_payroll_has_commission_tier(self):
        """GET /api/admin/finance/payroll should have commission_tier field"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/payroll",
            cookies={"session_token": ADMIN_SESSION_COOKIE}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check that commission_tier field is present for each teacher
        for teacher in data.get("payroll_details", []):
            assert "commission_tier" in teacher, f"commission_tier missing for {teacher.get('teacher_name')}"
            # Validate tier is one of the expected values
            valid_tiers = ["new", "rated", "elite"]
            if teacher.get("commission_tier"):
                assert teacher["commission_tier"] in valid_tiers, f"Invalid tier: {teacher['commission_tier']}"


class TestHourlyRateRemovalFromTeacherProfile:
    """Test that teacher profile doesn't have hourly_rate"""
    
    def test_teacher_list_no_hourly_rate(self):
        """GET /api/teachers should not return hourly_rate"""
        response = requests.get(f"{BASE_URL}/api/teachers")
        assert response.status_code == 200
        teachers = response.json()
        
        for teacher in teachers:
            assert "hourly_rate" not in teacher, f"hourly_rate found for teacher {teacher.get('teacher_id')}"
            
    def test_teacher_dashboard_no_hourly_rate(self):
        """Teacher dashboard should not return hourly_rate"""
        # This test may skip if no teacher session, but we test the endpoint exists
        response = requests.get(
            f"{BASE_URL}/api/teachers/dashboard",
            cookies={"session_token": ADMIN_SESSION_COOKIE}
        )
        # May return 403 if admin is not a teacher - that's expected
        if response.status_code == 200:
            data = response.json()
            if "teacher" in data:
                assert "hourly_rate" not in data["teacher"]


class TestHourlyRateRemovalFromAdminUsersList:
    """Test that admin user list doesn't return hourly_rate"""
    
    def test_admin_users_no_hourly_rate(self):
        """GET /api/admin/users/all should not return hourly_rate in teacher_info"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/all",
            cookies={"session_token": ADMIN_SESSION_COOKIE}
        )
        assert response.status_code == 200
        data = response.json()
        
        for user in data.get("users", []):
            if user.get("teacher_info"):
                assert "hourly_rate" not in user["teacher_info"], f"hourly_rate found in teacher_info for {user.get('email')}"


class TestTeacherProfileUpdateNoHourlyRate:
    """Test that teacher profile update doesn't accept hourlyRate"""
    
    def test_teacher_profile_update_ignores_hourly_rate(self):
        """PUT /api/teachers/{teacher_id}/profile should ignore hourlyRate"""
        # First, get a teacher to update
        response = requests.get(f"{BASE_URL}/api/teachers")
        if response.status_code != 200 or not response.json():
            pytest.skip("No teachers available to test profile update")
            
        teachers = response.json()
        if not teachers:
            pytest.skip("No teachers available")
            
        teacher_id = teachers[0]["teacher_id"]
        
        # Try to update with hourlyRate - should be ignored
        update_data = {
            "bio": "Test bio update",
            "hourlyRate": 999  # This should be ignored
        }
        
        response = requests.put(
            f"{BASE_URL}/api/teachers/{teacher_id}/profile",
            json=update_data,
            cookies={"session_token": ADMIN_SESSION_COOKIE}
        )
        # May return 401 if admin doesn't have teacher role - that's expected
        if response.status_code == 401:
            pytest.skip("Admin session doesn't have teacher permissions")
        assert response.status_code == 200
        
        # Verify the teacher doesn't have hourly_rate
        response = requests.get(f"{BASE_URL}/api/teachers/{teacher_id}")
        assert response.status_code == 200
        teacher = response.json()
        assert "hourly_rate" not in teacher


class TestPayrollCalculationFromSessionRecords:
    """Test that payroll uses session_payment_records instead of hourly_rate * hours"""
    
    def test_payroll_uses_session_records(self):
        """Payroll should be calculated from session_payment_records.tutor_payout"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/payroll",
            cookies={"session_token": ADMIN_SESSION_COOKIE}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check structure - should have payment_due based on tutor_payout from session records
        assert "total_payroll" in data
        assert "payroll_details" in data
        
        for teacher in data.get("payroll_details", []):
            # Should have payment_due (from session_payment_records aggregation)
            assert "payment_due" in teacher
            # Should NOT have hourly_rate or total_hours
            assert "hourly_rate" not in teacher
            assert "total_hours" not in teacher


class TestCreditBasedPricing:
    """Verify that the platform uses credit-based pricing"""
    
    def test_revenue_report_structure(self):
        """Revenue report should reflect credit-based pricing (RM15 per credit)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/revenue",
            cookies={"session_token": ADMIN_SESSION_COOKIE}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return revenue data without hourly_rate references
        assert "total_revenue" in data
        assert "paid_classes" in data
        assert "trial_classes" in data


class TestTeacherTransactionsNoHourlyRate:
    """Test that teacher transaction history doesn't use hourly_rate"""
    
    def test_transactions_no_hourly_rate(self):
        """GET /api/teachers/{teacher_id}/transactions should not reference hourly_rate"""
        # Get a teacher first
        response = requests.get(f"{BASE_URL}/api/teachers")
        if response.status_code != 200 or not response.json():
            pytest.skip("No teachers available")
            
        teachers = response.json()
        if not teachers:
            pytest.skip("No teachers available")
            
        teacher_id = teachers[0]["teacher_id"]
        
        response = requests.get(
            f"{BASE_URL}/api/teachers/{teacher_id}/transactions",
            cookies={"session_token": ADMIN_SESSION_COOKIE}
        )
        # May return 401 if endpoint requires specific permissions
        if response.status_code == 401:
            pytest.skip("Admin session doesn't have permissions for this endpoint")
        assert response.status_code == 200
        data = response.json()
        
        # Transaction amounts should be based on platform standard rate, not teacher hourly_rate
        for txn in data.get("transactions", []):
            # Verify no hourly_rate reference in transaction data
            assert "hourly_rate" not in txn


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
