import * as winston from 'winston';

export interface LoggerConfig {
  level: string;
  service: string;
  environment: string;
}

export class Logger {
  private logger: winston.Logger;
  private static instance: Logger;

  private constructor(config: LoggerConfig) {
    const formats = [
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ];

    // Add colorization for development
    if (config.environment === 'development') {
      formats.unshift(winston.format.colorize());
      formats.push(winston.format.simple());
    }

    this.logger = winston.createLogger({
      level: config.level || 'info',
      format: winston.format.combine(...formats),
      defaultMeta: {
        service: config.service,
        environment: config.environment,
      },
      transports: [
        new winston.transports.Console({
          handleExceptions: true,
          handleRejections: true,
        }),
      ],
    });

    // Add file transport for production
    if (config.environment === 'production') {
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );

      this.logger.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }
  }

  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      if (!config) {
        throw new Error('Logger configuration required for first initialization');
      }
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error | any, meta?: any): void {
    this.logger.error(message, { error, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: any): void {
    this.logger.verbose(message, meta);
  }

  // Structured logging methods
  logRequest(req: any, res: any, responseTime?: number): void {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      statusCode: res.statusCode,
      responseTime: responseTime || 0,
      userId: req.user?.id,
    });
  }

  logError(error: Error, context?: any): void {
    this.error('Application Error', error, {
      stack: error.stack,
      name: error.name,
      context,
    });
  }

  logAuth(action: string, userId: string, success: boolean, details?: any): void {
    this.info('Authentication Event', {
      action,
      userId,
      success,
      details,
    });
  }

  logDatabase(operation: string, table: string, duration?: number, error?: Error): void {
    if (error) {
      this.error('Database Error', error, {
        operation,
        table,
        duration,
      });
    } else {
      this.debug('Database Operation', {
        operation,
        table,
        duration,
      });
    }
  }

  logAI(operation: string, model: string, duration?: number, tokens?: number): void {
    this.info('AI Operation', {
      operation,
      model,
      duration,
      tokens,
    });
  }
}