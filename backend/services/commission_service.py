"""
Commission Service Module for Alif Amin Academy

A standalone, modular commission calculation service that can be easily
configured and adjusted without breaking the booking or wallet systems.

This module provides:
- Configurable commission tier definitions
- Tier evaluation logic
- Commission calculation functions
- Helper utilities for session pricing

IMPORTANT: All commission calculations are SERVER-SIDE ONLY to prevent manipulation.

Usage:
    from services.commission_service import (
        CommissionService,
        COMMISSION_CONFIG,
        SESSION_PRICES
    )
    
    # Get commission rate for a tutor
    rate = CommissionService.get_commission_rate(tier_level)
    
    # Calculate commission split
    split = CommissionService.calculate_split(session_price, rate)
    
    # Evaluate tier based on metrics
    result = CommissionService.evaluate_tier(sessions, rating, reviews)
"""

from dataclasses import dataclass
from typing import Dict, Optional, Tuple
from enum import Enum


# ============== CONFIGURATION ==============

class TierLevel(str, Enum):
    """Commission tier levels"""
    NEW = "new"
    RATED = "rated"
    ELITE = "elite"


@dataclass
class TierConfig:
    """Configuration for a commission tier"""
    level: int
    name: str
    commission_rate: float
    badge: str
    icon: str
    color: str
    requirements_description: str
    # Thresholds (None means not applicable for this tier)
    min_rating: Optional[float] = None
    min_reviews: Optional[int] = None
    min_sessions: Optional[int] = None


@dataclass
class SessionPriceConfig:
    """Configuration for session pricing"""
    duration_minutes: int
    base_price: float  # in RM
    credits_required: int


# ============== DEFAULT CONFIGURATION ==============
# These can be overridden by loading from database or environment

COMMISSION_CONFIG: Dict[str, TierConfig] = {
    TierLevel.NEW: TierConfig(
        level=1,
        name="New Tutor",
        commission_rate=0.40,  # 40% platform fee
        badge="new",
        icon="seedling",
        color="#6B7280",
        requirements_description="Default tier for all new tutors (< 20 sessions)"
    ),
    TierLevel.RATED: TierConfig(
        level=2,
        name="Rated Tutor",
        commission_rate=0.35,  # 35% platform fee
        badge="rated",
        icon="star",
        color="#D4AF37",
        requirements_description="20+ sessions with 4.5+ rating",
        min_rating=4.5,
        min_sessions=20
    ),
    TierLevel.ELITE: TierConfig(
        level=3,
        name="Elite Tutor",
        commission_rate=0.30,  # 30% platform fee
        badge="elite",
        icon="crown",
        color="#0F3D2E",
        requirements_description="100+ sessions with 4.7+ rating",
        min_rating=4.7,
        min_sessions=100
    )
}

# Rating threshold below which tutor is downgraded to NEW tier
DOWNGRADE_RATING_THRESHOLD = 4.3

# Session pricing configuration
SESSION_PRICES: Dict[int, SessionPriceConfig] = {
    15: SessionPriceConfig(duration_minutes=15, base_price=15.0, credits_required=1),
    30: SessionPriceConfig(duration_minutes=30, base_price=27.0, credits_required=2),
    60: SessionPriceConfig(duration_minutes=60, base_price=50.0, credits_required=4),
}


# ============== COMMISSION SERVICE CLASS ==============

