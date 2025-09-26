"""
Session management routes - Proxy to Session Service
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import structlog
import httpx
from config.settings import get_settings
from core.database import db_manager

logger = structlog.get_logger(__name__)

router = APIRouter()

# Request/Response Models
class StartSessionRequest(BaseModel):
    scenarioId: str

class CompleteSessionRequest(BaseModel):
    duration: int  # in seconds
    transcript: Optional[str] = None
    patientPersona: Optional[Dict[str, Any]] = None
    profession: Optional[str] = None
    difficulty: Optional[str] = None
    scenarioType: Optional[str] = None


@router.get("/")
async def get_sessions(request: Request, settings: dict = Depends(get_settings)):
    """Get user's practice sessions"""
    # Proxy to Session Service
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.session_service_url}/sessions",
            headers={"X-User-ID": request.state.user["id"]},
            timeout=30.0
        )
        return response.json()


@router.post("/")
async def create_session(session_data: dict, request: Request, settings: dict = Depends(get_settings)):
    """Create new practice session"""
    # Proxy to Session Service
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.session_service_url}/sessions",
            json=session_data,
            headers={"X-User-ID": request.state.user["id"]},
            timeout=30.0
        )
        return response.json()


@router.post("/start")
async def start_session(session_data: StartSessionRequest, request: Request, settings: dict = Depends(get_settings)):
    """Start a new practice session"""
    try:
        user_id = request.state.user["id"]
        
        # Verify scenario exists
        scenario = await db_manager.get_scenario_by_id(session_data.scenarioId)
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        # Create session in database
        session = await db_manager.create_session({
            'user_id': user_id,
            'scenario_id': session_data.scenarioId,
            'status': 'active'
        })
        
        # Return session details with scenario info
        return {
            "sessionId": session["id"],
            "scenario": scenario,
            "status": "started",
            "websocketUrl": f"ws://localhost:8000/sessions/{session['id']}/stream",  # TODO: Implement WebSocket
            "livekitToken": "temp_token"  # TODO: Generate real LiveKit token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting session: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str, 
    completion_data: CompleteSessionRequest, 
    request: Request, 
    settings: dict = Depends(get_settings)
):
    """Complete a practice session and generate feedback"""
    try:
        user_id = request.state.user["id"]
        
        # Get session from database
        session = await db_manager.get_session_by_id(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        if session["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update session status and duration
        updated_session = await db_manager.update_session(session_id, {
            'status': 'completed',
            'duration_seconds': completion_data.duration
        })
        
        ai_feedback = None
        feedback_report = None
        
        # Generate comprehensive AI feedback if transcript is available
        if completion_data.transcript:
            async with httpx.AsyncClient() as client:
                feedback_request = {
                    "transcript": completion_data.transcript,
                    "patientPersona": completion_data.patientPersona or {},
                    "sessionDuration": completion_data.duration,
                    "targetProfession": completion_data.profession or session["profession"],
                    "difficultyLevel": completion_data.difficulty or "intermediate",
                    "scenarioType": completion_data.scenarioType or "consultation"
                }
                
                # Generate AI feedback
                ai_response = await client.post(
                    f"{settings.ai_service_url}/api/v2/feedback/comprehensive",
                    json=feedback_request,
                    headers={"Content-Type": "application/json"},
                    timeout=60.0
                )
                
                if ai_response.status_code == 200:
                    ai_feedback = ai_response.json()
                    
                    # Store feedback in database
                    if ai_feedback and "success" in ai_feedback and ai_feedback["success"]:
                        feedback_data = ai_feedback["data"]
                        feedback_report = await db_manager.create_feedback_report({
                            'session_id': session_id,
                            'transcript': completion_data.transcript,
                            'ai_summary': feedback_data.get("summary", ""),
                            'score_raw': int(feedback_data.get("overallScore", 0)),
                            'strengths': "; ".join(feedback_data.get("strengths", [])),
                            'areas_for_improvement': "; ".join(feedback_data.get("areasForImprovement", []))
                        })
                else:
                    logger.warning(f"AI feedback generation failed: {ai_response.status_code} - {ai_response.text}")
                    ai_feedback = {"error": "AI feedback generation failed", "status_code": ai_response.status_code}
        
        return {
            "sessionId": session_id,
            "session": updated_session,
            "feedback": ai_feedback,
            "feedbackReport": feedback_report,
            "status": "completed"
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing session: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{session_id}")
async def get_session(session_id: str, request: Request, settings: dict = Depends(get_settings)):
    """Get session details"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.session_service_url}/sessions/{session_id}",
            headers={"X-User-ID": request.state.user["id"]},
            timeout=30.0
        )
        return response.json()