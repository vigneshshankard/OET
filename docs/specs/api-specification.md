# API Specification

Version: 1.0  
Last Updated: September 21, 2025

## Overview

This document specifies the complete API interface for the OET Praxis platform. All endpoints are REST-based unless specifically noted for WebSocket connections. The API uses JWT for authentication and follows OpenAPI 3.0 specifications.

## Base URLs

- Production: `https://api.oetpraxis.com/v1`
- Staging: `https://api.staging.oetpraxis.com/v1`
- Development: `https://api.dev.oetpraxis.com/v1`

## Authentication

### JWT Format
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "role": "user|admin",
    "plan": "free|paid",
    "exp": 1600000000
  }
}
```

### Authentication Endpoints

#### POST /auth/register
Creates a new user account.

Request:
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "profession": "string"
}
```

Response:
```json
{
  "userId": "uuid",
  "email": "string",
  "verificationToken": "string"
}
```

#### POST /auth/verify-email
Verifies user's email address.

Request:
```json
{
  "token": "string"
}
```

Response:
```json
{
  "verified": true,
  "redirectUrl": "string"
}
```

#### POST /auth/login
Authenticates a user.

Request:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600
}
```

#### POST /auth/forgot-password
Initiates the password reset process.

Request:
```json
{
  "email": "string"
}
```

Response:
```json
{
  "message": "string",
  "resetTokenExpiry": "string"
}
```

#### POST /auth/reset-password
Resets the user's password using a valid reset token.

Request:
```json
{
  "token": "string",
  "newPassword": "string"
}
```

Response:
```json
{
  "success": true,
  "message": "string"
}
```

## User Management API

### Profile Management

#### GET /users/me
Retrieves the current user's profile.

Response:
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string",
  "profession": "string",
  "subscription": {
    "plan": "string",
    "status": "string",
    "expiresAt": "string"
  },
  "stats": {
    "sessionsCompleted": 0,
    "averageScore": 0
  }
}
```

#### PATCH /users/me
Updates the current user's profile.

Request:
```json
{
  "fullName": "string",
  "profession": "string"
}
```

Response:
```json
{
  "updated": true,
  "user": {
    "id": "uuid",
    "fullName": "string",
    "profession": "string"
  }
}
```

#### POST /users/me/avatar
Updates the user's profile picture.

Request:
- Content-Type: multipart/form-data
- Field name: avatar
- Accepted formats: image/jpeg, image/png
- Max size: 5MB

Response:
```json
{
  "uploaded": true,
  "avatarUrl": "string",
  "thumbnailUrl": "string"
}
```

#### DELETE /users/me
Requests account deletion.

Request:
```json
{
  "password": "string",
  "reason": "string",
  "confirmation": "string"
}
```

Response:
```json
{
  "scheduled": true,
  "deletionDate": "string",
  "graceUntil": "string",
  "dataRetentionInfo": {
    "retentionPeriod": 0,
    "finalDeletionDate": "string",
    "dataTypes": ["string"]
  }
}
```

## Subscription API

### User Settings

#### GET /users/me/settings
Retrieves the user's settings and preferences.

Response:
```json
{
  "preferences": {
    "language": "string",
    "timezone": "string",
    "theme": "light|dark"
  },
  "notifications": {
    "email": {
      "practiceReminders": boolean,
      "feedbackReports": boolean,
      "newScenarios": boolean
    },
    "inApp": {
      "practiceReminders": boolean,
      "feedbackReady": boolean,
      "systemUpdates": boolean
    }
  },
  "accessibility": {
    "fontSize": "string",
    "highContrast": boolean,
    "screenReader": boolean
  }
}
```

#### PATCH /users/me/settings
Updates the user's settings and preferences.

