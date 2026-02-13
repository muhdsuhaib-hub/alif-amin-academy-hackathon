"""
Test suite for Revenue Recognition Tracking feature
Tests the /api/admin/revenue/recognition endpoint

Key Business Rule: Commission is ONLY recognized when sessions are completed,
not when credits are purchased. Cash collected = deferred revenue until sessions delivered.

Current expected state:
- RM200 cash collected from top-ups
- 0 completed sessions
- 8 paid credits + 1 bonus credit outstanding
- Commission earned = 0 (no sessions completed)
- Deferred revenue = RM200 (cash collected = deferred when no sessions)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Constants for validation
BASE_CREDIT_PRICE = 15.0
COMMISSION_RATE = 0.20
TUTOR_PAYOUT_RATE = 0.80

class TestRevenueRecognitionEndpoint:
    """Test /api/admin/revenue/recognition endpoint"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def revenue_response(self, api_client):
        """Get revenue recognition data once for all tests in class"""
        response = api_client.get(f"{BASE_URL}/api/admin/revenue/recognition")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        return response.json()
    
    # ============== ENDPOINT TESTS ==============
    
    def test_revenue_recognition_endpoint_returns_200(self, api_client):
        """Test that endpoint returns 200 status"""
        response = api_client.get(f"{BASE_URL}/api/admin/revenue/recognition")
        assert response.status_code == 200
        print("PASSED: Endpoint returns 200")
    
    def test_response_has_all_required_sections(self, revenue_response):
        """Test response has all required top-level sections"""
        required_sections = [
            "cash_flow",
            "revenue_recognition",
            "tutor_payable",
            "deferred_revenue",
            "marketing_expense",
            "outstanding_credits",
            "session_summary",
            "accounting_summary"
        ]
        for section in required_sections:
            assert section in revenue_response, f"Missing section: {section}"
        print("PASSED: All required sections present")
    
    # ============== CASH FLOW TESTS ==============
    
    def test_cash_flow_has_total_cash_collected(self, revenue_response):
        """Test cash_flow section has total_cash_collected"""
        assert "total_cash_collected" in revenue_response["cash_flow"]
        cash_collected = revenue_response["cash_flow"]["total_cash_collected"]
        assert isinstance(cash_collected, (int, float))
        assert cash_collected >= 0
        print(f"PASSED: total_cash_collected = {cash_collected}")
    
    def test_cash_flow_total_is_200(self, revenue_response):
        """Test total cash collected is RM200 (known data)"""
        cash_collected = revenue_response["cash_flow"]["total_cash_collected"]
        # Allow for floating point tolerance
        assert cash_collected == 200.0, f"Expected 200, got {cash_collected}"
        print(f"PASSED: Cash collected is RM200 as expected")
    
    def test_cash_flow_has_last_30_days(self, revenue_response):
        """Test cash_flow has last_30_days field"""
        assert "last_30_days" in revenue_response["cash_flow"]
        last_30 = revenue_response["cash_flow"]["last_30_days"]
        assert isinstance(last_30, (int, float))
        print(f"PASSED: last_30_days = {last_30}")
    
    # ============== REVENUE RECOGNITION TESTS ==============
    
    def test_commission_earned_is_zero_no_sessions(self, revenue_response):
        """Test commission earned is 0 when no sessions completed"""
        commission = revenue_response["revenue_recognition"]["commission_earned"]
        assert commission == 0, f"Expected 0 commission (no sessions), got {commission}"
        print("PASSED: Commission earned = 0 (correct - no sessions completed)")
    
    def test_revenue_recognition_has_commission_rate(self, revenue_response):
        """Test revenue_recognition has commission_rate field"""
        rate = revenue_response["revenue_recognition"]["commission_rate"]
        assert rate == COMMISSION_RATE, f"Expected {COMMISSION_RATE}, got {rate}"
        print(f"PASSED: Commission rate = {rate} (20%)")
    
    def test_revenue_recognition_has_description(self, revenue_response):
        """Test revenue_recognition has description explaining policy"""
        desc = revenue_response["revenue_recognition"].get("description", "")
        assert "COMPLETED sessions" in desc or "completed sessions" in desc.lower()
        print("PASSED: Description explains commission is from completed sessions only")
    
    # ============== TUTOR PAYABLE TESTS ==============
    
    def test_tutor_payable_is_zero_no_sessions(self, revenue_response):
        """Test tutor payable is 0 when no sessions completed"""
        payable = revenue_response["tutor_payable"]["total_payable"]
        assert payable == 0, f"Expected 0 tutor payable (no sessions), got {payable}"
        print("PASSED: Tutor payable = 0 (correct - no sessions completed)")
    
    def test_tutor_payable_has_already_paid(self, revenue_response):
        """Test tutor_payable has already_paid field"""
        assert "already_paid" in revenue_response["tutor_payable"]
        paid = revenue_response["tutor_payable"]["already_paid"]
        assert isinstance(paid, (int, float))
        print(f"PASSED: already_paid = {paid}")
    
    def test_tutor_payable_has_pending_payment(self, revenue_response):
        """Test tutor_payable has pending_payment field"""
        assert "pending_payment" in revenue_response["tutor_payable"]
        pending = revenue_response["tutor_payable"]["pending_payment"]
        assert isinstance(pending, (int, float))
        print(f"PASSED: pending_payment = {pending}")
    
    def test_tutor_payable_has_payout_rate(self, revenue_response):
        """Test tutor_payable has payout_rate field"""
        rate = revenue_response["tutor_payable"]["payout_rate"]
        assert rate == TUTOR_PAYOUT_RATE, f"Expected {TUTOR_PAYOUT_RATE}, got {rate}"
        print(f"PASSED: Payout rate = {rate} (80%)")
    
    def test_pending_equals_total_minus_paid(self, revenue_response):
        """Test pending_payment = total_payable - already_paid"""
        total = revenue_response["tutor_payable"]["total_payable"]
        paid = revenue_response["tutor_payable"]["already_paid"]
        pending = revenue_response["tutor_payable"]["pending_payment"]
        expected = total - paid
        assert pending == expected, f"Expected pending={expected}, got {pending}"
        print(f"PASSED: pending ({pending}) = total ({total}) - paid ({paid})")
    
    # ============== DEFERRED REVENUE TESTS ==============
    
    def test_deferred_revenue_amount(self, revenue_response):
        """Test deferred_revenue amount calculation"""
        deferred = revenue_response["deferred_revenue"]["amount"]
        assert isinstance(deferred, (int, float))
        assert deferred >= 0
        print(f"PASSED: Deferred revenue amount = {deferred}")
    
    def test_deferred_equals_cash_minus_recognized(self, revenue_response):
        """Test deferred = cash_collected - revenue_recognized"""
        cash = revenue_response["deferred_revenue"]["breakdown"]["cash_collected"]
        recognized = revenue_response["deferred_revenue"]["breakdown"]["minus_revenue_recognized"]
        expected_deferred = revenue_response["deferred_revenue"]["breakdown"]["equals_deferred"]
        deferred_amount = revenue_response["deferred_revenue"]["amount"]
        
        # Calculate expected
        calculated = max(0, cash - recognized)
        assert deferred_amount == calculated or deferred_amount == expected_deferred
        print(f"PASSED: Deferred revenue = {cash} - {recognized} = {deferred_amount}")
    
    def test_deferred_revenue_equals_cash_when_no_sessions(self, revenue_response):
        """Test deferred revenue equals cash collected when no sessions completed"""
        cash = revenue_response["cash_flow"]["total_cash_collected"]
        deferred = revenue_response["deferred_revenue"]["amount"]
        sessions = revenue_response["session_summary"]["total_completed"]
        
        if sessions == 0:
            assert deferred == cash, f"With 0 sessions, deferred ({deferred}) should equal cash ({cash})"
            print(f"PASSED: With 0 sessions, deferred revenue = cash collected = {cash}")
        else:
            print(f"SKIPPED: Sessions exist ({sessions}), deferred may differ from cash")
    
    def test_deferred_revenue_breakdown_structure(self, revenue_response):
        """Test deferred_revenue has breakdown sub-section"""
        breakdown = revenue_response["deferred_revenue"]["breakdown"]
        assert "cash_collected" in breakdown
        assert "minus_revenue_recognized" in breakdown
        assert "equals_deferred" in breakdown
        print("PASSED: Deferred revenue breakdown has all required fields")
    
    # ============== OUTSTANDING CREDITS TESTS ==============
    
    def test_outstanding_credits_has_paid_and_bonus(self, revenue_response):
        """Test outstanding_credits has paid_credits and bonus_credits"""
        oc = revenue_response["outstanding_credits"]
        assert "paid_credits" in oc
        assert "bonus_credits" in oc
        assert "total_credits" in oc
        print(f"PASSED: paid={oc['paid_credits']}, bonus={oc['bonus_credits']}, total={oc['total_credits']}")
    
    def test_outstanding_total_equals_paid_plus_bonus(self, revenue_response):
        """Test total_credits = paid_credits + bonus_credits"""
        oc = revenue_response["outstanding_credits"]
        paid = oc["paid_credits"]
        bonus = oc["bonus_credits"]
        total = oc["total_credits"]
        expected = paid + bonus
        assert total == expected, f"Expected total={expected}, got {total}"
        print(f"PASSED: Total credits ({total}) = paid ({paid}) + bonus ({bonus})")
    
    def test_outstanding_paid_credits_is_8(self, revenue_response):
        """Test outstanding paid credits is 8 (known data)"""
        paid = revenue_response["outstanding_credits"]["paid_credits"]
        assert paid == 8.0, f"Expected 8 paid credits, got {paid}"
        print("PASSED: Paid credits outstanding = 8")
    
    def test_outstanding_bonus_credits_is_1(self, revenue_response):
        """Test outstanding bonus credits is 1 (known data)"""
        bonus = revenue_response["outstanding_credits"]["bonus_credits"]
        assert bonus == 1.0, f"Expected 1 bonus credit, got {bonus}"
        print("PASSED: Bonus credits outstanding = 1")
    
    # ============== ACCOUNTING SUMMARY TESTS ==============
    
    def test_accounting_summary_has_gross_revenue(self, revenue_response):
        """Test accounting_summary has gross_revenue field"""
        assert "gross_revenue" in revenue_response["accounting_summary"]
        gross = revenue_response["accounting_summary"]["gross_revenue"]
        assert isinstance(gross, (int, float))
        print(f"PASSED: Gross revenue = {gross}")
    
    def test_accounting_summary_has_net_platform_revenue(self, revenue_response):
        """Test accounting_summary has net_platform_revenue field"""
        assert "net_platform_revenue" in revenue_response["accounting_summary"]
        net = revenue_response["accounting_summary"]["net_platform_revenue"]
        assert isinstance(net, (int, float))
        print(f"PASSED: Net platform revenue = {net}")
    
    def test_gross_revenue_calculation(self, revenue_response):
        """Test gross_revenue = commission_earned + tutor_payable"""
        commission = revenue_response["revenue_recognition"]["commission_earned"]
        tutor = revenue_response["tutor_payable"]["total_payable"]
        gross = revenue_response["accounting_summary"]["gross_revenue"]
        expected = commission + tutor
        assert gross == expected, f"Expected gross={expected}, got {gross}"
        print(f"PASSED: Gross revenue ({gross}) = commission ({commission}) + tutor ({tutor})")
    
    def test_net_platform_revenue_calculation(self, revenue_response):
        """Test net_platform_revenue = commission_earned - marketing_cost"""
        commission = revenue_response["revenue_recognition"]["commission_earned"]
        marketing = revenue_response["marketing_expense"]["realized"]
        net = revenue_response["accounting_summary"]["net_platform_revenue"]
        expected = commission - marketing
        assert net == expected, f"Expected net={expected}, got {net}"
        print(f"PASSED: Net revenue ({net}) = commission ({commission}) - marketing ({marketing})")
    
    # ============== SESSION SUMMARY TESTS ==============
    
    def test_session_summary_has_total_completed(self, revenue_response):
        """Test session_summary has total_completed field"""
        assert "total_completed" in revenue_response["session_summary"]
        completed = revenue_response["session_summary"]["total_completed"]
        assert isinstance(completed, int) or completed == int(completed)
        print(f"PASSED: Total completed sessions = {completed}")
    
    def test_session_summary_total_is_zero(self, revenue_response):
        """Test total completed sessions is 0 (known data)"""
        completed = revenue_response["session_summary"]["total_completed"]
        assert completed == 0, f"Expected 0 completed sessions, got {completed}"
        print("PASSED: Total completed sessions = 0")
    
    # ============== BUSINESS LOGIC VALIDATION ==============
    
    def test_revenue_recognition_policy(self, revenue_response):
        """
        Core business test: Verify revenue is only recognized when sessions complete.
        With 0 sessions:
        - commission_earned should be 0
        - tutor_payable should be 0
        - deferred_revenue should equal cash_collected
        """
        sessions = revenue_response["session_summary"]["total_completed"]
        commission = revenue_response["revenue_recognition"]["commission_earned"]
        tutor = revenue_response["tutor_payable"]["total_payable"]
        cash = revenue_response["cash_flow"]["total_cash_collected"]
        deferred = revenue_response["deferred_revenue"]["amount"]
        
        if sessions == 0:
            assert commission == 0, "With 0 sessions, commission should be 0"
            assert tutor == 0, "With 0 sessions, tutor payable should be 0"
            assert deferred == cash, f"With 0 sessions, deferred ({deferred}) should equal cash ({cash})"
            print("PASSED: Revenue recognition policy correctly enforced - no revenue recognized without completed sessions")
        else:
            print(f"NOTE: {sessions} sessions completed, revenue recognition tested differently")


