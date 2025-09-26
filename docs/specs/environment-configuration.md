# Environment Configuration Specification

Version: 1.0  
Last Updated: September 24, 2025

## Overview
This document specifies exact environment variables, build configurations, and deployment settings to eliminate developer assumptions.

## 1. Environment Variables

### 1.1 Required Environment Variables
```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/oet_praxis"
DATABASE_POOL_SIZE=20
DATABASE_MAX_CONNECTIONS=100

# Authentication
JWT_SECRET="your-256-bit-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Third-Party APIs
HUGGINGFACE_API_KEY="hf_your_api_key_here"
HUGGINGFACE_MODEL_URL="https://api-inference.huggingface.co/models/google/flan-t5-large"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_DB=0

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:8000/api"
NODE_ENV="development"
LOG_LEVEL="info"

# File Storage
STORAGE_PROVIDER="local"
UPLOAD_MAX_SIZE="10MB"
ALLOWED_FILE_TYPES="audio/wav,audio/mp3,audio/webm"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@oetpraxis.com"
```

### 1.2 Environment-Specific Overrides

#### Development (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
LOG_LEVEL=debug
DATABASE_URL=postgresql://postgres:password@localhost:5432/oet_praxis_dev
```

#### Staging (.env.staging)
```bash
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.oetpraxis.com
NEXT_PUBLIC_API_URL=https://api.staging.oetpraxis.com
LOG_LEVEL=info
DATABASE_URL=postgresql://user:pass@staging-db:5432/oet_praxis_staging
```

#### Production (.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://oetpraxis.com
NEXT_PUBLIC_API_URL=https://api.oetpraxis.com
LOG_LEVEL=warn
DATABASE_URL=${DATABASE_URL}
```

## 2. Build Configuration

### 2.1 Next.js Configuration (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'oetpraxis.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.devtool = 'source-map'
    }
    return config
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
}

module.exports = nextConfig
```

### 2.2 TypeScript Configuration (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/store/*": ["./src/store/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2.3 Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 3. Validation Rules

### 3.1 Required Environment Variables Check
```typescript
// src/lib/env.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'HUGGINGFACE_API_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL'
]

export function validateEnvironment() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
```

## 4. Security Configuration

### 4.1 Environment Variable Security
```bash
# Never commit these to version control
.env.local
.env.production
.env.staging

# Use these patterns for secrets
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_PASSWORD=$(openssl rand -base64 16)
```

### 4.2 Build Security
```javascript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
]
```