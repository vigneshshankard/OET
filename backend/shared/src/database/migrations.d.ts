import { PoolClient } from 'pg';
export interface Migration {
    id: string;
    name: string;
    up: (client: PoolClient) => Promise<void>;
    down: (client: PoolClient) => Promise<void>;
}
export declare class MigrationRunner {
    private client;
    constructor(client: PoolClient);
    createMigrationsTable(): Promise<void>;
    getExecutedMigrations(): Promise<string[]>;
    markMigrationExecuted(name: string): Promise<void>;
    removeMigrationRecord(name: string): Promise<void>;
    runMigrations(migrations: Migration[]): Promise<void>;
    rollbackMigration(migration: Migration): Promise<void>;
}
//# sourceMappingURL=migrations.d.ts.map