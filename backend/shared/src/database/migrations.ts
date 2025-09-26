import { PoolClient } from 'pg';

export interface Migration {
  id: string;
  name: string;
  up: (client: PoolClient) => Promise<void>;
  down: (client: PoolClient) => Promise<void>;
}

export class MigrationRunner {
  constructor(private client: PoolClient) {}

  async createMigrationsTable(): Promise<void> {
    await this.client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getExecutedMigrations(): Promise<string[]> {
    const result = await this.client.query('SELECT name FROM migrations ORDER BY id');
    return result.rows.map((row: any) => row.name);
  }

  async markMigrationExecuted(name: string): Promise<void> {
    await this.client.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
  }

  async removeMigrationRecord(name: string): Promise<void> {
    await this.client.query('DELETE FROM migrations WHERE name = $1', [name]);
  }

  async runMigrations(migrations: Migration[]): Promise<void> {
    await this.createMigrationsTable();
    const executed = await this.getExecutedMigrations();

    for (const migration of migrations) {
      if (!executed.includes(migration.name)) {
        try {
          await this.client.query('BEGIN');
          await migration.up(this.client);
          await this.markMigrationExecuted(migration.name);
          await this.client.query('COMMIT');
          console.log(`Migration ${migration.name} executed successfully`);
        } catch (error) {
          await this.client.query('ROLLBACK');
          console.error(`Migration ${migration.name} failed:`, error);
          throw error;
        }
      }
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    try {
      await this.client.query('BEGIN');
      await migration.down(this.client);
      await this.removeMigrationRecord(migration.name);
      await this.client.query('COMMIT');
      console.log(`Migration ${migration.name} rolled back successfully`);
    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error(`Migration rollback ${migration.name} failed:`, error);
      throw error;
    }
  }
}