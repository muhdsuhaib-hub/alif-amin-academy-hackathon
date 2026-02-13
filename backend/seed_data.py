import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def seed_data():
    print("Seeding database with initial data...")
    
    admin_user = {
        "user_id": "user_admin001",
        "email": "admin@alilm.com",
        "name": "Admin User",
        "role": "admin",
        "picture": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        "timezone": "Asia/Kuala_Lumpur",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.delete_many({"user_id": "user_admin001"})
    await db.users.insert_one(admin_user)
    print("✓ Created admin user")
    
    teachers_data = [
        {
            "user_id": "user_teacher001",
            "email": "ustaz.ahmad@alilm.com",
            "name": "Ustaz Ahmad bin Abdullah",
            "role": "teacher",
            "picture": "https://images.pexels.com/photos/8121775/pexels-photo-8121775.jpeg?w=150",
            "timezone": "Asia/Kuala_Lumpur",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_teacher002",
            "email": "ustazah.fatimah@alilm.com",
            "name": "Ustazah Fatimah binti Hassan",
            "role": "teacher",
            "picture": "https://images.unsplash.com/photo-1547567919-07728e7d2dc5?w=150",
            "timezone": "Asia/Kuala_Lumpur",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_teacher003",
            "email": "ustaz.muhammad@alilm.com",
            "name": "Ustaz Muhammad bin Ibrahim",
            "role": "teacher",
            "picture": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            "timezone": "Asia/Kuala_Lumpur",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for teacher_user in teachers_data:
        await db.users.delete_many({"user_id": teacher_user["user_id"]})
        await db.users.insert_one(teacher_user)
    
    print(f"✓ Created {len(teachers_data)} teacher users")
    
    teacher_profiles = [
        {
            "teacher_id": "teacher_001",
            "user_id": "user_teacher001",
            "bio": "Experienced Quran teacher with 10+ years specializing in Tajweed and memorization. Hafiz with Ijazah in Qira'at Asim.",
            "meet_link": "https://meet.google.com/abc-defg-hij",
            "specializations": ["Tajweed", "Memorization", "Qira'at"],
            "years_experience": 12,
            "is_active": True,
            "rating": 4.9,
            "total_classes": 847
        },
        {
            "teacher_id": "teacher_002",
            "user_id": "user_teacher002",
            "bio": "Passionate about teaching children and beginners. Patient approach with focus on proper pronunciation and understanding.",
            "meet_link": "https://meet.google.com/xyz-uvwx-rst",
            "specializations": ["Beginners", "Children", "Basic Arabic"],
            "years_experience": 8,
            "is_active": True,
            "rating": 4.8,
            "total_classes": 523
        },
        {
            "teacher_id": "teacher_003",
            "user_id": "user_teacher003",
            "bio": "Specialist in advanced Tajweed rules and Tafsir. Perfect for intermediate to advanced students seeking deeper understanding.",
            "meet_link": "https://meet.google.com/lmn-opqr-stu",
            "specializations": ["Advanced Tajweed", "Tafsir", "Arabic Grammar"],
            "years_experience": 15,
            "is_active": True,
            "rating": 5.0,
            "total_classes": 1204
        }
    ]
    
    for profile in teacher_profiles:
        await db.teachers.delete_many({"teacher_id": profile["teacher_id"]})
        await db.teachers.insert_one(profile)
    
    print(f"✓ Created {len(teacher_profiles)} teacher profiles")
    
    base_time = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    for day_offset in range(7):
        for teacher_id in ["teacher_001", "teacher_002", "teacher_003"]:
            for hour in [8, 10, 14, 16, 18, 20]:
                slot_time = base_time + timedelta(days=day_offset, hours=hour)
                if slot_time > datetime.now(timezone.utc):
                    slot = {
                        "slot_id": f"slot_{teacher_id}_{day_offset}_{hour}",
                        "teacher_id": teacher_id,
                        "start_time_utc": slot_time.isoformat(),
                        "end_time_utc": (slot_time + timedelta(hours=1)).isoformat(),
                        "is_booked": False,
                        "recurring": False,
                        "recurrence_pattern": None
                    }
                    await db.availability_slots.delete_many({"slot_id": slot["slot_id"]})
                    await db.availability_slots.insert_one(slot)
    
    print("✓ Created availability slots for next 7 days")
    
    print("\n" + "="*50)
    print("SEED DATA COMPLETE!")
    print("="*50)
    print("\nTest Accounts Created:")
    print(f"Admin: admin@alilm.com")
    print(f"Teacher 1: ustaz.ahmad@alilm.com")
    print(f"Teacher 2: ustazah.fatimah@alilm.com")
    print(f"Teacher 3: ustaz.muhammad@alilm.com")
    print("\nNote: Use Google OAuth to create student accounts")
    print("="*50)


if __name__ == "__main__":
    asyncio.run(seed_data())