Request:
```json
{
  "preferences": {
    "language": "string",
    "timezone": "string",
    "theme": "string"
  },
  "notifications": {
    "email": {
      "practiceReminders": boolean,
      "feedbackReports": boolean,
      "newScenarios": boolean
    },
    "inApp": {
      "practiceReminders": boolean,
      "feedbackReady": boolean,
      "systemUpdates": boolean
    }
  },
  "accessibility": {
    "fontSize": "string",
    "highContrast": boolean,
    "screenReader": boolean
  }
}
```

Response:
```json
{
  "updated": true,
  "settings": {
    // Updated settings object
  }
}
```

## Subscription API

#### POST /subscriptions/create
Creates a new subscription.

Request:
```json
{
  "planId": "string",
  "paymentMethodId": "string"
}
```

Response:
```json
{
  "subscriptionId": "string",
  "status": "active",
  "currentPeriodEnd": "string"
}
```

#### GET /subscriptions/plans
Retrieves available subscription plans.

Response:
```json
{
  "plans": [
    {
      "id": "string",
      "name": "string",
      "price": 0,
      "interval": "month|year",
      "features": ["string"]
    }
  ]
}
```

#### PUT /subscriptions/cancel
Cancels the current subscription.

Request:
```json
{
  "reason": "string",
  "feedback": "string"
}
```

Response:
```json
{
  "cancelled": true,
  "effectiveEndDate": "string",
  "remainingAccess": {
    "daysLeft": 0,
    "endDate": "string"
  }
}
```

#### GET /subscriptions/history
Retrieves subscription and billing history.

Query Parameters:
- page: number
- limit: number

Response:
```json
{
  "currentPlan": {
    "id": "string",
    "name": "string",
    "status": "active|cancelled|expired",
    "nextBillingDate": "string",
    "amount": 0
  },
  "transactions": [
    {
      "id": "string",
      "date": "string",
      "amount": 0,
      "description": "string",
      "status": "successful|failed|refunded",
      "invoiceUrl": "string"
    }
  ],
  "pagination": {
    "currentPage": 0,
    "totalPages": 0,
    "totalItems": 0
  }
}
```

## Practice Session API

## Help and Support API

### Help Content

#### GET /help/articles
Retrieves help articles and documentation.

