# OET Praxis Backend Makefile
.PHONY: help setup dev build test clean docker-up docker-down migrate seed

# Default target
help:
	@echo "🎯 OET Praxis Backend Commands"
	@echo ""
	@echo "📋 Development:"
	@echo "  setup     - Setup development environment"
	@echo "  dev       - Start all services in development mode"
	@echo "  build     - Build all services"
	@echo "  test      - Run all tests"
	@echo "  lint      - Run linting across all services"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  docker-up    - Start Docker services (postgres, redis)"
	@echo "  docker-down  - Stop Docker services"
	@echo "  docker-logs  - View Docker logs"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  migrate   - Run database migrations"
	@echo "  seed      - Seed database with sample data"
	@echo "  db-reset  - Reset database (migrate + seed)"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  clean     - Clean all build artifacts and dependencies"
	@echo "  install   - Install all dependencies"

# Setup development environment
setup:
	@echo "🚀 Setting up development environment..."
	@chmod +x scripts/*.sh
	@./scripts/setup-dev.sh

# Development commands
dev:
	@echo "🔥 Starting all services in development mode..."
	@npm run dev

build:
	@echo "🔨 Building all services..."
	@npm run build

test:
	@echo "🧪 Running all tests..."
	@npm run test

lint:
	@echo "🔍 Running linting..."
	@npm run lint

install:
	@echo "📦 Installing all dependencies..."
	@npm install
	@cd shared && npm install

# Docker commands
docker-up:
	@echo "🐳 Starting Docker services..."
	@docker-compose up -d postgres redis

docker-down:
	@echo "🛑 Stopping Docker services..."
	@docker-compose down

docker-logs:
	@echo "📋 Viewing Docker logs..."
	@docker-compose logs -f

# Database commands
migrate:
	@echo "🗃️ Running database migrations..."
	@./scripts/migrate-db.sh

seed:
	@echo "🌱 Seeding database..."
	@./scripts/seed-data.sh

db-reset: migrate seed
	@echo "✅ Database reset complete!"

# Maintenance commands
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf node_modules */node_modules */*/node_modules
	@rm -rf dist */dist */*/dist
	@rm -rf coverage */coverage */*/coverage
	@rm -rf .next */.next */*/.next

# Service-specific commands
dev-gateway:
	@npm run dev --workspace=gateway

dev-user:
	@npm run dev --workspace=services/user-service

dev-session:
	@npm run dev --workspace=services/session-service

dev-content:
	@npm run dev --workspace=services/content-service

dev-billing:
	@npm run dev --workspace=services/billing-service

dev-webrtc:
	@npm run dev --workspace=services/webrtc-server

# Build shared library
build-shared:
	@echo "🔨 Building shared library..."
	@cd shared && npm run build

# Watch shared library
watch-shared:
	@echo "👀 Watching shared library..."
	@cd shared && npm run dev