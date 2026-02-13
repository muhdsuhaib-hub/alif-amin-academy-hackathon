"""
Database migration script to remove hourly_rate field from all teacher documents.
This is needed because old seed data/documents still contain hourly_rate.

The platform now uses credit-based pricing (RM15 per credit) instead of 
teacher-set hourly rates.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def remove_hourly_rate_from_teachers():
    """Remove hourly_rate field from all teacher documents"""
    print("Starting migration: Remove hourly_rate from teachers collection...")
    
    # Count documents with hourly_rate
    count_before = await db.teachers.count_documents({"hourly_rate": {"$exists": True}})
    print(f"Found {count_before} teacher documents with hourly_rate field")
    
    if count_before == 0:
        print("No documents need migration.")
        return
    
    # Remove hourly_rate field from all documents that have it
    result = await db.teachers.update_many(
        {"hourly_rate": {"$exists": True}},
        {"$unset": {"hourly_rate": ""}}
    )
    
    print(f"Updated {result.modified_count} teacher documents")
    
    # Verify
    count_after = await db.teachers.count_documents({"hourly_rate": {"$exists": True}})
    print(f"Documents with hourly_rate after migration: {count_after}")
    
    if count_after == 0:
        print("SUCCESS: Migration completed successfully!")
    else:
        print("WARNING: Some documents still have hourly_rate field")


async def verify_migration():
    """Verify that hourly_rate has been removed"""
    print("\n=== Verification ===")
    
    teachers = await db.teachers.find({}, {"teacher_id": 1, "hourly_rate": 1, "tier_level": 1, "_id": 0}).to_list(100)
    
    for teacher in teachers:
        teacher_id = teacher.get("teacher_id", "unknown")
        hourly_rate = teacher.get("hourly_rate", "NOT PRESENT")
        tier_level = teacher.get("tier_level", "NOT PRESENT")
        print(f"  {teacher_id}: hourly_rate={hourly_rate}, tier_level={tier_level}")


async def main():
    await remove_hourly_rate_from_teachers()
    await verify_migration()
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
