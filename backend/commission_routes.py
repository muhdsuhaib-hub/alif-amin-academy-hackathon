"""
Tiered Commission Engine for Alif Amin Academy

Commission Tiers:
- Level 1 (New Tutor): 30% platform commission
- Level 2 (Rated Tutor): 25% commission (4.5+ rating, 20+ reviews)
- Level 3 (Elite Tutor): 20% commission (100+ sessions, 4.7+ rating)

Downgrade Rule: If rating falls below 4.3 → revert to 30%

All commission calculations are SERVER-SIDE ONLY to prevent manipulation.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid

commission_router = APIRouter(prefix="/api/commission")

# Database will be injected from server.py
db = None

def init_commission_routes(database):
    global db
    db = database


# ============== COMMISSION TIER CONFIGURATION ==============

COMMISSION_TIERS = {
    "new": {
        "level": 1,
        "name": "New Tutor",
        "commission_rate": 0.30,
        "badge": "new",
        "icon": "seedling",
        "color": "#6B7280",
        "requirements": "Default tier for all new tutors"
    },
    "rated": {
        "level": 2,
        "name": "Rated Tutor",
        "commission_rate": 0.25,
        "badge": "rated",
        "icon": "star",
        "color": "#D4AF37",
        "requirements": "4.5+ rating with 20+ reviews"
    },
    "elite": {
        "level": 3,
        "name": "Elite Tutor",
        "commission_rate": 0.20,
        "badge": "elite",
        "icon": "crown",
        "color": "#0F3D2E",
        "requirements": "100+ sessions with 4.7+ rating"
    }
}

# Tier evaluation thresholds
RATED_TUTOR_MIN_RATING = 4.5
RATED_TUTOR_MIN_REVIEWS = 20
ELITE_TUTOR_MIN_SESSIONS = 100
ELITE_TUTOR_MIN_RATING = 4.7
DOWNGRADE_RATING_THRESHOLD = 4.3


# ============== TIER EVALUATION LOGIC ==============

def evaluate_tier(
    total_completed_sessions: int,
    average_rating: float,
    total_reviews: int,
    current_tier: str = "new"
) -> dict:
    """
    Evaluate which commission tier a tutor qualifies for.
    
    Returns:
        dict: {tier_level, commission_rate, reason, metrics}
    """
    metrics = {
        "total_completed_sessions": total_completed_sessions,
        "average_rating": average_rating,
        "total_reviews": total_reviews
    }
    
    # Check for downgrade first (rating below 4.3)
    if average_rating > 0 and average_rating < DOWNGRADE_RATING_THRESHOLD:
        return {
            "tier_level": "new",
            "commission_rate": COMMISSION_TIERS["new"]["commission_rate"],
            "reason": f"Rating ({average_rating:.2f}) below {DOWNGRADE_RATING_THRESHOLD} threshold - reverted to New Tutor",
            "metrics": metrics,
            "changed": current_tier != "new"
        }
    
    # Check for Elite Tutor (Level 3)
    if (total_completed_sessions >= ELITE_TUTOR_MIN_SESSIONS and 
        average_rating >= ELITE_TUTOR_MIN_RATING):
        return {
            "tier_level": "elite",
            "commission_rate": COMMISSION_TIERS["elite"]["commission_rate"],
            "reason": f"Qualified for Elite: {total_completed_sessions} sessions, {average_rating:.2f} rating",
            "metrics": metrics,
            "changed": current_tier != "elite"
        }
    
    # Check for Rated Tutor (Level 2)
    if (average_rating >= RATED_TUTOR_MIN_RATING and 
        total_reviews >= RATED_TUTOR_MIN_REVIEWS):
        return {
            "tier_level": "rated",
            "commission_rate": COMMISSION_TIERS["rated"]["commission_rate"],
            "reason": f"Qualified for Rated: {average_rating:.2f} rating, {total_reviews} reviews",
            "metrics": metrics,
            "changed": current_tier != "rated"
        }
    
    # Default to New Tutor (Level 1)
    return {
        "tier_level": "new",
        "commission_rate": COMMISSION_TIERS["new"]["commission_rate"],
        "reason": "Does not meet criteria for higher tiers",
        "metrics": metrics,
        "changed": current_tier != "new"
    }


async def get_tutor_metrics(teacher_id: str) -> dict:
    """
    Calculate tutor metrics from completed sessions and reviews.
    This is SERVER-SIDE calculation to prevent manipulation.
    """
    # Count completed sessions from session_payment_records
    completed_sessions = await db.session_payment_records.count_documents({
        "teacher_id": teacher_id
    })
    
    # Also check bookings marked as completed
    completed_bookings = await db.bookings.count_documents({
        "teacher_id": teacher_id,
        "status": "completed"
    })
    
    total_completed = max(completed_sessions, completed_bookings)
    
    # Calculate average rating from reviews
    review_pipeline = [
        {"$match": {"teacher_id": teacher_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1}
        }}
    ]
    review_result = await db.reviews.aggregate(review_pipeline).to_list(1)
    
    if review_result:
        avg_rating = review_result[0].get("avg_rating", 0) or 0
        total_reviews = review_result[0].get("total_reviews", 0)
    else:
        # Fallback to teacher's stored rating if no reviews collection
        teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
        avg_rating = teacher.get("rating", 0) if teacher else 0
        total_reviews = teacher.get("total_reviews", 0) if teacher else 0
    
    return {
        "total_completed_sessions": total_completed,
        "average_rating": round(avg_rating, 2),
        "total_reviews": total_reviews
    }


async def evaluate_and_update_tutor_tier(teacher_id: str) -> dict:
    """
    Evaluate and update a single tutor's commission tier.
    """
    # Get current teacher data
    teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    current_tier = teacher.get("tier_level", "new")
    current_commission = teacher.get("commission_rate", 0.30)
    
    # Get fresh metrics from database
    metrics = await get_tutor_metrics(teacher_id)
    
    # Evaluate tier based on metrics
    evaluation = evaluate_tier(
        total_completed_sessions=metrics["total_completed_sessions"],
        average_rating=metrics["average_rating"],
        total_reviews=metrics["total_reviews"],
        current_tier=current_tier
    )
    
    now = datetime.now(timezone.utc)
    
    # Prepare tier history entry if tier changed
    tier_history = teacher.get("tier_history", [])
    if evaluation["changed"]:
        tier_history.append({
            "from_tier": current_tier,
            "to_tier": evaluation["tier_level"],
            "from_commission": current_commission,
            "to_commission": evaluation["commission_rate"],
            "reason": evaluation["reason"],
            "metrics": metrics,
            "evaluated_at": now.isoformat()
        })
    
    # Update teacher record
    await db.teachers.update_one(
        {"teacher_id": teacher_id},
        {"$set": {
            "tier_level": evaluation["tier_level"],
            "commission_rate": evaluation["commission_rate"],
            "total_completed_sessions": metrics["total_completed_sessions"],
            "average_rating": metrics["average_rating"],
            "total_reviews": metrics["total_reviews"],
            "tier_last_evaluated": now.isoformat(),
            "tier_history": tier_history
        }}
    )
    
    return {
        "teacher_id": teacher_id,
        "previous_tier": current_tier,
        "new_tier": evaluation["tier_level"],
        "previous_commission": current_commission,
        "new_commission": evaluation["commission_rate"],
        "changed": evaluation["changed"],
        "reason": evaluation["reason"],
        "metrics": metrics,
        "evaluated_at": now.isoformat()
    }


# ============== COMMISSION CALCULATION ==============

def calculate_commission(session_price: float, commission_rate: float) -> dict:
    """
    Calculate commission split between platform and tutor.
    SERVER-SIDE ONLY - prevents manipulation from frontend.
    
    Args:
        session_price: Base price of the session (e.g., RM27 for 30 min)
        commission_rate: Tutor's current commission rate (e.g., 0.30 for 30%)
    
    Returns:
        dict: {platform_earnings, tutor_earnings, commission_rate}
    """
    platform_earnings = round(session_price * commission_rate, 2)
    tutor_earnings = round(session_price * (1 - commission_rate), 2)
    
    return {
        "session_price": session_price,
        "commission_rate": commission_rate,
        "platform_earnings": platform_earnings,
        "tutor_earnings": tutor_earnings,
        "formula": {
            "tutor_earnings": f"{session_price} × (1 - {commission_rate}) = {tutor_earnings}",
            "platform_earnings": f"{session_price} × {commission_rate} = {platform_earnings}"
        }
    }


async def get_tutor_commission_rate(teacher_id: str) -> float:
    """
    Get the current commission rate for a tutor.
    Used by wallet_routes when processing session payments.
    """
    teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
    if not teacher:
        return 0.30  # Default to 30% if teacher not found
    
    return teacher.get("commission_rate", 0.30)


# ============== API ENDPOINTS ==============

@commission_router.get("/tiers")
async def get_commission_tiers():
    """Get all commission tier configurations"""
    return {
        "tiers": COMMISSION_TIERS,
        "thresholds": {
            "rated": {
                "min_rating": RATED_TUTOR_MIN_RATING,
                "min_reviews": RATED_TUTOR_MIN_REVIEWS
            },
            "elite": {
                "min_sessions": ELITE_TUTOR_MIN_SESSIONS,
                "min_rating": ELITE_TUTOR_MIN_RATING
            },
            "downgrade": {
                "rating_threshold": DOWNGRADE_RATING_THRESHOLD
            }
        }
    }


@commission_router.get("/tutor/{teacher_id}")
async def get_tutor_commission_info(teacher_id: str):
    """Get commission info for a specific tutor"""
    teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    user = await db.users.find_one({"user_id": teacher["user_id"]}, {"_id": 0})
    
    tier_info = COMMISSION_TIERS.get(teacher.get("tier_level", "new"), COMMISSION_TIERS["new"])
    
    return {
        "teacher_id": teacher_id,
        "teacher_name": user.get("name", "Unknown") if user else "Unknown",
        "tier_level": teacher.get("tier_level", "new"),
        "tier_name": tier_info["name"],
        "tier_badge": tier_info["badge"],
        "tier_icon": tier_info["icon"],
        "tier_color": tier_info["color"],
        "commission_rate": teacher.get("commission_rate", 0.30),
        "tutor_rate": 1 - teacher.get("commission_rate", 0.30),
        "metrics": {
            "total_completed_sessions": teacher.get("total_completed_sessions", 0),
            "average_rating": teacher.get("average_rating", 0),
            "total_reviews": teacher.get("total_reviews", 0)
        },
        "tier_last_evaluated": teacher.get("tier_last_evaluated"),
        "next_tier": get_next_tier_requirements(teacher)
    }


def get_next_tier_requirements(teacher: dict) -> Optional[dict]:
    """Calculate what's needed to reach the next tier"""
    current_tier = teacher.get("tier_level", "new")
    sessions = teacher.get("total_completed_sessions", 0)
    rating = teacher.get("average_rating", 0)
    reviews = teacher.get("total_reviews", 0)
    
    if current_tier == "new":
        # Next tier is Rated
        return {
            "next_tier": "rated",
            "next_tier_name": "Rated Tutor",
            "requirements": {
                "rating_needed": max(0, RATED_TUTOR_MIN_RATING - rating),
                "reviews_needed": max(0, RATED_TUTOR_MIN_REVIEWS - reviews),
                "current_rating": rating,
                "current_reviews": reviews,
                "target_rating": RATED_TUTOR_MIN_RATING,
                "target_reviews": RATED_TUTOR_MIN_REVIEWS
            },
            "commission_reduction": "5%",
            "new_commission": "25%"
        }
    elif current_tier == "rated":
        # Next tier is Elite
        return {
            "next_tier": "elite",
            "next_tier_name": "Elite Tutor",
            "requirements": {
                "sessions_needed": max(0, ELITE_TUTOR_MIN_SESSIONS - sessions),
                "rating_needed": max(0, ELITE_TUTOR_MIN_RATING - rating),
                "current_sessions": sessions,
                "current_rating": rating,
                "target_sessions": ELITE_TUTOR_MIN_SESSIONS,
                "target_rating": ELITE_TUTOR_MIN_RATING
            },
            "commission_reduction": "5%",
            "new_commission": "20%"
        }
    else:
        # Already at Elite - top tier
        return {
            "next_tier": None,
            "message": "Congratulations! You've reached the highest tier.",
            "maintain_requirements": {
                "min_rating": ELITE_TUTOR_MIN_RATING,
                "downgrade_threshold": DOWNGRADE_RATING_THRESHOLD
            }
        }


