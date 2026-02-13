"""
Test Credit Liability Tracking for Admin Dashboard
Tests the /api/admin/wallet/liability endpoint which provides:
- Total paid credits outstanding
- Total bonus credits outstanding
- Estimated future tutor payout exposure
- Platform commission calculations
- Wallet summary and historical usage
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCreditLiabilityEndpoint:
    """Test /api/admin/wallet/liability endpoint"""
    
    def test_liability_endpoint_returns_200(self):
        """Test that liability endpoint is accessible and returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✅ Liability endpoint returns 200 OK")
    
    def test_liability_response_has_required_sections(self):
        """Test that response contains all required top-level sections"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        
        required_sections = [
            'credit_liability',
            'tutor_payout_exposure',
            'platform_commission',
            'marketing_liability',
            'wallet_summary',
            'historical_usage',
            'base_rates'
        ]
        
        for section in required_sections:
            assert section in data, f"Missing required section: {section}"
            print(f"✅ Found required section: {section}")
        
    def test_credit_liability_structure(self):
        """Test credit_liability section has correct structure"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        credit_liability = data['credit_liability']
        
        required_fields = [
            'total_paid_credits_outstanding',
            'total_bonus_credits_outstanding',
            'total_credits_outstanding',
            'paid_credits_monetary_value',
            'bonus_credits_monetary_value',
            'total_monetary_value'
        ]
        
        for field in required_fields:
            assert field in credit_liability, f"Missing field in credit_liability: {field}"
        
        # Verify data types are numeric
        assert isinstance(credit_liability['total_paid_credits_outstanding'], (int, float))
        assert isinstance(credit_liability['total_bonus_credits_outstanding'], (int, float))
        print("✅ credit_liability section has correct structure")
    
    def test_tutor_payout_exposure_structure(self):
        """Test tutor_payout_exposure section has correct structure"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        payout = data['tutor_payout_exposure']
        
        required_fields = [
            'from_paid_credits',
            'from_bonus_credits',
            'total_exposure',
            'payout_rate',
            'note'
        ]
        
        for field in required_fields:
            assert field in payout, f"Missing field in tutor_payout_exposure: {field}"
        
        # Verify payout rate is 80% (0.8)
        assert payout['payout_rate'] == 0.8, f"Expected payout_rate 0.8, got {payout['payout_rate']}"
        print("✅ tutor_payout_exposure section has correct structure with 80% payout rate")
    
    def test_wallet_summary_structure(self):
        """Test wallet_summary section has correct structure"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        summary = data['wallet_summary']
        
        required_fields = [
            'total_wallets',
            'wallets_with_balance',
            'total_topup_revenue',
            'total_credits_used_all_time'
        ]
        
        for field in required_fields:
            assert field in summary, f"Missing field in wallet_summary: {field}"
        
        # Verify numeric types
        assert isinstance(summary['total_wallets'], int), "total_wallets should be int"
        assert isinstance(summary['wallets_with_balance'], int), "wallets_with_balance should be int"
        print("✅ wallet_summary section has correct structure")
    
    def test_historical_usage_structure(self):
        """Test historical_usage section has correct structure"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        usage = data['historical_usage']
        
        required_fields = [
            'total_sessions_completed',
            'total_tutor_payouts_made',
            'total_platform_commission_earned',
            'total_marketing_cost_realized',
            'paid_credits_used',
            'bonus_credits_used'
        ]
        
        for field in required_fields:
            assert field in usage, f"Missing field in historical_usage: {field}"
        print("✅ historical_usage section has correct structure")
    
    def test_base_rates_values(self):
        """Test base_rates section has correct values"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        rates = data['base_rates']
        
        # Verify base rates: 1 credit = RM15
        assert rates['credit_price'] == 15.0, f"Expected credit_price 15.0, got {rates['credit_price']}"
        # Commission rate should be 20%
        assert rates['commission_rate'] == 0.2, f"Expected commission_rate 0.2, got {rates['commission_rate']}"
        # Tutor rate should be 80%
        assert rates['tutor_rate'] == 0.8, f"Expected tutor_rate 0.8, got {rates['tutor_rate']}"
        print("✅ base_rates have correct values: credit=RM15, commission=20%, tutor=80%")


