/**
 * Extended Express types for User Service
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';

declare global {
  namespace Express {
    interface Request {
      database: Pool;
      cache: RedisClientType;
    }
  }
}

export {};