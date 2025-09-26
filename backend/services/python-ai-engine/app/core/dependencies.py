"""
Dependency Injection for OET Python AI Engine
"""

from typing import Optional
from fastapi import Depends, HTTPException, Header
from functools import lru_cache
import logging

from app.core.config import get_settings, Settings
from app.models.llm_manager import LLMManager

logger = logging.getLogger(__name__)

# Global instances (will be initialized in main.py)
_llm_manager: Optional[LLMManager] = None

def set_llm_manager(manager: LLMManager):
    """Set the global LLM manager instance"""
    global _llm_manager
    _llm_manager = manager

@lru_cache()
def get_settings_cached() -> Settings:
    """Get cached settings instance"""
    return get_settings()

async def get_llm_manager() -> LLMManager:
    """Get LLM manager dependency"""
    if _llm_manager is None:
        raise HTTPException(
            status_code=503,
            detail="LLM Manager not initialized"
        )
    return _llm_manager

async def get_current_user(
    x_api_key: Optional[str] = Header(None),
    settings: Settings = Depends(get_settings_cached)
):
    """Get current user (simplified authentication)"""
    if not settings.REQUIRE_AUTH:
        return {"user_id": "anonymous", "permissions": ["read", "write"]}
    
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # In production, validate API key against database/cache
    # For now, simple validation
    if x_api_key == settings.SECRET_KEY:
        return {"user_id": "api_user", "permissions": ["read", "write"]}
    
    raise HTTPException(
        status_code=401,
        detail="Invalid API key"
    )

async def verify_permissions(
    required_permission: str,
    current_user: dict = Depends(get_current_user)
):
    """Verify user has required permissions"""
    user_permissions = current_user.get("permissions", [])
    
    if required_permission not in user_permissions:
        raise HTTPException(
            status_code=403,
            detail=f"Permission '{required_permission}' required"
        )
    
    return current_user