"""
Configuration settings for the API Gateway
Based on environment-configuration.md specification
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application settings
    debug: bool = False
    port: int = 8000
    environment: str = "development"
    
    # Security settings
    secret_key: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 15
    jwt_refresh_expiry_days: int = 7
    
    # CORS settings
    allowed_origins: List[str] = ["http://localhost:3000", "https://app.oetpraxis.com"]
    allowed_hosts: List[str] = ["*"]
    
    # Database settings
    database_url: str
    redis_url: str = "redis://localhost:6379/0"
    
    # Microservice URLs
    user_service_url: str = "http://localhost:3001"
    session_service_url: str = "http://localhost:3002"
    content_service_url: str = "http://localhost:3003"
    billing_service_url: str = "http://localhost:3004"
    webrtc_server_url: str = "http://localhost:3005"
    ai_service_url: str = "http://localhost:3006"
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60
    
    # Monitoring
    enable_metrics: bool = True
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


_settings = None


def get_settings() -> Settings:
    """Get cached settings instance"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings