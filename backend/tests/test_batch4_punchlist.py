"""
Test suite for Batch 4 Punch List - 3 Fixes
Fix 1: Profile dropdown cleanup (Settings removed - UI only, tested via Playwright)
Fix 2: Support ticket system (POST /api/support, GET /api/admin/support-tickets)
Fix 3: Custom top-up system (POST /api/wallet/topup/custom)
"""
import pytest
import requests
import os
import uuid

# Use environment variable for BASE_URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = "test_student@example.com"
TEST_PASSWORD = "test1234"


class TestSupportTicketSystem:
    """Fix 2: Support ticket system tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.session_token = data.get("session_token")
        self.user_id = data.get("user")["user_id"]
        self.headers = {"Cookie": f"session_token={self.session_token}"}
    
    def test_create_support_ticket_technical(self):
        """Test creating a technical support ticket"""
        unique_msg = f"Test technical issue - {uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/support",
            headers=self.headers,
            json={"subject": "technical", "message": unique_msg}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Support ticket created"
        assert "ticket_id" in data
        assert data["ticket_id"].startswith("ticket_")
        print(f"PASS: Created technical ticket {data['ticket_id']}")
    
    def test_create_support_ticket_billing(self):
        """Test creating a billing support ticket"""
        unique_msg = f"Test billing issue - {uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/support",
            headers=self.headers,
            json={"subject": "billing", "message": unique_msg}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Support ticket created"
        print(f"PASS: Created billing ticket {data['ticket_id']}")
    
    def test_create_support_ticket_general(self):
        """Test creating a general support ticket"""
        unique_msg = f"Test general inquiry - {uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/support",
            headers=self.headers,
            json={"subject": "general", "message": unique_msg}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Support ticket created"
        print(f"PASS: Created general ticket {data['ticket_id']}")
    
    def test_create_support_ticket_empty_message_rejected(self):
        """Test that empty messages are rejected"""
        response = requests.post(
            f"{BASE_URL}/api/support",
            headers=self.headers,
            json={"subject": "general", "message": ""}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Message is required" in data.get("detail", "")
        print("PASS: Empty message correctly rejected")
    
    def test_create_support_ticket_invalid_subject_rejected(self):
        """Test that invalid subjects are rejected"""
        response = requests.post(
            f"{BASE_URL}/api/support",
            headers=self.headers,
            json={"subject": "invalid_subject", "message": "Test message"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Invalid subject" in data.get("detail", "")
        print("PASS: Invalid subject correctly rejected")
    
    def test_admin_support_tickets_requires_admin(self):
        """Test that GET /api/admin/support-tickets requires admin role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/support-tickets",
            headers=self.headers
        )
        # Student should get 403 forbidden
        assert response.status_code == 403
        data = response.json()
        assert "Not authorized" in data.get("detail", "")
        print("PASS: Admin endpoint correctly rejects non-admin users")


class TestCustomTopupSystem:
    """Fix 3: Custom top-up system tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get session token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.session_token = data.get("session_token")
        self.user_id = data.get("user")["user_id"]
        self.headers = {"Cookie": f"session_token={self.session_token}"}
    
    def test_custom_topup_single_credit(self):
        """Test custom top-up with 1 credit"""
        # Get initial balance
        response = requests.get(
            f"{BASE_URL}/api/wallet/balance?user_id={self.user_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        initial_balance = response.json()["wallet"]["credit_balance"]
        
        # Custom top-up 1 credit
        response = requests.post(
            f"{BASE_URL}/api/wallet/topup/custom?user_id={self.user_id}",
            headers=self.headers,
            json={"credits": 1}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["credits_added"] == 1
        assert data["amount_myr"] == 15  # 1 credit * RM15
        assert data["new_balance"] == initial_balance + 1
        print(f"PASS: Custom top-up 1 credit (RM15), new balance: {data['new_balance']}")
    
    def test_custom_topup_multiple_credits(self):
        """Test custom top-up with multiple credits"""
        # Get initial balance
        response = requests.get(
            f"{BASE_URL}/api/wallet/balance?user_id={self.user_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        initial_balance = response.json()["wallet"]["credit_balance"]
        
        # Custom top-up 3 credits
        response = requests.post(
            f"{BASE_URL}/api/wallet/topup/custom?user_id={self.user_id}",
            headers=self.headers,
            json={"credits": 3}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["credits_added"] == 3
        assert data["amount_myr"] == 45  # 3 credits * RM15
        assert data["new_balance"] == initial_balance + 3
        print(f"PASS: Custom top-up 3 credits (RM45), new balance: {data['new_balance']}")
    
    def test_custom_topup_max_credits(self):
        """Test custom top-up with max credits (100)"""
        # Get initial balance
        response = requests.get(
            f"{BASE_URL}/api/wallet/balance?user_id={self.user_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        initial_balance = response.json()["wallet"]["credit_balance"]
        
        # Custom top-up 100 credits (max allowed)
        response = requests.post(
            f"{BASE_URL}/api/wallet/topup/custom?user_id={self.user_id}",
            headers=self.headers,
            json={"credits": 100}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["credits_added"] == 100
        assert data["amount_myr"] == 1500  # 100 credits * RM15
        print(f"PASS: Custom top-up 100 credits (RM1500), new balance: {data['new_balance']}")
    
    def test_custom_topup_zero_credits_rejected(self):
        """Test that 0 credits is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/wallet/topup/custom?user_id={self.user_id}",
            headers=self.headers,
            json={"credits": 0}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Credits must be between 1 and 100" in data.get("detail", "")
        print("PASS: 0 credits correctly rejected")
    
    def test_custom_topup_over_100_credits_rejected(self):
        """Test that >100 credits is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/wallet/topup/custom?user_id={self.user_id}",
            headers=self.headers,
            json={"credits": 101}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Credits must be between 1 and 100" in data.get("detail", "")
        print("PASS: 101 credits correctly rejected")
    
    def test_custom_topup_negative_credits_rejected(self):
        """Test that negative credits is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/wallet/topup/custom?user_id={self.user_id}",
            headers=self.headers,
            json={"credits": -5}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Credits must be between 1 and 100" in data.get("detail", "")
        print("PASS: Negative credits correctly rejected")
    
    def test_custom_topup_creates_transaction_record(self):
        """Test that custom top-up creates a proper transaction record"""
        # Custom top-up
        response = requests.post(
            f"{BASE_URL}/api/wallet/topup/custom?user_id={self.user_id}",
            headers=self.headers,
            json={"credits": 2}
        )
        assert response.status_code == 200
        
        # Check transactions
        response = requests.get(
            f"{BASE_URL}/api/wallet/transactions?user_id={self.user_id}&limit=1",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["transactions"]) > 0
        
        latest_txn = data["transactions"][0]
        assert latest_txn["transaction_type"] == "topup_paid"
        assert latest_txn["credit_amount"] == 2
        assert "Custom Top-up" in latest_txn["description"]
        assert latest_txn["monetary_value"] == 30  # 2 * RM15
        print(f"PASS: Transaction record created: {latest_txn['description']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