@commission_router.post("/tutor/{teacher_id}/evaluate")
async def evaluate_tutor_tier(teacher_id: str):
    """Manually evaluate and update a tutor's commission tier"""
    result = await evaluate_and_update_tutor_tier(teacher_id)
    return result


@commission_router.post("/evaluate-all")
async def evaluate_all_tutors():
    """
    Scheduled job: Evaluate all tutors' commission tiers.
    Run this monthly to auto-update tiers based on performance.
    """
    results = {
        "total_evaluated": 0,
        "upgraded": [],
        "downgraded": [],
        "unchanged": [],
        "errors": []
    }
    
    # Get all active teachers
    teachers = await db.teachers.find(
        {"is_active": True},
        {"_id": 0, "teacher_id": 1, "tier_level": 1}
    ).to_list(1000)
    
    for teacher in teachers:
        try:
            evaluation = await evaluate_and_update_tutor_tier(teacher["teacher_id"])
            results["total_evaluated"] += 1
            
            if evaluation["changed"]:
                old_level = COMMISSION_TIERS.get(evaluation["previous_tier"], {}).get("level", 1)
                new_level = COMMISSION_TIERS.get(evaluation["new_tier"], {}).get("level", 1)
                
                if new_level > old_level:
                    results["upgraded"].append({
                        "teacher_id": evaluation["teacher_id"],
                        "from": evaluation["previous_tier"],
                        "to": evaluation["new_tier"],
                        "reason": evaluation["reason"]
                    })
                else:
                    results["downgraded"].append({
                        "teacher_id": evaluation["teacher_id"],
                        "from": evaluation["previous_tier"],
                        "to": evaluation["new_tier"],
                        "reason": evaluation["reason"]
                    })
            else:
                results["unchanged"].append(teacher["teacher_id"])
                
        except Exception as e:
            results["errors"].append({
                "teacher_id": teacher["teacher_id"],
                "error": str(e)
            })
    
    # Store evaluation run record
    await db.tier_evaluation_runs.insert_one({
        "run_id": f"tier_eval_{uuid.uuid4().hex[:12]}",
        "run_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_evaluated": results["total_evaluated"],
            "upgraded_count": len(results["upgraded"]),
            "downgraded_count": len(results["downgraded"]),
            "unchanged_count": len(results["unchanged"]),
            "error_count": len(results["errors"])
        },
        "details": results
    })
    
    return results


