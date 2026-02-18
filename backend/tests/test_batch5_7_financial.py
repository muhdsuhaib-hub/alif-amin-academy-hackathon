"""
Test suite for Batch 5.7: Financial & Data Integrity Repair

Tests covered:
1. GET /api/teachers/{teacher_id}/transactions - pagination + live student names
2. GET /api/teacher/dashboard-data - month_stats, tier info, wallet balance
3. Teacher with earnings: teacher_e288221828e6 (wallet RM 18.00, total_classes=1)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test teacher with earnings data (from migration script)
TEST_TEACHER_ID = "teacher_e288221828e6"
TEST_USER_ID = "user_089bb807b15e"


@pytest.fixture(scope="module")
def test_session():
    """Create a test session for the teacher user."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Create test session in MongoDB via API login or direct session creation
    # Using email login for the teacher user
    login_payload = {
        "email": "aimanchan89@gmail.com",  # Teacher email
        "password": "password123"  # Default test password
    }
    
    # Try to login - if fails, we'll use direct MongoDB session
    try:
        r = session.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        if r.status_code == 200:
            data = r.json()
            token = data.get("session_token")
            if token:
                session.cookies.set("session_token", token)
                return session
    except:
        pass
    
    # If login fails, use direct MongoDB approach
    import subprocess
    import uuid
    session_token = f"test_session_{uuid.uuid4().hex}"
    
    # Create session in MongoDB
    mongo_cmd = f'''
    mongosh --eval "
    use('test_database');
    db.user_sessions.insertOne({{
        user_id: '{TEST_USER_ID}',
        session_token: '{session_token}',
        expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
        created_at: new Date().toISOString()
    }});
    "
    '''
    subprocess.run(mongo_cmd, shell=True, capture_output=True)
    session.cookies.set("session_token", session_token)
    
    return session


class TestTeacherTransactionsEndpoint:
    """Test GET /api/teachers/{teacher_id}/transactions with pagination and live student names"""
    
    def test_transactions_returns_pagination_info(self, test_session):
        """Verify transactions endpoint returns total count and pagination params"""
        r = test_session.get(f"{BASE_URL}/api/teachers/{TEST_TEACHER_ID}/transactions?limit=10&skip=0")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert "transactions" in data, "Response should have 'transactions' field"
        assert "total" in data, "Response should have 'total' count"
        assert "limit" in data, "Response should have 'limit' param"
        assert "skip" in data, "Response should have 'skip' param"
        
        print(f"Transactions endpoint returned {data['total']} total transactions")
    
    def test_transactions_has_live_student_name(self, test_session):
        """Verify transactions include live student name field"""
        r = test_session.get(f"{BASE_URL}/api/teachers/{TEST_TEACHER_ID}/transactions?limit=10&skip=0")
        assert r.status_code == 200
        
        data = r.json()
        transactions = data.get("transactions", [])
        
        if len(transactions) > 0:
            t = transactions[0]
            # Check for student_name field populated via $lookup
            assert "student_name" in t or "student_id" in t, "Transaction should have student info"
            
            if t.get("student_name"):
                print(f"Transaction student_name: {t['student_name']}")
                assert len(t["student_name"]) > 0, "student_name should not be empty"
            
            # Verify duration_minutes exists for description formatting
            assert "duration_minutes" in t, "Transaction should have duration_minutes"
            print(f"Transaction duration_minutes: {t['duration_minutes']}")
    
    def test_transactions_correct_data_for_known_teacher(self, test_session):
        """Verify known teacher has correct transaction data"""
        r = test_session.get(f"{BASE_URL}/api/teachers/{TEST_TEACHER_ID}/transactions?limit=10&skip=0")
        assert r.status_code == 200
        
        data = r.json()
        transactions = data.get("transactions", [])
        
        # Teacher teacher_e288221828e6 should have 1 transaction
        assert data["total"] >= 1, f"Expected at least 1 transaction, got {data['total']}"
        
        # Check first transaction values
        if transactions:
            t = transactions[0]
            # Net amount should be 18.0 (after migration fix)
            net = t.get("net_amount", t.get("amount", 0))
            gross = t.get("gross_amount", 0)
            
            assert net == 18.0, f"Expected net_amount 18.0, got {net}"
            assert gross == 30.0, f"Expected gross_amount 30.0, got {gross}"
            print(f"Transaction amounts correct: net={net}, gross={gross}")