class CommissionService:
    """
    Standalone commission calculation service.
    
    All methods are static for easy use without instantiation.
    Configuration can be overridden by passing custom configs.
    """
    
    @staticmethod
    def get_tier_config(tier_level: str, config: Dict = None) -> TierConfig:
        """Get configuration for a specific tier"""
        cfg = config or COMMISSION_CONFIG
        tier = TierLevel(tier_level) if isinstance(tier_level, str) else tier_level
        return cfg.get(tier, cfg[TierLevel.NEW])
    
    @staticmethod
    def get_commission_rate(tier_level: str, config: Dict = None) -> float:
        """Get commission rate for a tier level"""
        tier_config = CommissionService.get_tier_config(tier_level, config)
        return tier_config.commission_rate
    
    @staticmethod
    def get_tutor_rate(tier_level: str, config: Dict = None) -> float:
        """Get tutor payout rate (1 - commission_rate)"""
        return 1.0 - CommissionService.get_commission_rate(tier_level, config)
    
    @staticmethod
    def calculate_split(
        session_price: float,
        commission_rate: float
    ) -> Dict:
        """
        Calculate commission split between platform and tutor.
        
        Args:
            session_price: Base price of the session (e.g., RM27 for 30 min)
            commission_rate: Commission rate (e.g., 0.30 for 30%)
        
        Returns:
            dict with platform_commission, tutor_payout, and breakdown
        """
        platform_commission = round(session_price * commission_rate, 2)
        tutor_payout = round(session_price * (1 - commission_rate), 2)
        
        return {
            "session_price": session_price,
            "commission_rate": commission_rate,
            "platform_commission": platform_commission,
            "tutor_payout": tutor_payout,
            "tutor_rate": round(1 - commission_rate, 2),
            "breakdown": {
                "platform": f"RM{session_price} × {commission_rate*100:.0f}% = RM{platform_commission}",
                "tutor": f"RM{session_price} × {(1-commission_rate)*100:.0f}% = RM{tutor_payout}"
            }
        }
    
    @staticmethod
    def calculate_for_tier(
        session_price: float,
        tier_level: str,
        config: Dict = None
    ) -> Dict:
        """
        Calculate commission split using tier's commission rate.
        
        Args:
            session_price: Base price of the session
            tier_level: Tier level (new, rated, elite)
        
        Returns:
            dict with split details and tier info
        """
        rate = CommissionService.get_commission_rate(tier_level, config)
        split = CommissionService.calculate_split(session_price, rate)
        tier_config = CommissionService.get_tier_config(tier_level, config)
        
        return {
            **split,
            "tier_level": tier_level,
            "tier_name": tier_config.name
        }
    
    @staticmethod
    def evaluate_tier(
        total_sessions: int,
        average_rating: float,
        total_reviews: int,
        current_tier: str = "new",
        config: Dict = None,
        downgrade_threshold: float = None
    ) -> Dict:
        """
        Evaluate which commission tier a tutor qualifies for.
        
        Args:
            total_sessions: Number of completed sessions
            average_rating: Average tutor rating (0-5)
            total_reviews: Number of reviews received
            current_tier: Current tier level
            config: Optional custom tier configuration
            downgrade_threshold: Optional custom downgrade threshold
        
        Returns:
            dict with tier_level, commission_rate, reason, changed flag
        """
        cfg = config or COMMISSION_CONFIG
        threshold = downgrade_threshold or DOWNGRADE_RATING_THRESHOLD
        
        metrics = {
            "total_sessions": total_sessions,
            "average_rating": average_rating,
            "total_reviews": total_reviews
        }
        
        # Check for downgrade first (rating below threshold)
        if average_rating > 0 and average_rating < threshold:
            new_tier = cfg[TierLevel.NEW]
            return {
                "tier_level": TierLevel.NEW.value,
                "commission_rate": new_tier.commission_rate,
                "tier_name": new_tier.name,
                "reason": f"Rating ({average_rating:.2f}) below {threshold} threshold - downgraded",
                "metrics": metrics,
                "changed": current_tier != TierLevel.NEW.value,
                "is_downgrade": True
            }
        
        # Check for Elite Tutor (highest tier first)
        elite = cfg[TierLevel.ELITE]
        if (elite.min_sessions and total_sessions >= elite.min_sessions and
            elite.min_rating and average_rating >= elite.min_rating):
            return {
                "tier_level": TierLevel.ELITE.value,
                "commission_rate": elite.commission_rate,
                "tier_name": elite.name,
                "reason": f"Qualified: {total_sessions} sessions, {average_rating:.2f} rating",
                "metrics": metrics,
                "changed": current_tier != TierLevel.ELITE.value,
                "is_downgrade": False
            }
        
        # Check for Rated Tutor
        rated = cfg[TierLevel.RATED]
        if (rated.min_rating and average_rating >= rated.min_rating and
            rated.min_sessions and total_sessions >= rated.min_sessions):
            return {
                "tier_level": TierLevel.RATED.value,
                "commission_rate": rated.commission_rate,
                "tier_name": rated.name,
                "reason": f"Qualified: {total_sessions} sessions, {average_rating:.2f} rating",
                "metrics": metrics,
                "changed": current_tier != TierLevel.RATED.value,
                "is_downgrade": current_tier == TierLevel.ELITE.value
            }
        
        # Default to New Tutor
        new_tier = cfg[TierLevel.NEW]
        return {
            "tier_level": TierLevel.NEW.value,
            "commission_rate": new_tier.commission_rate,
            "tier_name": new_tier.name,
            "reason": "Does not meet criteria for higher tiers",
            "metrics": metrics,
            "changed": current_tier != TierLevel.NEW.value,
            "is_downgrade": current_tier in [TierLevel.RATED.value, TierLevel.ELITE.value]
        }
    
    @staticmethod
    def get_next_tier_requirements(
        current_tier: str,
        total_sessions: int,
        average_rating: float,
        total_reviews: int,
        config: Dict = None
    ) -> Optional[Dict]:
        """
        Get requirements needed to reach the next tier.
        
        Returns:
            dict with next tier info and remaining requirements, or None if at max tier
        """
        cfg = config or COMMISSION_CONFIG
        
        if current_tier == TierLevel.ELITE.value:
            return None  # Already at max tier
        
        if current_tier == TierLevel.RATED.value:
            elite = cfg[TierLevel.ELITE]
            return {
                "next_tier": TierLevel.ELITE.value,
                "next_tier_name": elite.name,
                "next_commission_rate": elite.commission_rate,
                "requirements": {
                    "sessions_needed": max(0, (elite.min_sessions or 0) - total_sessions),
                    "rating_needed": max(0, (elite.min_rating or 0) - average_rating)
                },
                "current_progress": {
                    "sessions": f"{total_sessions}/{elite.min_sessions or 0}",
                    "rating": f"{average_rating:.1f}/{elite.min_rating or 0}"
                }
            }
        
        # Current is NEW tier
        rated = cfg[TierLevel.RATED]
        return {
            "next_tier": TierLevel.RATED.value,
            "next_tier_name": rated.name,
            "next_commission_rate": rated.commission_rate,
            "requirements": {
                "rating_needed": max(0, (rated.min_rating or 0) - average_rating),
                "reviews_needed": max(0, (rated.min_reviews or 0) - total_reviews)
            },
            "current_progress": {
                "rating": f"{average_rating:.1f}/{rated.min_rating or 0}",
                "reviews": f"{total_reviews}/{rated.min_reviews or 0}"
            }
        }
    
    @staticmethod
    def get_session_price(duration_minutes: int, prices: Dict = None) -> float:
        """
        Get base session price for a duration.
        
        Args:
            duration_minutes: Session duration (15, 30, 60)
        
        Returns:
            Base price in RM
        """
        pricing = prices or SESSION_PRICES
        if duration_minutes in pricing:
            return pricing[duration_minutes].base_price
        
        # Calculate for non-standard durations (pro-rata based on 15-min rate)
        base_rate = pricing[15].base_price  # RM15 per 15 minutes
        return round((duration_minutes / 15) * base_rate, 2)
    
    @staticmethod
    def get_credits_required(duration_minutes: int, prices: Dict = None) -> int:
        """Get credits required for a session duration"""
        pricing = prices or SESSION_PRICES
        if duration_minutes in pricing:
            return pricing[duration_minutes].credits_required
        return duration_minutes // 15
    
    @staticmethod
    def get_all_tiers_summary(config: Dict = None) -> list:
        """Get summary of all tiers for display"""
        cfg = config or COMMISSION_CONFIG
        return [
            {
                "tier_level": tier.value,
                "level": cfg[tier].level,
                "name": cfg[tier].name,
                "commission_rate": cfg[tier].commission_rate,
                "tutor_rate": 1 - cfg[tier].commission_rate,
                "badge": cfg[tier].badge,
                "icon": cfg[tier].icon,
                "color": cfg[tier].color,
                "requirements": cfg[tier].requirements_description
            }
            for tier in TierLevel
        ]


# ============== CONVENIENCE FUNCTIONS ==============
# For backward compatibility and simpler imports

def get_commission_rate(tier_level: str) -> float:
    """Get commission rate for a tier"""
    return CommissionService.get_commission_rate(tier_level)

def calculate_commission(session_price: float, tier_level: str) -> Dict:
    """Calculate commission split for a session"""
    return CommissionService.calculate_for_tier(session_price, tier_level)

def evaluate_tier(sessions: int, rating: float, reviews: int, current: str = "new") -> Dict:
    """Evaluate tutor tier based on metrics"""
    return CommissionService.evaluate_tier(sessions, rating, reviews, current)

def get_session_price(duration_minutes: int) -> float:
    """Get session price for duration"""
    return CommissionService.get_session_price(duration_minutes)
