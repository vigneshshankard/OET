"""
Billing management routes - Proxy to Billing Service
"""

from fastapi import APIRouter, HTTPException, Depends, Request
import structlog
import httpx
from config.settings import get_settings

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/subscription")
async def get_subscription(request: Request, settings: dict = Depends(get_settings)):
    """Get user's subscription"""
    # Proxy to Billing Service
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.billing_service_url}/subscription",
            headers={"X-User-ID": request.state.user["id"]},
            timeout=30.0
        )
        return response.json()