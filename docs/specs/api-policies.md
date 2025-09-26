# API Policies

Version: 1.0  
Last Updated: September 21, 2025

## Overview

This document defines essential API policies for the OET Praxis platform, ensuring proper security and resource utilization.

## Rate Limiting

1. Public Endpoints
   - Unauthenticated: 60 requests/hour
   - Authenticated: 1000 requests/hour
   - Tracking: By IP and user ID

2. Practice Session Endpoints
   - Audio upload: 120 requests/minute
   - AI responses: 60 requests/minute
   - Per active session only

3. Admin Endpoints
   - 2000 requests/hour
   - Tracked by admin ID

## CORS Policy

1. Allowed Origins
   - Web app: oetpraxis.com
   - Development: localhost:3000
   - Staging: staging.oetpraxis.com

2. Allowed Methods
   - GET, POST, PUT, DELETE
   - OPTIONS (preflight)

3. Allowed Headers
   - Authorization
   - Content-Type
   - X-Requested-With

4. Exposed Headers
   - Content-Length
   - X-RateLimit-Remaining

## Implementation Notes

- Use standard middleware
- Log rate limit violations
- Return 429 status for limits
- Include rate limit headers