Response:
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "string",
      "category": "string",
      "content": "string",
      "lastUpdated": "string"
    }
  ],
  "categories": ["string"]
}
```

#### GET /help/faqs
Retrieves frequently asked questions.

Response:
```json
{
  "faqs": [
    {
      "id": "uuid",
      "question": "string",
      "answer": "string",
      "category": "string"
    }
  ]
}
```

### Support Tickets

#### POST /support/tickets
Creates a new support ticket.

Request:
```json
{
  "subject": "string",
  "description": "string",
  "priority": "low|medium|high",
  "category": "string",
  "attachments": [
    {
      "name": "string",
      "content": "base64"
    }
  ]
}
```

Response:
```json
{
  "ticketId": "uuid",
  "status": "open",
  "estimatedResponse": "string"
}
```

#### GET /support/tickets
Retrieves user's support tickets.

Response:
```json
{
  "tickets": [
    {
      "id": "uuid",
      "subject": "string",
      "status": "open|in-progress|resolved|closed",
      "createdAt": "string",
      "lastUpdated": "string"
    }
  ]
}
```

#### GET /support/tickets/{ticketId}
Retrieves details of a specific support ticket.

Response:
```json
{
  "id": "uuid",
  "subject": "string",
  "description": "string",
  "status": "string",
  "priority": "string",
  "messages": [
    {
      "id": "uuid",
      "sender": "user|support",
      "message": "string",
      "timestamp": "string",
      "attachments": [
        {
          "name": "string",
          "url": "string"
        }
      ]
    }
  ]
}
```

#### POST /support/tickets/{ticketId}/messages
Adds a message to an existing support ticket.

Request:
```json
{
  "message": "string",
  "attachments": [
    {
      "name": "string",
      "content": "base64"
    }
  ]
}
```

Response:
```json
{
  "messageId": "uuid",
  "timestamp": "string"
}
```

## System Status API

### Health Check

#### GET /system/status
Retrieves the current system status and component health.

Response:
```json
{
  "status": "operational|degraded|maintenance|outage",
  "components": {
    "api": "operational|degraded|down",
    "websocket": "operational|degraded|down",
    "storage": "operational|degraded|down",
    "ai": "operational|degraded|down"
  },
  "performance": {
    "latency": 0,
    "uptime": 0,
    "lastIncident": "string"
  },
  "message": "string"
}
```

#### GET /system/maintenance
Retrieves scheduled maintenance windows and system updates.

Response:
```json
{
  "current": {
    "inMaintenance": boolean,
    "startTime": "string",
    "endTime": "string",
    "affectedServices": ["string"],
    "message": "string"
  },
  "upcoming": [
    {
      "startTime": "string",
      "endTime": "string",
      "type": "routine|emergency|upgrade",
      "affectedServices": ["string"],
      "description": "string"
    }
  ],
  "past": [
    {
      "startTime": "string",
      "endTime": "string",
      "type": "string",
      "summary": "string"
    }
  ]
}
```

## Progress Tracking API

### User Progress

#### GET /progress/overview
Retrieves an overview of user's learning progress with chart data.

Response:
```json
{
  "overallStats": {
    "totalSessions": 0,
    "totalPracticeTime": 0,
    "averageScore": 0,
    "completedScenarios": 0
  },
  "recentProgress": {
    "lastSession": {
      "id": "uuid",
      "date": "string",
      "score": 0
    },
    "weeklyStats": {
      "sessionsCompleted": 0,
      "practiceTime": 0,
      "averageScore": 0
    }
  },
  "skillLevels": {
    "communication": 0,
    "diagnosis": 0,
    "patientCare": 0
  },
  "chartData": {
    "scoreProgress": [
      {
        "date": "2025-09-01",
        "score": 75,
        "session": "uuid"
      }
    ],
    "practiceFrequency": [
      {
        "week": "2025-W36",
        "sessions": 5,
        "totalTime": 120
      }
    ],
    "skillRadar": [
      {
        "skill": "Communication",
        "level": 85,
        "maxLevel": 100
      },
      {
        "skill": "Diagnosis", 
        "level": 78,
        "maxLevel": 100
      },
      {
        "skill": "Patient Care",
        "level": 82,
        "maxLevel": 100
      }
    ]
  }
}
```

#### GET /progress/achievements
Retrieves user's achievements and badges.

Response:
```json
{
  "achievements": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "category": "string",
      "earnedDate": "string",
      "icon": "string"
    }
  ],
  "stats": {
    "totalAchievements": 0,
    "completionPercentage": 0
  }
}
```

#### GET /progress/history
Retrieves detailed practice history.

Query Parameters:
- startDate: string (ISO date)
- endDate: string (ISO date)
- page: number
- limit: number

Response:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "date": "string",
      "scenarioTitle": "string",
      "duration": 0,
      "score": 0,
      "feedbackHighlights": ["string"]
    }
  ],
  "pagination": {
    "currentPage": 0,
    "totalPages": 0,
    "totalItems": 0
  }
}
```

#### GET /progress/recommendations
Retrieves personalized learning recommendations.

