"""
Batch 5.7 Migration Script: Financial Data Recalculation
Recalculates all past session earnings using correct formula:
  - 1 Credit = RM 15 (15min=RM15, 30min=RM30, 60min=RM60)
  - Net = Gross * (1 - commission_rate)
Also fixes: total_classes, admin_revenue, transaction descriptions.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

CORRECT_PRICES = {15: 15.0, 30: 30.0, 60: 60.0}

def get_correct_price(duration_minutes):
    if duration_minutes in CORRECT_PRICES:
        return CORRECT_PRICES[duration_minutes]
    return (duration_minutes / 60) * 60.0

async def migrate():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['test_database']
    now = datetime.now(timezone.utc).isoformat()

    print("=== Batch 5.7: Financial Migration ===\n")

    # Step 1: Fix all session_payment_records
    records = await db.session_payment_records.find({}, {'_id': 0}).to_list(1000)
    print(f"Found {len(records)} session_payment_records to recalculate")

    teacher_earnings_map = {}  # teacher_id -> { total_net, total_gross, count, records }

    for rec in records:
        duration = rec.get('duration_minutes', 30)
        rate = rec.get('commission_rate', 0.40)
        old_base = rec.get('base_session_price', 0)
        correct_base = get_correct_price(duration)
        correct_payout = round(correct_base * (1 - rate), 2)
        correct_commission = round(correct_base * rate, 2)

        # Update the session_payment_record
        await db.session_payment_records.update_one(
            {'record_id': rec['record_id']},
            {'$set': {
                'base_session_price': correct_base,
                'tutor_payout': correct_payout,
                'platform_commission': correct_commission,
                'migrated_at': now,
                'migration_note': f'Corrected from base={old_base} to base={correct_base}'
            }}
        )
        print(f"  Record {rec['record_id']}: base {old_base} -> {correct_base}, payout {rec.get('tutor_payout', 0)} -> {correct_payout}")

        tid = rec.get('teacher_id')
        if tid not in teacher_earnings_map:
            teacher_earnings_map[tid] = {'total_net': 0, 'total_gross': 0, 'count': 0, 'records': []}
        teacher_earnings_map[tid]['total_net'] += correct_payout
        teacher_earnings_map[tid]['total_gross'] += correct_base
        teacher_earnings_map[tid]['count'] += 1
        teacher_earnings_map[tid]['records'].append({
            'record_id': rec['record_id'],
            'booking_id': rec.get('booking_id'),
            'duration': duration,
            'correct_base': correct_base,
            'correct_payout': correct_payout,
            'correct_commission': correct_commission,
            'student_id': rec.get('student_id'),
            'created_at': rec.get('created_at'),
        })

    # Step 2: Fix tutor_earnings wallets and teachers.total_classes
    print(f"\nRecalculating earnings for {len(teacher_earnings_map)} teachers:")
    for teacher_id, data in teacher_earnings_map.items():
        total_net = round(data['total_net'], 2)
        total_gross = round(data['total_gross'], 2)
        count = data['count']

        # Get existing withdrawn amount (don't overwrite)
        existing = await db.tutor_earnings.find_one({'teacher_id': teacher_id}, {'_id': 0})
        withdrawn = existing.get('total_withdrawn', 0) if existing else 0

        # Update tutor_earnings wallet
        await db.tutor_earnings.update_one(
            {'teacher_id': teacher_id},
            {'$set': {
                'total_earnings': total_net,
                'withdrawable_balance': round(total_net - withdrawn, 2),
                'updated_at': now,
            }},
            upsert=True
        )
        print(f"  Teacher {teacher_id}: wallet = RM {total_net} net (from {count} sessions)")

        # Update teachers.total_classes
        await db.teachers.update_one(
            {'teacher_id': teacher_id},
            {'$set': {'total_classes': count}}
        )
        print(f"  Teacher {teacher_id}: total_classes = {count}")

    # Step 3: Fix tutor_earnings_transactions
    print("\nRecalculating transactions:")
    for teacher_id, data in teacher_earnings_map.items():
        running_balance = 0
        for rec in data['records']:
            running_balance += rec['correct_payout']

            # Get student name for description
            student_name = 'Student'
            if rec.get('student_id'):
                student_doc = await db.students.find_one({'student_id': rec['student_id']}, {'_id': 0})
                if student_doc:
                    user_doc = await db.users.find_one({'user_id': student_doc.get('user_id')}, {'_id': 0})
                    if user_doc:
                        student_name = user_doc.get('name', 'Student')

            # Update or upsert the transaction
            txn_filter = {
                'teacher_id': teacher_id,
                'reference_id': rec.get('booking_id'),
                'transaction_type': 'session_earning'
            }
            txn_update = {
                '$set': {
                    'amount': rec['correct_payout'],
                    'gross_amount': rec['correct_base'],
                    'net_amount': rec['correct_payout'],
                    'platform_fee': rec['correct_commission'],
                    'balance_after': round(running_balance, 2),
                    'description': f"{student_name} - {rec['duration']} min session",
                    'student_id': rec.get('student_id'),
                    'duration_minutes': rec['duration'],
                    'migrated_at': now,
                }
            }
            result = await db.tutor_earnings_transactions.update_one(txn_filter, txn_update)
            if result.matched_count == 0:
                # Create if doesn't exist
                txn_update['$set'].update({
                    'transaction_id': f"te_txn_mig_{rec['record_id'][-8:]}",
                    'earnings_id': (await db.tutor_earnings.find_one({'teacher_id': teacher_id}, {'_id': 0, 'earnings_id': 1})).get('earnings_id', ''),
                    'teacher_id': teacher_id,
                    'transaction_type': 'session_earning',
                    'reference_id': rec.get('booking_id'),
                    'session_payment_record_id': rec['record_id'],
                    'created_at': rec.get('created_at', now),
                })
                await db.tutor_earnings_transactions.insert_one(txn_update['$set'])
            print(f"  Txn for booking {rec.get('booking_id')}: RM {rec['correct_payout']} net ({student_name})")

    # Step 4: Create admin_revenue entries for any missing ones
    print("\nCreating admin_revenue records:")
    for teacher_id, data in teacher_earnings_map.items():
        for rec in data['records']:
            existing = await db.admin_revenue.find_one({
                'booking_id': rec.get('booking_id'),
                'teacher_id': teacher_id
            })
            if not existing:
                await db.admin_revenue.insert_one({
                    'revenue_id': f"rev_mig_{rec['record_id'][-8:]}",
                    'teacher_id': teacher_id,
                    'booking_id': rec.get('booking_id'),
                    'gross_amount': rec['correct_base'],
                    'platform_fee': rec['correct_commission'],
                    'net_to_teacher': rec['correct_payout'],
                    'created_at': rec.get('created_at', now),
                })
                print(f"  Created admin_revenue for booking {rec.get('booking_id')}: platform gets RM {rec['correct_commission']}")

    # Verify final state
    print("\n=== VERIFICATION ===")
    for teacher_id in teacher_earnings_map:
        wallet = await db.tutor_earnings.find_one({'teacher_id': teacher_id}, {'_id': 0})
        teacher = await db.teachers.find_one({'teacher_id': teacher_id}, {'_id': 0, 'total_classes': 1, 'teacher_id': 1})
        print(f"Teacher {teacher_id}:")
        print(f"  Wallet: RM {wallet.get('withdrawable_balance', 0)} withdrawable, RM {wallet.get('total_earnings', 0)} total")
        print(f"  Total Classes: {teacher.get('total_classes', 0)}")

    admin_rev = await db.admin_revenue.find({}, {'_id': 0}).to_list(100)
    print(f"\nAdmin Revenue Records: {len(admin_rev)}")
    for r in admin_rev:
        print(f"  {r.get('revenue_id')}: RM {r.get('platform_fee')} from teacher {r.get('teacher_id')}")

    print("\n=== MIGRATION COMPLETE ===")

asyncio.run(migrate())
