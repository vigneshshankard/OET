import { RedisConfig } from '../types/common';
export declare class RedisCache {
    private client;
    private static instance;
    private constructor();
    static getInstance(config?: RedisConfig): RedisCache;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: string, expirationInSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    setObject<T>(key: string, obj: T, expirationInSeconds?: number): Promise<void>;
    getObject<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, seconds: number): Promise<void>;
    ttl(key: string): Promise<number>;
    keys(pattern: string): Promise<string[]>;
    flushDb(): Promise<void>;
    ping(): Promise<string>;
    setSession(userId: string, sessionData: any, expirationInSeconds?: number): Promise<void>;
    getSession<T>(userId: string): Promise<T | null>;
    deleteSession(userId: string): Promise<void>;
    incrementRateLimit(key: string, windowSizeInSeconds: number): Promise<number>;
}
//# sourceMappingURL=redis.d.ts.map