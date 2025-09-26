"""
Content Service API Routes
Complete implementation for content management including scenarios, dialogues, and progress
Based on microservice analysis and database schema
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import structlog
import httpx
import uuid
from config.settings import get_settings
from core.database import db_manager

logger = structlog.get_logger(__name__)

router = APIRouter()

# Request Models for new endpoints
class DialogueRequest(BaseModel):
    scenario_id: str = Field(..., description="Scenario ID")
    speaker: str = Field(..., description="Speaker (user or patient)")
    message: str = Field(..., description="Dialogue message")
    expected_response: Optional[str] = Field(None, description="Expected response")
    order_number: int = Field(..., description="Order in dialogue sequence")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class UserProgressRequest(BaseModel):
    user_id: str
    scenario_id: str
    status: str = Field(default="not_started", description="Progress status")
    current_dialogue_id: Optional[str] = None
    score: Optional[float] = None
    completed_at: Optional[str] = None
    time_spent: int = Field(default=0, description="Time spent in seconds")
    attempts: int = Field(default=1, description="Number of attempts")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class MediaFileRequest(BaseModel):
    filename: str
    original_name: str
    file_type: str
    file_size: int
    file_path: str
    mime_type: str
    uploaded_by: Optional[str] = None
    scenario_id: Optional[str] = None
    dialogue_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


@router.get("/scenarios")
async def get_scenarios(
    profession: Optional[str] = None,
    difficulty: Optional[str] = None,
    request: Request = None,
    settings: dict = Depends(get_settings)
):
    """Get practice scenarios with optional filtering"""
    try:
        scenarios = await db_manager.get_scenarios(profession=profession, difficulty=difficulty)
        return {
            "scenarios": scenarios,
            "total": len(scenarios),
            "filters": {
                "profession": profession,
                "difficulty": difficulty
            }
        }
    except Exception as e:
        logger.error(f"Error getting scenarios: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str, request: Request = None, settings: dict = Depends(get_settings)):
    """Get specific scenario details"""
    try:
        scenario = await db_manager.get_scenario_by_id(scenario_id)
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        return {"scenario": scenario}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scenario: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ===== NEW COMPREHENSIVE CONTENT ENDPOINTS =====

# Dialogue Endpoints
@router.post("/dialogues")
async def create_dialogue(dialogue: DialogueRequest):
    """Create a new dialogue for a scenario"""
    try:
        dialogue_data = dialogue.dict()
        result = await db_manager.create_dialogue(dialogue_data)
        logger.info(f"Dialogue created for scenario {dialogue.scenario_id}")
        return {"dialogue": result}
    except Exception as e:
        logger.error(f"Failed to create dialogue: {e}")
        raise HTTPException(status_code=500, detail="Failed to create dialogue")

@router.get("/scenarios/{scenario_id}/dialogues")
async def get_scenario_dialogues(scenario_id: str):
    """Get all dialogues for a scenario"""
    try:
        dialogues = await db_manager.get_scenario_dialogues(scenario_id)
        return {"dialogues": dialogues, "total": len(dialogues)}
    except Exception as e:
        logger.error(f"Failed to get dialogues for scenario {scenario_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dialogues")

# User Progress Endpoints
@router.post("/progress")
async def create_user_progress(progress: UserProgressRequest):
    """Create or update user progress"""
    try:
        progress_data = progress.dict()
        result = await db_manager.create_user_progress(progress_data)
        logger.info(f"Progress updated for user {progress.user_id}, scenario {progress.scenario_id}")
        return {"progress": result}
    except Exception as e:
        logger.error(f"Failed to create user progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to update progress")

@router.get("/progress/{user_id}")
async def get_user_progress(user_id: str, scenario_id: Optional[str] = None):
    """Get user progress for one or all scenarios"""
    try:
        progress = await db_manager.get_user_progress(user_id, scenario_id)
        return {"progress": progress, "total": len(progress)}
    except Exception as e:
        logger.error(f"Failed to get user progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to get progress")

# Media Files Endpoints
@router.post("/media")
async def create_media_file(media: MediaFileRequest):
    """Create a media file record"""
    try:
        media_data = media.dict()
        result = await db_manager.create_media_file(media_data)
        logger.info(f"Media file created: {media.filename}")
        return {"media": result}
    except Exception as e:
        logger.error(f"Failed to create media file: {e}")
        raise HTTPException(status_code=500, detail="Failed to create media file")

# Enhanced scenario endpoints with dialogues
@router.get("/scenarios/{scenario_id}/complete")
async def get_complete_scenario(scenario_id: str):
    """Get complete scenario with dialogues and media"""
    try:
        # Get scenario details
        scenario = await db_manager.get_scenario_by_id(scenario_id)
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        # Get dialogues
        dialogues = await db_manager.get_scenario_dialogues(scenario_id)
        
        # Combine data
        complete_scenario = {
            **scenario,
            'dialogues': dialogues
        }
        
        return {"scenario": complete_scenario}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get complete scenario: {e}")
        raise HTTPException(status_code=500, detail="Failed to get scenario")

# Statistics endpoint
@router.get("/stats/progress/{user_id}")
async def get_progress_stats(user_id: str):
    """Get comprehensive progress statistics for a user"""
    try:
        # Get all user progress
        progress_list = await db_manager.get_user_progress(user_id)
        
        if not progress_list:
            return {
                'stats': {
                    'total_scenarios': 0,
                    'completed_scenarios': 0,
                    'in_progress_scenarios': 0,
                    'average_score': 0,
                    'total_time_spent': 0,
                    'total_attempts': 0,
                    'recent_progress': []
                }
            }
        
        # Calculate statistics
        scores = [p['score'] for p in progress_list if p['score'] is not None]
        stats = {
            'total_scenarios': len(progress_list),
            'completed_scenarios': len([p for p in progress_list if p['status'] == 'completed']),
            'in_progress_scenarios': len([p for p in progress_list if p['status'] == 'in_progress']),
            'average_score': sum(scores) / len(scores) if scores else 0,
            'total_time_spent': sum([p['time_spent'] for p in progress_list if p['time_spent']]),
            'total_attempts': sum([p['attempts'] for p in progress_list if p['attempts']]),
            'recent_progress': progress_list[:5]  # Last 5 accessed
        }
        
        return {'stats': stats}
    except Exception as e:
        logger.error(f"Failed to get progress stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")