Response:
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "type": "scenario|course|resource",
      "title": "string",
      "description": "string",
      "difficulty": "string",
      "relevanceScore": 0,
      "estimatedDuration": 0
    }
  ],
  "focusAreas": [
    {
      "skill": "string",
      "currentLevel": 0,
      "suggestedScenarios": ["uuid"]
    }
  ]
}
```

## Legal and Compliance API

### Terms and Privacy

#### GET /legal/documents
Retrieves the latest versions of legal documents.

Response:
```json
{
  "documents": [
    {
      "id": "uuid",
      "type": "terms|privacy|data-policy",
      "version": "string",
      "effectiveDate": "string",
      "url": "string"
    }
  ]
}
```

#### POST /legal/accept
Records user acceptance of legal documents.

Request:
```json
{
  "documentId": "uuid",
  "version": "string"
}
```

Response:
```json
{
  "accepted": true,
  "timestamp": "string"
}
```

### Data Rights

#### POST /data/export
Requests a data export of the user's personal data.

Response:
```json
{
  "requestId": "uuid",
  "status": "processing",
  "estimatedCompletionTime": "string"
}
```

#### GET /data/export/{requestId}
Checks the status of a data export request.

Response:
```json
{
  "status": "processing|ready|expired",
  "downloadUrl": "string",
  "expiresAt": "string"
}
```

#### POST /data/deletion
Requests account deletion and data removal.

Request:
```json
{
  "reason": "string",
  "confirmation": "string"
}
```

Response:
```json
{
  "requestId": "uuid",
  "status": "scheduled",
  "deletionDate": "string"
}
```

## Practice Session API

### Scenario Management

#### GET /sessions/scenarios
Lists available practice scenarios filtered by user's profession.

Query Parameters:
- difficulty: string
- category: string
- search: string
- page: number
- limit: number

Note: Scenarios are automatically filtered to match the authenticated user's profession. Cross-profession access is not available as OET speaking tests are profession-specific.

Response:
```json
{
  "scenarios": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "difficulty": "beginner|intermediate|advanced",
      "category": "string",
      "duration": 0,
      "requiredPlan": "free|paid",
      "averageRating": 0
    }
  ],
  "pagination": {
    "currentPage": 0,
    "totalPages": 0,
    "totalItems": 0
  }
}
```

#### GET /sessions/scenarios/{id}
Retrieves detailed information about a specific scenario.

Response:
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "difficulty": "beginner|intermediate|advanced",
  "category": "string",
  "duration": 0,
  "requiredPlan": "free|paid",
  "learningObjectives": ["string"],
  "prerequisites": ["string"],
  "patientProfile": {
    "age": 0,
    "gender": "string",
    "background": "string",
    "mainComplaint": "string"
  },
  "instructions": {
    "preparation": ["string"],
    "during": ["string"],
    "completion": ["string"]
  },
  "ratings": {
    "average": 0,
    "total": 0,
    "distribution": {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0
    }
  }
}
```

#### GET /sessions/scenarios/filters
Retrieves available filters for scenarios within the user's profession.

Response:
```json
{
  "userProfession": "doctor",
  "difficulties": ["string"],
  "categories": ["string"],
  "durations": {
    "min": 0,
    "max": 0,
    "intervals": ["0-10", "10-20", "20-30", "30+"]
  },
  "totalScenarios": 45
}
```

### Session Management

#### POST /sessions/create
Initiates a new practice session.

Request:
```json
{
  "scenarioId": "uuid"
}
```

Response:
```json
{
  "sessionId": "uuid",
  "websocketUrl": "string",
  "scenario": {
    "id": "uuid",
    "title": "string",
    "instructions": "string"
  }
}
```

#### WebSocket /sessions/{sessionId}/stream
Real-time audio streaming endpoint.

Messages:
```json
// Client -> Server (Audio chunk)
{
  "type": "audio",
  "data": "base64-encoded-audio"
}

// Server -> Client (AI Response - text only)
{
  "type": "response",
  "text": "string"
}

// Server -> Client (Audio quality status)
{
  "type": "audio_quality",
  "status": "good|poor|silent",
  "confidence": 0.95
}

// Server -> Client (Ephemeral TTS chunk for immediate playback)
{
  "type": "tts_chunk",
  "data": "base64-encoded-audio-chunk",
  "sequence": 1
}

// Note: any `tts_chunk` frames are ephemeral and must not be stored or referenced via URLs. The server will not return audio URLs or persistent audio artifacts.
```

#### POST /sessions/{sessionId}/complete
Completes a practice session.

