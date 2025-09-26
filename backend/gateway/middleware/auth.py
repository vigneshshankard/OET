"""
Authentication middleware for JWT token validation
Based on api-specification.md JWT format
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import structlog
from jose import jwt, JWTError
from config.settings import get_settings

logger = structlog.get_logger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """JWT Authentication middleware"""
    
    # Public endpoints that don't require authentication
    PUBLIC_PATHS = {
        "/",
        "/docs",
        "/redoc", 
        "/openapi.json",
        "/health",
        "/health/ready",
        "/health/live",
        "/v1/auth/register",
        "/v1/auth/login",
        "/v1/auth/forgot-password",
        "/v1/content/scenarios",
        "/v1/content/progress",
        "/v1/content/dialogues",
        "/v1/auth/reset-password",
        "/v1/ai/health",  # Temporary for testing
        "/v1/ai/capabilities",  # Temporary for testing
    }
    
    def __init__(self, app, settings=None):
        super().__init__(app)
        self.settings = settings or get_settings()
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)
        
        # Skip authentication for health checks
        if request.url.path.startswith("/health"):
            return await call_next(request)
        
        # Temporarily skip authentication for content endpoints (for frontend development)
        if request.url.path.startswith("/v1/content"):
            return await call_next(request)
        
        # Extract JWT token
        token = self._extract_token(request)
        if not token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Missing authentication token"}
            )
        
        # Validate JWT token
        try:
            payload = self._validate_token(token)
            # Add user info to request state
            request.state.user = {
                "id": payload.get("sub"),
                "role": payload.get("role", "user"),
                "plan": payload.get("plan", "free"),
            }
            
            logger.info(
                "User authenticated",
                user_id=request.state.user["id"],
                role=request.state.user["role"],
                path=request.url.path
            )
            
        except JWTError as e:
            logger.warning("JWT validation failed", error=str(e), path=request.url.path)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Invalid authentication token"}
            )
        except Exception as e:
            logger.error("Authentication error", error=str(e), path=request.url.path)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Authentication service error"}
            )
        
        response = await call_next(request)
        return response
    
    def _extract_token(self, request: Request) -> str | None:
        """Extract JWT token from Authorization header"""
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None
        
        if not auth_header.startswith("Bearer "):
            return None
        
        return auth_header[7:]  # Remove "Bearer " prefix
    
    def _validate_token(self, token: str) -> dict:
        """Validate JWT token and return payload"""
        payload = jwt.decode(
            token,
            self.settings.jwt_secret,
            algorithms=[self.settings.jwt_algorithm],
            options={"verify_aud": False}  # Skip audience verification for now
        )
        
        # Validate required fields
        if not payload.get("sub"):
            raise JWTError("Missing subject in token")
        
        return payload