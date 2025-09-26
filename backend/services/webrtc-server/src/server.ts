import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import Joi from 'joi';
import axios from 'axios';

import { environment } from './config/environment';
import logger from './utils/logger';
import { DatabaseService } from './services/database';
import { LiveKitService } from './services/livekit';
import {
  CreateSessionRequest,
  CreateSessionResponse,
  SessionWebSocketEvent,
  AudioChunk,
  AIResponse,
  AudioQuality,
  TTSChunk,
  SessionError,
  PracticeSession,
  SessionStatus
} from './types/session';

class WebRTCServer {
  private app: express.Application;
  private server: any;
  private io!: SocketIOServer;
  private databaseService: DatabaseService;
  private livekitService: LiveKitService;
  private redisClient: any;
  private activeConnections: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private sessionSequences: Map<string, number> = new Map(); // sessionId -> sequence counter

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.databaseService = new DatabaseService();
    this.livekitService = new LiveKitService();
    this.setupRedis();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  private async setupRedis(): Promise<void> {
    try {
      const redisConfig: any = {
        host: environment.REDIS_HOST,
        port: environment.REDIS_PORT,
        db: environment.REDIS_DB,
        retryStrategy: (times: number) => Math.min(times * 50, 2000)
      };

      if (environment.REDIS_PASSWORD) {
        redisConfig.password = environment.REDIS_PASSWORD;
      }

      this.redisClient = createClient(redisConfig);

      this.redisClient.on('error', (error: Error) => {
        logger.error('Redis Client Error', { code: error.name, stack: error.stack });
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis client connected');
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.error('Failed to setup Redis', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private setupMiddleware(): void {
    // Security and performance middleware
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({
      origin: environment.CORS_ORIGIN,
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: environment.RATE_LIMIT_WINDOW_MS,
      max: environment.RATE_LIMIT_MAX_REQUESTS,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealthy = await this.databaseService.healthCheck();
        const livekitHealthy = await this.livekitService.healthCheck();
        const redisHealthy = this.redisClient?.isOpen || false;

        const health = {
          status: dbHealthy && livekitHealthy && redisHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: dbHealthy ? 'up' : 'down',
            livekit: livekitHealthy ? 'up' : 'down',
            redis: redisHealthy ? 'up' : 'down'
          }
        };

        res.status(health.status === 'healthy' ? 200 : 503).json(health);
      } catch (error) {
        logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(503).json({ status: 'unhealthy', error: 'Health check failed' });
      }
    });

    // Session management routes
    this.setupSessionRoutes();

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private setupSessionRoutes(): void {
    const router = express.Router();

    // Create new practice session
    router.post('/create', this.authenticateToken.bind(this), async (req, res) => {
      try {
        const schema = Joi.object({
          scenarioId: Joi.string().uuid().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }

        const createRequest: CreateSessionRequest = value;
        const userId = (req as any).user.id;

        // Check for existing active sessions
        const activeSessions = await this.databaseService.getActiveSessionsByUser(userId);
        if (activeSessions.length >= 3) { // Limit concurrent sessions
          return res.status(429).json({ 
            error: 'Too many active sessions. Please complete or cancel existing sessions first.' 
          });
        }

        // Create LiveKit room
        const sessionId = crypto.randomUUID();
        const room = await this.livekitService.ensureRoom(sessionId, {
          maxParticipants: 2, // User + AI
          metadata: {
            sessionId,
            scenarioId: createRequest.scenarioId,
            userId
          }
        });

        // Generate LiveKit token for user
        const userIdentity = this.livekitService.generateParticipantIdentity(userId, 'user');
        const livekitToken = this.livekitService.generateAccessToken(
          userIdentity,
          room.name!,
          { role: 'user', sessionId }
        );

        // Create session in database
        const session = await this.databaseService.createSession({
          userId,
          scenarioId: createRequest.scenarioId,
          livekitRoomName: room.name!,
          livekitToken
        });

        // Get scenario details (would normally come from Content Service)
        const scenario = {
          id: createRequest.scenarioId,
          title: 'Sample OET Practice Scenario',
          instructions: 'Begin your consultation with the patient. Listen carefully and respond professionally.'
        };

        const response: CreateSessionResponse = {
          sessionId: session.id,
          websocketUrl: `/sessions/${session.id}/stream`,
          livekitUrl: environment.LIVEKIT_WS_URL,
          livekitToken,
          scenario
        };

        // Initialize session sequence counter
        this.sessionSequences.set(sessionId, 0);

        logger.info('Practice session created successfully', {
          sessionId,
          userId,
          scenarioId: createRequest.scenarioId,
          roomName: room.name
        });

        res.status(201).json(response);
      } catch (error) {
        logger.error('Failed to create practice session', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: (req as any).user?.id
        });
        res.status(500).json({ error: 'Failed to create practice session' });
      }
    });

    // Complete practice session
    router.post('/:sessionId/complete', this.authenticateToken.bind(this), async (req, res) => {
      try {
        const sessionId = req.params.sessionId;
        const userId = (req as any).user.id;

        // Get session and verify ownership
        const session = await this.databaseService.getSessionById(sessionId);
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        if (session.userId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        if (session.status !== 'active') {
          return res.status(400).json({ error: 'Session is not active' });
        }

        // Calculate duration
        const duration = Math.round((Date.now() - session.startTime.getTime()) / 1000);

        // Complete session
        const completedSession = await this.databaseService.completeSession(sessionId, duration);

        // Cleanup LiveKit room
        await this.livekitService.cleanupRoom(sessionId);

        // Cleanup session data
        this.sessionSequences.delete(sessionId);

        logger.info('Practice session completed', {
          sessionId,
          userId,
          duration
        });

        res.json({
          sessionId,
          duration,
          feedbackReportId: crypto.randomUUID() // Would be generated by AI service
        });
      } catch (error) {
        logger.error('Failed to complete practice session', {
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId: req.params.sessionId
        });
        res.status(500).json({ error: 'Failed to complete practice session' });
      }
    });

    // Cancel practice session
    router.delete('/:sessionId', this.authenticateToken.bind(this), async (req, res) => {
      try {
        const sessionId = req.params.sessionId;
        const userId = (req as any).user.id;

        // Get session and verify ownership
        const session = await this.databaseService.getSessionById(sessionId);
        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        if (session.userId !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }

        if (session.status !== 'active') {
          return res.status(400).json({ error: 'Session is not active' });
        }

        // Cancel session
        await this.databaseService.cancelSession(sessionId);

        // Cleanup LiveKit room
        await this.livekitService.cleanupRoom(sessionId);

        // Cleanup session data
        this.sessionSequences.delete(sessionId);

        logger.info('Practice session cancelled', {
          sessionId,
          userId
        });

        res.json({
          cancelled: true,
          message: 'Session cancelled successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Failed to cancel practice session', {
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId: req.params.sessionId
        });
        res.status(500).json({ error: 'Failed to cancel practice session' });
      }
    });

    // Get recent sessions
    router.get('/recent', this.authenticateToken.bind(this), async (req, res) => {
      try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string || '1', 10);
        const limit = parseInt(req.query.limit as string || '10', 10);
        const status = req.query.status as SessionStatus | undefined;

        const result = await this.databaseService.getRecentSessions(userId, page, limit, status);

        const response = {
          sessions: result.sessions.map(session => ({
            id: session.id,
            scenarioId: session.scenarioId,
            scenarioTitle: 'Sample Scenario', // Would come from Content Service
            startTime: session.startTime.toISOString(),
            endTime: session.endTime?.toISOString(),
            status: session.status,
            duration: session.duration || 0,
            score: 0 // Would come from AI analysis
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(result.total / limit),
            totalItems: result.total
          }
        };

        res.json(response);
      } catch (error) {
        logger.error('Failed to get recent sessions', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: (req as any).user?.id
        });
        res.status(500).json({ error: 'Failed to retrieve recent sessions' });
      }
    });

    this.app.use('/api/sessions', router);
  }

  private setupSocketIO(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: environment.CORS_ORIGIN,
        methods: ['GET', 'POST']
      },
      pingTimeout: environment.WEBSOCKET_PING_TIMEOUT,
      pingInterval: environment.WEBSOCKET_PING_INTERVAL
    });

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, environment.JWT_SECRET) as any;
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.user.id;
      
      logger.info('Socket connected', {
        socketId: socket.id,
        userId
      });

      // Track user connections
      if (!this.activeConnections.has(userId)) {
        this.activeConnections.set(userId, new Set());
      }
      this.activeConnections.get(userId)!.add(socket.id);

      // Check connection limit per user
      const userConnections = this.activeConnections.get(userId)!;
      if (userConnections.size > environment.MAX_CONNECTIONS_PER_USER) {
        socket.emit('error', {
          type: 'connection_limit',
          message: 'Too many connections for this user'
        });
        socket.disconnect();
        return;
      }

      // Join session room
      socket.on('join_session', async (data) => {
        try {
          const { sessionId } = data;
          
          // Verify session ownership
          const session = await this.databaseService.getSessionById(sessionId);
          if (!session || session.userId !== userId) {
            socket.emit('error', {
              type: 'session_access_denied',
              message: 'Access denied to this session'
            });
            return;
          }

          if (session.status !== 'active') {
            socket.emit('error', {
              type: 'session_inactive',
              message: 'Session is not active'
            });
            return;
          }

          socket.join(sessionId);
          socket.data.sessionId = sessionId;

          logger.info('Socket joined session', {
            socketId: socket.id,
            userId,
            sessionId
          });

          socket.emit('session_joined', { sessionId });
        } catch (error) {
          logger.error('Failed to join session', {
            error: error instanceof Error ? error.message : 'Unknown error',
            socketId: socket.id,
            userId
          });
          socket.emit('error', {
            type: 'join_session_error',
            message: 'Failed to join session'
          });
        }
      });

      // Handle audio chunks
      socket.on('audio', async (data: AudioChunk) => {
        try {
          const sessionId = socket.data.sessionId;
          if (!sessionId) {
            socket.emit('error', {
              type: 'no_session',
              message: 'No active session'
            });
            return;
          }

          // Get and increment sequence number
          const currentSequence = this.sessionSequences.get(sessionId) || 0;
          const sequence = currentSequence + 1;
          this.sessionSequences.set(sessionId, sequence);

          // Save audio message (without storing actual audio data)
          await this.databaseService.saveSessionMessage({
            sessionId,
            type: 'audio',
            data: { 
              timestamp: Date.now(),
              sequence,
              size: data.data.length 
            }, // Don't store audio data
            userId,
            sequence
          });

          // Process audio with AI service (mock implementation)
          this.processAudioWithAI(sessionId, data, socket);

          logger.debug('Audio chunk processed', {
            sessionId,
            userId,
            sequence,
            dataSize: data.data.length
          });
        } catch (error) {
          logger.error('Failed to process audio', {
            error: error instanceof Error ? error.message : 'Unknown error',
            sessionId: socket.data.sessionId,
            userId
          });
          socket.emit('error', {
            type: 'audio_processing_error',
            message: 'Failed to process audio'
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('Socket disconnected', {
          socketId: socket.id,
          userId,
          sessionId: socket.data.sessionId
        });

        // Remove from active connections
        const userConnections = this.activeConnections.get(userId);
        if (userConnections) {
          userConnections.delete(socket.id);
          if (userConnections.size === 0) {
            this.activeConnections.delete(userId);
          }
        }

        // Leave session room
        if (socket.data.sessionId) {
          socket.leave(socket.data.sessionId);
        }
      });
    });
  }

  private async processAudioWithAI(
    sessionId: string, 
    audioChunk: AudioChunk, 
    socket: any
  ): Promise<void> {
    try {
      // Mock AI processing - in real implementation, this would:
      // 1. Send audio to speech-to-text service
      // 2. Process with LLM for response generation
      // 3. Convert response to speech with TTS
      // 4. Send back as TTS chunks

      // Simulate processing delay
      setTimeout(async () => {
        // Mock AI response
        const aiResponse: AIResponse = {
          type: 'response',
          text: 'Thank you for sharing that with me. Can you tell me more about when this started?',
          timestamp: Date.now(),
          confidence: 0.95
        };

        // Save AI response
        const sequence = (this.sessionSequences.get(sessionId) || 0) + 1;
        this.sessionSequences.set(sessionId, sequence);

        await this.databaseService.saveSessionMessage({
          sessionId,
          type: 'response',
          data: aiResponse,
          userId: 'ai-system',
          sequence
        });

        // Send response to client
        socket.emit('response', aiResponse);

        // Simulate TTS chunks (ephemeral audio)
        for (let i = 1; i <= 3; i++) {
          setTimeout(() => {
            const ttsChunk: TTSChunk = {
              type: 'tts_chunk',
              data: `mock-audio-chunk-${i}`, // Base64 encoded audio chunk
              sequence: i,
              timestamp: Date.now(),
              final: i === 3
            };
            socket.emit('tts_chunk', ttsChunk);
          }, i * 200);
        }

        // Simulate audio quality feedback
        setTimeout(() => {
          const audioQuality: AudioQuality = {
            type: 'audio_quality',
            status: Math.random() > 0.8 ? 'poor' : 'good',
            confidence: 0.92,
            timestamp: Date.now()
          };
          socket.emit('audio_quality', audioQuality);
        }, 500);

      }, Math.random() * 1000 + 500); // 500-1500ms delay

    } catch (error) {
      logger.error('AI processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });

      const errorResponse: SessionError = {
        type: 'error',
        code: 'AI_PROCESSING_ERROR',
        message: 'Failed to process audio with AI',
        timestamp: Date.now()
      };

      socket.emit('error', errorResponse);
    }
  }

  private authenticateToken(req: any, res: express.Response, next: express.NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(token, environment.JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        logger.error('JWT verification failed', { error: err.message });
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = decoded;
      next();
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      res.status(500).json({
        error: environment.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    try {
      // Test database connection
      const dbHealthy = await this.databaseService.healthCheck();
      if (!dbHealthy) {
        throw new Error('Database connection failed');
      }

      // Test LiveKit connection
      const livekitHealthy = await this.livekitService.healthCheck();
      if (!livekitHealthy) {
        logger.warn('LiveKit connection failed - service will start but WebRTC features may not work');
      }

      this.server.listen(environment.PORT, () => {
        logger.info('WebRTC server started successfully', {
          port: environment.PORT,
          nodeEnv: environment.NODE_ENV,
          livekitHost: environment.LIVEKIT_HOST
        });
      });
    } catch (error) {
      logger.error('Failed to start WebRTC server', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  }
}

// Start the server
const server = new WebRTCServer();
server.start().catch((error) => {
  logger.error('Server startup failed', { error });
  process.exit(1);
});