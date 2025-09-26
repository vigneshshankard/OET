"""
LiveKit Token Management Routes
"""

import httpx
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.auth import get_current_user
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/livekit", tags=["livekit"])

class TokenRequest(BaseModel):
    roomName: str
    participantName: str
    metadata: dict = {}

class TokenResponse(BaseModel):
    token: str
    url: str
    roomName: str

@router.post("/token", response_model=TokenResponse)
async def generate_livekit_token(
    token_request: TokenRequest,
    request: Request,
    settings: dict = Depends(get_settings)
):
    """Generate a LiveKit access token for room participation"""
    try:
        user_id = request.state.user["id"]
        
        logger.info(f"Generating LiveKit token for user {user_id}, room {token_request.roomName}")
        
        # Call WebRTC service to generate token
        webrtc_response = await httpx.AsyncClient().post(
            f"{settings['WEBRTC_SERVICE_URL']}/api/token",
            json={
                "roomName": token_request.roomName,
                "participantName": token_request.participantName,
                "userId": user_id,
                "metadata": token_request.metadata
            },
            timeout=30.0
        )
        
        if webrtc_response.status_code != 200:
            logger.error(f"WebRTC service returned {webrtc_response.status_code}: {webrtc_response.text}")
            raise HTTPException(status_code=500, detail="Failed to generate LiveKit token")
        
        token_data = webrtc_response.json()
        
        return TokenResponse(
            token=token_data["token"],
            url=token_data.get("url", settings.get('LIVEKIT_URL', 'wss://localhost:7880')),
            roomName=token_request.roomName
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating LiveKit token: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/rooms/{room_name}/status")
async def get_room_status(
    room_name: str,
    request: Request,
    settings: dict = Depends(get_settings)
):
    """Get the status of a LiveKit room"""
    try:
        user_id = request.state.user["id"]
        
        # Call WebRTC service to get room status
        webrtc_response = await httpx.AsyncClient().get(
            f"{settings['WEBRTC_SERVICE_URL']}/api/rooms/{room_name}/status",
            params={"userId": user_id},
            timeout=30.0
        )
        
        if webrtc_response.status_code != 200:
            raise HTTPException(status_code=404, detail="Room not found")
        
        return webrtc_response.json()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting room status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")