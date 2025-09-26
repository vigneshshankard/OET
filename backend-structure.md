# OET Praxis Backend Project Structure

## Overview

This document defines the complete backend project structure for the OET Praxis platform, strictly adhering to the specifications defined in `/docs/specs/`. The backend follows a microservices architecture with FastAPI gateway, Node.js services, Python AI services, and comprehensive DevOps infrastructure.

## Technology Stack

Based on `system-architecture.md` specifications:

- **API Gateway**: FastAPI (Python) with OpenAPI documentation
- **Core Services**: Node.js with Express.js framework
- **AI Services**: Python with Hugging Face integration
- **Database**: PostgreSQL 15+ with pgvector extension
- **Cache**: Redis 7+ for session state and API caching
- **Real-time**: Node.js WebRTC server with LiveKit integration
- **Deployment**: Docker containers with Kubernetes orchestration
- **Monitoring**: Prometheus + Grafana + health checks

## Complete Project Structure

```
backend/
├── README.md                          # Backend setup and development guide
├── docker-compose.yml                 # Local development services
├── docker-compose.prod.yml            # Production services composition
├── .env.example                       # Environment variables template
├── .env.local                         # Local development environment
├── .env.staging                       # Staging environment
├── .env.production                    # Production environment
├── .gitignore                         # Git ignore patterns
├── package.json                       # Root package.json for workspace
├── tsconfig.json                      # TypeScript configuration
├── jest.config.js                     # Testing configuration
├── .eslintrc.js                       # Code linting rules
├── .prettierrc                        # Code formatting rules
├── Dockerfile.gateway                 # API Gateway container
├── Dockerfile.webrtc                  # WebRTC server container
├── Dockerfile.ai                      # AI services container
├── requirements.txt                   # Python dependencies for AI services
├── pyproject.toml                     # Python project configuration
├── setup.py                          # Python package setup
├── Makefile                           # Build and deployment commands
├── .github/                           # GitHub Actions workflows
│   └── workflows/
│       ├── backend-ci.yml             # Backend CI/CD pipeline
│       ├── api-gateway-deploy.yml     # API Gateway deployment
│       ├── services-deploy.yml        # Services deployment
│       ├── ai-services-deploy.yml     # AI services deployment
│       └── infrastructure-deploy.yml  # Infrastructure deployment
├── k8s/                               # Kubernetes manifests
│   ├── namespace.yaml                 # OET namespace
│   ├── configmap.yaml                 # Configuration maps
│   ├── secrets.yaml                   # Secrets management
│   ├── persistent-volumes.yaml        # Storage volumes
│   ├── network-policies.yaml          # Network security policies
│   ├── ingress.yaml                   # Load balancer configuration
│   ├── hpa.yaml                       # Horizontal Pod Autoscaler
│   ├── services/                      # Service deployments
│   │   ├── gateway-deployment.yaml    # API Gateway deployment
│   │   ├── user-service-deployment.yaml # User service deployment
│   │   ├── session-service-deployment.yaml # Session service deployment
│   │   ├── content-service-deployment.yaml # Content service deployment
│   │   ├── billing-service-deployment.yaml # Billing service deployment
│   │   ├── webrtc-deployment.yaml     # WebRTC server deployment
│   │   └── ai-services-deployment.yaml # AI services deployment
│   ├── databases/                     # Database deployments
│   │   ├── postgres-deployment.yaml   # PostgreSQL deployment
│   │   ├── postgres-pvc.yaml          # PostgreSQL storage
│   │   ├── redis-deployment.yaml      # Redis deployment
│   │   └── redis-config.yaml          # Redis configuration
│   └── monitoring/                    # Monitoring deployments
│       ├── prometheus-deployment.yaml # Prometheus deployment
│       ├── grafana-deployment.yaml    # Grafana deployment
│       └── alertmanager-deployment.yaml # Alert manager deployment
├── scripts/                           # Deployment and utility scripts
│   ├── setup-dev.sh                   # Development environment setup
│   ├── install-dependencies.sh        # Dependency installation
│   ├── migrate-db.sh                  # Database migration runner
│   ├── seed-data.sh                   # Test data seeding
│   ├── backup-db.sh                   # Database backup
│   ├── restore-db.sh                  # Database restore
│   ├── deploy.sh                      # Deployment script
│   ├── rollback.sh                    # Rollback script
│   ├── health-check.sh                # Health check script
│   ├── logs.sh                        # Log aggregation script
│   └── cleanup.sh                     # Environment cleanup
│
├── shared/                            # Shared libraries and types
│   ├── package.json                   # Shared package dependencies
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── jest.config.js                 # Test configuration
│   ├── src/
│   │   ├── types/                     # TypeScript type definitions
│   │   │   ├── index.ts               # Type exports
│   │   │   ├── user.types.ts          # User-related types
│   │   │   ├── session.types.ts       # Session-related types
│   │   │   ├── scenario.types.ts      # Scenario-related types
│   │   │   ├── subscription.types.ts  # Billing-related types
│   │   │   ├── feedback.types.ts      # Feedback-related types
│   │   │   ├── api.types.ts           # API request/response types
│   │   │   ├── database.types.ts      # Database entity types
│   │   │   ├── websocket.types.ts     # WebSocket message types
│   │   │   └── ai.types.ts            # AI service types
│   │   ├── utils/                     # Shared utilities
│   │   │   ├── index.ts               # Utility exports
│   │   │   ├── validation.ts          # Input validation schemas (Zod)
│   │   │   ├── encryption.ts          # Data encryption utilities
│   │   │   ├── jwt.ts                # JWT token utilities
│   │   │   ├── logger.ts             # Centralized logging (Winston)
│   │   │   ├── errors.ts             # Custom error classes
│   │   │   ├── constants.ts          # Application constants
│   │   │   ├── date.ts               # Date formatting utilities
│   │   │   ├── string.ts             # String manipulation utilities
│   │   │   ├── number.ts             # Number formatting utilities
│   │   │   ├── array.ts              # Array manipulation utilities
│   │   │   └── object.ts             # Object manipulation utilities
│   │   ├── database/                 # Database layer
│   │   │   ├── index.ts              # Database exports
│   │   │   ├── connection.ts         # PostgreSQL connection pool
│   │   │   ├── transaction.ts        # Transaction management
│   │   │   ├── query-builder.ts      # SQL query builder
│   │   │   ├── migrations/           # Database migrations
│   │   │   │   ├── migrate.ts        # Migration runner
│   │   │   │   ├── 001_initial_schema.sql # Initial database schema
│   │   │   │   ├── 002_add_subscriptions.sql # Subscriptions table
│   │   │   │   ├── 003_add_scenarios.sql # Scenarios table
│   │   │   │   ├── 004_add_sessions.sql # Sessions table
│   │   │   │   ├── 005_add_feedback.sql # Feedback reports table
│   │   │   │   ├── 006_add_audit_logs.sql # Audit logs table
│   │   │   │   ├── 007_add_progress_snapshots.sql # Progress tracking
│   │   │   │   ├── 008_add_indexes.sql # Performance indexes
│   │   │   │   └── 009_add_constraints.sql # Data constraints
│   │   │   ├── models/               # Database models (TypeORM entities)
│   │   │   │   ├── index.ts          # Model exports
│   │   │   │   ├── base.model.ts     # Base entity with common fields
│   │   │   │   ├── user.model.ts     # Users table model
│   │   │   │   ├── subscription.model.ts # Subscriptions model
│   │   │   │   ├── scenario.model.ts # Scenarios model
│   │   │   │   ├── session.model.ts  # Sessions model
│   │   │   │   ├── feedback.model.ts # Feedback reports model
│   │   │   │   ├── progress.model.ts # Progress snapshots model
│   │   │   │   └── audit.model.ts    # Audit logs model
│   │   │   └── repositories/         # Data access layer
│   │   │       ├── index.ts          # Repository exports
│   │   │       ├── base.repository.ts # Base repository class
│   │   │       ├── user.repository.ts # User data operations
│   │   │       ├── subscription.repository.ts # Subscription operations
│   │   │       ├── scenario.repository.ts # Scenario operations
│   │   │       ├── session.repository.ts # Session operations
│   │   │       ├── feedback.repository.ts # Feedback operations
│   │   │       ├── progress.repository.ts # Progress operations
│   │   │       └── audit.repository.ts # Audit operations
│   │   ├── cache/                    # Redis caching layer
│   │   │   ├── index.ts              # Cache exports
│   │   │   ├── connection.ts         # Redis connection
│   │   │   ├── cache.service.ts      # Cache service implementation
│   │   │   ├── session-cache.ts      # Session state caching
│   │   │   ├── user-cache.ts         # User data caching
│   │   │   └── api-cache.ts          # API response caching
│   │   ├── messaging/                # Message queue and events
│   │   │   ├── index.ts              # Messaging exports
│   │   │   ├── event-bus.ts          # Event bus implementation
│   │   │   ├── message-queue.ts      # Message queue service
│   │   │   ├── events/               # Event definitions
│   │   │   │   ├── user.events.ts    # User-related events
│   │   │   │   ├── session.events.ts # Session-related events
│   │   │   │   └── billing.events.ts # Billing-related events
│   │   │   └── handlers/             # Event handlers
│   │   │       ├── user.handlers.ts  # User event handlers
│   │   │       ├── session.handlers.ts # Session event handlers
│   │   │       └── billing.handlers.ts # Billing event handlers
│   │   └── middleware/               # Shared middleware
│   │       ├── index.ts              # Middleware exports
│   │       ├── auth.middleware.ts    # JWT authentication
│   │       ├── rate-limiter.middleware.ts # Rate limiting
│   │       ├── cors.middleware.ts    # CORS configuration
│   │       ├── compression.middleware.ts # Response compression
│   │       ├── security.middleware.ts # Security headers
│   │       ├── validation.middleware.ts # Request validation
│   │       ├── error-handler.middleware.ts # Error handling
│   │       ├── logging.middleware.ts # Request logging
│   │       └── metrics.middleware.ts # Metrics collection
│   ├── tests/                        # Shared tests
│   │   ├── unit/                     # Unit tests
│   │   ├── integration/              # Integration tests
│   │   ├── fixtures/                 # Test fixtures
│   │   └── helpers/                  # Test helpers
│   └── dist/                         # Compiled shared code
│
├── services/                         # Microservices
│   ├── api-gateway/                  # FastAPI Gateway Service
│   │   ├── README.md                 # Gateway service documentation
│   │   ├── Dockerfile               # Gateway container
│   │   ├── requirements.txt         # Python dependencies
│   │   ├── pyproject.toml           # Python project config
│   │   ├── pytest.ini               # Test configuration
│   │   ├── main.py                  # FastAPI application entry
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py              # FastAPI app initialization
│   │   │   ├── config.py            # Configuration settings
│   │   │   ├── dependencies.py      # Dependency injection
│   │   │   ├── middleware/          # Gateway middleware
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py         # Authentication middleware
│   │   │   │   ├── rate_limiter.py # Rate limiting implementation
│   │   │   │   ├── cors.py         # CORS handling
│   │   │   │   ├── compression.py  # Response compression
│   │   │   │   ├── security.py     # Security headers
│   │   │   │   ├── logging.py      # Request logging
│   │   │   │   └── metrics.py      # Metrics collection
│   │   │   ├── routes/             # Route definitions
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py         # Authentication routes
│   │   │   │   ├── users.py        # User service proxy
│   │   │   │   ├── sessions.py     # Session service proxy
│   │   │   │   ├── scenarios.py    # Content service proxy
│   │   │   │   ├── billing.py      # Billing service proxy
│   │   │   │   ├── ai.py           # AI services proxy
│   │   │   │   ├── webhooks.py     # Webhook endpoints
│   │   │   │   └── health.py       # Health check endpoints
│   │   │   ├── utils/              # Utility functions
│   │   │   │   ├── __init__.py
│   │   │   │   ├── jwt_handler.py  # JWT utilities
│   │   │   │   ├── service_client.py # Service communication
│   │   │   │   ├── validators.py   # Request validation
│   │   │   │   ├── errors.py       # Error handling
│   │   │   │   └── helpers.py      # Helper functions
│   │   │   ├── models/             # Pydantic models
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py         # Base model classes
│   │   │   │   ├── auth_models.py  # Authentication models
│   │   │   │   ├── user_models.py  # User-related models
│   │   │   │   ├── session_models.py # Session models
│   │   │   │   ├── scenario_models.py # Scenario models
│   │   │   │   ├── billing_models.py # Billing models
│   │   │   │   ├── ai_models.py    # AI service models
│   │   │   │   └── response_models.py # Standard responses
│   │   │   └── core/               # Core functionality
│   │   │       ├── __init__.py
│   │   │       ├── security.py     # Security utilities
│   │   │       ├── service_discovery.py # Service discovery
│   │   │       └── load_balancer.py # Load balancing
│   │   ├── tests/                  # API Gateway tests
│   │   │   ├── __init__.py
│   │   │   ├── conftest.py         # Test configuration
│   │   │   ├── test_auth.py        # Authentication tests
│   │   │   ├── test_routes.py      # Route tests
│   │   │   ├── test_middleware.py  # Middleware tests
│   │   │   ├── test_models.py      # Model tests
│   │   │   └── integration/        # Integration tests
│   │   │       ├── test_user_service.py # User service integration
│   │   │       ├── test_session_service.py # Session service integration
│   │   │       └── test_billing_service.py # Billing service integration
│   │   └── docs/                   # Service documentation
│   │       ├── API.md              # API documentation
│   │       └── DEPLOYMENT.md       # Deployment guide
│   │
│   ├── user-service/               # User Management Service (Node.js)
│   │   ├── README.md               # User service documentation
│   │   ├── package.json            # Node.js dependencies
│   │   ├── tsconfig.json           # TypeScript configuration
│   │   ├── jest.config.js          # Test configuration
│   │   ├── Dockerfile             # User service container
│   │   ├── .env.example           # Environment variables template
│   │   ├── src/
│   │   │   ├── index.ts           # Service entry point
│   │   │   ├── app.ts             # Express app configuration
│   │   │   ├── server.ts          # HTTP server setup
│   │   │   ├── config/            # Configuration
│   │   │   │   ├── index.ts       # Config exports
│   │   │   │   ├── database.ts    # DB connection config
│   │   │   │   ├── redis.ts       # Redis config
│   │   │   │   ├── jwt.ts         # JWT configuration
│   │   │   │   └── email.ts       # Email service config
│   │   │   ├── controllers/       # Request handlers
│   │   │   │   ├── index.ts       # Controller exports
│   │   │   │   ├── auth.controller.ts # Authentication logic
│   │   │   │   ├── user.controller.ts # User management
│   │   │   │   ├── profile.controller.ts # Profile management
│   │   │   │   └── admin.controller.ts # Admin operations
│   │   │   ├── services/          # Business logic
│   │   │   │   ├── index.ts       # Service exports
│   │   │   │   ├── auth.service.ts # Authentication service
│   │   │   │   ├── user.service.ts # User operations
│   │   │   │   ├── profile.service.ts # Profile operations
│   │   │   │   ├── email.service.ts # Email notifications
│   │   │   │   ├── cache.service.ts # Redis caching
│   │   │   │   └── audit.service.ts # Audit logging
│   │   │   ├── routes/            # Express routes
│   │   │   │   ├── index.ts       # Route exports
│   │   │   │   ├── auth.routes.ts # Authentication endpoints
│   │   │   │   ├── user.routes.ts # User management endpoints
│   │   │   │   ├── profile.routes.ts # Profile endpoints
│   │   │   │   ├── admin.routes.ts # Admin endpoints
│   │   │   │   └── health.routes.ts # Health check
│   │   │   ├── middleware/        # Service middleware
│   │   │   │   ├── index.ts       # Middleware exports
│   │   │   │   ├── auth.ts        # Authentication middleware
│   │   │   │   ├── validation.ts  # Input validation
│   │   │   │   ├── rate-limit.ts  # Rate limiting
│   │   │   │   ├── cors.ts        # CORS handling
│   │   │   │   ├── helmet.ts      # Security headers
│   │   │   │   ├── compression.ts # Response compression
│   │   │   │   ├── logging.ts     # Request logging
│   │   │   │   └── error-handler.ts # Error handling
│   │   │   ├── utils/             # Utility functions
│   │   │   │   ├── index.ts       # Utility exports
│   │   │   │   ├── password.ts    # Password hashing
│   │   │   │   ├── token.ts       # Token generation
│   │   │   │   ├── email-templates.ts # Email templates
│   │   │   │   └── validators.ts  # Custom validators
│   │   │   └── types/             # Service-specific types
│   │   │       ├── index.ts       # Type exports
│   │   │       ├── auth.types.ts  # Authentication types
│   │   │       ├── user.types.ts  # User types
│   │   │       └── api.types.ts   # API types
│   │   ├── tests/                 # User service tests
│   │   │   ├── unit/              # Unit tests
│   │   │   │   ├── controllers/   # Controller tests
│   │   │   │   ├── services/      # Service tests
│   │   │   │   └── utils/         # Utility tests
│   │   │   ├── integration/       # Integration tests
│   │   │   │   ├── auth.test.ts   # Authentication integration
│   │   │   │   └── user.test.ts   # User management integration
│   │   │   ├── fixtures/          # Test fixtures
│   │   │   └── helpers/           # Test helpers
│   │   └── docs/                  # Service documentation
│   │       ├── API.md             # API endpoints
│   │       ├── AUTHENTICATION.md  # Auth flow documentation
│   │       └── DEPLOYMENT.md      # Deployment guide
│   │
│   ├── session-service/           # Session Management Service (Node.js)
│   │   ├── README.md              # Session service documentation
│   │   ├── package.json           # Node.js dependencies
│   │   ├── tsconfig.json          # TypeScript configuration
│   │   ├── jest.config.js         # Test configuration
│   │   ├── Dockerfile            # Session service container
│   │   ├── .env.example          # Environment variables template
│   │   ├── src/
│   │   │   ├── index.ts          # Service entry point
│   │   │   ├── app.ts            # Express app configuration
│   │   │   ├── server.ts         # HTTP server setup
│   │   │   ├── websocket.ts      # WebSocket server setup
│   │   │   ├── config/           # Configuration
│   │   │   │   ├── index.ts      # Config exports
│   │   │   │   ├── database.ts   # DB connection config
│   │   │   │   ├── redis.ts      # Redis config
│   │   │   │   ├── websocket.ts  # WebSocket config
│   │   │   │   └── ai.ts         # AI services config
│   │   │   ├── controllers/      # Session controllers
│   │   │   │   ├── index.ts      # Controller exports
│   │   │   │   ├── session.controller.ts # Session management
│   │   │   │   ├── progress.controller.ts # Progress tracking
│   │   │   │   ├── feedback.controller.ts # Feedback handling
│   │   │   │   └── analytics.controller.ts # Session analytics
│   │   │   ├── services/         # Business logic
│   │   │   │   ├── index.ts      # Service exports
│   │   │   │   ├── session.service.ts # Session orchestration
│   │   │   │   ├── audio.service.ts # Audio processing
│   │   │   │   ├── ai.service.ts # AI integration
│   │   │   │   ├── progress.service.ts # Progress tracking
│   │   │   │   ├── feedback.service.ts # Feedback generation
│   │   │   │   ├── analytics.service.ts # Session analytics
│   │   │   │   └── cache.service.ts # Session state caching
│   │   │   ├── routes/           # Express routes
│   │   │   │   ├── index.ts      # Route exports
│   │   │   │   ├── session.routes.ts # Session endpoints
│   │   │   │   ├── progress.routes.ts # Progress endpoints
│   │   │   │   ├── feedback.routes.ts # Feedback endpoints
│   │   │   │   ├── analytics.routes.ts # Analytics endpoints
│   │   │   │   └── health.routes.ts # Health check
│   │   │   ├── websocket/        # Real-time communication
│   │   │   │   ├── index.ts      # WebSocket exports
│   │   │   │   ├── session.handler.ts # Session WebSocket
│   │   │   │   ├── audio.handler.ts # Audio streaming
│   │   │   │   ├── progress.handler.ts # Progress updates
│   │   │   │   └── events.ts     # WebSocket events
│   │   │   ├── middleware/       # Service middleware
│   │   │   │   ├── index.ts      # Middleware exports
│   │   │   │   ├── auth.ts       # Authentication middleware
│   │   │   │   ├── session-guard.ts # Session access control
│   │   │   │   ├── validation.ts # Input validation
│   │   │   │   └── error-handler.ts # Error handling
│   │   │   ├── utils/            # Utility functions
│   │   │   │   ├── index.ts      # Utility exports
│   │   │   │   ├── audio.ts      # Audio processing utilities
│   │   │   │   ├── scoring.ts    # Scoring algorithms
│   │   │   │   └── session-state.ts # Session state management
│   │   │   └── types/            # Service-specific types
│   │   │       ├── index.ts      # Type exports
│   │   │       ├── session.types.ts # Session types
│   │   │       ├── audio.types.ts # Audio types
│   │   │       ├── progress.types.ts # Progress types
│   │   │       └── websocket.types.ts # WebSocket types
│   │   ├── tests/                # Session service tests
│   │   │   ├── unit/             # Unit tests
│   │   │   ├── integration/      # Integration tests
│   │   │   ├── websocket/        # WebSocket tests
│   │   │   ├── fixtures/         # Test fixtures
│   │   │   └── helpers/          # Test helpers
│   │   └── docs/                 # Service documentation
│   │       ├── API.md            # API endpoints
│   │       ├── WEBSOCKET.md      # WebSocket protocols
│   │       ├── AUDIO.md          # Audio processing
│   │       └── DEPLOYMENT.md     # Deployment guide
│   │
│   ├── content-service/          # Content Management Service (Node.js)
│   │   ├── README.md             # Content service documentation
│   │   ├── package.json          # Node.js dependencies
│   │   ├── tsconfig.json         # TypeScript configuration
│   │   ├── jest.config.js        # Test configuration
│   │   ├── Dockerfile           # Content service container
│   │   ├── .env.example         # Environment variables template
│   │   ├── src/
│   │   │   ├── index.ts         # Service entry point
│   │   │   ├── app.ts           # Express app configuration
│   │   │   ├── server.ts        # HTTP server setup
│   │   │   ├── config/          # Configuration
│   │   │   │   ├── index.ts     # Config exports
│   │   │   │   ├── database.ts  # DB connection config
│   │   │   │   ├── redis.ts     # Redis config
│   │   │   │   └── storage.ts   # File storage config
│   │   │   ├── controllers/     # Content controllers
│   │   │   │   ├── index.ts     # Controller exports
│   │   │   │   ├── scenario.controller.ts # Scenario management
│   │   │   │   ├── admin.controller.ts # Admin operations
│   │   │   │   ├── content.controller.ts # Content operations
│   │   │   │   └── search.controller.ts # Content search
│   │   │   ├── services/        # Business logic
│   │   │   │   ├── index.ts     # Service exports
│   │   │   │   ├── scenario.service.ts # Scenario operations
│   │   │   │   ├── content.service.ts # Content management
│   │   │   │   ├── versioning.service.ts # Content versioning
│   │   │   │   ├── search.service.ts # Content search
│   │   │   │   ├── validation.service.ts # Content validation
│   │   │   │   └── cache.service.ts # Content caching
│   │   │   ├── routes/          # Express routes
│   │   │   │   ├── index.ts     # Route exports
│   │   │   │   ├── scenario.routes.ts # Scenario endpoints
│   │   │   │   ├── admin.routes.ts # Admin endpoints
│   │   │   │   ├── content.routes.ts # Content endpoints
│   │   │   │   ├── search.routes.ts # Search endpoints
│   │   │   │   └── health.routes.ts # Health check
│   │   │   ├── middleware/      # Content middleware
│   │   │   │   ├── index.ts     # Middleware exports
│   │   │   │   ├── auth.ts      # Authentication middleware
│   │   │   │   ├── admin-auth.ts # Admin authorization
│   │   │   │   ├── validation.ts # Input validation
│   │   │   │   └── error-handler.ts # Error handling
│   │   │   ├── utils/           # Utility functions
│   │   │   │   ├── index.ts     # Utility exports
│   │   │   │   ├── content-parser.ts # Content parsing
│   │   │   │   ├── scenario-validator.ts # Scenario validation
│   │   │   │   └── search-indexer.ts # Search indexing
│   │   │   └── types/           # Service-specific types
│   │   │       ├── index.ts     # Type exports
│   │   │       ├── scenario.types.ts # Scenario types
│   │   │       ├── content.types.ts # Content types
│   │   │       └── search.types.ts # Search types
│   │   ├── tests/               # Content service tests
│   │   │   ├── unit/            # Unit tests
│   │   │   ├── integration/     # Integration tests
│   │   │   ├── fixtures/        # Test fixtures
│   │   │   └── helpers/         # Test helpers
│   │   └── docs/                # Service documentation
│   │       ├── API.md           # API endpoints
│   │       ├── SCENARIOS.md     # Scenario management
│   │       ├── ADMIN.md         # Admin operations
│   │       └── DEPLOYMENT.md    # Deployment guide
│   │
│   ├── billing-service/         # Billing & Subscription Service (Node.js)
│   │   ├── README.md            # Billing service documentation
│   │   ├── package.json         # Node.js dependencies
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   ├── jest.config.js       # Test configuration
│   │   ├── Dockerfile          # Billing service container
│   │   ├── .env.example        # Environment variables template
│   │   ├── src/
│   │   │   ├── index.ts        # Service entry point
│   │   │   ├── app.ts          # Express app configuration
│   │   │   ├── server.ts       # HTTP server setup
│   │   │   ├── config/         # Configuration
│   │   │   │   ├── index.ts    # Config exports
│   │   │   │   ├── database.ts # DB connection config
│   │   │   │   ├── redis.ts    # Redis config
│   │   │   │   └── stripe.ts   # Stripe configuration
│   │   │   ├── controllers/    # Billing controllers
│   │   │   │   ├── index.ts    # Controller exports
│   │   │   │   ├── subscription.controller.ts # Subscription logic
│   │   │   │   ├── payment.controller.ts # Payment processing
│   │   │   │   ├── webhook.controller.ts # Stripe webhooks
│   │   │   │   ├── invoice.controller.ts # Invoice management
│   │   │   │   └── usage.controller.ts # Usage tracking
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── index.ts    # Service exports
│   │   │   │   ├── stripe.service.ts # Stripe integration
│   │   │   │   ├── subscription.service.ts # Subscription management
│   │   │   │   ├── payment.service.ts # Payment processing
│   │   │   │   ├── invoice.service.ts # Invoice generation
│   │   │   │   ├── usage.service.ts # Usage tracking
│   │   │   │   └── notification.service.ts # Billing notifications
│   │   │   ├── routes/         # Express routes
│   │   │   │   ├── index.ts    # Route exports
│   │   │   │   ├── subscription.routes.ts # Subscription endpoints
│   │   │   │   ├── payment.routes.ts # Payment endpoints
│   │   │   │   ├── webhook.routes.ts # Webhook endpoints
│   │   │   │   ├── invoice.routes.ts # Invoice endpoints
│   │   │   │   ├── usage.routes.ts # Usage endpoints
│   │   │   │   └── health.routes.ts # Health check
│   │   │   ├── middleware/     # Billing middleware
│   │   │   │   ├── index.ts    # Middleware exports
│   │   │   │   ├── auth.ts     # Authentication middleware
│   │   │   │   ├── stripe-webhook.ts # Webhook validation
│   │   │   │   ├── subscription-guard.ts # Subscription validation
│   │   │   │   ├── validation.ts # Input validation
│   │   │   │   └── error-handler.ts # Error handling
│   │   │   ├── utils/          # Utility functions
│   │   │   │   ├── index.ts    # Utility exports
│   │   │   │   ├── stripe-helpers.ts # Stripe utilities
│   │   │   │   ├── invoice-generator.ts # Invoice generation
│   │   │   │   └── usage-calculator.ts # Usage calculations
│   │   │   └── types/          # Service-specific types
│   │   │       ├── index.ts    # Type exports
│   │   │       ├── subscription.types.ts # Subscription types
│   │   │       ├── payment.types.ts # Payment types
│   │   │       ├── invoice.types.ts # Invoice types
│   │   │       └── stripe.types.ts # Stripe types
│   │   ├── tests/              # Billing service tests
│   │   │   ├── unit/           # Unit tests
│   │   │   ├── integration/    # Integration tests
│   │   │   ├── webhooks/       # Webhook tests
│   │   │   ├── fixtures/       # Test fixtures
│   │   │   └── helpers/        # Test helpers
│   │   └── docs/               # Service documentation
│   │       ├── API.md          # API endpoints
│   │       ├── STRIPE.md       # Stripe integration
│   │       ├── WEBHOOKS.md     # Webhook handling
│   │       └── DEPLOYMENT.md   # Deployment guide
│   │
│   └── webrtc-server/          # Real-time Communication Server (Node.js)
│       ├── README.md           # WebRTC server documentation
│       ├── package.json        # Node.js dependencies
│       ├── tsconfig.json       # TypeScript configuration
│       ├── jest.config.js      # Test configuration
│       ├── Dockerfile         # WebRTC server container
│       ├── .env.example       # Environment variables template
│       ├── src/
│       │   ├── index.ts       # WebRTC server entry
│       │   ├── app.ts         # Express app configuration
│       │   ├── server.ts      # HTTP and WebSocket server
│       │   ├── config/        # LiveKit configuration
│       │   │   ├── index.ts   # Config exports
│       │   │   ├── livekit.ts # LiveKit setup
│       │   │   ├── websocket.ts # WebSocket config
│       │   │   └── audio.ts   # Audio processing config
│       │   ├── handlers/      # WebRTC handlers
│       │   │   ├── index.ts   # Handler exports
│       │   │   ├── room.handler.ts # Room management
│       │   │   ├── audio.handler.ts # Audio streaming
│       │   │   ├── session.handler.ts # Session coordination
│       │   │   └── recording.handler.ts # Audio recording
│       │   ├── services/      # WebRTC services
│       │   │   ├── index.ts   # Service exports
│       │   │   ├── livekit.service.ts # LiveKit integration
│       │   │   ├── room.service.ts # Room operations
│       │   │   ├── audio.service.ts # Audio processing
│       │   │   ├── recording.service.ts # Audio recording
│       │   │   └── session.service.ts # Session management
│       │   ├── routes/        # Express routes
│       │   │   ├── index.ts   # Route exports
│       │   │   ├── room.routes.ts # Room endpoints
│       │   │   ├── session.routes.ts # Session endpoints
│       │   │   └── health.routes.ts # Health check
│       │   ├── middleware/    # WebRTC middleware
│       │   │   ├── index.ts   # Middleware exports
│       │   │   ├── auth.ts    # WebRTC authentication
│       │   │   ├── room-guard.ts # Room access control
│       │   │   ├── validation.ts # Input validation
│       │   │   └── error-handler.ts # Error handling
│       │   ├── utils/         # Utility functions
│       │   │   ├── index.ts   # Utility exports
│       │   │   ├── token.ts   # LiveKit token generation
│       │   │   ├── audio.ts   # Audio utilities
│       │   │   └── room.ts    # Room utilities
│       │   └── types/         # Service-specific types
│       │       ├── index.ts   # Type exports
│       │       ├── room.types.ts # Room types
│       │       ├── audio.types.ts # Audio types
│       │       └── livekit.types.ts # LiveKit types
│       ├── tests/             # WebRTC server tests
│       │   ├── unit/          # Unit tests
│       │   ├── integration/   # Integration tests
│       │   ├── websocket/     # WebSocket tests
│       │   ├── fixtures/      # Test fixtures
│       │   └── helpers/       # Test helpers
│       └── docs/              # Service documentation
│           ├── API.md         # API endpoints
│           ├── LIVEKIT.md     # LiveKit integration
│           ├── WEBSOCKET.md   # WebSocket protocols
│           └── DEPLOYMENT.md  # Deployment guide
│
├── ai-services/               # AI Processing Services (Python)
│   ├── README.md              # AI services documentation
│   ├── requirements.txt       # Python dependencies
│   ├── requirements-dev.txt   # Development dependencies
│   ├── pyproject.toml         # Python project configuration
│   ├── pytest.ini            # Test configuration
│   ├── Dockerfile            # AI services container
│   ├── .env.example          # Environment variables template
│   ├── main.py               # AI services entry point
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app initialization
│   │   ├── config.py         # AI configuration
│   │   ├── dependencies.py   # Dependency injection
│   │   ├── services/         # AI service implementations
│   │   │   ├── __init__.py
│   │   │   ├── huggingface_client.py # Hugging Face integration
│   │   │   ├── speech_to_text.py # STT service
│   │   │   ├── text_to_speech.py # TTS service
│   │   │   ├── feedback_generator.py # Feedback generation
│   │   │   ├── persona_manager.py # Patient persona handling
│   │   │   ├── conversation_engine.py # Conversation management
│   │   │   └── scoring_engine.py # Performance scoring
│   │   ├── models/           # AI model definitions
│   │   │   ├── __init__.py
│   │   │   ├── base.py       # Base model classes
│   │   │   ├── conversation.py # Conversation models
│   │   │   ├── feedback.py   # Feedback models
│   │   │   ├── scoring.py    # Scoring models
│   │   │   ├── persona.py    # Persona models
│   │   │   └── audio.py      # Audio processing models
│   │   ├── utils/            # AI utilities
│   │   │   ├── __init__.py
│   │   │   ├── audio_processing.py # Audio utilities
│   │   │   ├── text_processing.py # Text processing
│   │   │   ├── prompt_templates.py # LLM prompts
│   │   │   ├── error_handling.py # AI error handling
│   │   │   ├── model_cache.py # Model caching
│   │   │   └── performance_monitor.py # Performance monitoring
│   │   ├── api/              # AI API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── conversation.py # Conversation endpoints
│   │   │   ├── feedback.py   # Feedback endpoints
│   │   │   ├── speech.py     # Speech processing endpoints
│   │   │   ├── scoring.py    # Scoring endpoints
│   │   │   └── health.py     # Health check
│   │   ├── middleware/       # AI middleware
│   │   │   ├── __init__.py
│   │   │   ├── auth.py       # Authentication middleware
│   │   │   ├── rate_limiter.py # Rate limiting
│   │   │   ├── logging.py    # Request logging
│   │   │   └── error_handler.py # Error handling
│   │   └── core/             # Core AI functionality
│   │       ├── __init__.py
│   │       ├── model_manager.py # Model lifecycle management
│   │       ├── prompt_engine.py # Prompt generation
│   │       ├── safety_filter.py # Content safety
│   │       └── metrics_collector.py # AI metrics
│   ├── tests/                # AI services tests
│   │   ├── __init__.py
│   │   ├── conftest.py       # Test configuration
│   │   ├── test_huggingface.py # Hugging Face tests
│   │   ├── test_feedback.py  # Feedback tests
│   │   ├── test_speech.py    # Speech processing tests
│   │   ├── test_conversation.py # Conversation tests
│   │   ├── test_scoring.py   # Scoring tests
│   │   ├── integration/      # Integration tests
│   │   │   ├── test_api.py   # API integration tests
│   │   │   └── test_models.py # Model integration tests
│   │   ├── fixtures/         # Test fixtures
│   │   └── helpers/          # Test helpers
│   ├── models/               # AI model files and cache
│   │   ├── huggingface/      # Hugging Face model cache
│   │   ├── custom/           # Custom trained models
│   │   └── embeddings/       # Embedding models
│   └── docs/                 # AI services documentation
│       ├── API.md            # API endpoints
│       ├── MODELS.md         # Model documentation
│       ├── HUGGINGFACE.md    # Hugging Face integration
│       ├── SPEECH.md         # Speech processing
│       ├── FEEDBACK.md       # Feedback generation
│       └── DEPLOYMENT.md     # Deployment guide
│
├── monitoring/               # Monitoring & Observability
│   ├── README.md             # Monitoring setup documentation
│   ├── docker-compose.monitoring.yml # Monitoring stack
│   ├── prometheus/           # Prometheus configuration
│   │   ├── prometheus.yml    # Prometheus config
│   │   ├── alert-rules.yml   # Alert definitions
│   │   ├── recording-rules.yml # Recording rules
│   │   └── targets/          # Service discovery targets
│   │       ├── api-gateway.yml # API Gateway targets
│   │       ├── services.yml  # Microservices targets
│   │       └── infrastructure.yml # Infrastructure targets
│   ├── grafana/              # Grafana dashboards
│   │   ├── provisioning/
│   │   │   ├── datasources.yml # Data source configuration
│   │   │   └── dashboards.yml # Dashboard provisioning
│   │   └── dashboards/
│   │       ├── system-overview.json # System metrics dashboard
│   │       ├── api-performance.json # API performance dashboard
│   │       ├── business-metrics.json # Business KPIs dashboard
│   │       ├── error-tracking.json # Error monitoring dashboard
│   │       └── service-health.json # Service health dashboard
│   ├── alertmanager/         # Alert manager configuration
│   │   ├── alertmanager.yml  # Alert routing configuration
│   │   └── templates/        # Alert templates
│   │       ├── email.tmpl    # Email alert template
│   │       └── slack.tmpl    # Slack alert template
│   └── health-checks/        # Health check configurations
│       ├── service-checks.yml # Service health definitions
│       ├── dependency-checks.yml # Dependency health checks
│       └── scripts/          # Health check scripts
│           ├── api-gateway-check.sh # API Gateway health
│           ├── database-check.sh # Database health
│           └── redis-check.sh # Redis health
│
├── database/                 # Database management
│   ├── README.md             # Database documentation
│   ├── docker-compose.db.yml # Database development stack
│   ├── init/                 # Database initialization
│   │   ├── 01-create-database.sql # Database creation
│   │   ├── 02-create-extensions.sql # PostgreSQL extensions
│   │   ├── 03-create-users.sql # Database users
│   │   └── 04-grant-permissions.sql # User permissions
│   ├── migrations/           # Migration scripts
│   │   └── [managed by shared/database/migrations]
│   ├── seeds/                # Seed data
│   │   ├── 01-users.sql      # User seed data
│   │   ├── 02-scenarios.sql  # Scenario seed data
│   │   ├── 03-subscriptions.sql # Subscription plans
│   │   ├── 04-test-sessions.sql # Sample sessions
│   │   └── 05-admin-users.sql # Admin users
│   ├── backups/              # Database backups
│   │   ├── daily/            # Daily backups
│   │   ├── weekly/           # Weekly backups
│   │   └── monthly/          # Monthly backups
│   ├── scripts/              # Database scripts
│   │   ├── backup.sh         # Backup script
│   │   ├── restore.sh        # Restore script
│   │   ├── migrate.sh        # Migration script
│   │   ├── seed.sh           # Seeding script
│   │   └── cleanup.sh        # Cleanup script
│   └── docs/                 # Database documentation
│       ├── SCHEMA.md         # Schema documentation
│       ├── MIGRATIONS.md     # Migration guide
│       ├── BACKUP.md         # Backup procedures
│       └── PERFORMANCE.md    # Performance tuning
│
├── docs/                     # Backend documentation
│   ├── README.md             # Documentation index
│   ├── API.md                # Complete API documentation
│   ├── ARCHITECTURE.md       # Architecture overview
│   ├── SERVICES.md           # Service descriptions
│   ├── DEPLOYMENT.md         # Deployment guide
│   ├── DEVELOPMENT.md        # Development setup
│   ├── MONITORING.md         # Monitoring setup
│   ├── SECURITY.md           # Security guidelines
│   ├── PERFORMANCE.md        # Performance optimization
│   ├── TROUBLESHOOTING.md    # Common issues and solutions
│   ├── API_REFERENCE.md      # Generated API reference
│   ├── CHANGELOG.md          # Version changelog
│   └── CONTRIBUTING.md       # Development guidelines
│
└── tools/                    # Development tools
    ├── README.md             # Tools documentation
    ├── load-testing/         # Load testing scripts
    │   ├── scenarios/        # Test scenarios
    │   │   ├── user-registration.yml # User registration test
    │   │   ├── session-flow.yml # Session flow test
    │   │   ├── api-stress.yml # API stress test
    │   │   └── websocket-load.yml # WebSocket load test
    │   ├── artillery-config.yml # Artillery configuration
    │   ├── k6-scripts/       # K6 load testing scripts
    │   └── reports/          # Load test reports
    ├── performance/          # Performance testing
    │   ├── benchmark-scripts/ # Benchmark tests
    │   │   ├── api-benchmarks.js # API performance benchmarks
    │   │   ├── database-benchmarks.js # Database benchmarks
    │   │   └── ai-benchmarks.js # AI service benchmarks
    │   ├── profiling/        # Performance profiling
    │   └── reports/          # Performance reports
    ├── security/             # Security testing
    │   ├── vulnerability-scans/ # Security scan configs
    │   │   ├── owasp-zap.yml # OWASP ZAP configuration
    │   │   ├── snyk-config.yml # Snyk configuration
    │   │   └── sonarqube-config.yml # SonarQube configuration
    │   ├── penetration-tests/ # Pen test scripts
    │   └── reports/          # Security reports
    ├── data-migration/       # Data migration tools
    │   ├── scripts/          # Migration scripts
    │   ├── validators/       # Data validation tools
    │   └── reports/          # Migration reports
    └── utilities/            # Utility scripts
        ├── log-analyzer.sh   # Log analysis tool
        ├── service-status.sh # Service status checker
        ├── cleanup-docker.sh # Docker cleanup
        └── generate-docs.sh  # Documentation generator
```

