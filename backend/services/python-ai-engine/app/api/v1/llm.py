"""
LLM API Endpoints for OET Python AI Engine
Local LLM inference and management
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, AsyncGenerator
from fastapi.responses import StreamingResponse
import asyncio
import json
import logging

from app.models.llm_manager import (
    LLMManager, GenerationRequest, GenerationResponse, ModelType
)
from app.core.dependencies import get_llm_manager
from app.utils.performance import measure_performance

router = APIRouter()
logger = logging.getLogger(__name__)

# Request/Response Models
class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Input prompt for generation")
    model_name: Optional[str] = Field(None, description="Specific model to use")
    max_tokens: int = Field(512, ge=1, le=4096, description="Maximum tokens to generate")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    top_p: float = Field(0.9, ge=0.0, le=1.0, description="Top-p sampling")
    top_k: int = Field(50, ge=1, le=100, description="Top-k sampling")
    repetition_penalty: float = Field(1.1, ge=1.0, le=2.0, description="Repetition penalty")
    stop_sequences: Optional[List[str]] = Field(None, description="Stop sequences")
    stream: bool = Field(False, description="Enable streaming response")
    context_length: Optional[int] = Field(None, description="Context length limit")

class GenerateResponse(BaseModel):
    text: str
    model_used: str
    tokens_generated: int
    generation_time: float
    prompt_tokens: int
    total_tokens: int
    finish_reason: str
    metadata: Dict[str, Any]

class MedicalConversationRequest(BaseModel):
    patient_message: str
    conversation_history: List[Dict[str, str]] = Field(default_factory=list)
    patient_persona: Dict[str, Any]
    healthcare_professional: str = Field("doctor", description="Type: doctor, nurse, dentist, etc.")
    scenario_type: str = Field("consultation", description="consultation, emergency, follow_up")
    difficulty_level: str = Field("intermediate", description="beginner, intermediate, advanced")

class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="Text to generate embeddings for")
    model_name: Optional[str] = Field(None, description="Embedding model to use")

class EmbeddingResponse(BaseModel):
    embeddings: List[float]
    model_used: str
    dimension: int
    processing_time: float

@router.post("/generate", response_model=GenerateResponse)
async def generate_text(
    request: GenerateRequest,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Generate text using local LLM"""
    try:
        with measure_performance("llm_generation") as perf:
            generation_request = GenerationRequest(
                prompt=request.prompt,
                model_name=request.model_name,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                top_p=request.top_p,
                top_k=request.top_k,
                repetition_penalty=request.repetition_penalty,
                stop_sequences=request.stop_sequences or [],
                stream=request.stream,
                context_length=request.context_length
            )
            
            response = await llm_manager.generate_text(generation_request)
            
            return GenerateResponse(
                text=response.text,
                model_used=response.model_used,
                tokens_generated=response.tokens_generated,
                generation_time=response.generation_time,
                prompt_tokens=response.prompt_tokens,
                total_tokens=response.total_tokens,
                finish_reason=response.finish_reason,
                metadata={
                    **response.metadata,
                    "performance": perf.get_metrics()
                }
            )
    
    except Exception as e:
        logger.error(f"Text generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/stream")