class TestTeacherDashboardData:
    """Test GET /api/teacher/dashboard-data endpoint"""
    
    def test_dashboard_returns_month_stats_with_earnings(self, test_session):
        """Verify month_stats includes net_earnings and gross_earnings"""
        r = test_session.get(f"{BASE_URL}/api/teacher/dashboard-data")
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        
        data = r.json()
        assert "month_stats" in data, "Response should have month_stats"
        
        month_stats = data["month_stats"]
        assert "net_earnings" in month_stats, "month_stats should have net_earnings"
        assert "gross_earnings" in month_stats, "month_stats should have gross_earnings"
        
        print(f"Month stats: net={month_stats['net_earnings']}, gross={month_stats['gross_earnings']}")
    
    def test_dashboard_returns_tier_info(self, test_session):
        """Verify tier info includes total_sessions > 0 for teacher with classes"""
        r = test_session.get(f"{BASE_URL}/api/teacher/dashboard-data")
        assert r.status_code == 200
        
        data = r.json()
        assert "tier" in data, "Response should have tier info"
        
        tier = data["tier"]
        assert "total_sessions" in tier, "tier should have total_sessions"
        assert "level" in tier, "tier should have level"
        assert "name" in tier, "tier should have name"
        
        # For teacher_e288221828e6 with 1 completed class
        teacher = data.get("teacher", {})
        total_classes = teacher.get("total_classes", 0)
        
        print(f"Teacher total_classes: {total_classes}, tier total_sessions: {tier['total_sessions']}")
        
        # tier.total_sessions should equal teacher.total_classes
        assert tier["total_sessions"] == total_classes, f"tier.total_sessions ({tier['total_sessions']}) should match teacher.total_classes ({total_classes})"
    
    def test_dashboard_returns_correct_wallet_balance(self, test_session):
        """Verify wallet balance is correct (RM 18.00 for teacher_e288221828e6)"""
        r = test_session.get(f"{BASE_URL}/api/teacher/dashboard-data")
        assert r.status_code == 200
        
        data = r.json()
        assert "wallet" in data, "Response should have wallet info"
        
        wallet = data["wallet"]
        assert "balance" in wallet, "wallet should have balance"
        
        # Balance should be 18.0 after migration fix
        balance = wallet["balance"]
        print(f"Wallet balance: RM {balance}")
        
        assert balance == 18.0, f"Expected wallet balance 18.0, got {balance}"
    
    def test_dashboard_teacher_has_correct_total_classes(self, test_session):
        """Verify teacher document has correct total_classes (not stuck at 0)"""
        r = test_session.get(f"{BASE_URL}/api/teacher/dashboard-data")
        assert r.status_code == 200
        
        data = r.json()
        teacher = data.get("teacher", {})
        
        total_classes = teacher.get("total_classes", 0)
        print(f"Teacher total_classes: {total_classes}")
        
        # Should be at least 1 after migration
        assert total_classes >= 1, f"Expected total_classes >= 1, got {total_classes}"


class TestTransactionsPagination:
    """Test pagination functionality for transactions"""
    
    def test_pagination_respects_limit(self, test_session):
        """Verify limit parameter works correctly"""
        r = test_session.get(f"{BASE_URL}/api/teachers/{TEST_TEACHER_ID}/transactions?limit=5&skip=0")
        assert r.status_code == 200
        
        data = r.json()
        assert data["limit"] == 5, f"Expected limit=5, got {data['limit']}"
        assert len(data["transactions"]) <= 5, "Should not return more than limit"
    
    def test_pagination_respects_skip(self, test_session):
        """Verify skip parameter works correctly"""
        r = test_session.get(f"{BASE_URL}/api/teachers/{TEST_TEACHER_ID}/transactions?limit=10&skip=0")
        assert r.status_code == 200
        
        data = r.json()
        assert data["skip"] == 0, f"Expected skip=0, got {data['skip']}"


class TestDirectMongoVerification:
    """Direct MongoDB verification of data integrity fixes"""
    
    def test_mongo_teacher_data_correct(self):
        """Verify MongoDB teacher record has correct total_classes"""
        import subprocess
        result = subprocess.run(
            ['mongosh', '--eval', f'''
            use('test_database');
            const t = db.teachers.findOne({{teacher_id: '{TEST_TEACHER_ID}'}});
            print(JSON.stringify({{total_classes: t.total_classes, rating: t.rating}}));
            '''],
            capture_output=True, text=True
        )
        
        import json
        output_lines = result.stdout.strip().split('\n')
        for line in output_lines:
            if line.startswith('{'):
                data = json.loads(line)
                print(f"MongoDB teacher data: {data}")
                assert data.get("total_classes", 0) >= 1, "total_classes should be >= 1"
                break
    
    def test_mongo_tutor_earnings_correct(self):
        """Verify MongoDB tutor_earnings has correct balance"""
        import subprocess
        result = subprocess.run(
            ['mongosh', '--eval', f'''
            use('test_database');
            const e = db.tutor_earnings.findOne({{teacher_id: '{TEST_TEACHER_ID}'}});
            print(JSON.stringify({{withdrawable_balance: e.withdrawable_balance, total_earnings: e.total_earnings}}));
            '''],
            capture_output=True, text=True
        )
        
        import json
        output_lines = result.stdout.strip().split('\n')
        for line in output_lines:
            if line.startswith('{'):
                data = json.loads(line)
                print(f"MongoDB tutor_earnings data: {data}")
                assert data.get("withdrawable_balance", 0) == 18, "withdrawable_balance should be 18"
                break
    
    def test_mongo_transaction_has_student_id(self):
        """Verify transaction record has student_id for name lookup"""
        import subprocess
        result = subprocess.run(
            ['mongosh', '--eval', f'''
            use('test_database');
            const txn = db.tutor_earnings_transactions.findOne({{teacher_id: '{TEST_TEACHER_ID}'}});
            print(JSON.stringify({{student_id: txn.student_id, duration_minutes: txn.duration_minutes, net_amount: txn.net_amount, gross_amount: txn.gross_amount}}));
            '''],
            capture_output=True, text=True
        )
        
        import json
        output_lines = result.stdout.strip().split('\n')
        for line in output_lines:
            if line.startswith('{'):
                data = json.loads(line)
                print(f"MongoDB transaction data: {data}")
                assert data.get("student_id"), "Transaction should have student_id"
                assert data.get("duration_minutes") == 30, "duration_minutes should be 30"
                assert data.get("net_amount") == 18, "net_amount should be 18"
                assert data.get("gross_amount") == 30, "gross_amount should be 30"
                break


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
