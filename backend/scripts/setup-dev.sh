#!/bin/bash

# OET Praxis Backend Development Setup
set -e

echo "🚀 Setting up OET Praxis Backend Development Environment"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your actual configuration values"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install shared library dependencies
echo "📦 Installing shared library dependencies..."
cd shared && npm install && cd ..

# Build shared library
echo "🔨 Building shared library..."
cd shared && npm run build && cd ..

echo "🗄️  Starting database and cache services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗃️  Running database migrations..."
./scripts/migrate-db.sh

# Seed database with sample data
echo "🌱 Seeding database with sample data..."
./scripts/seed-data.sh

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Edit .env.local with your actual API keys"
echo "  2. Start all services: npm run dev"
echo "  3. Or start individual services:"
echo "     - API Gateway: npm run dev --workspace=gateway"
echo "     - User Service: npm run dev --workspace=services/user-service"
echo "     - Session Service: npm run dev --workspace=services/session-service"
echo "     - Content Service: npm run dev --workspace=services/content-service"
echo "     - Billing Service: npm run dev --workspace=services/billing-service"
echo "     - WebRTC Server: npm run dev --workspace=services/webrtc-server"
echo ""
echo "🌐 Services will be available at:"
echo "  - API Gateway: http://localhost:8000"
echo "  - User Service: http://localhost:3001"
echo "  - Session Service: http://localhost:3002"
echo "  - Content Service: http://localhost:3003"
echo "  - Billing Service: http://localhost:3004"
echo "  - WebRTC Server: http://localhost:3005"
echo "  - AI Services: http://localhost:8001"