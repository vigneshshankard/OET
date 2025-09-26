import dotenv from 'dotenv';

dotenv.config();

export interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: string;
  PORT: number;
  LOG_LEVEL: string;
  
  // Database Configuration
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_MAX_CONNECTIONS: number;
  
  // Redis Configuration
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string | undefined;
  REDIS_DB: number;
  
  // JWT Configuration
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // LiveKit Configuration
  LIVEKIT_HOST: string;
  LIVEKIT_API_KEY: string;
  LIVEKIT_API_SECRET: string;
  LIVEKIT_WS_URL: string;
  
  // WebSocket Configuration
  WEBSOCKET_PING_TIMEOUT: number;
  WEBSOCKET_PING_INTERVAL: number;
  MAX_CONNECTIONS_PER_USER: number;
  
  // Audio Processing Configuration
  AUDIO_SAMPLE_RATE: number;
  AUDIO_CHANNELS: number;
  AUDIO_BIT_DEPTH: number;
  AUDIO_BUFFER_SIZE: number;
  VAD_THRESHOLD: number;
  
  // AI Service Configuration
  AI_SERVICE_URL: string;
  AI_SERVICE_TIMEOUT: number;
  
  // Service Configuration
  SERVICE_NAME: string;
  CORS_ORIGIN: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

export const environment = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3003', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'oet_sessions',
  DB_USER: process.env.DB_USER || 'oet_user',
  DB_PASSWORD: process.env.DB_PASSWORD || 'oet_password',
  DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: parseInt(process.env.REDIS_DB || '1', 10),
  
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  LIVEKIT_HOST: process.env.LIVEKIT_HOST || 'wss://your-livekit-host.com',
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY || 'your-livekit-api-key',
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET || 'your-livekit-api-secret',
  LIVEKIT_WS_URL: process.env.LIVEKIT_WS_URL || 'wss://your-livekit-host.com',
  
  WEBSOCKET_PING_TIMEOUT: parseInt(process.env.WEBSOCKET_PING_TIMEOUT || '5000', 10),
  WEBSOCKET_PING_INTERVAL: parseInt(process.env.WEBSOCKET_PING_INTERVAL || '25000', 10),
  MAX_CONNECTIONS_PER_USER: parseInt(process.env.MAX_CONNECTIONS_PER_USER || '3', 10),
  
  AUDIO_SAMPLE_RATE: parseInt(process.env.AUDIO_SAMPLE_RATE || '16000', 10),
  AUDIO_CHANNELS: parseInt(process.env.AUDIO_CHANNELS || '1', 10),
  AUDIO_BIT_DEPTH: parseInt(process.env.AUDIO_BIT_DEPTH || '16', 10),
  AUDIO_BUFFER_SIZE: parseInt(process.env.AUDIO_BUFFER_SIZE || '1024', 10),
  VAD_THRESHOLD: parseFloat(process.env.VAD_THRESHOLD || '0.5'),
  
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  AI_SERVICE_TIMEOUT: parseInt(process.env.AI_SERVICE_TIMEOUT || '10000', 10),
  
  SERVICE_NAME: 'webrtc-server',
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10)
} as const satisfies EnvironmentConfig;