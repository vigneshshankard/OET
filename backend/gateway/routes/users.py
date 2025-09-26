"""
User management routes - Proxy to User Service
Based on api-specification.md user endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import structlog
import httpx
from config.settings import get_settings

logger = structlog.get_logger(__name__)

router = APIRouter()


class UpdateProfileRequest(BaseModel):
    fullName: str = None
    profession: str = None


@router.get("/me")
async def get_profile(request: Request, settings: dict = Depends(get_settings)):
    """Get current user's profile"""
    user_id = request.state.user["id"]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.user_service_url}/users/{user_id}",
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("error", "Failed to get profile")
                )
                
    except httpx.TimeoutException:
        logger.error("User service timeout")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except httpx.RequestError as e:
        logger.error("User service connection error", error=str(e))
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.patch("/me")
async def update_profile(
    profile_data: UpdateProfileRequest, 
    request: Request, 
    settings: dict = Depends(get_settings)
):
    """Update current user's profile"""
    user_id = request.state.user["id"]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{settings.user_service_url}/users/{user_id}",
                json=profile_data.dict(exclude_unset=True),
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("error", "Failed to update profile")
                )
                
    except httpx.TimeoutException:
        logger.error("User service timeout")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except httpx.RequestError as e:
        logger.error("User service connection error", error=str(e))
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")


@router.delete("/me")
async def delete_account(request: Request, settings: dict = Depends(get_settings)):
    """Delete current user's account"""
    user_id = request.state.user["id"]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{settings.user_service_url}/users/{user_id}",
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("error", "Failed to delete account")
                )
                
    except httpx.TimeoutException:
        logger.error("User service timeout")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except httpx.RequestError as e:
        logger.error("User service connection error", error=str(e))
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")