class TestRevenueRecognitionValues:
    """Test specific expected values based on known data"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def revenue_response(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/admin/revenue/recognition")
        return response.json()
    
    def test_expected_values_summary(self, revenue_response):
        """Summary test of all expected values"""
        # Cash collected should be RM200
        assert revenue_response["cash_flow"]["total_cash_collected"] == 200.0
        
        # Commission earned should be 0 (no sessions)
        assert revenue_response["revenue_recognition"]["commission_earned"] == 0
        
        # Tutor payable should be 0 (no sessions)
        assert revenue_response["tutor_payable"]["total_payable"] == 0
        
        # Deferred revenue should be RM200 (all cash is deferred)
        assert revenue_response["deferred_revenue"]["amount"] == 200.0
        
        # Outstanding credits: 8 paid + 1 bonus = 9 total
        assert revenue_response["outstanding_credits"]["paid_credits"] == 8.0
        assert revenue_response["outstanding_credits"]["bonus_credits"] == 1.0
        assert revenue_response["outstanding_credits"]["total_credits"] == 9.0
        
        # Sessions completed should be 0
        assert revenue_response["session_summary"]["total_completed"] == 0
        
        # Gross revenue should be 0 (no sessions)
        assert revenue_response["accounting_summary"]["gross_revenue"] == 0
        
        # Net platform revenue should be 0 (no sessions)
        assert revenue_response["accounting_summary"]["net_platform_revenue"] == 0
        
        print("PASSED: All expected values verified correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
