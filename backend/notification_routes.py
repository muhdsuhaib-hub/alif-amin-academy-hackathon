from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
import uuid
from typing import Optional, List
from pydantic import BaseModel

notification_router = APIRouter(prefix="/api/notifications")

# Database will be injected from server.py
db = None

def init_notification_routes(database):
    global db
    db = database


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    notification_type: str
    related_id: Optional[str] = None


# Helper function to create a notification
async def create_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str,
    related_id: Optional[str] = None,
    link: Optional[str] = None,
    action_required: bool = False,
    class_time_utc: Optional[str] = None
):
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    notification_doc = {
        "notification_id": notification_id,
        "user_id": user_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "related_id": related_id,
        "link": link,
        "action_required": action_required,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    if class_time_utc:
        notification_doc["class_time_utc"] = class_time_utc
    await db.notifications.insert_one(notification_doc)
    return notification_id


# Get notifications for current user
@notification_router.get("")
async def get_notifications(user_id: str, unread_only: bool = False, limit: int = 50):
    """Get notifications for a user"""
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    unread_count = await db.notifications.count_documents({
        "user_id": user_id,
        "is_read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


# Mark notification as read
@notification_router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a single notification as read"""
    result = await db.notifications.update_one(
        {"notification_id": notification_id},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}


# Mark all notifications as read
@notification_router.put("/mark-all-read")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user"""
    result = await db.notifications.update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}


# Delete a notification
@notification_router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete a notification"""
    result = await db.notifications.delete_one({"notification_id": notification_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}


# Generate automatic notifications for students
@notification_router.post("/generate/student/{user_id}")
async def generate_student_notifications(user_id: str):
    """Generate automatic notifications for a student"""
    # Get student profile
    student = await db.students.find_one({"user_id": user_id}, {"_id": 0})
    if not student:
        return {"message": "Student not found", "generated": 0}
    
    generated_count = 0
    now = datetime.now(timezone.utc)
    
    # Check for upcoming classes in the next 24 hours
    tomorrow = now + timedelta(hours=24)
    upcoming_classes = await db.bookings.find({
        "student_id": student["student_id"],
        "status": "scheduled",
        "start_time_utc": {
            "$gte": now.isoformat(),
            "$lte": tomorrow.isoformat()
        }
    }, {"_id": 0}).to_list(10)
    
    for booking in upcoming_classes:
        # Check if notification already exists for this booking
        existing = await db.notifications.find_one({
            "user_id": user_id,
            "notification_type": "upcoming_class",
            "related_id": booking["booking_id"]
        })
        
        if not existing:
            # Get teacher info
            teacher = await db.teachers.find_one({"teacher_id": booking["teacher_id"]}, {"_id": 0})
            teacher_user = None
            if teacher:
                teacher_user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
            
            teacher_name = teacher_user.get("name", "Your Teacher") if teacher_user else "Your Teacher"
            
            # Format time in a parseable way — frontend will convert to local tz
            raw_time = booking["start_time_utc"]
            
            # Look up session_id for classroom link
            session_doc = await db.class_sessions.find_one(
                {"booking_id": booking["booking_id"]}, {"_id": 0, "session_id": 1}
            )
            classroom_link = f"/classroom/{session_doc['session_id']}" if session_doc else None
            
            await create_notification(
                user_id=user_id,
                title="Upcoming Class Reminder",
                message=f"You have a class with {teacher_name}. Check your schedule for details!",
                notification_type="upcoming_class",
                related_id=booking["booking_id"],
                link=classroom_link,
                action_required=True,
                class_time_utc=raw_time
            )
            generated_count += 1
    
    # Check if student has no upcoming classes at all
    any_future_bookings = await db.bookings.count_documents({
        "student_id": student["student_id"],
        "status": "scheduled",
        "start_time_utc": {"$gte": now.isoformat()}
    })
    
    if any_future_bookings == 0:
        # Check if we already sent this notification in the last 7 days
        week_ago = (now - timedelta(days=7)).isoformat()
        existing_reminder = await db.notifications.find_one({
            "user_id": user_id,
            "notification_type": "no_upcoming_class",
            "created_at": {"$gte": week_ago}
        })
        
        if not existing_reminder:
            await create_notification(
                user_id=user_id,
                title="Book Your Next Class",
                message="You don't have any upcoming classes scheduled. Book a session with your teacher to continue your Quran learning journey!",
                notification_type="no_upcoming_class"
            )
            generated_count += 1
    
    return {"message": f"Generated {generated_count} notifications", "generated": generated_count}


# Generate automatic notifications for teachers
@notification_router.post("/generate/teacher/{user_id}")
async def generate_teacher_notifications(user_id: str):
    """Generate automatic notifications for a teacher"""
    # Get teacher profile
    teacher = await db.teachers.find_one({"user_id": user_id}, {"_id": 0})
    if not teacher:
        return {"message": "Teacher not found", "generated": 0}
    
    generated_count = 0
    now = datetime.now(timezone.utc)
    
    # Check for upcoming classes in the next 24 hours
    tomorrow = now + timedelta(hours=24)
    upcoming_classes = await db.bookings.find({
        "teacher_id": teacher["teacher_id"],
        "status": "scheduled",
        "start_time_utc": {
            "$gte": now.isoformat(),
            "$lte": tomorrow.isoformat()
        }
    }, {"_id": 0}).to_list(10)
    
    for booking in upcoming_classes:
        # Check if notification already exists
        existing = await db.notifications.find_one({
            "user_id": user_id,
            "notification_type": "upcoming_class",
            "related_id": booking["booking_id"]
        })
        
        if not existing:
            # Get student info
            student = await db.students.find_one({"student_id": booking["student_id"]}, {"_id": 0})
            student_user = None
            if student:
                student_user = await db.users.find_one({"user_id": student["user_id"]}, {"_id": 0})
            
            student_name = student_user.get("name", "Your Student") if student_user else "Your Student"
            
            raw_time = booking["start_time_utc"]
            
            # Look up session_id for classroom link
            session_doc = await db.class_sessions.find_one(
                {"booking_id": booking["booking_id"]}, {"_id": 0, "session_id": 1}
            )
            classroom_link = f"/classroom/{session_doc['session_id']}" if session_doc else None
            
            await create_notification(
                user_id=user_id,
                title="Upcoming Class",
                message=f"You have a class with {student_name}. Be ready to teach!",
                notification_type="upcoming_class",
                related_id=booking["booking_id"],
                link=classroom_link,
                action_required=True,
                class_time_utc=raw_time
            )
            generated_count += 1
    
    # Check for recently completed classes that need notes
    yesterday = now - timedelta(hours=24)
    completed_classes = await db.bookings.find({
        "teacher_id": teacher["teacher_id"],
        "status": "completed",
        "start_time_utc": {
            "$gte": yesterday.isoformat(),
            "$lte": now.isoformat()
        }
    }, {"_id": 0}).to_list(20)
    
    for booking in completed_classes:
        # Check if notes exist for this booking
        notes_exist = await db.progress_logs.find_one({
            "teacher_id": teacher["teacher_id"],
            "student_id": booking["student_id"],
            "created_at": {"$gte": booking["start_time_utc"]}
        })
        
        if not notes_exist:
            # Check if reminder already sent
            existing_reminder = await db.notifications.find_one({
                "user_id": user_id,
                "notification_type": "leave_note_reminder",
                "related_id": booking["booking_id"]
            })
            
            if not existing_reminder:
                student = await db.students.find_one({"student_id": booking["student_id"]}, {"_id": 0})
                student_user = None
                if student:
                    student_user = await db.users.find_one({"user_id": student["user_id"]}, {"_id": 0})
                
                student_name = student_user.get("name", "your student") if student_user else "your student"
                
                await create_notification(
                    user_id=user_id,
                    title="Leave a Note for Your Student",
                    message=f"Don't forget to leave progress notes for {student_name}'s recent class!",
                    notification_type="leave_note_reminder",
                    related_id=booking["booking_id"]
                )
                generated_count += 1
    
    # Check for completed classes to credit earnings
    completed_for_earnings = await db.bookings.find({
        "teacher_id": teacher["teacher_id"],
        "status": "completed",
        "booking_type": "paid"
    }, {"_id": 0}).to_list(100)
    
    for booking in completed_for_earnings[-5:]:  # Last 5 completed
        existing_earning = await db.notifications.find_one({
            "user_id": user_id,
            "notification_type": "earning_credited",
            "related_id": booking["booking_id"]
        })
        
        if not existing_earning:
            await create_notification(
                user_id=user_id,
                title="Earning Credited",
                message="Your earnings have been credited for completing a class.",
                notification_type="earning_credited",
                related_id=booking["booking_id"]
            )
            generated_count += 1
    
    return {"message": f"Generated {generated_count} notifications", "generated": generated_count}


# Generate automatic notifications for admin
@notification_router.post("/generate/admin/{user_id}")
async def generate_admin_notifications(user_id: str):
    """Generate automatic notifications for an admin"""
    generated_count = 0
    now = datetime.now(timezone.utc)
    
    # Check for pending teacher approvals
    pending_teachers = await db.teachers.find({
        "$or": [{"approval_status": "pending"}, {"is_active": False, "approval_status": {"$exists": False}}]
    }, {"_id": 0}).to_list(50)
    
    for teacher in pending_teachers:
        existing = await db.notifications.find_one({
            "user_id": user_id,
            "notification_type": "teacher_pending",
            "related_id": teacher["teacher_id"]
        })
        
        if not existing:
            teacher_user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
            teacher_name = teacher_user.get("name", "A new teacher") if teacher_user else "A new teacher"
            
            await create_notification(
                user_id=user_id,
                title="New Teacher Application",
                message=f"{teacher_name} has applied to become a teacher. Review their application in the Approvals tab.",
                notification_type="teacher_pending",
                related_id=teacher["teacher_id"]
            )
            generated_count += 1
    
    # Check for new student registrations in the last 24 hours
    yesterday = (now - timedelta(hours=24)).isoformat()
    new_students = await db.users.find({
        "role": "student",
        "created_at": {"$gte": yesterday}
    }, {"_id": 0}).to_list(50)
    
    for student in new_students:
        existing = await db.notifications.find_one({
            "user_id": user_id,
            "notification_type": "new_registration",
            "related_id": student["user_id"]
        })
        
        if not existing:
            await create_notification(
                user_id=user_id,
                title="New Student Registration",
                message=f"{student.get('name', 'A new student')} has registered on the platform.",
                notification_type="new_registration",
                related_id=student["user_id"]
            )
            generated_count += 1
    
    # Check for cancelled/rescheduled bookings in the last 24 hours
    cancelled_bookings = await db.bookings.find({
        "status": "cancelled",
        "cancelled_at": {"$gte": yesterday}
    }, {"_id": 0}).to_list(20)
    
    for booking in cancelled_bookings:
        existing = await db.notifications.find_one({
            "user_id": user_id,
            "notification_type": "class_reschedule",
            "related_id": booking["booking_id"]
        })
        
        if not existing:
            await create_notification(
                user_id=user_id,
                title="Class Cancelled",
                message=f"A class (ID: {booking['booking_id'][:12]}...) has been cancelled. Review in the Bookings tab.",
                notification_type="class_reschedule",
                related_id=booking["booking_id"]
            )
            generated_count += 1
    
    return {"message": f"Generated {generated_count} notifications", "generated": generated_count}


# Create custom notification (admin only)
@notification_router.post("")
async def create_custom_notification(notification: NotificationCreate):
    """Create a custom notification (admin feature)"""
    notification_id = await create_notification(
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        related_id=notification.related_id
    )
    
    return {"message": "Notification created", "notification_id": notification_id}
