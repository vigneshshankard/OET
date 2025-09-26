"""
Session Management API Routes
Complete implementation for session data and practice session management
Based on Session Service and WebRTC Server requirements
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timedelta
from core.database import db_manager
import structlog
import json

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Request/Response Models
class SessionCreateRequest(BaseModel):
    user_id: str
    user_email: str
    user_role: str
    device_id: Optional[str] = None
    device_info: Optional[Dict[str, Any]] = None
    ip_address: str
    user_agent: Optional[str] = None
    expires_in: int = Field(default=86400, description="Session duration in seconds")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SessionActivityRequest(BaseModel):
    session_id: str
    action: str = Field(..., description="Action type: login, logout, refresh, activity, expired")
    ip_address: str
    user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)

class PracticeSessionRequest(BaseModel):
    user_id: str
    scenario_id: str
    livekit_room_name: str
    livekit_token: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class SessionMessageRequest(BaseModel):
    session_id: str
    user_id: str
    message_type: str = Field(..., description="Message type: audio, response, audio_quality, tts_chunk, session_start, session_end, error")
    data: Dict[str, Any]
    sequence_number: int
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class LiveKitRoomRequest(BaseModel):
    name: str
    sid: str
    metadata: Optional[str] = None

class LiveKitParticipantRequest(BaseModel):
    room_id: str
    user_id: str
    participant_id: str
    identity: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

# Session Data Management
@router.post("/auth/create")
async def create_session(session: SessionCreateRequest):
    """Create a new authentication session"""
    try:
        # Calculate expiry time
        expires_at = datetime.utcnow() + timedelta(seconds=session.expires_in)
        
        session_data = session.dict()
        session_data['expires_at'] = expires_at
        
        result = await db_manager.create_session_data(session_data)
        
        # Log session creation activity
        await db_manager.log_session_activity({
            'session_id': result['id'],
            'action': 'login',
            'ip_address': session.ip_address,
            'user_agent': session.user_agent,
            'details': {'method': 'create_session', 'success': True}
        })
        
        logger.info(f"Session created for user {session.user_id}")
        return {
            'session': result,
            'token': f"session_{result['id']}",  # Simplified token
            'expires_at': expires_at.isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session")

@router.get("/auth/{user_id}/active")
async def get_active_sessions(user_id: str):
    """Get active sessions for a user"""
    try:
        sessions = await db_manager.get_active_sessions(user_id)
        return {
            'sessions': sessions,
            'total': len(sessions)
        }
    except Exception as e:
        logger.error(f"Failed to get active sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to get sessions")

@router.post("/auth/{session_id}/activity")
async def update_session_activity(session_id: str):
    """Update session last activity timestamp"""
    try:
        await db_manager.update_session_activity(session_id)
        return {'status': 'success', 'message': 'Activity updated'}
    except Exception as e:
        logger.error(f"Failed to update session activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to update activity")

@router.post("/activity/log")
async def log_session_activity(activity: SessionActivityRequest):
    """Log session activity"""
    try:
        activity_data = activity.dict()
        result = await db_manager.log_session_activity(activity_data)
        logger.info(f"Activity logged for session {activity.session_id}: {activity.action}")
        return {'activity': result}
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to log activity")

# Practice Session Management (WebRTC)
@router.post("/practice/create")
async def create_practice_session(session: PracticeSessionRequest):
    """Create a new practice session"""
    try:
        session_data = session.dict()
        result = await db_manager.create_practice_session(session_data)
        
        logger.info(f"Practice session created for user {session.user_id}, scenario {session.scenario_id}")
        return {
            'practice_session': result,
            'room_name': session.livekit_room_name,
            'status': 'active'
        }
    except Exception as e:
        logger.error(f"Failed to create practice session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create practice session")

@router.post("/practice/{session_id}/complete")
async def complete_practice_session(session_id: str, duration: Optional[int] = None):
    """Complete a practice session"""
    try:
        end_data = {
            'status': 'completed',
            'duration': duration
        }
        result = await db_manager.complete_practice_session(session_id, end_data)
        
        if not result:
            raise HTTPException(status_code=404, detail="Practice session not found")
            
        logger.info(f"Practice session {session_id} completed")
        return {'practice_session': result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to complete practice session: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete session")

@router.post("/practice/{session_id}/cancel")
async def cancel_practice_session(session_id: str, reason: Optional[str] = None):
    """Cancel a practice session"""
    try:
        end_data = {
            'status': 'cancelled',
            'reason': reason
        }
        result = await db_manager.complete_practice_session(session_id, end_data)
        
        if not result:
            raise HTTPException(status_code=404, detail="Practice session not found")
            
        logger.info(f"Practice session {session_id} cancelled")
        return {'practice_session': result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel practice session: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel session")

# Session Messages Management
@router.post("/messages/create")
async def create_session_message(message: SessionMessageRequest):
    """Create a session message"""
    try:
        message_data = message.dict()
        result = await db_manager.create_session_message(message_data)
        
        logger.debug(f"Message created for session {message.session_id}: {message.message_type}")
        return {'message': result}
    except Exception as e:
        logger.error(f"Failed to create session message: {e}")
        raise HTTPException(status_code=500, detail="Failed to create message")

@router.get("/messages/{session_id}")
async def get_session_messages(session_id: str, limit: int = 100):
    """Get messages for a session"""
    try:
        messages = await db_manager.get_session_messages(session_id, limit)
        return {
            'messages': messages,
            'total': len(messages),
            'session_id': session_id
        }
    except Exception as e:
        logger.error(f"Failed to get session messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to get messages")

# LiveKit Integration
@router.post("/livekit/rooms")
async def create_livekit_room(room: LiveKitRoomRequest):
    """Create or update a LiveKit room record"""
    try:
        room_data = room.dict()
        result = await db_manager.create_livekit_room(room_data)
        
        logger.info(f"LiveKit room created/updated: {room.name}")
        return {'room': result}
    except Exception as e:
        logger.error(f"Failed to create LiveKit room: {e}")
        raise HTTPException(status_code=500, detail="Failed to create room")

@router.post("/livekit/participants")
async def add_livekit_participant(participant: LiveKitParticipantRequest):
    """Add a participant to a LiveKit room"""
    try:
        participant_data = participant.dict()
        result = await db_manager.add_livekit_participant(participant_data)
        
        logger.info(f"Participant added to room: {participant.identity}")
        return {'participant': result}
    except Exception as e:
        logger.error(f"Failed to add participant: {e}")
        raise HTTPException(status_code=500, detail="Failed to add participant")

# Session Analytics
@router.get("/analytics/{user_id}")
async def get_session_analytics(user_id: str):
    """Get session analytics for a user"""
    try:
        # Get session data
        sessions = await db_manager.get_active_sessions(user_id)
        
        # Calculate analytics
        analytics = {
            'total_sessions': len(sessions),
            'active_sessions': len([s for s in sessions if s['is_active']]),
            'average_session_duration': 0,  # Calculate based on session data
            'last_login': max([s['created_at'] for s in sessions]) if sessions else None,
            'device_info': [s['device_info'] for s in sessions if s.get('device_info')],
            'sessions': sessions
        }
        
        return {'analytics': analytics}
    except Exception as e:
        logger.error(f"Failed to get session analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analytics")

# Health check for session service
@router.get("/health")
async def session_health_check():
    """Health check for session management"""
    try:
        # Test database connectivity
        await db_manager._pool.acquire()
        return {
            'status': 'healthy',
            'service': 'session_management',
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Session service health check failed: {e}")
        raise HTTPException(status_code=503, detail="Session service unhealthy")