@commission_router.get("/evaluation-history")
async def get_evaluation_history(limit: int = 10):
    """Get history of tier evaluation runs"""
    runs = await db.tier_evaluation_runs.find(
        {},
        {"_id": 0}
    ).sort("run_at", -1).limit(limit).to_list(limit)
    
    return {"evaluation_runs": runs}


@commission_router.get("/admin/summary")
async def get_commission_summary():
    """Admin: Get summary of all tutors by commission tier"""
    # Aggregate tutors by tier
    tier_pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {
            "_id": "$tier_level",
            "count": {"$sum": 1},
            "avg_sessions": {"$avg": "$total_completed_sessions"},
            "avg_rating": {"$avg": "$average_rating"},
            "avg_reviews": {"$avg": "$total_reviews"}
        }}
    ]
    tier_result = await db.teachers.aggregate(tier_pipeline).to_list(10)
    
    # Format results
    tier_summary = {}
    for tier in tier_result:
        tier_name = tier["_id"] or "new"
        tier_info = COMMISSION_TIERS.get(tier_name, COMMISSION_TIERS["new"])
        tier_summary[tier_name] = {
            "count": tier["count"],
            "tier_info": tier_info,
            "averages": {
                "sessions": round(tier.get("avg_sessions", 0) or 0, 1),
                "rating": round(tier.get("avg_rating", 0) or 0, 2),
                "reviews": round(tier.get("avg_reviews", 0) or 0, 1)
            }
        }
    
    # Calculate potential commission savings/costs
    # If all tutors were at elite vs new tier
    total_teachers = await db.teachers.count_documents({"is_active": True})
    
    return {
        "tier_distribution": tier_summary,
        "total_active_tutors": total_teachers,
        "tier_configs": COMMISSION_TIERS
    }


