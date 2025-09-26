"""
Exception handlers for the API Gateway
Based on error-handling.md specification
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import structlog
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = structlog.get_logger(__name__)


class APIException(Exception):
    """Base API exception class"""
    
    def __init__(self, message: str, status_code: int = 500, error_code: str = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "INTERNAL_ERROR"
        super().__init__(message)


class ValidationException(APIException):
    """Validation error exception"""
    
    def __init__(self, message: str, details: list = None):
        super().__init__(message, 400, "VALIDATION_ERROR")
        self.details = details or []


class AuthenticationException(APIException):
    """Authentication error exception"""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, 401, "AUTHENTICATION_ERROR")


class AuthorizationException(APIException):
    """Authorization error exception"""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, 403, "AUTHORIZATION_ERROR")


class ResourceNotFoundException(APIException):
    """Resource not found exception"""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, 404, "RESOURCE_NOT_FOUND")


class ServiceUnavailableException(APIException):
    """Service unavailable exception"""
    
    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(message, 503, "SERVICE_UNAVAILABLE")


def setup_exception_handlers(app: FastAPI):
    """Setup global exception handlers"""
    
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        """Handle custom API exceptions"""
        logger.error(
            "API exception",
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
            path=request.url.path,
            method=request.method,
            request_id=getattr(request.state, "request_id", None)
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                    "details": getattr(exc, "details", None)
                },
                "request_id": getattr(request.state, "request_id", None)
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors"""
        details = []
        for error in exc.errors():
            details.append({
                "field": ".".join(str(x) for x in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })
        
        logger.warning(
            "Validation error",
            details=details,
            path=request.url.path,
            method=request.method,
            request_id=getattr(request.state, "request_id", None)
        )
        
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": details
                },
                "request_id": getattr(request.state, "request_id", None)
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        """Handle HTTP exceptions"""
        logger.warning(
            "HTTP exception",
            status_code=exc.status_code,
            detail=exc.detail,
            path=request.url.path,
            method=request.method,
            request_id=getattr(request.state, "request_id", None)
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail
                },
                "request_id": getattr(request.state, "request_id", None)
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected exceptions"""
        logger.error(
            "Unexpected exception",
            error=str(exc),
            error_type=type(exc).__name__,
            path=request.url.path,
            method=request.method,
            request_id=getattr(request.state, "request_id", None),
            exc_info=True
        )
        
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred"
                },
                "request_id": getattr(request.state, "request_id", None)
            }
        )