import { createClient, RedisClientType } from 'redis';
import { RedisConfig } from '../types/common';

export class RedisCache {
  private client: RedisClientType;
  private static instance: RedisCache;

  private constructor(config: RedisConfig) {
    this.client = createClient({
      url: config.url,
      password: config.password,
      database: config.db,
      socket: {
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (err: Error) => {
      console.error('Redis client error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('ready', () => {
      console.log('Redis client ready');
    });
  }

  public static getInstance(config?: RedisConfig): RedisCache {
    if (!RedisCache.instance) {
      if (!config) {
        throw new Error('Redis configuration required for first initialization');
      }
      RedisCache.instance = new RedisCache(config);
    }
    return RedisCache.instance;
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  async set(key: string, value: string, expirationInSeconds?: number): Promise<void> {
    if (expirationInSeconds) {
      await this.client.setEx(key, expirationInSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async setObject<T>(key: string, obj: T, expirationInSeconds?: number): Promise<void> {
    const value = JSON.stringify(obj);
    await this.set(key, value, expirationInSeconds);
  }

  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async flushDb(): Promise<void> {
    await this.client.flushDb();
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  // Session-specific cache methods
  async setSession(userId: string, sessionData: any, expirationInSeconds: number = 3600): Promise<void> {
    const key = `session:${userId}`;
    await this.setObject(key, sessionData, expirationInSeconds);
  }

  async getSession<T>(userId: string): Promise<T | null> {
    const key = `session:${userId}`;
    return await this.getObject<T>(key);
  }

  async deleteSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.delete(key);
  }

  // Rate limiting methods
  async incrementRateLimit(key: string, windowSizeInSeconds: number): Promise<number> {
    const result = await this.client.incr(key);
    if (result === 1) {
      await this.expire(key, windowSizeInSeconds);
    }
    return result;
  }
}