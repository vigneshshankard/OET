"""
OET Praxis API Gateway

FastAPI-based gateway that handles:
- Authentication and authorization
- Request routing to microservices
- Rate limiting and validation
- API versioning
- Request/response logging
"""

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog
import time
from contextlib import asynccontextmanager

from config.settings import get_settings
from middleware.auth import AuthMiddleware
from middleware.rate_limiting import RateLimitMiddleware
from middleware.logging import RequestLoggingMiddleware
from routes import auth, users, sessions, content, billing, health, ai
from core.exceptions import setup_exception_handlers
from core.metrics import setup_metrics
from core.database import initialize_database, close_database


# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting OET Praxis API Gateway")
    
    # Setup metrics collection
    setup_metrics()
    
    # Initialize database
    await initialize_database()
    
    yield
    
    # Close database connections
    await close_database()
    logger.info("Shutting down OET Praxis API Gateway")


def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    settings = get_settings()
    
    app = FastAPI(
        title="OET Praxis API",
        description="API Gateway for OET Praxis Platform",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan
    )
    
    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Temporarily allow all origins for debugging
        allow_credentials=False,  # Can't use credentials with allow_origins=["*"]
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts
    )
    
    # Custom middleware
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(AuthMiddleware)
    
    # Setup exception handlers
    setup_exception_handlers(app)
    
    # Include API routes
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(auth.router, prefix="/v1/auth", tags=["authentication"])
    app.include_router(users.router, prefix="/v1/users", tags=["users"])
    app.include_router(sessions.router, prefix="/v1/sessions", tags=["sessions"])
    app.include_router(content.router, prefix="/v1/content", tags=["content"])
    app.include_router(billing.router, prefix="/v1/billing", tags=["billing"])
    app.include_router(ai.router, prefix="/v1/ai", tags=["ai"])
    
    # Add new comprehensive session management routes
    from routes import session_management
    app.include_router(session_management.router, prefix="/v1", tags=["session-management"])
    
    @app.get("/")
    async def root():
        return {
            "service": "OET Praxis API Gateway",
            "version": "1.0.0",
            "status": "running"
        }
    
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    settings = get_settings()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
        log_config=None  # Use structlog instead
    )