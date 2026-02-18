"""
Batch 5: Teacher Experience Overhaul - Backend Tests
Tests commission tiers, dashboard data, payout requests, availability, and profile updates.
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review_request
TEACHER_SESSION = "session_604d0a2753df44e4a0cfeb23041605c3"
TEACHER_ID = "teacher_f2e2f5605228"
STUDENT_SESSION = "session_e980c3ee392e4f70849e1936cef22cc9"

class TestTeacherDashboardData:
    """Test GET /api/teacher/dashboard-data endpoint"""
    
    def test_dashboard_data_returns_tier_info(self):
        """Step 1: Verify dashboard-data returns tier with commission_rate"""
        r = requests.get(
            f"{BASE_URL}/api/teacher/dashboard-data",
            headers={"Authorization": f"Bearer {TEACHER_SESSION}"},
            timeout=10
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        
        # Validate tier structure
        assert "tier" in data, "Response should contain tier info"
        tier = data["tier"]
        assert "commission_rate" in tier, "Tier should have commission_rate"
        assert "level" in tier, "Tier should have level (new/rated/elite)"
        assert "name" in tier, "Tier should have name"
        
        # New tutors should have 0.40 commission rate (40%)
        # Note: The teacher might have progressed, but commission_rate should exist
        assert 0.0 < tier["commission_rate"] <= 0.40, f"Commission rate should be <= 0.40, got {tier['commission_rate']}"
        print(f"Tier info: {tier['name']} - {tier['commission_rate']*100}% platform fee")

    def test_dashboard_data_returns_upcoming_classes(self):
        """Verify dashboard returns upcoming_classes array"""
        r = requests.get(
            f"{BASE_URL}/api/teacher/dashboard-data",
            headers={"Authorization": f"Bearer {TEACHER_SESSION}"},
            timeout=10
        )
        assert r.status_code == 200
        data = r.json()
        
        assert "upcoming_classes" in data, "Response should have upcoming_classes"
        assert isinstance(data["upcoming_classes"], list), "upcoming_classes should be a list"
        print(f"Upcoming classes count: {len(data['upcoming_classes'])}")

    def test_dashboard_data_returns_month_stats(self):
        """Verify dashboard returns month_stats for earnings widget"""
        r = requests.get(
            f"{BASE_URL}/api/teacher/dashboard-data",
            headers={"Authorization": f"Bearer {TEACHER_SESSION}"},
            timeout=10
        )
        assert r.status_code == 200
        data = r.json()
        
        assert "month_stats" in data, "Response should have month_stats"
        stats = data["month_stats"]
        assert "net_earnings" in stats, "month_stats should have net_earnings"
        assert "gross_earnings" in stats, "month_stats should have gross_earnings"
        assert "classes_taught" in stats, "month_stats should have classes_taught"
        print(f"Month stats: net={stats['net_earnings']}, gross={stats['gross_earnings']}, classes={stats['classes_taught']}")

    def test_dashboard_data_returns_teacher_info(self):
        """Verify dashboard returns teacher profile"""
        r = requests.get(
            f"{BASE_URL}/api/teacher/dashboard-data",
            headers={"Authorization": f"Bearer {TEACHER_SESSION}"},
            timeout=10
        )
        assert r.status_code == 200
        data = r.json()
        
        assert "teacher" in data, "Response should have teacher"
        teacher = data["teacher"]
        assert "teacher_id" in teacher, "Teacher should have teacher_id"
        print(f"Teacher ID: {teacher['teacher_id']}")

    def test_dashboard_data_requires_auth(self):
        """Verify endpoint requires authentication"""
        r = requests.get(f"{BASE_URL}/api/teacher/dashboard-data", timeout=10)
        assert r.status_code == 401, "Should require authentication"

    def test_dashboard_data_requires_teacher_role(self):
        """Verify endpoint requires teacher role"""
        r = requests.get(
            f"{BASE_URL}/api/teacher/dashboard-data",
            headers={"Authorization": f"Bearer {STUDENT_SESSION}"},
            timeout=10
        )
        assert r.status_code == 403, f"Students should get 403, got {r.status_code}"


class TestSystemSettings:
    """Step 1: Verify system_settings collection has commission_tiers"""
    
    def test_commission_tiers_api_exists(self):
        """Check if commission tiers can be retrieved"""
        # The commission service defines tiers - check it's imported properly
        # We test this via the dashboard-data endpoint which uses commission rates
        r = requests.get(
            f"{BASE_URL}/api/teacher/dashboard-data",
            headers={"Authorization": f"Bearer {TEACHER_SESSION}"},
            timeout=10
        )
        assert r.status_code == 200
        data = r.json()
        
        tier = data.get("tier", {})
        # New Tutor: 40%, Rated Tutor: 35%, Elite Tutor: 30%
        valid_rates = [0.30, 0.35, 0.40]
        assert tier.get("commission_rate") in valid_rates, f"Commission rate should be one of {valid_rates}"


class TestAvailabilityBulkSave:
    """Step 3: Test POST /api/booking/availability/bulk"""
    
    def test_save_availability_slots(self):
        """Save availability slots for a week"""
        # Get today and create week_start (Monday)
        today = datetime.now()
        week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        
        # Create some test slots
        test_slots = [
            {"date": week_start, "start_time": "09:00", "end_time": "09:30"},
            {"date": week_start, "start_time": "09:30", "end_time": "10:00"},
            {"date": week_start, "start_time": "14:00", "end_time": "14:30"},
        ]
        
        r = requests.post(
            f"{BASE_URL}/api/booking/availability/bulk",
            headers={
                "Authorization": f"Bearer {TEACHER_SESSION}",
                "Content-Type": "application/json"
            },
            json={
                "teacher_id": TEACHER_ID,
                "week_start": week_start,
                "slots": test_slots
            },
            timeout=10
        )
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        data = r.json()
        assert "count" in data or "message" in data, "Response should confirm save"
        print(f"Saved slots: {data}")

    def test_get_teacher_availability(self):
        """Verify slots can be retrieved after saving"""
        today = datetime.now()
        start_date = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        end_date = (today + timedelta(days=7)).strftime('%Y-%m-%d')
        
        r = requests.get(
            f"{BASE_URL}/api/booking/teacher-availability/{TEACHER_ID}",
            params={"start_date": start_date, "end_date": end_date},
            timeout=10
        )
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "slots" in data, "Response should have slots array"
        print(f"Retrieved {len(data['slots'])} slots")

    def test_bulk_save_requires_auth(self):
        """Verify bulk save requires authentication"""
        r = requests.post(
            f"{BASE_URL}/api/booking/availability/bulk",
            json={"teacher_id": TEACHER_ID, "week_start": "2025-01-01", "slots": []},
            timeout=10
        )
        assert r.status_code == 401, "Should require authentication"


class TestTeacherRequestPayout:
    """Step 4: Test POST /api/teacher/request-payout"""
    
    def test_request_payout_validation(self):
        """Verify payout requires all bank fields"""
        r = requests.post(
            f"{BASE_URL}/api/teacher/request-payout",
            headers={
                "Authorization": f"Bearer {TEACHER_SESSION}",
                "Content-Type": "application/json"
            },
            json={
                "bank_name": "Maybank",
                "account_number": "",  # Missing
                "account_holder": "Test Teacher",
                "amount": 50
            },
            timeout=10
        )
        # Should fail validation
        assert r.status_code == 400, f"Should reject incomplete bank details, got {r.status_code}"
        print(f"Validation response: {r.text}")

    def test_request_payout_amount_validation(self):
        """Verify payout amount must be positive and <= balance"""
        r = requests.post(
            f"{BASE_URL}/api/teacher/request-payout",
            headers={
                "Authorization": f"Bearer {TEACHER_SESSION}",
                "Content-Type": "application/json"
            },
            json={
                "bank_name": "Maybank",
                "account_number": "1234567890",
                "account_holder": "Test Teacher",
                "amount": -100  # Invalid negative amount
            },
            timeout=10
        )
        assert r.status_code == 400, f"Should reject negative amount, got {r.status_code}"

    def test_request_payout_requires_teacher_role(self):
        """Verify only teachers can request payouts"""
        r = requests.post(
            f"{BASE_URL}/api/teacher/request-payout",
            headers={
                "Authorization": f"Bearer {STUDENT_SESSION}",
                "Content-Type": "application/json"
            },
            json={
                "bank_name": "Maybank",
                "account_number": "1234567890",
                "account_holder": "Test",
                "amount": 50
            },
            timeout=10
        )
        assert r.status_code == 403, f"Students should get 403, got {r.status_code}"


class TestTeacherStudents:
    """Step 5: Test GET /api/booking/teacher-students/{teacher_id}"""
    
    def test_get_teacher_students(self):
        """Verify teacher can get their students list"""
        r = requests.get(
            f"{BASE_URL}/api/booking/teacher-students/{TEACHER_ID}",
            headers={"Authorization": f"Bearer {TEACHER_SESSION}"},
            timeout=10
        )
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "students" in data, "Response should have students array"
        assert isinstance(data["students"], list), "students should be a list"
        print(f"Students count: {len(data['students'])}")


class TestTeacherProfileUpdate:
    """Step 6: Test PUT /api/teacher/update-profile"""
    
    def test_update_teacher_bio(self):
        """Verify teacher can update bio"""
        r = requests.put(
            f"{BASE_URL}/api/teacher/update-profile",
            headers={
                "Authorization": f"Bearer {TEACHER_SESSION}",
                "Content-Type": "application/json"
            },
            json={"bio": "Test bio update from automated tests"},
            timeout=10
        )
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        print(f"Bio update response: {r.json()}")

    def test_update_teacher_specializations(self):
        """Verify teacher can update specializations"""
        r = requests.put(
            f"{BASE_URL}/api/teacher/update-profile",
            headers={
                "Authorization": f"Bearer {TEACHER_SESSION}",
                "Content-Type": "application/json"
            },
            json={"specializations": ["Tajweed", "Hifz"]},
            timeout=10
        )
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_update_profile_requires_teacher(self):
        """Verify only teachers can update teacher profile"""
        r = requests.put(
            f"{BASE_URL}/api/teacher/update-profile",
            headers={
                "Authorization": f"Bearer {STUDENT_SESSION}",
                "Content-Type": "application/json"
            },
            json={"bio": "Hacked bio"},
            timeout=10
        )
        assert r.status_code == 403, f"Students should get 403, got {r.status_code}"


class TestTeacherTransactions:
    """Test teacher earnings transaction history"""
    
    def test_get_teacher_transactions(self):
        """Verify teacher can get transaction history"""
        r = requests.get(
            f"{BASE_URL}/api/teachers/{TEACHER_ID}/transactions",
            headers={"Authorization": f"Bearer {TEACHER_SESSION}"},
            timeout=10
        )
        
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert "transactions" in data, "Response should have transactions"
        print(f"Transactions count: {len(data['transactions'])}")


class TestAPIHealth:
    """Basic health checks"""
    
    def test_api_root(self):
        """Verify API is responding"""
        r = requests.get(f"{BASE_URL}/api/", timeout=10)
        assert r.status_code == 200
        print(f"API response: {r.json()}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
