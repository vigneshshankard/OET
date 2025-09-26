"""
AI service routes - Proxy to AI Services
Handles all AI-related requests including conversation processing, feedback generation, and validation
"""

from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import structlog
import httpx
import base64
from config.settings import get_settings

logger = structlog.get_logger(__name__)

router = APIRouter()

# Request/Response Models
class ConversationTurnRequest(BaseModel):
    audioData: str  # Base64 encoded audio
    sessionId: str
    patientPersona: Dict[str, Any]
    promptContext: Dict[str, Any] 
    conversationHistory: List[str]

class FeedbackGenerationRequest(BaseModel):
    transcript: str
    patientPersona: Dict[str, Any]
    sessionDuration: int
    targetProfession: str
    difficultyLevel: str
    scenarioType: str

class ScenarioGuidanceRequest(BaseModel):
    profession: str
    clinicalArea: str
    difficulty: str
    patientPersona: Dict[str, Any]

class ValidationRequest(BaseModel):
    response: str
    responseType: str  # 'patient' | 'feedback'
    patientPersona: Optional[Dict[str, Any]] = None
    conversationHistory: Optional[List[str]] = None


@router.post("/conversation/turn")
async def process_conversation_turn(
    request_data: ConversationTurnRequest,
    request: Request,
    settings: dict = Depends(get_settings)
):
    """Process audio input and generate AI response"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ai_service_url}/conversation/turn",
                json=request_data.dict(),
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
                
    except httpx.TimeoutException:
        logger.error("AI service timeout during conversation turn")
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        logger.error(f"Error processing conversation turn: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/feedback/comprehensive")
async def generate_comprehensive_feedback(
    request_data: FeedbackGenerationRequest,
    request: Request,
    settings: dict = Depends(get_settings)
):
    """Generate comprehensive OET feedback for completed session"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ai_service_url}/feedback/comprehensive",
                json=request_data.dict(),
                headers={"Content-Type": "application/json"},
                timeout=60.0  # Longer timeout for comprehensive feedback
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
                
    except httpx.TimeoutException:
        logger.error("AI service timeout during feedback generation")
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        logger.error(f"Error generating comprehensive feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/scenario/guidance")
async def get_scenario_guidance(
    request_data: ScenarioGuidanceRequest,
    request: Request,
    settings: dict = Depends(get_settings)
):
    """Get AI-generated scenario guidance and suggestions"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ai_service_url}/scenario/guidance",
                json=request_data.dict(),
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
                
    except httpx.TimeoutException:
        logger.error("AI service timeout during scenario guidance")
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        logger.error(f"Error getting scenario guidance: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/validation/sanitize")
async def validate_and_sanitize_response(
    request_data: ValidationRequest,
    request: Request,
    settings: dict = Depends(get_settings)
):
    """Validate and sanitize AI responses for safety"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ai_service_url}/validation/sanitize",
                json=request_data.dict(),
                headers={"Content-Type": "application/json"},
                timeout=15.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
                
    except httpx.TimeoutException:
        logger.error("AI service timeout during validation")
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        logger.error(f"Error validating response: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/capabilities")
async def get_ai_capabilities(
    settings: dict = Depends(get_settings)
):
    """Get AI service capabilities and health status"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ai_service_url}/capabilities",
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
                
    except httpx.TimeoutException:
        logger.error("AI service timeout during capabilities check")
        raise HTTPException(status_code=504, detail="AI service timeout")
    except Exception as e:
        logger.error(f"Error getting AI capabilities: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/health")
async def get_ai_health(
    settings: dict = Depends(get_settings)
):
    """Get AI service health status"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ai_service_url}/health",
                timeout=10.0
            )
            
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "ai_service": response.json() if response.status_code == 200 else {"error": response.text},
                "gateway_status": "operational"
            }
                
    except Exception as e:
        logger.error(f"Error checking AI health: {str(e)}")
        return {
            "status": "unhealthy",
            "ai_service": {"error": str(e)},
            "gateway_status": "operational"
        }


@router.post("/audio/process")
async def process_audio_file(
    file: UploadFile = File(...),
    session_id: str = None,
    settings: dict = Depends(get_settings)
):
    """Process uploaded audio file for transcription and analysis"""
    try:
        # Read audio file and encode as base64
        audio_content = await file.read()
        audio_base64 = base64.b64encode(audio_content).decode('utf-8')
        
        # Create conversation turn request
        request_data = {
            "audioData": audio_base64,
            "sessionId": session_id or "default",
            "patientPersona": {},  # Will be filled by frontend
            "promptContext": {},
            "conversationHistory": []
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.ai_service_url}/conversation/turn",
                json=request_data,
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"AI service error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {response.text}"
                )
                
    except Exception as e:
        logger.error(f"Error processing audio file: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")