"""
Authentication routes - Proxy to User Service
Based on api-specification.md authentication endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
import structlog
import httpx
from config.settings import get_settings

logger = structlog.get_logger(__name__)

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    profession: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str


@router.post("/register")
async def register(request: RegisterRequest, settings: dict = Depends(get_settings)):
    """
    Register a new user account
    Proxies request to User Service
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_service_url}/auth/register",
                json=request.dict(),
                timeout=30.0
            )
            
            if response.status_code == 201:
                return response.json()
            else:
                logger.warning(
                    "User registration failed",
                    status_code=response.status_code,
                    email=request.email
                )
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("error", "Registration failed")
                )
                
    except httpx.TimeoutException:
        logger.error("User service timeout during registration")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable"
        )
    except httpx.RequestError as e:
        logger.error("User service connection error", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable"
        )


@router.post("/login")
async def login(request: LoginRequest, settings: dict = Depends(get_settings)):
    """
    Authenticate user and return JWT tokens
    Proxies request to User Service
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_service_url}/auth/login",
                json=request.dict(),
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(
                    "User login failed",
                    status_code=response.status_code,
                    email=request.email
                )
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("error", "Authentication failed")
                )
                
    except httpx.TimeoutException:
        logger.error("User service timeout during login")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable"
        )
    except httpx.RequestError as e:
        logger.error("User service connection error", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable"
        )


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, settings: dict = Depends(get_settings)):
    """
    Initiate password reset process
    Proxies request to User Service
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_service_url}/auth/forgot-password",
                json=request.dict(),
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(
                    "Password reset request failed",
                    status_code=response.status_code,
                    email=request.email
                )
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("error", "Password reset failed")
                )
                
    except httpx.TimeoutException:
        logger.error("User service timeout during password reset")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable"
        )
    except httpx.RequestError as e:
        logger.error("User service connection error", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable"
        )


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, settings: dict = Depends(get_settings)):
    """
    Reset password using reset token
    Proxies request to User Service
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_service_url}/auth/reset-password",
                json=request.dict(),
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(
                    "Password reset failed",
                    status_code=response.status_code
                )
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("error", "Password reset failed")
                )
                
    except httpx.TimeoutException:
        logger.error("User service timeout during password reset")
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable"
        )
    except httpx.RequestError as e:
        logger.error("User service connection error", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable"
        )