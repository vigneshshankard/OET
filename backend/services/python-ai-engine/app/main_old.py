"""
FastAPI Application Entry Point
OET Python AI Engine for Advanced ML Operations and Local LLM Management
"""

import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime
import time

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_llm_manager, initialize_services, cleanup_services
from app.models.llm_manager import LLMManager
from app.api.v1 import llm, evaluation, safety, analytics, models
from app.utils.monitoring import setup_monitoring

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global LLM manager instance
llm_manager: LLMManager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan management
    Handles startup and shutdown of AI services
    """
    global llm_manager
    
    try:
        logger.info("🚀 Starting OET Python AI Engine...")
        
        # Get configuration
        settings = get_settings()
        
        # Initialize LLM Manager
        logger.info("🤖 Initializing LLM Manager...")
        llm_manager = LLMManager(
            model_cache_dir=settings.MODEL_CACHE_DIR,
            enable_gpu=settings.USE_GPU,
            max_memory_gb=settings.MAX_MEMORY_GB,
            log_level=settings.LOG_LEVEL
        )
        
        # Initialize models based on configuration
        if settings.PRELOAD_MODELS:
            logger.info("⚡ Pre-loading default models...")
            await llm_manager.preload_default_models()
        
        logger.info("✅ OET Python AI Engine started successfully!")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        raise
    finally:
        # Cleanup
        logger.info("🔄 Shutting down OET Python AI Engine...")
        if llm_manager:
            await llm_manager.cleanup()
        logger.info("✅ Shutdown complete")

def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    settings = get_settings()
    
    # Create FastAPI app with lifespan
    app = FastAPI(
        title="OET Python AI Engine",
        description="""
        Advanced AI processing service for OET (Occupational English Test) training platform.
        
        **Key Capabilities:**
        - 🤖 Local LLM inference (Llama, Mistral, Medical models)
        - 📊 Conversation evaluation and scoring
        - 🛡️ AI safety and guardrails
        - 📈 Learning analytics and insights
        - 🔧 Dynamic model management
        
        **Features:**
        - GPU acceleration support
        - Model quantization for efficiency
        - Real-time conversation processing
        - Comprehensive performance monitoring
        """,
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
    
    # Add logging middleware
    @app.middleware("http") 
    async def log_requests(request, call_next):
        logger.info(f"📝 {request.method} {request.url.path}")
        response = await call_next(request)
        logger.info(f"✅ {response.status_code} - {request.url.path}")
        return response

    # Include API routers with proper prefixes
    app.include_router(llm.router, prefix="/api/v1/llm", tags=["LLM Operations"])
    app.include_router(evaluation.router, prefix="/api/v1/evaluation", tags=["Evaluation"])
    app.include_router(safety.router, prefix="/api/v1/safety", tags=["Safety"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
    app.include_router(models.router, prefix="/api/v1/models", tags=["Model Management"])
    
    # Health and monitoring endpoints
    @app.get("/health")
    async def health_check():
        """Basic health check endpoint"""
        return {
            "status": "healthy",
            "service": "oet-python-ai-engine", 
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime": "unknown"  # Could implement uptime tracking
        }
    
    @app.get("/ready")
    async def readiness_check(
        llm_manager: LLMManager = Depends(get_llm_manager)
    ):
        """Readiness check - indicates if service is ready to handle requests"""
        try:
            is_ready = await llm_manager.health_check() if llm_manager else False
            
            return {
                "ready": is_ready,
                "llm_manager_status": "healthy" if is_ready else "unhealthy",
                "models_loaded": len(llm_manager.loaded_models) if llm_manager else 0,
                "gpu_available": llm_manager.device != "cpu" if llm_manager else False
            }
        except Exception as e:
            logger.error(f"Readiness check failed: {e}")
            raise HTTPException(status_code=503, detail="Service not ready")
    
    @app.get("/metrics")
    async def get_metrics(
        llm_manager: LLMManager = Depends(get_llm_manager)
    ):
        """Get service metrics and performance data"""
        try:
            metrics = {
                "requests_total": "N/A",  # Could implement request counting
                "models_loaded": len(llm_manager.loaded_models) if llm_manager else 0,
                "memory_usage": "N/A",    # Could implement memory monitoring
                "gpu_utilization": "N/A", # Could implement GPU monitoring
                "average_response_time": "N/A"
            }
            return metrics
        except Exception as e:
            logger.error(f"Metrics collection failed: {e}")
            return {"error": "Failed to collect metrics"}
    
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
    
    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        logger.error(f"❌ Unhandled exception: {exc}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error occurred"}
        )
    
    return app

import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime
import time

from app.core.config import get_settings
from app.core.dependencies import get_current_user, get_llm_manager, initialize_services, cleanup_services
from app.models.llm_manager import LLMManager
from app.api.v1 import llm, evaluation, safety, analytics, models
from app.utils.monitoring import setup_monitoring
from app.utils.monitoring import MetricsCollector, HealthChecker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
llm_manager: LLMManager = None
metrics_collector: MetricsCollector = None
health_checker: HealthChecker = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global llm_manager, metrics_collector, health_checker
    
    try:
        logger.info("🚀 Starting OET Python AI Engine...")
        
        # Initialize core services
        settings = get_settings()
        
        # Initialize LLM Manager
        logger.info("📚 Initializing LLM Manager...")
        llm_manager = LLMManager(settings)
        await llm_manager.initialize()
        
        # Initialize monitoring
        logger.info("📊 Initializing monitoring services...")
        metrics_collector = MetricsCollector()
        health_checker = HealthChecker(llm_manager)
        
        # Pre-load default models if configured
        if settings.PRELOAD_MODELS:
            logger.info("⚡ Pre-loading default models...")
            await llm_manager.preload_default_models()
        
        logger.info("✅ OET Python AI Engine started successfully!")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to start application: {e}")
        raise
    finally:
        # Cleanup
        logger.info("🔄 Shutting down OET Python AI Engine...")
        if llm_manager:
            await llm_manager.cleanup()
        logger.info("✅ Shutdown complete")

def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    settings = get_settings()
    
    app = FastAPI(
        title="OET Python AI Engine",
        description="Advanced AI microservice for medical conversation analysis and local LLM processing",
        version="1.0.0",
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan
    )
    
    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Add request/response middleware for metrics
    @app.middleware("http")
    async def metrics_middleware(request, call_next):
        start_time = datetime.utcnow()
        
        try:
            response = await call_next(request)
            
            # Collect metrics
            if metrics_collector:
                duration = (datetime.utcnow() - start_time).total_seconds()
                await metrics_collector.record_request(
                    method=request.method,
                    endpoint=str(request.url.path),
                    status_code=response.status_code,
                    duration=duration
                )
            
            return response
            
        except Exception as e:
            # Record error metrics
            if metrics_collector:
                duration = (datetime.utcnow() - start_time).total_seconds()
                await metrics_collector.record_error(
                    method=request.method,
                    endpoint=str(request.url.path),
                    error_type=type(e).__name__,
                    duration=duration
                )
            raise
    
    # Include routers
# Include API routers with proper prefixes
app.include_router(llm.router, prefix="/api/v1/llm", tags=["LLM Operations"])
app.include_router(evaluation.router, prefix="/api/v1/evaluation", tags=["Evaluation"])
app.include_router(safety.router, prefix="/api/v1/safety", tags=["Safety"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Model Management"])    # Health and monitoring endpoints
    @app.get("/health")
    async def health_check():
        """Basic health check"""
        try:
            if health_checker:
                health_status = await health_checker.comprehensive_check()
                return JSONResponse(
                    status_code=200 if health_status["overall_healthy"] else 503,
                    content=health_status
                )
            else:
                return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return JSONResponse(
                status_code=503,
                content={"status": "unhealthy", "error": str(e)}
            )
    
    @app.get("/ready")
    async def readiness_check():
        """Readiness check for Kubernetes"""
        try:
            if llm_manager and await llm_manager.is_ready():
                return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
            else:
                return JSONResponse(
                    status_code=503,
                    content={"status": "not_ready", "message": "Models not loaded"}
                )
        except Exception as e:
            return JSONResponse(
                status_code=503,
                content={"status": "not_ready", "error": str(e)}
            )
    
    @app.get("/metrics")
    async def get_metrics():
        """Prometheus-style metrics endpoint"""
        try:
            if metrics_collector:
                metrics = await metrics_collector.get_prometheus_metrics()
                return JSONResponse(content=metrics)
            else:
                return {"message": "Metrics not available"}
        except Exception as e:
            logger.error(f"Metrics endpoint failed: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": "Metrics collection failed"}
            )
    
    @app.get("/info")
    async def get_system_info():
        """System information endpoint"""
        try:
            info = {
                "service": "OET Python AI Engine",
                "version": "1.0.0",
                "timestamp": datetime.utcnow().isoformat(),
                "environment": settings.ENVIRONMENT,
                "python_version": f"{__import__('sys').version_info.major}.{__import__('sys').version_info.minor}",
            }
            
            if llm_manager:
                info["models"] = await llm_manager.get_loaded_models_info()
                info["gpu_available"] = llm_manager.gpu_available
                info["gpu_memory"] = await llm_manager.get_gpu_memory_info()
            
            return info
            
        except Exception as e:
            logger.error(f"System info endpoint failed: {e}")
            return JSONResponse(
                status_code=500,
                content={"error": "System info collection failed"}
            )
    
    # Model management endpoints
    @app.post("/api/v1/models/load")
    async def load_model(
        model_request: Dict[str, Any],
        background_tasks: BackgroundTasks,
        current_user=Depends(get_current_user) if settings.REQUIRE_AUTH else None
    ):
        """Load a new model"""
        try:
            model_name = model_request.get("model_name")
            model_type = model_request.get("model_type", "llm")
            
            if not model_name:
                raise HTTPException(status_code=400, detail="Model name required")
            
            if llm_manager:
                # Load model in background
                background_tasks.add_task(
                    llm_manager.load_model,
                    model_name=model_name,
                    model_type=model_type
                )
                
                return {
                    "message": f"Loading model {model_name}",
                    "status": "started",
                    "model_name": model_name
                }
            else:
                raise HTTPException(status_code=503, detail="LLM Manager not available")
                
        except Exception as e:
            logger.error(f"Model loading failed: {e}")
            raise HTTPException(status_code=500, detail=f"Model loading failed: {str(e)}")
    
    @app.delete("/api/v1/models/{model_name}")
    async def unload_model(
        model_name: str,
        current_user=Depends(get_current_user) if settings.REQUIRE_AUTH else None
    ):
        """Unload a model"""
        try:
            if llm_manager:
                success = await llm_manager.unload_model(model_name)
                if success:
                    return {"message": f"Model {model_name} unloaded successfully"}
                else:
                    raise HTTPException(status_code=404, detail="Model not found")
            else:
                raise HTTPException(status_code=503, detail="LLM Manager not available")
                
        except Exception as e:
            logger.error(f"Model unloading failed: {e}")
            raise HTTPException(status_code=500, detail=f"Model unloading failed: {str(e)}")
    
    @app.get("/api/v1/models")
    async def list_models(
        current_user=Depends(get_current_user) if settings.REQUIRE_AUTH else None
    ):
        """List available and loaded models"""
        try:
            if llm_manager:
                models_info = await llm_manager.get_models_status()
                return models_info
            else:
                raise HTTPException(status_code=503, detail="LLM Manager not available")
                
        except Exception as e:
            logger.error(f"Model listing failed: {e}")
            raise HTTPException(status_code=500, detail=f"Model listing failed: {str(e)}")
    
    # Exception handlers
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        """Global exception handler"""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "type": type(exc).__name__}
        )
    
    return app

# Create the app instance
app = create_app()

def main():
    """Main entry point for development server"""
    settings = get_settings()
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        use_colors=True,
    )

if __name__ == "__main__":
    main()