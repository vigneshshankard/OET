#!/bin/bash

# Database Seeding Script
set -e

echo "🌱 Seeding database with sample data..."

# Load environment variables
if [ -f .env.local ]; then
    source .env.local
fi

# Default DATABASE_URL if not set
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/oet_praxis_dev"}

echo "📡 Connecting to database: $DATABASE_URL"

# Run seed SQL file
PGPASSWORD=$(echo $DATABASE_URL | cut -d':' -f3 | cut -d'@' -f1) \
psql $(echo $DATABASE_URL) \
  -f database/seed.sql

echo "✅ Database seeded successfully with sample data!"
echo ""
echo "📊 Sample data includes:"
echo "  - Admin user: admin@oetpraxis.com"
echo "  - 4 test users (doctor, nurse, dentist, physiotherapist)"
echo "  - 4 sample scenarios"
echo "  - Sample practice sessions and feedback"