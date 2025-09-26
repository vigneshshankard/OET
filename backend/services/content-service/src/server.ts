/**
 * Content Service Server
 * Express.js server with scenario management, progress tracking, and media upload
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import path from 'path';

import { environment } from './config/environment';
import { logger } from './utils/logger';
import { DatabaseService } from './services/database';
import { MediaService } from './services/media';
import { 
  ScenarioCreateRequest, 
  ScenarioUpdateRequest, 
  ProgressUpdateRequest,
  ScenarioFilters 
} from './types/content';

class ContentServer {
  private app: express.Application;
  private pool!: Pool;
  private redisClient: any;
  private databaseService!: DatabaseService;
  private mediaService: MediaService;

  constructor() {
    this.app = express();
    this.setupDatabase();
    this.setupRedis();
    this.databaseService = new DatabaseService(this.pool);
    this.mediaService = new MediaService();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupDatabase(): void {
    this.pool = new Pool({
      host: environment.DB_HOST,
      port: environment.DB_PORT,
      database: environment.DB_NAME,
      user: environment.DB_USER,
      password: environment.DB_PASSWORD,
      ssl: environment.DB_SSL,
      max: environment.DB_MAX_CONNECTIONS,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    logger.info('Database pool configured', {
      host: environment.DB_HOST,
      database: environment.DB_NAME,
      maxConnections: environment.DB_MAX_CONNECTIONS
    });
  }

  private setupRedis(): void {
    const config: any = {
      socket: {
        host: environment.REDIS_HOST,
        port: environment.REDIS_PORT,
      },
      database: environment.REDIS_DB,
    };
    
    if (environment.REDIS_PASSWORD) {
      config.password = environment.REDIS_PASSWORD;
    }
    
    this.redisClient = createClient(config);

    this.redisClient.on('error', (err: any) => {
      logger.error('Redis Client Error', err);
    });

    this.redisClient.on('connect', () => {
      logger.info('Connected to Redis', {
        host: environment.REDIS_HOST,
        database: environment.REDIS_DB
      });
    });
  }

  private setupMiddleware(): void {
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"],
        },
      },
    }));

    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use((req, res, next) => {
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      next();
    });
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

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', async (req, res) => {
      try {
        await this.pool.query('SELECT 1');
        await this.redisClient.ping();

        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'content-service',
          version: process.env.npm_package_version || '1.0.0'
        });
      } catch (error) {
        logger.error('Health check failed', { error });
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Service dependencies unavailable'
        });
      }
    });

    this.setupScenarioRoutes();
    this.setupProgressRoutes();
    this.setupMediaRoutes();
    this.app.use('/api/media/files', express.static(environment.MEDIA_UPLOAD_PATH));
  }

  private setupScenarioRoutes(): void {
    this.app.get('/api/scenarios', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const filters: ScenarioFilters = {
          profession: req.query.profession,
          difficulty: req.query.difficulty,
          category: req.query.category,
          search: req.query.search,
          isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
        };

        const result = await this.databaseService.getScenarios(filters, page, limit);
        
        return res.json({
          scenarios: result.scenarios,
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        });

      } catch (error) {
        logger.error('Failed to get scenarios', { error, userId: req.user?.id });
        return res.status(500).json({ error: 'Failed to retrieve scenarios' });
      }
    });

    this.app.get('/api/scenarios/:id', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        const scenario = await this.databaseService.getScenarioById(req.params.id);
        
        if (!scenario) {
          return res.status(404).json({ error: 'Scenario not found' });
        }

        return res.json(scenario);

      } catch (error) {
        logger.error('Failed to get scenario', { error, scenarioId: req.params.id });
        return res.status(500).json({ error: 'Failed to retrieve scenario' });
      }
    });

    this.app.post('/api/scenarios', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        const scenarioData: ScenarioCreateRequest = req.body;
        
        if (!scenarioData.title || !scenarioData.description || !scenarioData.profession) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const scenario = await this.databaseService.createScenario(
          scenarioData, 
          req.user.id
        );

        return res.status(201).json(scenario);

      } catch (error) {
        logger.error('Failed to create scenario', { error, userId: req.user?.id });
        return res.status(500).json({ error: 'Failed to create scenario' });
      }
    });

    this.app.put('/api/scenarios/:id', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        const updateData: ScenarioUpdateRequest = req.body;
        const scenario = await this.databaseService.updateScenario(req.params.id, updateData);
        
        if (!scenario) {
          return res.status(404).json({ error: 'Scenario not found' });
        }

        return res.json(scenario);

      } catch (error) {
        logger.error('Failed to update scenario', { error, scenarioId: req.params.id });
        return res.status(500).json({ error: 'Failed to update scenario' });
      }
    });
  }

  private setupProgressRoutes(): void {
    this.app.get('/api/progress/:scenarioId', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        const progress = await this.databaseService.getUserProgress(
          req.user.id, 
          req.params.scenarioId
        );

        if (!progress) {
          return res.status(404).json({ error: 'Progress not found' });
        }

        const scenario = await this.databaseService.getScenarioById(req.params.scenarioId);
        
        if (!scenario) {
          return res.status(404).json({ error: 'Scenario not found' });
        }

        let nextDialogue = null;
        if (progress.status === 'in_progress' && progress.currentDialogueId) {
          const currentIndex = scenario.dialogues.findIndex(d => d.id === progress.currentDialogueId);
          if (currentIndex >= 0 && currentIndex < scenario.dialogues.length - 1) {
            nextDialogue = scenario.dialogues[currentIndex + 1];
          }
        } else if (progress.status === 'not_started' && scenario.dialogues.length > 0) {
          nextDialogue = scenario.dialogues[0];
        }

        return res.json({
          progress,
          scenario,
          nextDialogue
        });

      } catch (error) {
        logger.error('Failed to get progress', { error, userId: req.user?.id });
        return res.status(500).json({ error: 'Failed to retrieve progress' });
      }
    });

    this.app.post('/api/progress/:scenarioId', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        const updateData: ProgressUpdateRequest = req.body;
        
        const progress = await this.databaseService.createOrUpdateProgress(
          req.user.id,
          req.params.scenarioId,
          updateData
        );

        return res.json(progress);

      } catch (error) {
        logger.error('Failed to update progress', { error, userId: req.user?.id });
        return res.status(500).json({ error: 'Failed to update progress' });
      }
    });

    this.app.get('/api/progress', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await this.databaseService.getUserProgressList(
          req.user.id,
          page,
          limit
        );

        return res.json({
          progress: result.progress,
          total: result.total,
          page,
          limit,
          totalPages: Math.ceil(result.total / limit)
        });

      } catch (error) {
        logger.error('Failed to get progress list', { error, userId: req.user?.id });
        return res.status(500).json({ error: 'Failed to retrieve progress list' });
      }
    });
  }

  private setupMediaRoutes(): void {
    const upload = this.mediaService.getUploadMiddleware();

    this.app.post('/api/media/upload', 
      this.authenticateToken.bind(this),
      upload.array('files', 5),
      async (req: any, res: any) => {
        try {
          const files = req.files as Express.Multer.File[];
          const { scenarioId, dialogueId } = req.body;

          if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
          }

          const uploadedFiles = [];

          for (const file of files) {
            let processedFile = file;
            if (file.mimetype.startsWith('image/')) {
              try {
                const processed = await this.mediaService.processImage(file.path, {
                  width: 1024,
                  height: 768,
                  quality: 85,
                  format: 'webp'
                });
                
                await this.mediaService.generateThumbnail(file.path, 200);
                
                processedFile = {
                  ...file,
                  path: processed.path,
                  size: processed.size,
                  mimetype: 'image/webp'
                };
              } catch (error) {
                logger.error('Image processing failed, using original', { error, filename: file.filename });
              }
            }

            const fileData = await this.mediaService.prepareFileData(
              processedFile,
              req.user.id,
              scenarioId,
              dialogueId
            );

            const savedFile = await this.databaseService.saveMediaFile(fileData);
            uploadedFiles.push(savedFile);
          }

          return res.status(201).json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
          });

        } catch (error) {
          logger.error('File upload failed', { error, userId: req.user?.id });
          return res.status(500).json({ error: 'File upload failed' });
        }
      }
    );

    this.app.get('/api/media/:id', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        const mediaFile = await this.databaseService.getMediaFile(req.params.id);
        
        if (!mediaFile) {
          return res.status(404).json({ error: 'Media file not found' });
        }

        return res.json(mediaFile);

      } catch (error) {
        logger.error('Failed to get media file', { error, fileId: req.params.id });
        return res.status(500).json({ error: 'Failed to retrieve media file' });
      }
    });

    this.app.delete('/api/media/:id', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        const mediaFile = await this.databaseService.getMediaFile(req.params.id);
        
        if (!mediaFile) {
          return res.status(404).json({ error: 'Media file not found' });
        }

        if (mediaFile.uploadedBy !== req.user.id && req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Access denied' });
        }

        const deleted = await this.databaseService.deleteMediaFile(req.params.id);
        
        if (!deleted) {
          return res.status(404).json({ error: 'Media file not found' });
        }

        try {
          await this.mediaService.deleteFile(mediaFile.path);
        } catch (error) {
          logger.error('Failed to delete file from filesystem', { error, path: mediaFile.path });
        }

        return res.json({ message: 'Media file deleted successfully' });

      } catch (error) {
        logger.error('Failed to delete media file', { error, fileId: req.params.id });
        return res.status(500).json({ error: 'Failed to delete media file' });
      }
    });

    this.app.get('/api/media/serve/:filename', this.authenticateToken.bind(this), async (req: any, res: any) => {
      try {
        const filename = req.params.filename;
        const filePath = path.join(environment.MEDIA_UPLOAD_PATH, filename);

        const fileStream = await this.mediaService.getFileStream(filePath);
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        
        fileStream.pipe(res);

      } catch (error) {
        logger.error('Failed to serve media file', { error, filename: req.params.filename });
        return res.status(404).json({ error: 'File not found' });
      }
    });
  }

  private setupErrorHandling(): void {
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        method: req.method,
        url: req.originalUrl
      });
    });

    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
      });

      res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message
      });
    });
  }

  public async start(): Promise<void> {
    try {
      await this.redisClient.connect();
      await this.pool.query('SELECT NOW()');
      logger.info('Database connection established');

      const port = environment.PORT;
      this.app.listen(port, () => {
        logger.info('Content Service started', {
          port,
          environment: environment.NODE_ENV,
          timestamp: new Date().toISOString()
        });
      });

      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start Content Service', { error });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down Content Service...');
    
    try {
      await this.pool.end();
      await this.redisClient.quit();
      logger.info('Content Service shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new ContentServer();
  server.start().catch((error) => {
    logger.error('Failed to start server', { error });
    process.exit(1);
  });
}

export default ContentServer;