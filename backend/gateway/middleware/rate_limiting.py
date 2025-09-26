"""
Rate limiting middleware
Based on api-policies.md specification
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import structlog
import redis.asyncio as redis
import time
from typing import Dict, Tuple
from config.settings import get_settings

logger = structlog.get_logger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis"""
    
    def __init__(self, app, settings=None):
        super().__init__(app)
        self.settings = settings or get_settings()
        self.redis_client = None
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(self.settings.redis_url)
        except Exception as e:
            logger.warning("Redis not available for rate limiting", error=str(e))
            self.redis_client = None
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting if Redis is not available
        if not self.redis_client:
            return await call_next(request)
        
        # Skip rate limiting for health checks
        if request.url.path.startswith("/health"):
            return await call_next(request)
        
        # Get client identifier (IP or user ID if authenticated)
        client_id = self._get_client_id(request)
        
        # Check rate limit
        allowed, reset_time = await self._check_rate_limit(client_id)
        
        if not allowed:
            logger.warning(
                "Rate limit exceeded",
                client_id=client_id,
                path=request.url.path
            )
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "retry_after": reset_time
                },
                headers={
                    "Retry-After": str(reset_time),
                    "X-RateLimit-Limit": str(self.settings.rate_limit_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + reset_time))
                }
            )
        
        response = await call_next(request)
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier"""
        # Use user ID if authenticated, otherwise use IP address
        if hasattr(request.state, "user") and request.state.user:
            return f"user:{request.state.user['id']}"
        
        # Get client IP (considering proxy headers)
        client_ip = (
            request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or request.headers.get("X-Real-IP")
            or request.client.host
        )
        return f"ip:{client_ip}"
    
    async def _check_rate_limit(self, client_id: str) -> Tuple[bool, int]:
        """Check if client is within rate limits"""
        try:
            window = self.settings.rate_limit_window
            limit = self.settings.rate_limit_requests
            
            key = f"rate_limit:{client_id}"
            current_time = int(time.time())
            window_start = current_time - window
            
            # Use Redis sorted set to track requests in time window
            pipe = self.redis_client.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Count current requests
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiry on key
            pipe.expire(key, window)
            
            results = await pipe.execute()
            current_requests = results[1]
            
            if current_requests >= limit:
                # Calculate reset time
                oldest_request = await self.redis_client.zrange(key, 0, 0, withscores=True)
                if oldest_request:
                    reset_time = int(oldest_request[0][1]) + window - current_time
                else:
                    reset_time = window
                
                return False, max(reset_time, 1)
            
            return True, 0
            
        except Exception as e:
            logger.error("Rate limiting error", error=str(e))
            # Allow request if rate limiting fails
            return True, 0