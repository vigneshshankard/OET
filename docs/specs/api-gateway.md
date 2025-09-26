# API Gateway Specification

Version: 1.0  
Last Updated: September 21, 2025

## Overview

This document specifies the API Gateway requirements for the OET Praxis platform, focusing on routing, middleware, and gateway-specific functionality.

## 1. Gateway Middleware Stack

### 1.1 Authentication Middleware
- JWT validation
- Token extraction from:
  - Authorization header
  - Query parameters (WebSocket connections only)
- Token verification using RS256

### 1.2 Rate Limiting
Extends existing rate limits from api-policies.md:
```json
{
  "global_rate_limit": {
    "window_seconds": 60,
    "max_requests": 1000
  },
  "burst_limit": {
    "window_seconds": 1,
    "max_requests": 10
  }
}
```

### 1.3 Logging Middleware
Standardized log format:
```json
{
  "timestamp": "ISO8601",
  "request_id": "uuid",
  "service": "string",
  "method": "HTTP_METHOD",
  "path": "string",
  "status_code": "number",
  "duration_ms": "number",
  "user_id": "uuid?",
  "ip": "string"
}
```

## 2. Service Routing

### 2.1 Route Mappings
Based on existing service endpoints from api-specification.md:

| Path Pattern | Service |
|--------------|---------|
| /auth/*      | User Service |
| /users/*     | User Service |
| /sessions/*  | Session Service |
| /scenarios/* | Content Service |
| /admin/*     | Admin Service |

### 2.2 Load Balancing
- Algorithm: Round Robin
- Health Check Interval: 30 seconds
- Timeout: 5 seconds
- Circuit Breaker: Match service-resilience.md specifications

## 3. Error Handling

Extends error-handling.md for gateway-specific scenarios:

### 3.1 Gateway Errors
```json
{
  "error": {
    "code": "GATEWAY_ERROR_CODE",
    "message": "User-friendly message",
    "details": {
      "service": "affected_service",
      "retry_after": "number?"
    }
  }
}
```

### 3.2 Error Codes
- GATEWAY_001: Service Unavailable
- GATEWAY_002: Rate Limit Exceeded
- GATEWAY_003: Invalid Token
- GATEWAY_004: Route Not Found

## 4. Performance Requirements

### 4.1 Latency Targets
- Gateway Processing Time: < 50ms
- Total Added Latency: < 100ms

### 4.2 Throughput
- Sustained: 1000 RPS
- Peak: 2000 RPS

## 5. Security

### 5.1 TLS Configuration
- Minimum Version: 1.2
- Preferred Ciphers: TLS_AES_128_GCM_SHA256
- HSTS: Enabled

### 5.2 Request Validation
- Max Body Size: 10MB
- Max Header Size: 8KB
- URL Length: 2048 characters

## Implementation Notes

1. Use existing FastAPI gateway
2. Implement middleware in order:
   - Logging
   - Authentication
   - Rate Limiting
3. Use Redis for rate limiting
4. Log all routing decisions