@commission_router.get("/tutor/{teacher_id}/history")
async def get_tutor_tier_history(teacher_id: str):
    """Get tier change history for a specific tutor"""
    teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return {
        "teacher_id": teacher_id,
        "current_tier": teacher.get("tier_level", "new"),
        "current_commission": teacher.get("commission_rate", 0.30),
        "tier_history": teacher.get("tier_history", []),
        "last_evaluated": teacher.get("tier_last_evaluated")
    }


# ============== CALCULATE COMMISSION FOR SESSION ==============

@commission_router.post("/calculate")
async def calculate_session_commission(
    teacher_id: str,
    session_price: float
):
    """
    Calculate commission for a session.
    SERVER-SIDE ONLY - used by booking/payment systems.
    """
    commission_rate = await get_tutor_commission_rate(teacher_id)
    calculation = calculate_commission(session_price, commission_rate)
    
    # Get tier info
    teacher = await db.teachers.find_one({"teacher_id": teacher_id}, {"_id": 0})
    tier_level = teacher.get("tier_level", "new") if teacher else "new"
    tier_info = COMMISSION_TIERS.get(tier_level, COMMISSION_TIERS["new"])
    
    return {
        "teacher_id": teacher_id,
        "tier": {
            "level": tier_level,
            "name": tier_info["name"],
            "badge": tier_info["badge"]
        },
        **calculation
    }
