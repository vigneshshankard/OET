import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logLevel,
  ...(config.nodeEnv === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  }),
});

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createServiceResponse = <T>(
  data?: T,
  error?: { code: string; message: string; details?: any }
) => ({
  success: !error,
  data,
  error,
  timestamp: new Date().toISOString(),
});