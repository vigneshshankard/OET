import { Pool, PoolClient } from 'pg';
import { environment } from '../config/environment';
import logger from '../utils/logger';
import {
  Subscription,
  SubscriptionPlan,
  Transaction,
  StripeCustomer,
  Usage,
  WebhookEvent,
  SubscriptionStatus,
  TransactionStatus
} from '../types/billing';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: environment.DB_HOST,
      port: environment.DB_PORT,
      database: environment.DB_NAME,
      user: environment.DB_USER,
      password: environment.DB_PASSWORD,
      max: environment.DB_MAX_CONNECTIONS,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    logger.info('Database pool configured', {
      host: environment.DB_HOST,
      database: environment.DB_NAME,
      maxConnections: environment.DB_MAX_CONNECTIONS
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('Database health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  // Subscription Management
  async createSubscription(subscriptionData: {
    userId: string;
    planName: string;
    status: SubscriptionStatus;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<Subscription> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const subscriptionId = crypto.randomUUID();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO subscriptions 
         (id, user_id, plan_name, status, stripe_customer_id, stripe_subscription_id,
          current_period_start, current_period_end, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          subscriptionId,
          subscriptionData.userId,
          subscriptionData.planName,
          subscriptionData.status,
          subscriptionData.stripeCustomerId,
          subscriptionData.stripeSubscriptionId,
          subscriptionData.currentPeriodStart,
          subscriptionData.currentPeriodEnd,
          now,
          now
        ]
      );

      await client.query('COMMIT');

      logger.info('Subscription created', { subscriptionId, userId: subscriptionData.userId });
      return this.mapSubscriptionRow(result.rows[0]);

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: subscriptionData.userId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapSubscriptionRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get subscription by user ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1',
        [stripeSubscriptionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapSubscriptionRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get subscription by Stripe ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stripeSubscriptionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const client = await this.pool.connect();
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'createdAt') {
          const dbKey = this.camelToSnakeCase(key);
          updateFields.push(`${dbKey} = $${paramCount}`);
          updateValues.push(value);
          paramCount++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());
      updateValues.push(subscriptionId);

      const query = `
        UPDATE subscriptions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await client.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      logger.info('Subscription updated', { subscriptionId });
      return this.mapSubscriptionRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to update subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, { 
      status: 'cancelled' as SubscriptionStatus 
    });
  }

  // Stripe Customer Management
  async createStripeCustomer(customerData: {
    userId: string;
    stripeCustomerId: string;
    email: string;
    name?: string;
  }): Promise<StripeCustomer> {
    const client = await this.pool.connect();
    try {
      const customerId = crypto.randomUUID();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO stripe_customers 
         (id, user_id, stripe_customer_id, email, name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          customerId,
          customerData.userId,
          customerData.stripeCustomerId,
          customerData.email,
          customerData.name,
          now,
          now
        ]
      );

      logger.info('Stripe customer created', { customerId, userId: customerData.userId });
      return this.mapStripeCustomerRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: customerData.userId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getStripeCustomerByUserId(userId: string): Promise<StripeCustomer | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM stripe_customers WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapStripeCustomerRow(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get Stripe customer by user ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Transaction Management
  async createTransaction(transactionData: {
    subscriptionId: string;
    stripeInvoiceId: string;
    amount: number;
    currency: string;
    status: TransactionStatus;
    description: string;
    invoiceUrl?: string;
    paidAt?: Date;
  }): Promise<Transaction> {
    const client = await this.pool.connect();
    try {
      const transactionId = crypto.randomUUID();
      const now = new Date();

      const result = await client.query(
        `INSERT INTO transactions 
         (id, subscription_id, stripe_invoice_id, amount, currency, status, 
          description, invoice_url, paid_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          transactionId,
          transactionData.subscriptionId,
          transactionData.stripeInvoiceId,
          transactionData.amount,
          transactionData.currency,
          transactionData.status,
          transactionData.description,
          transactionData.invoiceUrl,
          transactionData.paidAt,
          now
        ]
      );

      logger.info('Transaction created', { transactionId, subscriptionId: transactionData.subscriptionId });
      return this.mapTransactionRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to create transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId: transactionData.subscriptionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async getTransactionsBySubscription(
    subscriptionId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await client.query(
        'SELECT COUNT(*) FROM transactions WHERE subscription_id = $1',
        [subscriptionId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get transactions
      const result = await client.query(
        `SELECT * FROM transactions 
         WHERE subscription_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [subscriptionId, limit, offset]
      );

      const transactions = result.rows.map(row => this.mapTransactionRow(row));

      return { transactions, total };
    } catch (error) {
      logger.error('Failed to get transactions by subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Webhook Event Management
  async createWebhookEvent(eventData: {
    id: string;
    type: string;
    data: any;
  }): Promise<WebhookEvent> {
    const client = await this.pool.connect();
    try {
      const now = new Date();

      const result = await client.query(
        `INSERT INTO webhook_events 
         (id, type, data, processed, retry_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          eventData.id,
          eventData.type,
          JSON.stringify(eventData.data),
          false,
          0,
          now
        ]
      );

      logger.info('Webhook event created', { eventId: eventData.id, type: eventData.type });
      return this.mapWebhookEventRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to create webhook event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId: eventData.id
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async markWebhookEventProcessed(eventId: string, error?: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const now = new Date();
      
      if (error) {
        await client.query(
          `UPDATE webhook_events 
           SET retry_count = retry_count + 1, error = $2, updated_at = $3
           WHERE id = $1`,
          [eventId, error, now]
        );
      } else {
        await client.query(
          `UPDATE webhook_events 
           SET processed = true, processed_at = $2, updated_at = $3
           WHERE id = $1`,
          [eventId, now, now]
        );
      }

      logger.info('Webhook event updated', { eventId, processed: !error });

    } catch (error) {
      logger.error('Failed to update webhook event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Usage Tracking
  async recordUsage(usageData: {
    subscriptionId: string;
    period: string;
    practiceMinutes?: number;
    scenariosAccessed?: number;
    reportsGenerated?: number;
  }): Promise<Usage> {
    const client = await this.pool.connect();
    try {
      const now = new Date();

      // Try to update existing usage record first
      const updateResult = await client.query(
        `UPDATE usage_tracking 
         SET practice_minutes = COALESCE(practice_minutes, 0) + COALESCE($3, 0),
             scenarios_accessed = COALESCE(scenarios_accessed, 0) + COALESCE($4, 0),
             reports_generated = COALESCE(reports_generated, 0) + COALESCE($5, 0),
             updated_at = $6
         WHERE subscription_id = $1 AND period = $2
         RETURNING *`,
        [
          usageData.subscriptionId,
          usageData.period,
          usageData.practiceMinutes || 0,
          usageData.scenariosAccessed || 0,
          usageData.reportsGenerated || 0,
          now
        ]
      );

      if (updateResult.rows.length > 0) {
        return this.mapUsageRow(updateResult.rows[0]);
      }

      // Create new usage record if none exists
      const result = await client.query(
        `INSERT INTO usage_tracking 
         (subscription_id, period, practice_minutes, scenarios_accessed, reports_generated, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          usageData.subscriptionId,
          usageData.period,
          usageData.practiceMinutes || 0,
          usageData.scenariosAccessed || 0,
          usageData.reportsGenerated || 0,
          now
        ]
      );

      logger.info('Usage recorded', { 
        subscriptionId: usageData.subscriptionId, 
        period: usageData.period 
      });
      return this.mapUsageRow(result.rows[0]);

    } catch (error) {
      logger.error('Failed to record usage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId: usageData.subscriptionId
      });
      throw error;
    } finally {
      client.release();
    }
  }

  // Utility Methods
  private mapSubscriptionRow(row: any): Subscription {
    return {
      id: row.id,
      userId: row.user_id,
      planName: row.plan_name,
      status: row.status,
      stripeCustomerId: row.stripe_customer_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      currentPeriodStart: new Date(row.current_period_start),
      currentPeriodEnd: new Date(row.current_period_end),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapStripeCustomerRow(row: any): StripeCustomer {
    return {
      id: row.id,
      userId: row.user_id,
      stripeCustomerId: row.stripe_customer_id,
      email: row.email,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapTransactionRow(row: any): Transaction {
    const transaction: any = {
      id: row.id,
      subscriptionId: row.subscription_id,
      stripeInvoiceId: row.stripe_invoice_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      description: row.description,
      invoiceUrl: row.invoice_url,
      createdAt: new Date(row.created_at)
    };

    if (row.paid_at) {
      transaction.paidAt = new Date(row.paid_at);
    }

    return transaction;
  }

  private mapWebhookEventRow(row: any): WebhookEvent {
    const event: any = {
      id: row.id,
      type: row.type,
      data: JSON.parse(row.data),
      processed: row.processed,
      error: row.error,
      retryCount: row.retry_count,
      createdAt: new Date(row.created_at)
    };

    if (row.processed_at) {
      event.processedAt = new Date(row.processed_at);
    }

    return event;
  }

  private mapUsageRow(row: any): Usage {
    return {
      subscriptionId: row.subscription_id,
      period: row.period,
      practiceMinutes: row.practice_minutes,
      scenariosAccessed: row.scenarios_accessed,
      reportsGenerated: row.reports_generated,
      createdAt: new Date(row.created_at)
    };
  }

  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}