## Key Dependencies

### API Gateway (Python/FastAPI)
```python
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
aioredis==2.0.1
asyncpg==0.29.0
httpx==0.25.2
prometheus-fastapi-instrumentator==6.1.0
structlog==23.2.0
```

### Node.js Services
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.3.0",
    "@types/node": "^20.10.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "socket.io": "^4.7.5",
    "redis": "^4.6.12",
    "pg": "^8.11.3",
    "typeorm": "^0.3.17",
    "stripe": "^14.9.0",
    "livekit-server-sdk": "^1.2.7"
  }
}
```

### AI Services (Python)
```python
# requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
transformers==4.36.0
torch==2.1.1
torchaudio==2.1.1
accelerate==0.25.0
datasets==2.15.0
huggingface-hub==0.19.4
openai-whisper==20231117
TTS==0.22.0
librosa==0.10.1
soundfile==0.12.1
numpy==1.25.2
scipy==1.11.4
scikit-learn==1.3.2
```

## Service Communication

### Inter-Service Communication
- **HTTP/REST**: Primary communication protocol
- **WebSocket**: Real-time updates and audio streaming
- **Message Queue**: Asynchronous event processing
- **Redis Cache**: Shared state and session management

### Authentication Flow
1. **API Gateway**: JWT token validation and routing
2. **User Service**: Authentication and user management
3. **Services**: Service-to-service authentication via JWT
4. **WebRTC Server**: LiveKit token-based authentication

### Data Flow
1. **Frontend → API Gateway → Services**
2. **Services → Database (PostgreSQL)**
3. **Services → Cache (Redis)**
4. **AI Services → Hugging Face API**
5. **Real-time → WebRTC Server → LiveKit**

## Environment Configuration

### Development Environment
```bash
# .env.local
NODE_ENV=development
API_GATEWAY_URL=http://localhost:8000
USER_SERVICE_URL=http://localhost:8001
SESSION_SERVICE_URL=http://localhost:8002
CONTENT_SERVICE_URL=http://localhost:8003
BILLING_SERVICE_URL=http://localhost:8004
WEBRTC_SERVICE_URL=http://localhost:8005
AI_SERVICES_URL=http://localhost:8006
DATABASE_URL=postgresql://postgres:password@localhost:5432/oet_praxis_dev
REDIS_URL=redis://localhost:6379
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
API_GATEWAY_URL=https://api.oetpraxis.com
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
HUGGINGFACE_API_KEY=${HUGGINGFACE_API_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
JWT_SECRET=${JWT_SECRET}
```

## Deployment Commands

### Local Development
```bash
# Start all services
make dev

# Start specific service
make dev-user-service
make dev-session-service
make dev-content-service
make dev-billing-service
make dev-webrtc-server
make dev-ai-services

# Run migrations
make migrate

# Seed database
make seed
```

### Production Deployment
```bash
# Deploy to Kubernetes
make deploy-prod

# Deploy specific service
make deploy-api-gateway
make deploy-services
make deploy-ai-services

# Health check
make health-check

# View logs
make logs
```

## Architecture Highlights

### 1. **Microservices Architecture**
- **5 Core Services**: API Gateway, User, Session, Content, Billing
- **2 Specialized Services**: WebRTC Server, AI Services
- **Service Discovery**: Kubernetes service discovery
- **Load Balancing**: Kubernetes ingress with NGINX

### 2. **Technology Stack Compliance**
- **API Gateway**: FastAPI (Python) as specified in system-architecture.md
- **Core Services**: Node.js/Express as specified
- **AI Services**: Python with Hugging Face integration
- **Database**: PostgreSQL with pgvector extension
- **Cache**: Redis for session state and API caching

### 3. **Scalability & Performance**
- **Horizontal Scaling**: Kubernetes HPA for auto-scaling
- **Caching Strategy**: Multi-layer caching with Redis
- **Database Optimization**: Connection pooling and read replicas
- **CDN Integration**: Static content delivery optimization

### 4. **Security & Compliance**
- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Data Encryption**: End-to-end encryption for audio streams
- **Compliance**: GDPR and HIPAA considerations

### 5. **Monitoring & Observability**
- **Metrics**: Prometheus metrics collection
- **Logging**: Centralized logging with structured logs
- **Tracing**: Distributed tracing for request flows
- **Alerting**: Comprehensive alerting with AlertManager

### 6. **DevOps & CI/CD**
- **Containerization**: Docker containers for all services
- **Orchestration**: Kubernetes for production deployment
- **CI/CD**: GitHub Actions for automated deployment
- **Infrastructure as Code**: Kubernetes manifests and Helm charts

This backend structure implements all requirements from the 23 specification files, providing a production-ready, scalable, and maintainable microservices architecture for the OET Praxis platform.