#!/bin/bash

# Database Migration Script
set -e

echo "🗃️  Running database migrations..."

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
fi

# Default DATABASE_URL if not set
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/oet_praxis_dev"}

echo "📡 Connecting to database: $DATABASE_URL"

# Run migration SQL file
PGPASSWORD=$(echo $DATABASE_URL | cut -d':' -f3 | cut -d'@' -f1) \
psql $(echo $DATABASE_URL) \
  -f database/migrations/001_initial_schema.sql

echo "✅ Database migrations completed successfully!"