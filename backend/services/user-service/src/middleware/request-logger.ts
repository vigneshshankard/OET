/**
 * Request logging middleware for User Service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Add request ID to headers
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  (res as any).end = function(chunk?: any, encoding?: any, cb?: () => void) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return originalEnd.call(res, chunk, encoding, cb);
  };

  next();
};