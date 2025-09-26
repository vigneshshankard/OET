/**
 * Session Management Service
 * Handles user sessions, authentication tokens, and session lifecycle
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createClient, RedisClientType } from 'redis';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config/environment';
import { 
  SessionData, 
  SessionCreateRequest, 
  SessionUpdateRequest,
  SessionResponse,
  ValidationResult,
  DeviceInfo
} from './types/session';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'session-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (config.server.environment !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Express application setup
class SessionService {
  private app: Application;
  private redis!: RedisClientType;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.app = express();
    this.setupRedis();
    this.setupMiddleware();
    this.setupRoutes();
    this.startSessionCleanup();
  }

  private setupRedis(): void {
    this.redis = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
      database: config.redis.db,
    });

    this.redis.on('error', (err: Error) => {
      logger.error('Redis client error', { error: err.message });
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: config.corsOrigins,
      credentials: true,
    }));

    // Request parsing
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    
    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimiting.windowMs,
      max: config.rateLimiting.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
    });
    this.app.use(limiter);

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4();
      next();
    });

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('Request completed', {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
        });
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        service: 'session-service',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      });
    });

    // Create new session
    this.app.post('/sessions', async (req: Request, res: Response): Promise<void> => {
      try {
        const sessionRequest: SessionCreateRequest = req.body;
        
        // Validate required fields
        if (!sessionRequest.userId || !sessionRequest.userEmail || !sessionRequest.userRole) {
          res.status(400).json({
            error: 'Missing required fields: userId, userEmail, userRole'
          });
          return;
        }

        const sessionResponse = await this.createSession(sessionRequest, req);
        
        logger.info('Session created', {
          sessionId: sessionResponse.session.id,
          userId: sessionResponse.session.userId,
        });

        res.status(201).json(sessionResponse);
      } catch (error) {
        const err = error as Error;
        logger.error('Session creation failed', { error: err.message });
        res.status(500).json({ error: 'Failed to create session' });
          return;
      }
    });

    // Validate session
    this.app.post('/sessions/validate', async (req: Request, res: Response): Promise<void> => {
      try {
        const { token } = req.body;
        
        if (!token) {
          res.status(400).json({ error: 'Token is required' });
          return;
        }

        const validation = await this.validateSession(token);
        
        res.json({
          valid: validation.valid,
          session: validation.session,
          reason: validation.reason,
        });
      } catch (error) {
        const err = error as Error;
        logger.error('Session validation failed', { error: err.message });
        res.status(500).json({ error: 'Failed to validate session' });
          return;
      }
    });

    // Refresh session
    this.app.post('/sessions/:sessionId/refresh', async (req: Request, res: Response): Promise<void> => {
      try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
          res.status(400).json({ error: 'Session ID is required' });
          return;
        }
        
        const session = await this.refreshSession(sessionId, req);
        
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        logger.info('Session refreshed', { sessionId });
        
        res.json({ session });
      } catch (error) {
        const err = error as Error;
        logger.error('Session refresh failed', { error: err.message });
        res.status(500).json({ error: 'Failed to refresh session' });
          return;
      }
    });

    // Get user sessions
    this.app.get('/sessions/user/:userId', async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req.params;
        const { includeInactive } = req.query;
        
        if (!userId) {
          res.status(400).json({ error: 'User ID is required' });
          return;
        }
        
        const sessions = await this.getUserSessions(userId, includeInactive === 'true');
        
        res.json({
          sessions,
          total: sessions.length,
        });
      } catch (error) {
        const err = error as Error;
        logger.error('Failed to get user sessions', { error: err.message });
        res.status(500).json({ error: 'Failed to get user sessions' });
          return;
      }
    });

    // Terminate session
    this.app.delete('/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
      try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
          res.status(400).json({ error: 'Session ID is required' });
          return;
        }
        
        const success = await this.terminateSession(sessionId);
        
        if (!success) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        logger.info('Session terminated', { sessionId });
        
        res.json({ success: true, message: 'Session terminated successfully' });
      } catch (error) {
        const err = error as Error;
        logger.error('Session termination failed', { error: err.message });
        res.status(500).json({ error: 'Failed to terminate session' });
          return;
      }
    });

    // Terminate all user sessions
    this.app.delete('/sessions/user/:userId', async (req: Request, res: Response): Promise<void> => {
      try {
        const { userId } = req.params;
        const { excludeSessionId } = req.query;
        
        if (!userId) {
          res.status(400).json({ error: 'User ID is required' });
          return;
        }
        
        const count = await this.terminateAllUserSessions(userId, excludeSessionId as string);
        
        logger.info('All user sessions terminated', { userId, count });
        
        res.json({ 
          success: true, 
          message: `${count} sessions terminated`,
          count 
        });
      } catch (error) {
        const err = error as Error;
        logger.error('Failed to terminate user sessions', { error: err.message });
        res.status(500).json({ error: 'Failed to terminate user sessions' });
          return;
      }
    });

    // Update session metadata
    this.app.patch('/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
      try {
        const { sessionId } = req.params;
        const updateData: SessionUpdateRequest = req.body;
        
        if (!sessionId) {
          res.status(400).json({ error: 'Session ID is required' });
          return;
        }
        
        const session = await this.updateSession(sessionId, updateData);
        
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        logger.info('Session updated', { sessionId });
        
        res.json({ session });
      } catch (error) {
        const err = error as Error;
        logger.error('Session update failed', { error: err.message });
        res.status(500).json({ error: 'Failed to update session' });
          return;
      }
    });

    // Get session details
    this.app.get('/sessions/:sessionId', async (req: Request, res: Response): Promise<void> => {
      try {
        const { sessionId } = req.params;
        
        if (!sessionId) {
          res.status(400).json({ error: 'Session ID is required' });
          return;
        }
        
        const session = await this.getSession(sessionId);
        
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
        
        res.json({ session });
      } catch (error) {
        const err = error as Error;
        logger.error('Failed to get session', { error: err.message });
        res.status(500).json({ error: 'Failed to get session' });
          return;
      }
    });
  }

  private async createSession(request: SessionCreateRequest, req: Request): Promise<SessionResponse> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (request.expiresIn || config.session.sessionTimeout) * 1000);

    // Parse device info from User-Agent if not provided
    let deviceInfo: DeviceInfo | undefined = request.deviceInfo;
    if (!deviceInfo && req.get('User-Agent')) {
      deviceInfo = this.parseUserAgent(req.get('User-Agent')!);
    }

    const sessionObj = {
      id: sessionId,
      userId: request.userId,
      userEmail: request.userEmail,
      userRole: request.userRole,
      ...(request.deviceId !== undefined && { deviceId: request.deviceId }),
      ...(deviceInfo !== undefined && { deviceInfo }),
      ipAddress: request.ipAddress,
      ...(req.get('User-Agent') !== undefined && { userAgent: req.get('User-Agent') }),
      isActive: true,
      lastActivity: now,
      createdAt: now,
      expiresAt,
      metadata: request.metadata || {},
    };
    
    const session = sessionObj as SessionData;

    // Check session limit for user
    const existingSessions = await this.getUserSessions(request.userId, false);
    if (existingSessions.length >= config.session.maxSessions) {
      // Remove oldest session
      const oldestSession = existingSessions.sort((a, b) => 
        a.lastActivity.getTime() - b.lastActivity.getTime()
      )[0];
      if (oldestSession) {
        await this.terminateSession(oldestSession.id);
      }
    }

    // Store session in Redis
    await this.redis.setEx(
      `session:${sessionId}`,
      config.session.sessionTimeout,
      JSON.stringify(session)
    );

    // Add to user session index
    await this.redis.sAdd(`user_sessions:${request.userId}`, sessionId);

    // Generate JWT token
    const token = jwt.sign(
      { 
        sessionId,
        userId: request.userId,
        userRole: request.userRole,
        type: 'session'
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any
    );

    return { session, token };
  }

  private async validateSession(token: string): Promise<ValidationResult> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      if (!decoded.sessionId || decoded.type !== 'session') {
        return { valid: false, reason: 'Invalid token format' };
      }

      // Get session from Redis
      const sessionData = await this.redis.get(`session:${decoded.sessionId}`);
      
      if (!sessionData) {
        return { valid: false, reason: 'Session not found' };
      }

      const session: SessionData = JSON.parse(sessionData);
      
      // Check if session is active
      if (!session.isActive) {
        return { valid: false, reason: 'Session is inactive' };
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.terminateSession(session.id);
        return { valid: false, reason: 'Session expired' };
      }

      // Update last activity
      session.lastActivity = new Date();
      await this.redis.setEx(
        `session:${session.id}`,
        config.session.sessionTimeout,
        JSON.stringify(session)
      );

      return { valid: true, session };
    } catch (error) {
      const err = error as Error;
      logger.error('Session validation error', { error: err.message });
      return { valid: false, reason: 'Token verification failed' };
    }
  }

  private async refreshSession(sessionId: string, req: Request): Promise<SessionData | null> {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    
    if (!sessionData) {
      return null;
    }

    const session: SessionData = JSON.parse(sessionData);
    
    // Update session data
    session.lastActivity = new Date();
    session.ipAddress = req.ip || session.ipAddress;
    
    // Extend expiration
    const newExpiresAt = new Date(Date.now() + config.session.sessionTimeout * 1000);
    session.expiresAt = newExpiresAt;

    // Update in Redis
    await this.redis.setEx(
      `session:${sessionId}`,
      config.session.sessionTimeout,
      JSON.stringify(session)
    );

    return session;
  }

  private async getUserSessions(userId: string, includeInactive: boolean = false): Promise<SessionData[]> {
    const sessionIds = await this.redis.sMembers(`user_sessions:${userId}`);
    const sessions: SessionData[] = [];

    for (const sessionId of sessionIds) {
      const sessionData = await this.redis.get(`session:${sessionId}`);
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        
        // Check if session should be included
        if (includeInactive || (session.isActive && new Date() <= new Date(session.expiresAt))) {
          sessions.push(session);
        }
      } else {
        // Clean up orphaned session ID
        await this.redis.sRem(`user_sessions:${userId}`, sessionId);
      }
    }

    return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  private async terminateSession(sessionId: string): Promise<boolean> {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    
    if (!sessionData) {
      return false;
    }

    const session: SessionData = JSON.parse(sessionData);
    
    // Remove from Redis
    await this.redis.del(`session:${sessionId}`);
    await this.redis.sRem(`user_sessions:${session.userId}`, sessionId);

    return true;
  }

  private async terminateAllUserSessions(userId: string, excludeSessionId?: string): Promise<number> {
    const sessionIds = await this.redis.sMembers(`user_sessions:${userId}`);
    let count = 0;

    for (const sessionId of sessionIds) {
      if (excludeSessionId && sessionId === excludeSessionId) {
        continue;
      }
      
      const success = await this.terminateSession(sessionId);
      if (success) {
        count++;
      }
    }

    return count;
  }

  private async updateSession(sessionId: string, updateData: SessionUpdateRequest): Promise<SessionData | null> {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    
    if (!sessionData) {
      return null;
    }

    const session: SessionData = JSON.parse(sessionData);
    
    // Update fields
    if (updateData.isActive !== undefined) {
      session.isActive = updateData.isActive;
    }
    
    if (updateData.metadata) {
      session.metadata = { ...session.metadata, ...updateData.metadata };
    }

    session.lastActivity = new Date();

    // Update in Redis
    await this.redis.setEx(
      `session:${sessionId}`,
      config.session.sessionTimeout,
      JSON.stringify(session)
    );

    return session;
  }

  private async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    
    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData);
  }

  private parseUserAgent(userAgent: string): DeviceInfo {
    // Simple user agent parsing (in production, use a proper library like ua-parser-js)
    const mobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const chrome = /Chrome\/(\d+\.\d+)/.exec(userAgent);
    const firefox = /Firefox\/(\d+\.\d+)/.exec(userAgent);
    const safari = /Safari\/(\d+\.\d+)/.exec(userAgent);

    let browser = 'Unknown';
    let version = '';

    if (chrome) {
      browser = 'Chrome';
      version = chrome[1] || '';
    } else if (firefox) {
      browser = 'Firefox';
      version = firefox[1] || '';
    } else if (safari) {
      browser = 'Safari';
      version = safari[1] || '';
    }

    return {
      platform: mobile ? 'Mobile' : 'Desktop',
      browser,
      version,
      mobile,
    };
  }

  private startSessionCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        const err = error as Error;
        logger.error('Session cleanup failed', { error: err.message });
      }
    }, config.session.cleanupInterval);
  }

  private async cleanupExpiredSessions(): Promise<void> {
    logger.info('Starting session cleanup');
    
    const keys = await this.redis.keys('session:*');
    let cleanedCount = 0;

    for (const key of keys) {
      try {
        const sessionData = await this.redis.get(key);
        if (!sessionData) continue;

        const session: SessionData = JSON.parse(sessionData);
        
        if (new Date() > new Date(session.expiresAt)) {
          await this.terminateSession(session.id);
          cleanedCount++;
        }
      } catch (error) {
        // Invalid session data, remove it
        await this.redis.del(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Session cleanup completed', { cleanedCount });
    }
  }

  public async start(): Promise<void> {
    try {
      // Connect Redis
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
      logger.info('Redis cache connected successfully');

      // Start HTTP server
      const port = config.server.port;
      this.app.listen(port, () => {
        logger.info(`Session Service running on port ${port}`, {
          service: 'session-service',
          port,
          environment: config.server.environment,
        });
      });

    } catch (error) {
      const err = error as Error;
      logger.error('Failed to start Session Service', { error: err.message });
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      
      if (this.redis.isOpen) {
        await this.redis.disconnect();
      }
      
      logger.info('Session Service shutdown completed');
    } catch (error) {
      const err = error as Error;
      logger.error('Error during shutdown', { error: err.message });
    }
  }
}

// Create service instance
const sessionService = new SessionService();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sessionService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sessionService.shutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the service
if (require.main === module) {
  sessionService.start().catch((error) => {
    logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  });
}

export default sessionService;