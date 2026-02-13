import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin emails to grant access
ADMIN_EMAILS = [
    'muhdsuhaib@gmail.com',
    'hello.alifamin@gmail.com'
]

async def grant_admin_access():
    print("="*60)
    print("GRANTING ADMIN ACCESS")
    print("="*60)
    
    for email in ADMIN_EMAILS:
        print(f"\nProcessing: {email}")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            # Update existing user to admin
            result = await db.users.update_one(
                {"email": email},
                {"$set": {"role": "admin"}}
            )
            print(f"  ✓ Updated existing user to admin role")
            print(f"    User ID: {existing_user['user_id']}")
        else:
            # Create new admin user (will be completed when they first login)
            user_id = f"admin_{email.split('@')[0]}_{int(datetime.now(timezone.utc).timestamp())}"
            new_admin = {
                "user_id": user_id,
                "email": email,
                "name": email.split('@')[0].title(),
                "role": "admin",
                "picture": None,
                "timezone": "Asia/Kuala_Lumpur",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_admin)
            print(f"  ✓ Created new admin user")
            print(f"    User ID: {user_id}")
            print(f"    Note: Profile will be completed on first login")
    
    print("\n" + "="*60)
    print("ADMIN ACCESS GRANTED SUCCESSFULLY")
    print("="*60)
    print("\nAdmin users can now access:")
    print("  • URL: https://alif-amin-preview.preview.emergentagent.com/auth/admin")
    print("  • Login with Google using one of the emails above")
    print("  • You'll be redirected to /admin/dashboard")
    print("\nAdmin Emails:")
    for email in ADMIN_EMAILS:
        print(f"  ✓ {email}")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(grant_admin_access())
