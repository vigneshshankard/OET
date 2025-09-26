// Common types and interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  pool: {
    min: number;
    max: number;
    idle: number;
  };
}

export interface RedisConfig {
  url: string;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
}

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'paid';
  exp: number;
  iat: number;
}

export interface ServiceConfig {
  port: number;
  host: string;
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
}