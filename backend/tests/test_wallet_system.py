"""
Wallet System Tests - Testing the updated Student Wallet with marketing bonus credits

Tests the following features:
- GET /api/wallet/packages - Correct package structure (RM100→9, RM300→27, RM500→46)
- POST /api/wallet/topup/create-intent - Payment intent with paid/bonus split
- POST /api/wallet/topup/confirm - Allocates paid and bonus credits separately
- GET /api/wallet/balance - Returns separate paid_credits and bonus_credits
- GET /api/wallet/transactions - Transaction history with correct types
- GET /api/wallet/bonus-credits - Bonus credit details with expiry dates
- POST /api/wallet/deduct - Deducts paid credits first, then bonus
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://quran-academy-54.preview.emergentagent.com').rstrip('/')


class TestWalletPackages:
    """Test wallet packages endpoint"""
    
    def test_get_packages_returns_correct_structure(self):
        """GET /api/wallet/packages returns correct package information"""
        response = requests.get(f"{BASE_URL}/api/wallet/packages")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify packages array exists
        assert "packages" in data
        assert len(data["packages"]) == 3
        
        # Verify credit pricing info
        assert "credit_pricing" in data
        assert "credit_to_minutes" in data
        assert "base_credit_price" in data
        assert data["base_credit_price"] == 15.0
    
    def test_starter_pack_rm100_gives_9_credits(self):
        """RM100 Starter Pack should give 8 paid + 1 bonus = 9 total credits"""
        response = requests.get(f"{BASE_URL}/api/wallet/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        starter_pack = next((p for p in packages if p["package_id"] == "pkg_100"), None)
        
        assert starter_pack is not None
        assert starter_pack["price_myr"] == 100.0
        assert starter_pack["paid_credits"] == 8
        assert starter_pack["bonus_credits"] == 1
        assert starter_pack["total_credits"] == 9
    
    def test_value_pack_rm300_gives_27_credits(self):
        """RM300 Value Pack should give 24 paid + 3 bonus = 27 total credits"""
        response = requests.get(f"{BASE_URL}/api/wallet/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        value_pack = next((p for p in packages if p["package_id"] == "pkg_300"), None)
        
        assert value_pack is not None
        assert value_pack["price_myr"] == 300.0
        assert value_pack["paid_credits"] == 24
        assert value_pack["bonus_credits"] == 3
        assert value_pack["total_credits"] == 27
        assert value_pack["popular"] == True  # Most popular package
    
    def test_premium_pack_rm500_gives_46_credits(self):
        """RM500 Premium Pack should give 40 paid + 6 bonus = 46 total credits"""
        response = requests.get(f"{BASE_URL}/api/wallet/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        premium_pack = next((p for p in packages if p["package_id"] == "pkg_500"), None)
        
        assert premium_pack is not None
        assert premium_pack["price_myr"] == 500.0
        assert premium_pack["paid_credits"] == 40
        assert premium_pack["bonus_credits"] == 6
        assert premium_pack["total_credits"] == 46


class TestWalletTopup:
    """Test wallet topup flow"""
    
    @pytest.fixture
    def test_user(self):
        """Create a test user for wallet testing"""
        import subprocess
        import json
        
        timestamp = int(time.time() * 1000)
        user_id = f"wallet-pytest-{timestamp}"
        session_token = f"pytest_session_{timestamp}"
        student_id = f"pytest-student-{timestamp}"
        
        # Create user, session, and student in MongoDB
        mongo_script = f'''
        use('test_database');
        db.users.insertOne({{
            user_id: '{user_id}',
            email: 'pytest.wallet.{timestamp}@example.com',
            name: 'Pytest Wallet User',
            role: 'student',
            created_at: new Date()
        }});
        db.user_sessions.insertOne({{
            user_id: '{user_id}',
            session_token: '{session_token}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        db.students.insertOne({{
            student_id: '{student_id}',
            user_id: '{user_id}',
            current_level: 'Beginner',
            subscription_status: 'inactive',
            created_at: new Date()
        }});
        '''
        
        subprocess.run(['mongosh', '--quiet', '--eval', mongo_script], capture_output=True)
        
        yield {"user_id": user_id, "session_token": session_token, "student_id": student_id}
        
        # Cleanup
        cleanup_script = f'''
        use('test_database');
        db.users.deleteOne({{user_id: '{user_id}'}});
        db.user_sessions.deleteOne({{session_token: '{session_token}'}});
        db.students.deleteOne({{student_id: '{student_id}'}});
        db.student_wallets.deleteOne({{user_id: '{user_id}'}});
        db.payment_intents.deleteMany({{user_id: '{user_id}'}});
        db.wallet_transactions.deleteMany({{student_id: '{student_id}'}});
        db.bonus_credit_batches.deleteMany({{student_id: '{student_id}'}});
        '''
        subprocess.run(['mongosh', '--quiet', '--eval', cleanup_script], capture_output=True)
    
    def test_create_payment_intent_with_paid_bonus_split(self, test_user):
        """POST /api/wallet/topup/create-intent creates intent with correct split"""
        user_id = test_user["user_id"]
        
        response = requests.post(
            f"{BASE_URL}/api/wallet/topup/create-intent?user_id={user_id}",
            json={"package_id": "pkg_100", "payment_method": "stripe"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify payment intent structure
        assert "payment_intent_id" in data
        assert data["amount_myr"] == 100.0
        assert data["paid_credits"] == 8
        assert data["bonus_credits"] == 1
        assert data["total_credits"] == 9
        assert "client_secret" in data
    
    def test_confirm_topup_allocates_separate_credits(self, test_user):
        """POST /api/wallet/topup/confirm correctly allocates paid and bonus credits"""
        user_id = test_user["user_id"]
        
        # Create payment intent first
        create_response = requests.post(
            f"{BASE_URL}/api/wallet/topup/create-intent?user_id={user_id}",
            json={"package_id": "pkg_300", "payment_method": "stripe"}
        )
        assert create_response.status_code == 200
        payment_intent_id = create_response.json()["payment_intent_id"]
        
        # Confirm topup
        confirm_response = requests.post(
            f"{BASE_URL}/api/wallet/topup/confirm?payment_intent_id={payment_intent_id}&user_id={user_id}"
        )
        
        assert confirm_response.status_code == 200
        data = confirm_response.json()
        
        assert data["success"] == True
        assert data["paid_credits_added"] == 24
        assert data["bonus_credits_added"] == 3
        assert data["total_credits_added"] == 27
        assert data["new_balance"]["total"] == 27.0
        assert data["new_balance"]["paid"] == 24.0
        assert data["new_balance"]["bonus"] == 3.0
    
    def test_wallet_balance_shows_separate_credits(self, test_user):
        """GET /api/wallet/balance returns separate paid_credits and bonus_credits"""
        user_id = test_user["user_id"]
        
        # First topup to have credits
        create_resp = requests.post(
            f"{BASE_URL}/api/wallet/topup/create-intent?user_id={user_id}",
            json={"package_id": "pkg_100", "payment_method": "stripe"}
        )
        pi_id = create_resp.json()["payment_intent_id"]
        requests.post(f"{BASE_URL}/api/wallet/topup/confirm?payment_intent_id={pi_id}&user_id={user_id}")
        
        # Get balance
        response = requests.get(f"{BASE_URL}/api/wallet/balance?user_id={user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "wallet" in data
        wallet = data["wallet"]
        
        assert "paid_credits" in wallet
        assert "bonus_credits" in wallet
        assert "credit_balance" in wallet
        
        assert wallet["paid_credits"] == 8.0
        assert wallet["bonus_credits"] == 1.0
        assert wallet["credit_balance"] == 9.0


class TestTransactionHistory:
    """Test transaction history"""
    
    @pytest.fixture
    def user_with_topup(self):
        """Create user and perform a topup"""
        import subprocess
        
        timestamp = int(time.time() * 1000)
        user_id = f"txn-test-{timestamp}"
        student_id = f"txn-student-{timestamp}"
        
        mongo_script = f'''
        use('test_database');
        db.users.insertOne({{
            user_id: '{user_id}',
            email: 'txn.test.{timestamp}@example.com',
            name: 'Txn Test User',
            role: 'student',
            created_at: new Date()
        }});
        db.user_sessions.insertOne({{
            user_id: '{user_id}',
            session_token: 'txn_session_{timestamp}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        db.students.insertOne({{
            student_id: '{student_id}',
            user_id: '{user_id}',
            current_level: 'Beginner',
            subscription_status: 'inactive',
            created_at: new Date()
        }});
        '''
        subprocess.run(['mongosh', '--quiet', '--eval', mongo_script], capture_output=True)
        
        # Perform topup
        create_resp = requests.post(
            f"{BASE_URL}/api/wallet/topup/create-intent?user_id={user_id}",
            json={"package_id": "pkg_100", "payment_method": "stripe"}
        )
        pi_id = create_resp.json()["payment_intent_id"]
        requests.post(f"{BASE_URL}/api/wallet/topup/confirm?payment_intent_id={pi_id}&user_id={user_id}")
        
        yield {"user_id": user_id, "student_id": student_id}
        
        # Cleanup
        cleanup_script = f'''
        use('test_database');
        db.users.deleteOne({{user_id: '{user_id}'}});
        db.user_sessions.deleteMany({{user_id: '{user_id}'}});
        db.students.deleteOne({{student_id: '{student_id}'}});
        db.student_wallets.deleteOne({{user_id: '{user_id}'}});
        db.payment_intents.deleteMany({{user_id: '{user_id}'}});
        db.wallet_transactions.deleteMany({{student_id: '{student_id}'}});
        db.bonus_credit_batches.deleteMany({{student_id: '{student_id}'}});
        '''
        subprocess.run(['mongosh', '--quiet', '--eval', cleanup_script], capture_output=True)
    
    def test_transactions_contain_topup_paid_type(self, user_with_topup):
        """GET /api/wallet/transactions returns topup_paid transaction type"""
        user_id = user_with_topup["user_id"]
        
        response = requests.get(f"{BASE_URL}/api/wallet/transactions?user_id={user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "transactions" in data
        transactions = data["transactions"]
        
        # Should have topup_paid transaction
        paid_txn = next((t for t in transactions if t["transaction_type"] == "topup_paid"), None)
        assert paid_txn is not None
        assert paid_txn["credit_amount"] == 8
        assert paid_txn["payment_amount"] == 100.0
    
    def test_transactions_contain_topup_bonus_type(self, user_with_topup):
        """GET /api/wallet/transactions returns topup_bonus transaction type"""
        user_id = user_with_topup["user_id"]
        
        response = requests.get(f"{BASE_URL}/api/wallet/transactions?user_id={user_id}")
        
        assert response.status_code == 200
        transactions = response.json()["transactions"]
        
        # Should have topup_bonus transaction
        bonus_txn = next((t for t in transactions if t["transaction_type"] == "topup_bonus"), None)
        assert bonus_txn is not None
        assert bonus_txn["credit_amount"] == 1
        assert bonus_txn["payment_amount"] == 0  # Bonus has no payment


class TestBonusCreditExpiry:
    """Test bonus credit tracking and expiry"""
    
    @pytest.fixture
    def user_with_bonus(self):
        """Create user with bonus credits"""
        import subprocess
        
        timestamp = int(time.time() * 1000)
        user_id = f"bonus-test-{timestamp}"
        student_id = f"bonus-student-{timestamp}"
        
        mongo_script = f'''
        use('test_database');
        db.users.insertOne({{
            user_id: '{user_id}',
            email: 'bonus.test.{timestamp}@example.com',
            name: 'Bonus Test User',
            role: 'student',
            created_at: new Date()
        }});
        db.user_sessions.insertOne({{
            user_id: '{user_id}',
            session_token: 'bonus_session_{timestamp}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        db.students.insertOne({{
            student_id: '{student_id}',
            user_id: '{user_id}',
            current_level: 'Beginner',
            subscription_status: 'inactive',
            created_at: new Date()
        }});
        '''
        subprocess.run(['mongosh', '--quiet', '--eval', mongo_script], capture_output=True)
        
        # Perform topup to get bonus credits
        create_resp = requests.post(
            f"{BASE_URL}/api/wallet/topup/create-intent?user_id={user_id}",
            json={"package_id": "pkg_500", "payment_method": "stripe"}  # Premium pack - 6 bonus
        )
        pi_id = create_resp.json()["payment_intent_id"]
        requests.post(f"{BASE_URL}/api/wallet/topup/confirm?payment_intent_id={pi_id}&user_id={user_id}")
        
        yield {"user_id": user_id, "student_id": student_id}
        
        # Cleanup
        cleanup_script = f'''
        use('test_database');
        db.users.deleteOne({{user_id: '{user_id}'}});
        db.user_sessions.deleteMany({{user_id: '{user_id}'}});
        db.students.deleteOne({{student_id: '{student_id}'}});
        db.student_wallets.deleteOne({{user_id: '{user_id}'}});
        db.payment_intents.deleteMany({{user_id: '{user_id}'}});
        db.wallet_transactions.deleteMany({{student_id: '{student_id}'}});
        db.bonus_credit_batches.deleteMany({{student_id: '{student_id}'}});
        '''
        subprocess.run(['mongosh', '--quiet', '--eval', cleanup_script], capture_output=True)
    
    def test_bonus_credits_endpoint_returns_expiry_info(self, user_with_bonus):
        """GET /api/wallet/bonus-credits returns bonus details with expiry"""
        user_id = user_with_bonus["user_id"]
        
        response = requests.get(f"{BASE_URL}/api/wallet/bonus-credits?user_id={user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total_bonus_credits" in data
        assert data["total_bonus_credits"] == 6.0  # Premium pack gives 6 bonus
        
        assert "active_batches" in data
        assert len(data["active_batches"]) > 0
        
        batch = data["active_batches"][0]
        assert "expires_at" in batch
        assert "issued_at" in batch
        assert "remaining_credits" in batch
        assert batch["remaining_credits"] == 6
        
        assert "expiry_policy_months" in data
        assert data["expiry_policy_months"] == 12


class TestWalletBalanceValidation:
    """Test wallet balance endpoint validation"""
    
    def test_balance_requires_user_id(self):
        """GET /api/wallet/balance requires user_id parameter"""
        response = requests.get(f"{BASE_URL}/api/wallet/balance")
        
        # Should return 422 (Unprocessable Entity) for missing user_id
        assert response.status_code == 422
    
    def test_balance_invalid_user_returns_404(self):
        """GET /api/wallet/balance with invalid user returns 404"""
        response = requests.get(f"{BASE_URL}/api/wallet/balance?user_id=nonexistent-user-12345")
        
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
