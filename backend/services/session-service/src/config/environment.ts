/**
 * Session Service Configuration
 * Handles session management, authentication tracking, and user state
 */

import dotenv from 'dotenv';

dotenv.config();

interface RedisConfig {
  host: string;
  port: number;
  db: number;
}

interface ServerConfig {
  port: number;
  environment: string;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
}

interface RateLimitingConfig {
  maxRequests: number;
  windowMs: number;
}

interface SessionConfig {
  maxSessions: number;
  sessionTimeout: number; // in seconds
  cleanupInterval: number; // in milliseconds
}

interface Config {
  server: ServerConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  rateLimiting: RateLimitingConfig;
  session: SessionConfig;
  corsOrigins: string[];
}

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3002', 10),
    environment: process.env.NODE_ENV || 'development',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  rateLimiting: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  session: {
    maxSessions: parseInt(process.env.MAX_SESSIONS_PER_USER || '5', 10),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '86400', 10), // 24 hours
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000', 10), // 1 hour
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001').split(','),
};