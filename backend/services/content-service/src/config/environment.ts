/**
 * Environment Configuration for Content Service
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface EnvironmentConfig {
  // Server Configuration
  PORT: number;
  NODE_ENV: string;
  
  // Database Configuration
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  DB_MAX_CONNECTIONS: number;
  
  // Redis Configuration
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string | undefined;
  REDIS_DB: number;
  
  // JWT Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // Media Configuration
  MEDIA_UPLOAD_PATH: string;
  MEDIA_BASE_URL: string;
  MAX_FILE_SIZE: number;
  
  // Logging Configuration
  LOG_LEVEL: string;
}

export const environment: EnvironmentConfig = {
  // Server Configuration
  PORT: parseInt(process.env.PORT || '3003'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_NAME: process.env.DB_NAME || 'oet_content',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',
  DB_SSL: process.env.DB_SSL === 'true',
  DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  
  // Redis Configuration
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: parseInt(process.env.REDIS_DB || '2'),
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Media Configuration
  MEDIA_UPLOAD_PATH: process.env.MEDIA_UPLOAD_PATH || './uploads',
  MEDIA_BASE_URL: process.env.MEDIA_BASE_URL || 'http://localhost:3003',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

export default environment;