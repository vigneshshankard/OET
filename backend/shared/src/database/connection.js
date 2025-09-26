"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const pg_1 = require("pg");
class DatabaseConnection {
    constructor(config) {
        this.pool = new pg_1.Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            min: config.pool.min,
            max: config.pool.max,
            idleTimeoutMillis: config.pool.idle,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
        // Handle pool errors
        this.pool.on('error', (err) => {
            console.error('Database pool error:', err);
        });
    }
    static getInstance(config) {
        if (!DatabaseConnection.instance) {
            if (!config) {
                throw new Error('Database configuration required for first initialization');
            }
            DatabaseConnection.instance = new DatabaseConnection(config);
        }
        return DatabaseConnection.instance;
    }
    async query(text, params) {
        const client = await this.pool.connect();
        try {
            return await client.query(text, params);
        }
        finally {
            client.release();
        }
    }
    async queryWithConfig(config) {
        const client = await this.pool.connect();
        try {
            return await client.query(config);
        }
        finally {
            client.release();
        }
    }
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async getClient() {
        return this.pool.connect();
    }
    async close() {
        await this.pool.end();
    }
    async testConnection() {
        try {
            const result = await this.query('SELECT 1 as test');
            return result.rows[0].test === 1;
        }
        catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
}
exports.DatabaseConnection = DatabaseConnection;
//# sourceMappingURL=connection.js.map