Response:
```json
{
  "sessionId": "uuid",
  "duration": 0,
  "feedbackReportId": "uuid"
}
```

#### GET /sessions/recent
Retrieves recent practice sessions.

Query Parameters:
- page: number
- limit: number
- status: "completed|cancelled|in-progress"

Response:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "scenarioId": "uuid",
      "scenarioTitle": "string",
      "startTime": "string",
      "endTime": "string",
      "status": "completed|cancelled|in-progress",
      "duration": 0,
      "score": 0
    }
  ],
  "pagination": {
    "currentPage": 0,
    "totalPages": 0,
    "totalItems": 0
  }
}
```

#### DELETE /sessions/{sessionId}
Cancels an ongoing practice session.

Response:
```json
{
  "cancelled": true,
  "message": "string",
  "timestamp": "string"
}
```

### Feedback Reports

#### GET /sessions/{sessionId}/feedback
Retrieves the feedback report for a session.

Response:
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "overallScore": 0,
  "transcript": "string",
  "feedback": {
    "summary": "string",
    "strengths": ["string"],
    "improvements": ["string"]
  },
  "detailedScores": {
    "grammar": 0,
    "pronunciation": 0,
    "clinicalCommunication": 0,
    "empathy": 0
  }
}
```

## Content Management API

### Scenarios

#### GET /scenarios
Lists available practice scenarios.

Query Parameters:
- profession (string)
- difficulty (string)
- category (string)
- page (integer)
- limit (integer)

Response:
```json
{
  "scenarios": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "difficulty": "string",
      "category": "string",
      "duration": 0
    }
  ],
  "pagination": {
    "total": 0,
    "page": 0,
    "limit": 0
  }
}
```

#### GET /scenarios/{id}
Retrieves a specific scenario.

Response:
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "category": "string",
  "patientPersona": {
    "age": 0,
    "gender": "string",
    "condition": "string"
  },
  "instructions": "string"
}
```

### Admin API

#### POST /admin/scenarios
Creates a new scenario (Admin only).

Request:
```json
{
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "category": "string",
  "patientPersona": {
    "age": 0,
    "gender": "string",
    "condition": "string"
  },
  "instructions": "string"
}
```

Response:
```json
{
  "id": "uuid",
  "status": "draft|published"
}
```

#### GET /admin/analytics/users
Retrieves user analytics (Admin only).

Query Parameters:
- startDate (string)
- endDate (string)
- metric (string)

Response:
```json
{
  "timeframe": {
    "start": "string",
    "end": "string"
  },
  "metrics": {
    "totalUsers": 0,
    "activeUsers": 0,
    "conversionRate": 0
  },
  "breakdown": [
    {
      "date": "string",
      "value": 0
    }
  ]
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Common Error Codes
- AUTH001: Authentication failed
- AUTH002: Token expired
- VAL001: Validation error
- RES001: Resource not found
- PER001: Permission denied

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

- Free tier: 60 requests/minute
- Paid tier: 300 requests/minute
- Admin: 600 requests/minute

Headers:
```
X-RateLimit-Limit: [requests_per_minute]
X-RateLimit-Remaining: [remaining_requests]
X-RateLimit-Reset: [reset_timestamp]
```

## WebSocket Connections

### Connection Lifecycle
1. Establish connection with authentication token
2. Subscribe to session events
3. Stream audio data
4. Receive real-time responses
5. Handle connection closure

### Heartbeat
- Client sends ping every 30 seconds
- Server responds with pong
- Connection closed if no ping for 90 seconds

## API Versioning

### Version Header
```
Accept: application/json; version=1
```

### Version Lifecycle
1. Current: v1
2. Beta: v2-beta
3. Deprecated: none

## Traceability to PRD

This API specification supports:
- Section 4: Solution Overview
- Section 6.1: User Journey
- Section 6.2: Content Strategy
- Section 7: Monetization Model

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-09-21 | 1.0 | Initial API specification |