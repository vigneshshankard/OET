/**
 * Session Types for Session Service
 */

export interface SessionData {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  deviceId?: string;
  deviceInfo?: DeviceInfo;
  ipAddress: string;
  userAgent?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface DeviceInfo {
  platform: string;
  browser: string;
  version: string;
  mobile: boolean;
}

export interface SessionCreateRequest {
  userId: string;
  userEmail: string;
  userRole: string;
  deviceId?: string;
  deviceInfo?: DeviceInfo;
  ipAddress: string;
  userAgent?: string;
  expiresIn?: number; // seconds
  metadata?: Record<string, any>;
}

export interface SessionUpdateRequest {
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface SessionResponse {
  session: SessionData;
  token: string;
}

export interface SessionListResponse {
  sessions: SessionData[];
  total: number;
}

export interface SessionActivity {
  sessionId: string;
  action: 'login' | 'logout' | 'refresh' | 'activity' | 'expired';
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  session?: SessionData;
  reason?: string;
}