async def generate_stream(
    request: GenerateRequest,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Generate text with streaming response"""
    try:
        async def generate():
            generation_request = GenerationRequest(
                prompt=request.prompt,
                model_name=request.model_name,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                top_p=request.top_p,
                top_k=request.top_k,
                repetition_penalty=request.repetition_penalty,
                stop_sequences=request.stop_sequences or [],
                stream=True,
                context_length=request.context_length
            )
            
            # Note: This is a simplified streaming implementation
            # In practice, you'd implement proper streaming with the model
            response = await llm_manager.generate_text(generation_request)
            
            # Simulate streaming by chunking the response
            words = response.text.split()
            for i, word in enumerate(words):
                chunk = {
                    "text": word + " ",
                    "index": i,
                    "is_final": i == len(words) - 1,
                    "model": response.model_used
                }
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.05)  # Simulate processing delay
            
            # Final chunk with metadata
            final_chunk = {
                "text": "",
                "is_final": True,
                "metadata": {
                    "tokens_generated": response.tokens_generated,
                    "generation_time": response.generation_time,
                    "finish_reason": response.finish_reason
                }
            }
            yield f"data: {json.dumps(final_chunk)}\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    
    except Exception as e:
        logger.error(f"Streaming generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Streaming failed: {str(e)}")

@router.post("/medical-conversation")
async def generate_medical_conversation(
    request: MedicalConversationRequest,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Generate medical conversation response with context awareness"""
    try:
        # Build enhanced prompt for medical conversations
        persona_context = f"""
Patient Profile:
- Name: {request.patient_persona.get('name', 'Patient')}
- Age: {request.patient_persona.get('age', 'Unknown')}
- Primary Condition: {request.patient_persona.get('primaryCondition', 'General consultation')}
- Current Symptoms: {', '.join(request.patient_persona.get('currentSymptoms', []))}
- Medical History: {', '.join(request.patient_persona.get('medicalHistory', []))}
- Emotional State: {request.patient_persona.get('emotionalState', 'calm')}
- Communication Style: {request.patient_persona.get('communicationStyle', 'direct')}
"""
        
        conversation_context = ""
        if request.conversation_history:
            conversation_context = "\n".join([
                f"{msg['speaker']}: {msg['message']}" 
                for msg in request.conversation_history[-5:]  # Last 5 messages
            ])
        
        medical_prompt = f"""
You are simulating a patient in a medical {request.scenario_type} with a {request.healthcare_professional}.
This is a {request.difficulty_level} level scenario for OET training.

{persona_context}

Previous Conversation:
{conversation_context}

Healthcare Professional just said: "{request.patient_message}"

Respond as the patient would, staying in character. Be realistic, appropriate, and helpful for OET training.
Keep your response concise (1-3 sentences) and natural.

Patient Response:"""
        
        generation_request = GenerationRequest(
            prompt=medical_prompt,
            max_tokens=150,
            temperature=0.8,
            top_p=0.9,
            stop_sequences=["Healthcare Professional:", "Doctor:", "Nurse:"],
        )
        
        with measure_performance("medical_conversation") as perf:
            response = await llm_manager.generate_text(generation_request)
            
            return {
                "patient_response": response.text.strip(),
                "model_used": response.model_used,
                "generation_time": response.generation_time,
                "scenario_metadata": {
                    "healthcare_professional": request.healthcare_professional,
                    "scenario_type": request.scenario_type,
                    "difficulty_level": request.difficulty_level
                },
                "performance": perf.get_metrics()
            }
    
    except Exception as e:
        logger.error(f"Medical conversation generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Medical conversation failed: {str(e)}")

@router.post("/embeddings", response_model=EmbeddingResponse)
async def generate_embeddings(
    request: EmbeddingRequest,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Generate embeddings for text"""
    try:
        with measure_performance("embedding_generation") as perf:
            embeddings = await llm_manager.get_embedding(
                text=request.text,
                model_name=request.model_name
            )
            
            return EmbeddingResponse(
                embeddings=embeddings,
                model_used=request.model_name or "default",
                dimension=len(embeddings),
                processing_time=perf.get_metrics()["duration"]
            )
    
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@router.get("/models")
async def list_models(llm_manager: LLMManager = Depends(get_llm_manager)):
    """List available and loaded models"""
    try:
        models_status = await llm_manager.get_models_status()
        return models_status
    
    except Exception as e:
        logger.error(f"Model listing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Model listing failed: {str(e)}")

@router.post("/models/{model_name}/load")
async def load_model(
    model_name: str,
    model_type: ModelType = ModelType.LLM,
    background_tasks: BackgroundTasks = None,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Load a specific model"""
    try:
        if background_tasks:
            background_tasks.add_task(
                llm_manager.load_model,
                model_name=model_name,
                model_type=model_type
            )
            return {"message": f"Loading {model_name} in background", "status": "started"}
        else:
            success = await llm_manager.load_model(model_name, model_type)
            if success:
                return {"message": f"Model {model_name} loaded successfully", "status": "loaded"}
            else:
                raise HTTPException(status_code=500, detail=f"Failed to load model {model_name}")
    
    except Exception as e:
        logger.error(f"Model loading failed: {e}")
        raise HTTPException(status_code=500, detail=f"Model loading failed: {str(e)}")

@router.delete("/models/{model_name}")
async def unload_model(
    model_name: str,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Unload a specific model"""
    try:
        success = await llm_manager.unload_model(model_name)
        if success:
            return {"message": f"Model {model_name} unloaded successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
    
    except Exception as e:
        logger.error(f"Model unloading failed: {e}")
        raise HTTPException(status_code=500, detail=f"Model unloading failed: {str(e)}")

@router.get("/performance")
async def get_performance_metrics(llm_manager: LLMManager = Depends(get_llm_manager)):
    """Get LLM performance metrics"""
    try:
        models_info = await llm_manager.get_loaded_models_info()
        gpu_info = await llm_manager.get_gpu_memory_info()
        
        metrics = {
            "models": models_info,
            "gpu": gpu_info,
            "system": {
                "device": llm_manager.device,
                "gpu_available": llm_manager.gpu_available,
            }
        }
        
        return metrics
    
    except Exception as e:
        logger.error(f"Performance metrics failed: {e}")
        raise HTTPException(status_code=500, detail=f"Performance metrics failed: {str(e)}")

@router.post("/benchmark")
async def benchmark_model(
    model_name: Optional[str] = None,
    test_prompts: List[str] = None,
    llm_manager: LLMManager = Depends(get_llm_manager)
):
    """Benchmark model performance"""
    try:
        if test_prompts is None:
            test_prompts = [
                "Hello, how are you?",
                "What are the symptoms of hypertension?",
                "Explain the procedure for taking blood pressure.",
            ]
        
        results = []
        for prompt in test_prompts:
            generation_request = GenerationRequest(
                prompt=prompt,
                model_name=model_name,
                max_tokens=100,
                temperature=0.7
            )
            
            response = await llm_manager.generate_text(generation_request)
            results.append({
                "prompt": prompt,
                "response_length": len(response.text),
                "generation_time": response.generation_time,
                "tokens_generated": response.tokens_generated,
                "tokens_per_second": response.tokens_generated / response.generation_time if response.generation_time > 0 else 0
            })
        
        # Calculate aggregate metrics
        avg_time = sum(r["generation_time"] for r in results) / len(results)
        avg_tokens_per_sec = sum(r["tokens_per_second"] for r in results) / len(results)
        
        return {
            "model_name": model_name or "default",
            "test_count": len(test_prompts),
            "results": results,
            "summary": {
                "average_generation_time": avg_time,
                "average_tokens_per_second": avg_tokens_per_sec,
                "total_test_time": sum(r["generation_time"] for r in results)
            }
        }
    
    except Exception as e:
        logger.error(f"Model benchmarking failed: {e}")
        raise HTTPException(status_code=500, detail=f"Benchmarking failed: {str(e)}")