class TestCreditLiabilityCalculations:
    """Test that liability calculations are correct"""
    
    def test_total_credits_equals_paid_plus_bonus(self):
        """Test that total credits = paid + bonus"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        credit = data['credit_liability']
        
        total = credit['total_credits_outstanding']
        paid = credit['total_paid_credits_outstanding']
        bonus = credit['total_bonus_credits_outstanding']
        
        assert total == paid + bonus, f"Total ({total}) should equal paid ({paid}) + bonus ({bonus})"
        print(f"✅ Total credits ({total}) = paid ({paid}) + bonus ({bonus})")
    
    def test_paid_credits_monetary_value_calculation(self):
        """Test paid_credits_monetary_value = paid_credits × RM15"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        credit = data['credit_liability']
        base_price = data['base_rates']['credit_price']
        
        paid_credits = credit['total_paid_credits_outstanding']
        expected_value = paid_credits * base_price
        actual_value = credit['paid_credits_monetary_value']
        
        assert abs(actual_value - expected_value) < 0.01, \
            f"paid_credits_monetary_value ({actual_value}) should be {expected_value}"
        print(f"✅ Paid credits value: {paid_credits} × RM{base_price} = RM{actual_value}")
    
    def test_tutor_payout_exposure_calculation(self):
        """Test tutor_payout_exposure = credits × RM15 × 80%"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        
        credit = data['credit_liability']
        payout = data['tutor_payout_exposure']
        rates = data['base_rates']
        
        total_credits = credit['total_credits_outstanding']
        total_value = total_credits * rates['credit_price']
        expected_payout = total_value * rates['tutor_rate']
        
        actual_payout = payout['total_exposure']
        
        assert abs(actual_payout - expected_payout) < 0.01, \
            f"total_exposure ({actual_payout}) should be {expected_payout}"
        print(f"✅ Tutor payout exposure: {total_credits} credits × RM15 × 80% = RM{actual_payout}")
    
    def test_platform_commission_calculation(self):
        """Test platform_commission = credits × RM15 × 20%"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        
        credit = data['credit_liability']
        commission = data['platform_commission']
        rates = data['base_rates']
        
        total_credits = credit['total_credits_outstanding']
        total_value = total_credits * rates['credit_price']
        expected_commission = total_value * rates['commission_rate']
        
        actual_commission = commission['potential_commission']
        
        assert abs(actual_commission - expected_commission) < 0.01, \
            f"potential_commission ({actual_commission}) should be {expected_commission}"
        print(f"✅ Platform commission: {total_credits} credits × RM15 × 20% = RM{actual_commission}")
    
    def test_tutor_plus_commission_equals_total_value(self):
        """Test that tutor payout + platform commission = total monetary value"""
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        data = response.json()
        
        credit = data['credit_liability']
        payout = data['tutor_payout_exposure']
        commission = data['platform_commission']
        
        total_value = credit['total_monetary_value']
        tutor = payout['total_exposure']
        platform = commission['potential_commission']
        
        calculated_total = tutor + platform
        
        assert abs(calculated_total - total_value) < 0.01, \
            f"Tutor ({tutor}) + Commission ({platform}) = {calculated_total} should equal total value ({total_value})"
        print(f"✅ Tutor (RM{tutor}) + Commission (RM{platform}) = Total (RM{total_value})")


class TestCreditLiabilityDataIntegrity:
    """Test that liability data matches actual wallet data"""
    
    def test_paid_credits_matches_wallet_sum(self):
        """Test that total_paid_credits_outstanding matches sum of all wallet paid_credits"""
        import subprocess
        import json
        
        # Get sum from MongoDB
        result = subprocess.run([
            'mongosh', '--quiet', '--eval',
            "use('test_database'); const sum = db.student_wallets.aggregate([{$group:{_id:null,total:{$sum:'$paid_credits'}}}]).toArray(); printjson(sum.length > 0 ? sum[0].total : 0);"
        ], capture_output=True, text=True)
        
        db_total = float(result.stdout.strip() or 0)
        
        # Get API response
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        api_total = response.json()['credit_liability']['total_paid_credits_outstanding']
        
        assert abs(api_total - db_total) < 0.01, \
            f"API total_paid_credits ({api_total}) should match DB sum ({db_total})"
        print(f"✅ Paid credits from API ({api_total}) matches MongoDB sum ({db_total})")
    
    def test_bonus_credits_matches_wallet_sum(self):
        """Test that total_bonus_credits_outstanding matches sum of all wallet bonus_credits"""
        import subprocess
        import json
        
        # Get sum from MongoDB
        result = subprocess.run([
            'mongosh', '--quiet', '--eval',
            "use('test_database'); const sum = db.student_wallets.aggregate([{$group:{_id:null,total:{$sum:'$bonus_credits'}}}]).toArray(); printjson(sum.length > 0 ? sum[0].total : 0);"
        ], capture_output=True, text=True)
        
        db_total = float(result.stdout.strip() or 0)
        
        # Get API response
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        api_total = response.json()['credit_liability']['total_bonus_credits_outstanding']
        
        assert abs(api_total - db_total) < 0.01, \
            f"API total_bonus_credits ({api_total}) should match DB sum ({db_total})"
        print(f"✅ Bonus credits from API ({api_total}) matches MongoDB sum ({db_total})")
    
    def test_wallet_count_matches_db(self):
        """Test that total_wallets matches actual wallet count in DB"""
        import subprocess
        
        # Get count from MongoDB
        result = subprocess.run([
            'mongosh', '--quiet', '--eval',
            "use('test_database'); db.student_wallets.countDocuments();"
        ], capture_output=True, text=True)
        
        db_count = int(result.stdout.strip() or 0)
        
        # Get API response
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        api_count = response.json()['wallet_summary']['total_wallets']
        
        assert api_count == db_count, \
            f"API total_wallets ({api_count}) should match DB count ({db_count})"
        print(f"✅ Wallet count from API ({api_count}) matches MongoDB count ({db_count})")
    
    def test_wallets_with_balance_matches_db(self):
        """Test that wallets_with_balance matches actual count of wallets with credit_balance > 0"""
        import subprocess
        
        # Get count from MongoDB
        result = subprocess.run([
            'mongosh', '--quiet', '--eval',
            "use('test_database'); db.student_wallets.countDocuments({credit_balance: {$gt: 0}});"
        ], capture_output=True, text=True)
        
        db_count = int(result.stdout.strip() or 0)
        
        # Get API response
        response = requests.get(f"{BASE_URL}/api/admin/wallet/liability")
        api_count = response.json()['wallet_summary']['wallets_with_balance']
        
        assert api_count == db_count, \
            f"API wallets_with_balance ({api_count}) should match DB count ({db_count})"
        print(f"✅ Wallets with balance from API ({api_count}) matches MongoDB count ({db_count})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
