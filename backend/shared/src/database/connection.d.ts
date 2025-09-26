import { PoolClient, QueryConfig, QueryResult, QueryResultRow } from 'pg';
import { DatabaseConfig } from '../types/common';
export declare class DatabaseConnection {
    private pool;
    private static instance;
    private constructor();
    static getInstance(config?: DatabaseConfig): DatabaseConnection;
    query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    queryWithConfig<T extends QueryResultRow = any>(config: QueryConfig): Promise<QueryResult<T>>;
    transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
    getClient(): Promise<PoolClient>;
    close(): Promise<void>;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=connection.d.ts.map