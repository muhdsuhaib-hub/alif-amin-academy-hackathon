"""
Services Module for Alif Amin Academy Backend

Contains modular, reusable business logic services.
"""

from .commission_service import (
    CommissionService,
    TierLevel,
    TierConfig,
    SessionPriceConfig,
    COMMISSION_CONFIG,
    SESSION_PRICES,
    DOWNGRADE_RATING_THRESHOLD,
    get_commission_rate,
    calculate_commission,
    evaluate_tier,
    get_session_price
)

__all__ = [
    'CommissionService',
    'TierLevel',
    'TierConfig',
    'SessionPriceConfig',
    'COMMISSION_CONFIG',
    'SESSION_PRICES',
    'DOWNGRADE_RATING_THRESHOLD',
    'get_commission_rate',
    'calculate_commission',
    'evaluate_tier',
    'get_session_price'
]
