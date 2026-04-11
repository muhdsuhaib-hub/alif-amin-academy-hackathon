"""
Test Admin Dashboard API endpoints - Iteration 11
Tests for the Admin Dashboard changes:
1. GET /api/admin/stats - should return trial_students with student_name and student_email
2. GET /api/admin/stats - should return trends object (user_trend, student_trend, revenue_trend)
3. GET /api/admin/stats - should return charts object (user_growth, revenue_trend, attendance)
4. GET /api/admin/subscriptions/overview - should return trials_expiring_soon with student names
5. GET /api/admin/revenue/recognition - should return proper revenue data
6. GET /api/admin/wallet/liability - should return proper liability data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://amin-env-secure.preview.emergentagent.com"

# Admin credentials from the test request
ADMIN_SESSION_COOKIE = "session_b8ed5bf2f29c4780a8dfbe540f5f00e9"


@pytest.fixture
def admin_session():
    """Session with admin authentication cookie"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    session.cookies.set("session_token", ADMIN_SESSION_COOKIE)
    return session


class TestAdminStatsEndpoint:
    """Test GET /api/admin/stats endpoint"""
    
    def test_admin_stats_returns_200(self, admin_session):
        """Test that admin stats endpoint returns 200"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Admin stats endpoint returns 200")
    
    def test_admin_stats_has_trial_students(self, admin_session):
        """Test that admin stats has trial_students array"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "trial_students" in data, "trial_students field missing from response"
        assert isinstance(data["trial_students"], list), "trial_students should be a list"
        print(f"✓ Admin stats has trial_students array with {len(data['trial_students'])} students")
    
    def test_trial_students_have_name_and_email(self, admin_session):
        """Test that trial_students contain student_name and student_email fields"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        trial_students = data.get("trial_students", [])
        if len(trial_students) > 0:
            student = trial_students[0]
            assert "student_name" in student, f"student_name field missing. Available fields: {list(student.keys())}"
            assert "student_email" in student, f"student_email field missing. Available fields: {list(student.keys())}"
            print(f"✓ Trial students have student_name: '{student.get('student_name')}' and student_email: '{student.get('student_email')}'")
        else:
            pytest.skip("No trial students to verify - field structure exists but empty")
    
    def test_admin_stats_has_trends_object(self, admin_session):
        """Test that admin stats has trends object with user_trend, student_trend, revenue_trend"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "trends" in data, f"trends field missing from response. Available fields: {list(data.keys())}"
        trends = data["trends"]
        
        assert "user_trend" in trends, f"user_trend missing from trends. Available: {list(trends.keys())}"
        assert "student_trend" in trends, f"student_trend missing from trends. Available: {list(trends.keys())}"
        assert "revenue_trend" in trends, f"revenue_trend missing from trends. Available: {list(trends.keys())}"
        
        # Verify they are numeric values (not hardcoded strings like "+12%")
        assert isinstance(trends["user_trend"], (int, float)), f"user_trend should be numeric, got {type(trends['user_trend'])}"
        assert isinstance(trends["student_trend"], (int, float)), f"student_trend should be numeric, got {type(trends['student_trend'])}"
        assert isinstance(trends["revenue_trend"], (int, float)), f"revenue_trend should be numeric, got {type(trends['revenue_trend'])}"
        
        print(f"✓ Trends object has real values - user: {trends['user_trend']}%, student: {trends['student_trend']}%, revenue: {trends['revenue_trend']}%")
    
    def test_admin_stats_has_charts_object(self, admin_session):
        """Test that admin stats has charts object with user_growth, revenue_trend, attendance"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "charts" in data, f"charts field missing from response. Available fields: {list(data.keys())}"
        charts = data["charts"]
        
        assert "user_growth" in charts, f"user_growth missing from charts. Available: {list(charts.keys())}"
        assert "revenue_trend" in charts, f"revenue_trend missing from charts. Available: {list(charts.keys())}"
        assert "attendance" in charts, f"attendance missing from charts. Available: {list(charts.keys())}"
        
        # Verify they are arrays
        assert isinstance(charts["user_growth"], list), "user_growth should be a list"
        assert isinstance(charts["revenue_trend"], list), "revenue_trend should be a list"
        assert isinstance(charts["attendance"], list), "attendance should be a list"
        
        print(f"✓ Charts object has arrays - user_growth: {len(charts['user_growth'])} items, revenue_trend: {len(charts['revenue_trend'])} items, attendance: {len(charts['attendance'])} items")
    
    def test_charts_user_growth_structure(self, admin_session):
        """Test user_growth chart data structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        user_growth = data.get("charts", {}).get("user_growth", [])
        if len(user_growth) > 0:
            item = user_growth[0]
            assert "month" in item, f"month field missing from user_growth item. Available: {list(item.keys())}"
            assert "users" in item, f"users field missing from user_growth item. Available: {list(item.keys())}"
            print(f"✓ User growth data structure correct: {item}")
        else:
            pytest.skip("No user growth data to verify structure")
    
    def test_charts_attendance_structure(self, admin_session):
        """Test attendance chart data structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        data = response.json()
        
        attendance = data.get("charts", {}).get("attendance", [])
        if len(attendance) > 0:
            item = attendance[0]
            assert "day" in item, f"day field missing from attendance item. Available: {list(item.keys())}"
            assert "rate" in item, f"rate field missing from attendance item. Available: {list(item.keys())}"
            print(f"✓ Attendance data structure correct: {item}")
        else:
            pytest.skip("No attendance data to verify structure")


class TestSubscriptionsOverviewEndpoint:
    """Test GET /api/admin/subscriptions/overview endpoint"""
    
    def test_subscriptions_overview_returns_200(self, admin_session):
        """Test that subscriptions overview endpoint returns 200"""
        response = admin_session.get(f"{BASE_URL}/api/admin/subscriptions/overview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Subscriptions overview endpoint returns 200")
    
    def test_subscriptions_overview_has_counts(self, admin_session):
        """Test that subscriptions overview has subscription counts"""
        response = admin_session.get(f"{BASE_URL}/api/admin/subscriptions/overview")
        assert response.status_code == 200
        data = response.json()
        
        assert "active_subscriptions" in data, "active_subscriptions missing"
        assert "trial_subscriptions" in data, "trial_subscriptions missing"
        assert "paused_subscriptions" in data, "paused_subscriptions missing"
        assert "cancelled_subscriptions" in data, "cancelled_subscriptions missing"
        
        print(f"✓ Subscription counts - Active: {data['active_subscriptions']}, Trial: {data['trial_subscriptions']}, Paused: {data['paused_subscriptions']}, Cancelled: {data['cancelled_subscriptions']}")
    
    def test_trials_expiring_soon_has_student_names(self, admin_session):
        """Test that trials_expiring_soon contains student_name and student_email"""
        response = admin_session.get(f"{BASE_URL}/api/admin/subscriptions/overview")
        assert response.status_code == 200
        data = response.json()
        
        assert "trials_expiring_soon" in data, "trials_expiring_soon missing from response"
        trials = data["trials_expiring_soon"]
        
        if len(trials) > 0:
            trial = trials[0]
            assert "student_name" in trial, f"student_name missing from trials_expiring_soon. Available: {list(trial.keys())}"
            assert "student_email" in trial, f"student_email missing from trials_expiring_soon. Available: {list(trial.keys())}"
            print(f"✓ Trials expiring soon has names - first student: '{trial.get('student_name')}', email: '{trial.get('student_email')}'")
        else:
            print("✓ No trials expiring soon (empty array) - field structure exists")


class TestRevenueRecognitionEndpoint:
    """Test GET /api/admin/revenue/recognition endpoint"""
    
    def test_revenue_recognition_returns_200(self, admin_session):
        """Test that revenue recognition endpoint returns 200"""
        response = admin_session.get(f"{BASE_URL}/api/admin/revenue/recognition")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Revenue recognition endpoint returns 200")
    
    def test_revenue_recognition_has_required_fields(self, admin_session):
        """Test that revenue recognition has all required fields"""
        response = admin_session.get(f"{BASE_URL}/api/admin/revenue/recognition")
        assert response.status_code == 200
        data = response.json()
        
        # Check main sections exist
        assert "cash_flow" in data, f"cash_flow missing. Available: {list(data.keys())}"
        assert "revenue_recognition" in data, f"revenue_recognition missing. Available: {list(data.keys())}"
        assert "tutor_payable" in data, f"tutor_payable missing. Available: {list(data.keys())}"
        assert "deferred_revenue" in data, f"deferred_revenue missing. Available: {list(data.keys())}"
        
        print(f"✓ Revenue recognition has all required sections")
    
    def test_cash_flow_structure(self, admin_session):
        """Test cash_flow section structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/revenue/recognition")
        assert response.status_code == 200
        data = response.json()
        
        cash_flow = data.get("cash_flow", {})
        assert "total_cash_collected" in cash_flow, "total_cash_collected missing from cash_flow"
        
        print(f"✓ Cash flow - Total collected: RM {cash_flow.get('total_cash_collected', 0)}")
    
    def test_commission_earned_structure(self, admin_session):
        """Test commission earned (revenue_recognition) section structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/revenue/recognition")
        assert response.status_code == 200
        data = response.json()
        
        rev = data.get("revenue_recognition", {})
        assert "commission_earned" in rev, "commission_earned missing from revenue_recognition"
        
        print(f"✓ Commission earned: RM {rev.get('commission_earned', 0)}")
    
    def test_tutor_payable_structure(self, admin_session):
        """Test tutor_payable section structure"""
        response = admin_session.get(f"{BASE_URL}/api/admin/revenue/recognition")
        assert response.status_code == 200
        data = response.json()
        
        tutor = data.get("tutor_payable", {})
        assert "total_payable" in tutor, "total_payable missing from tutor_payable"
        assert "already_paid" in tutor, "already_paid missing from tutor_payable"
        assert "pending_payment" in tutor, "pending_payment missing from tutor_payable"
        
        print(f"✓ Tutor payable - Total: RM {tutor.get('total_payable', 0)}, Paid: RM {tutor.get('already_paid', 0)}, Pending: RM {tutor.get('pending_payment', 0)}")


class TestWalletLiabilityEndpoint:
    """Test GET /api/admin/wallet/liability endpoint"""
    
    def test_wallet_liability_returns_200(self, admin_session):
        """Test that wallet liability endpoint returns 200"""
        response = admin_session.get(f"{BASE_URL}/api/admin/wallet/liability")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Wallet liability endpoint returns 200")
    
    def test_wallet_liability_has_credit_liability(self, admin_session):
        """Test that wallet liability has credit_liability section"""
        response = admin_session.get(f"{BASE_URL}/api/admin/wallet/liability")
        assert response.status_code == 200
        data = response.json()
        
        assert "credit_liability" in data, f"credit_liability missing. Available: {list(data.keys())}"
        
        liability = data["credit_liability"]
        assert "total_paid_credits_outstanding" in liability, "total_paid_credits_outstanding missing"
        assert "total_bonus_credits_outstanding" in liability, "total_bonus_credits_outstanding missing"
        
        print(f"✓ Credit liability - Paid: {liability.get('total_paid_credits_outstanding', 0)}, Bonus: {liability.get('total_bonus_credits_outstanding', 0)}")
    
    def test_wallet_liability_has_tutor_exposure(self, admin_session):
        """Test that wallet liability has tutor_payout_exposure section"""
        response = admin_session.get(f"{BASE_URL}/api/admin/wallet/liability")
        assert response.status_code == 200
        data = response.json()
        
        assert "tutor_payout_exposure" in data, "tutor_payout_exposure missing"
        
        exposure = data["tutor_payout_exposure"]
        assert "total_exposure" in exposure, "total_exposure missing from tutor_payout_exposure"
        
        print(f"✓ Tutor payout exposure: RM {exposure.get('total_exposure', 0)}")


class TestAdminAuthRequired:
    """Test that admin endpoints require authentication"""
    
    def test_admin_stats_without_auth_returns_401(self):
        """Test that admin stats requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Admin stats requires authentication (401 without cookie)")
    
    def test_subscriptions_overview_without_auth_returns_401(self):
        """Test that subscriptions overview requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/subscriptions/overview")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Subscriptions overview requires authentication")
    
    def test_revenue_recognition_without_auth_returns_401(self):
        """Test that revenue recognition requires authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/revenue/recognition")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Revenue recognition requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
