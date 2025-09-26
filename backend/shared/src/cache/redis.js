"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const redis_1 = require("redis");
class RedisCache {
    constructor(config) {
        this.client = (0, redis_1.createClient)({
            url: config.url,
            password: config.password,
            database: config.db,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 500),
            },
        });
        this.client.on('error', (err) => {
            console.error('Redis client error:', err);
        });
        this.client.on('connect', () => {
            console.log('Redis client connected');
        });
        this.client.on('ready', () => {
            console.log('Redis client ready');
        });
    }
    static getInstance(config) {
        if (!RedisCache.instance) {
            if (!config) {
                throw new Error('Redis configuration required for first initialization');
            }
            RedisCache.instance = new RedisCache(config);
        }
        return RedisCache.instance;
    }
    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }
    async disconnect() {
        if (this.client.isOpen) {
            await this.client.disconnect();
        }
    }
    async set(key, value, expirationInSeconds) {
        if (expirationInSeconds) {
            await this.client.setEx(key, expirationInSeconds, value);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async get(key) {
        return await this.client.get(key);
    }
    async setObject(key, obj, expirationInSeconds) {
        const value = JSON.stringify(obj);
        await this.set(key, value, expirationInSeconds);
    }
    async getObject(key) {
        const value = await this.get(key);
        return value ? JSON.parse(value) : null;
    }
    async delete(key) {
        await this.client.del(key);
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    async expire(key, seconds) {
        await this.client.expire(key, seconds);
    }
    async ttl(key) {
        return await this.client.ttl(key);
    }
    async keys(pattern) {
        return await this.client.keys(pattern);
    }
    async flushDb() {
        await this.client.flushDb();
    }
    async ping() {
        return await this.client.ping();
    }
    // Session-specific cache methods
    async setSession(userId, sessionData, expirationInSeconds = 3600) {
        const key = `session:${userId}`;
        await this.setObject(key, sessionData, expirationInSeconds);
    }
    async getSession(userId) {
        const key = `session:${userId}`;
        return await this.getObject(key);
    }
    async deleteSession(userId) {
        const key = `session:${userId}`;
        await this.delete(key);
    }
    // Rate limiting methods
    async incrementRateLimit(key, windowSizeInSeconds) {
        const result = await this.client.incr(key);
        if (result === 1) {
            await this.expire(key, windowSizeInSeconds);
        }
        return result;
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=redis.js.map