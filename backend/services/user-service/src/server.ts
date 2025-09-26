/**
 * User Service Server
 * 
 * Node.js/Express microservice for user management
 * Based on api-specification.md user endpoints
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import healthRoutes from './routes/health';

class UserService {
  private app: express.Application;
  private database!: Pool;
  private cache!: RedisClientType;

  constructor() {
    this.app = express();
    this.setupDatabase();
    this.setupCache();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupDatabase(): void {
    this.database = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    this.database.on('error', (err: Error) => {
      logger.error('Database pool error', { error: err.message });
    });
  }

  private setupCache(): void {
    this.cache = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
      database: config.redis.db,
    });

    this.cache.on('error', (err: Error) => {
      logger.error('Redis client error', { error: err.message });
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
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimiting.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Request logging
    this.app.use(requestLogger);

    // Make database and cache available in request context
    this.app.use((req, res, next) => {
      req.database = this.database;
      req.cache = this.cache;
      next();
    });
  }

  private setupRoutes(): void {
    // Health checks
    this.app.use('/health', healthRoutes);

    // API routes
    this.app.use('/auth', authRoutes);
    this.app.use('/users', userRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'OET Praxis User Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await this.database.query('SELECT 1');
      logger.info('Database connected successfully');

      // Connect Redis
      if (!this.cache.isOpen) {
        await this.cache.connect();
      }
      logger.info('Redis cache connected successfully');

      // Start HTTP server
      const port = config.server.port;
      this.app.listen(port, () => {
        logger.info(`User Service running on port ${port}`, {
          service: 'user-service',
          port,
          environment: config.server.environment,
        });
      });

    } catch (error) {
      const err = error as Error;
      logger.error('Failed to start User Service', { error: err.message });
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.database.end();
      if (this.cache.isOpen) {
        await this.cache.disconnect();
      }
      logger.info('User Service shutdown completed');
    } catch (error) {
      const err = error as Error;
      logger.error('Error during shutdown', { error: err.message });
    }
  }
}

// Initialize and start the service
const userService = new UserService();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await userService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await userService.shutdown();
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
  userService.start().catch((error) => {
    logger.error('Failed to start service', { error: error.message });
    process.exit(1);
  });
}

export default userService;