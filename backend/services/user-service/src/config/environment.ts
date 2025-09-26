/**
 * Environment Configuration for User Service
 * Based on environment-configuration.md specification
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

interface RedisConfig {
  host: string;
  port: number;
  db: number;
}

interface JWTConfig {
  secret: string;
  refreshSecret: string;
  accessExpiry: string;
  refreshExpiry: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

interface ServerConfig {
  port: number;
  environment: string;
}

interface RateLimitingConfig {
  maxRequests: number;
  windowMs: number;
}

interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  email: EmailConfig;
  rateLimiting: RateLimitingConfig;
  corsOrigins: string[];
}

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    environment: process.env.NODE_ENV || 'development',
  },
  
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    name: process.env.DATABASE_NAME || 'oet_praxis',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@oetpraxis.com',
  },
  
  rateLimiting: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  },
  
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://app.oetpraxis.com'
  ],
};