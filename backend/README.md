# OET Praxis Backend

AI-powered speaking practice platform backend - Microservices architecture for healthcare professional OET exam preparation.

## Architecture Overview

- **API Gateway**: FastAPI (Python) with OpenAPI documentation
- **Core Services**: Node.js with Express.js framework  
- **AI Services**: Python with Hugging Face integration
- **Database**: PostgreSQL 15+ with pgvector extension
- **Cache**: Redis 7+ for session state and API caching
- **Real-time**: Node.js WebRTC server with LiveKit integration
- **Deployment**: Docker containers with Kubernetes orchestration

## Services

1. **API Gateway** (`/gateway`) - FastAPI routing and authentication
2. **User Service** (`/services/user-service`) - Authentication and user management
3. **Session Service** (`/services/session-service`) - Practice session orchestration
4. **Content Service** (`/services/content-service`) - Scenario and content management
5. **Billing Service** (`/services/billing-service`) - Subscription and payment processing
6. **WebRTC Server** (`/services/webrtc-server`) - Real-time audio communication
7. **AI Services** (`/ai-services`) - Speech processing and feedback generation

## Quick Start

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Development setup**:
   ```bash
   ./scripts/setup-dev.sh
   ```

3. **Run database migrations**:
   ```bash
   ./scripts/migrate-db.sh
   ```

## Environment Setup

Copy environment templates and configure:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

## Testing

Run all tests:
```bash
npm run test:all
```

## Documentation

- [API Documentation](./docs/API.md)
- [Service Architecture](./docs/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)