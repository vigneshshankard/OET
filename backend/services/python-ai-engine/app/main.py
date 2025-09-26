"""
FastAPI Application Entry Point
OET Python AI Engine for Advanced ML Operations and Local LLM Management
"""

import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any
import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime
import time

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_llm_manager, initialize_services, cleanup_services
from app.models.llm_manager import LLMManager
from app.api.v1 import evaluation, safety, analytics, models
from app.utils.monitoring import setup_monitoring

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    try:
        logger.info("🚀 Starting OET Python AI Engine...")
        await initialize_services()
        setup_monitoring()
        logger.info("✅ OET Python AI Engine started successfully!")
        yield
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        raise
    finally:
        logger.info("🔄 Shutting down OET Python AI Engine...")
        await cleanup_services()
        logger.info("✅ Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="OET Python AI Engine",
    description="Advanced AI processing service for OET training platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add request timing middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include API routers
app.include_router(evaluation.router, prefix="/api/v1/evaluation", tags=["Evaluation"])
app.include_router(safety.router, prefix="/api/v1/safety", tags=["Safety"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Model Management"])

# Health and monitoring endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "OET AI Engine",
        "version": "1.0.0", 
        "status": "operational",
        "description": "Python AI Service for Advanced Language Processing and Local LLM Management"
    }

@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "oet-python-ai-engine", 
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check"""
    try:
        return {
            "ready": True,
            "service": "oet-python-ai-engine",
            "status": "ready"
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

@app.get("/info")
async def get_service_info():
    """Get comprehensive service information"""
    return {
        "service_name": "OET Python AI Engine",
        "version": "1.0.0",
        "description": "Advanced AI processing for OET training",
        "capabilities": ["llm_inference", "conversation_evaluation", "safety_validation", "analytics"],
        "supported_models": ["llama", "mistral", "medical_llms", "bert_variants"],
        "environment": settings.ENVIRONMENT,
        "features": {
            "gpu_acceleration": settings.USE_GPU,
            "model_quantization": True,
            "batch_processing": True,
            "real_time_inference": True
        },
        "api_version": "v1",
        "documentation": "/docs" if settings.DEBUG else "Contact administrator",
        "status": "operational"
    }

@app.get("/capabilities")
async def get_capabilities():
    """Get AI engine capabilities and features"""
    return {
        "ai_capabilities": {
            "local_llm_inference": {
                "description": "Run large language models locally for privacy and control",
                "supported_models": ["Llama 2", "Mistral", "Medical LLMs"],
                "features": ["Conversation", "Text Generation", "Question Answering"]
            },
            "conversation_evaluation": {
                "description": "Evaluate conversation quality and provide detailed feedback",
                "metrics": ["Communication Skills", "Medical Accuracy", "Professionalism"],
                "output": "Structured feedback with scores and improvement suggestions"
            },
            "safety_validation": {
                "description": "Ensure AI responses meet safety and ethical standards",
                "checks": ["Content Safety", "Medical Accuracy", "Cultural Sensitivity"],
                "guardrails": "Multi-layer validation system"
            },
            "analytics_processing": {
                "description": "Generate insights from training data and performance metrics",
                "features": ["Learning Analytics", "Performance Trends", "Predictive Insights"],
                "ai_powered": "Machine learning based analysis"
            },
            "model_management": {
                "description": "Load, optimize, and manage AI models dynamically",
                "features": ["Dynamic Loading", "Quantization", "Performance Optimization"],
                "resource_management": "Intelligent memory and GPU utilization"
            }
        },
        "technical_specifications": {
            "supported_model_formats": ["PyTorch", "Hugging Face Transformers", "ONNX"],
            "quantization_options": ["4-bit", "8-bit", "16-bit", "Full Precision"],
            "optimization_techniques": ["Model Pruning", "Distillation", "Compilation"],
            "hardware_acceleration": ["CUDA", "CPU Inference", "Mixed Precision"],
            "api_features": ["REST API", "Async Processing", "Batch Inference", "Streaming"]
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )