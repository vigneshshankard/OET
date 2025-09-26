import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';
import Joi from 'joi';

import { environment } from './config/environment';
import logger from './utils/logger';
import { DatabaseService } from './services/database';
import { StripeService } from './services/stripe';
import {
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  BillingHistory,
  SubscriptionPlan,
  SubscriptionStatus
} from './types/billing';

class BillingServer {
  private app: express.Application;
  private databaseService: DatabaseService;
  private stripeService: StripeService;
  private redisClient: any;

  constructor() {
    this.app = express();
    this.databaseService = new DatabaseService();
    this.stripeService = new StripeService();
    this.setupRedis();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private async setupRedis(): Promise<void> {
    try {
      const redisConfig: any = {
        host: environment.REDIS_HOST,
        port: environment.REDIS_PORT,
        db: environment.REDIS_DB,
        retryStrategy: (times: number) => Math.min(times * 50, 2000)
      };

      if (environment.REDIS_PASSWORD) {
        redisConfig.password = environment.REDIS_PASSWORD;
      }

      this.redisClient = createClient(redisConfig);

      this.redisClient.on('error', (error: Error) => {
        logger.error('Redis Client Error', { code: error.name, stack: error.stack });
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis client connected');
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.error('Failed to setup Redis', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private setupMiddleware(): void {
    // Security and performance middleware
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({
      origin: environment.CORS_ORIGIN,
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: environment.RATE_LIMIT_WINDOW_MS,
      max: environment.RATE_LIMIT_MAX_REQUESTS,
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use('/api/webhooks', express.raw({ type: 'application/json' }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealthy = await this.databaseService.healthCheck();
        const redisHealthy = this.redisClient?.isOpen || false;

        const health = {
          status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: dbHealthy ? 'up' : 'down',
            redis: redisHealthy ? 'up' : 'down'
          }
        };

        res.status(health.status === 'healthy' ? 200 : 503).json(health);
      } catch (error) {
        logger.error('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(503).json({ status: 'unhealthy', error: 'Health check failed' });
      }
    });

    // API routes
    this.setupSubscriptionRoutes();
    this.setupWebhookRoutes();

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private setupSubscriptionRoutes(): void {
    const router = express.Router();

    // Get available subscription plans
    router.get('/plans', async (req, res) => {
      try {
        // In a real implementation, these would come from the database or Stripe
        const plans: SubscriptionPlan[] = [
          {
            id: 'basic',
            name: 'basic',
            displayName: 'Basic Plan',
            description: 'Perfect for getting started with OET practice',
            price: 2999, // $29.99 in cents
            currency: 'usd',
            interval: 'month',
            intervalCount: 1,
            features: [
              'Access to 50+ practice scenarios',
              'Basic progress tracking',
              'Email support'
            ],
            stripePriceId: 'price_basic_monthly',
            isActive: true
          },
          {
            id: 'premium',
            name: 'premium',
            displayName: 'Premium Plan',
            description: 'Advanced features for serious OET preparation',
            price: 4999, // $49.99 in cents
            currency: 'usd',
            interval: 'month',
            intervalCount: 1,
            features: [
              'Access to 200+ practice scenarios',
              'Advanced analytics and insights',
              'Personalized feedback reports',
              'Priority support',
              'Mock exam simulations'
            ],
            stripePriceId: 'price_premium_monthly',
            isActive: true,
            trialPeriodDays: 7
          },
          {
            id: 'annual',
            name: 'annual',
            displayName: 'Annual Plan',
            description: 'Best value with annual billing',
            price: 39999, // $399.99 in cents
            currency: 'usd',
            interval: 'year',
            intervalCount: 1,
            features: [
              'Everything in Premium',
              '2 months free',
              'Exclusive annual content updates',
              'Priority feature access'
            ],
            stripePriceId: 'price_annual_yearly',
            isActive: true
          }
        ];

        res.json({ plans });
      } catch (error) {
        logger.error('Failed to get subscription plans', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(500).json({ error: 'Failed to retrieve subscription plans' });
      }
    });

    // Create subscription
    router.post('/create', this.authenticateToken.bind(this), async (req, res) => {
      try {
        const schema = Joi.object({
          planId: Joi.string().required(),
          paymentMethodId: Joi.string().required(),
          trialPeriodDays: Joi.number().integer().min(0).max(30).optional()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }

        const createRequest: CreateSubscriptionRequest = value;
        const userId = (req as any).user.id;

        // Check if user already has an active subscription
        const existingSubscription = await this.databaseService.getSubscriptionByUserId(userId);
        if (existingSubscription && existingSubscription.status === 'active') {
          return res.status(409).json({ error: 'User already has an active subscription' });
        }

        // Get or create Stripe customer
        let stripeCustomer = await this.databaseService.getStripeCustomerByUserId(userId);
        if (!stripeCustomer) {
          const newCustomer = await this.stripeService.createCustomer({
            email: (req as any).user.email,
            name: (req as any).user.name,
            userId
          });

          stripeCustomer = await this.databaseService.createStripeCustomer({
            userId,
            stripeCustomerId: newCustomer.id,
            email: (req as any).user.email,
            name: (req as any).user.name
          });
        }

        // Map plan ID to Stripe price ID
        const planPriceMap: Record<string, string> = {
          'basic': 'price_basic_monthly',
          'premium': 'price_premium_monthly',
          'annual': 'price_annual_yearly'
        };

        const stripePriceId = planPriceMap[createRequest.planId];
        if (!stripePriceId) {
          return res.status(400).json({ error: 'Invalid plan ID' });
        }

        // Attach payment method to customer
        await this.stripeService.attachPaymentMethod(createRequest.paymentMethodId, stripeCustomer.stripeCustomerId);

        // Create Stripe subscription
        const subscriptionParams: any = {
          customerId: stripeCustomer.stripeCustomerId,
          priceId: stripePriceId,
          paymentMethodId: createRequest.paymentMethodId
        };

        if (createRequest.trialPeriodDays) {
          subscriptionParams.trialPeriodDays = createRequest.trialPeriodDays;
        }

        const stripeSubscription = await this.stripeService.createSubscription(subscriptionParams);

        // Create subscription in database
        const subscription = await this.databaseService.createSubscription({
          userId,
          planName: createRequest.planId,
          status: this.stripeService.mapStripeStatusToSubscriptionStatus(stripeSubscription.status),
          stripeCustomerId: stripeCustomer.stripeCustomerId,
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
        });

        const response: CreateSubscriptionResponse = {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString()
        };

        // Add client secret if payment requires confirmation
        const latestInvoice = stripeSubscription.latest_invoice as any;
        if (latestInvoice?.payment_intent?.client_secret) {
          response.clientSecret = latestInvoice.payment_intent.client_secret;
        }

        res.status(201).json(response);
      } catch (error) {
        logger.error('Failed to create subscription', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: (req as any).user?.id
        });
        res.status(500).json({ error: 'Failed to create subscription' });
      }
    });

    // Cancel subscription
    router.put('/cancel', this.authenticateToken.bind(this), async (req, res) => {
      try {
        const schema = Joi.object({
          reason: Joi.string().optional(),
          feedback: Joi.string().optional(),
          cancelAtPeriodEnd: Joi.boolean().default(true)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }

        const cancelRequest: CancelSubscriptionRequest = value;
        const userId = (req as any).user.id;

        // Get user's subscription
        const subscription = await this.databaseService.getSubscriptionByUserId(userId);
        if (!subscription) {
          return res.status(404).json({ error: 'No subscription found' });
        }

        if (subscription.status !== 'active') {
          return res.status(400).json({ error: 'Subscription is not active' });
        }

        // Cancel in Stripe
        const stripeSubscription = await this.stripeService.cancelSubscription(
          subscription.stripeSubscriptionId,
          cancelRequest.cancelAtPeriodEnd ?? true
        );

        // Update subscription in database
        const updatedSubscription = await this.databaseService.updateSubscription(subscription.id, {
          status: this.stripeService.mapStripeStatusToSubscriptionStatus(stripeSubscription.status)
        });

        const daysLeft = this.stripeService.calculateDaysRemaining(stripeSubscription.current_period_end);
        const effectiveEndDate = new Date(stripeSubscription.current_period_end * 1000);

        const response: CancelSubscriptionResponse = {
          cancelled: true,
          effectiveEndDate: effectiveEndDate.toISOString(),
          remainingAccess: {
            daysLeft,
            endDate: effectiveEndDate.toISOString()
          }
        };

        res.json(response);
      } catch (error) {
        logger.error('Failed to cancel subscription', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: (req as any).user?.id
        });
        res.status(500).json({ error: 'Failed to cancel subscription' });
      }
    });

    // Get billing history
    router.get('/history', this.authenticateToken.bind(this), async (req, res) => {
      try {
        const page = parseInt(req.query.page as string || '1', 10);
        const limit = parseInt(req.query.limit as string || '10', 10);
        const userId = (req as any).user.id;

        // Get user's current subscription
        const subscription = await this.databaseService.getSubscriptionByUserId(userId);
        
        let currentPlan = null;
        let transactions: any[] = [];
        let total = 0;

        if (subscription) {
          // Get current plan info
          const planInfo: any = {
            id: subscription.planName,
            name: subscription.planName,
            status: subscription.status,
            amount: 0 // This would come from the plan configuration
          };

          if (subscription.status === 'active') {
            planInfo.nextBillingDate = subscription.currentPeriodEnd.toISOString();
          }

          currentPlan = planInfo;

          // Get transactions
          const transactionResult = await this.databaseService.getTransactionsBySubscription(
            subscription.id,
            page,
            limit
          );
          
          transactions = transactionResult.transactions.map(t => ({
            id: t.id,
            date: t.createdAt.toISOString(),
            amount: t.amount,
            description: t.description,
            status: t.status,
            invoiceUrl: t.invoiceUrl
          }));
          
          total = transactionResult.total;
        }

        const response: BillingHistory = {
          currentPlan,
          transactions,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
          }
        };

        res.json(response);
      } catch (error) {
        logger.error('Failed to get billing history', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: (req as any).user?.id
        });
        res.status(500).json({ error: 'Failed to retrieve billing history' });
      }
    });

    this.app.use('/api/subscriptions', router);
  }

  private setupWebhookRoutes(): void {
    // Stripe webhook endpoint
    this.app.post('/api/webhooks/stripe', async (req, res) => {
      try {
        const signature = req.headers['stripe-signature'] as string;
        
        if (!signature) {
          return res.status(400).json({ error: 'Missing Stripe signature' });
        }

        // Construct and verify the webhook event
        const event = await this.stripeService.constructWebhookEvent(req.body, signature);

        // Store the webhook event
        await this.databaseService.createWebhookEvent({
          id: event.id,
          type: event.type,
          data: event.data
        });

        // Process the event
        await this.handleStripeWebhook(event);

        res.json({ received: true });
      } catch (error) {
        logger.error('Failed to process Stripe webhook', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        res.status(400).json({ error: 'Webhook processing failed' });
      }
    });
  }

  private async handleStripeWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          await this.handleSubscriptionChanged(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }

      // Mark as processed
      await this.databaseService.markWebhookEventProcessed(event.id);

    } catch (error) {
      logger.error('Error handling webhook event', {
        eventId: event.id,
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Mark as failed
      await this.databaseService.markWebhookEventProcessed(
        event.id,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async handleSubscriptionChanged(stripeSubscription: any): Promise<void> {
    const subscription = await this.databaseService.getSubscriptionByStripeId(stripeSubscription.id);
    
    if (subscription) {
      await this.databaseService.updateSubscription(subscription.id, {
        status: this.stripeService.mapStripeStatusToSubscriptionStatus(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
      });

      logger.info('Subscription updated from webhook', { 
        subscriptionId: subscription.id,
        status: stripeSubscription.status 
      });
    }
  }

  private async handlePaymentSucceeded(stripeInvoice: any): Promise<void> {
    const subscription = await this.databaseService.getSubscriptionByStripeId(stripeInvoice.subscription);
    
    if (subscription) {
      await this.databaseService.createTransaction({
        subscriptionId: subscription.id,
        stripeInvoiceId: stripeInvoice.id,
        amount: stripeInvoice.amount_paid,
        currency: stripeInvoice.currency,
        status: 'paid',
        description: `Payment for ${subscription.planName} subscription`,
        invoiceUrl: stripeInvoice.hosted_invoice_url,
        paidAt: new Date()
      });

      logger.info('Payment recorded from webhook', { 
        subscriptionId: subscription.id,
        amount: stripeInvoice.amount_paid 
      });
    }
  }

  private async handlePaymentFailed(stripeInvoice: any): Promise<void> {
    const subscription = await this.databaseService.getSubscriptionByStripeId(stripeInvoice.subscription);
    
    if (subscription) {
      await this.databaseService.createTransaction({
        subscriptionId: subscription.id,
        stripeInvoiceId: stripeInvoice.id,
        amount: stripeInvoice.amount_due,
        currency: stripeInvoice.currency,
        status: 'uncollectible',
        description: `Failed payment for ${subscription.planName} subscription`
      });

      logger.error('Payment failed', { 
        subscriptionId: subscription.id,
        amount: stripeInvoice.amount_due 
      });
    }
  }

  private authenticateToken(req: any, res: express.Response, next: express.NextFunction): void {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    jwt.verify(token, environment.JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        logger.error('JWT verification failed', { error: err.message });
        res.status(403).json({ error: 'Invalid or expired token' });
        return;
      }

      req.user = decoded;
      next();
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      res.status(500).json({
        error: environment.NODE_ENV === 'production' ? 'Internal server error' : error.message
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  async start(): Promise<void> {
    try {
      // Test database connection
      const dbHealthy = await this.databaseService.healthCheck();
      if (!dbHealthy) {
        throw new Error('Database connection failed');
      }

      this.app.listen(environment.PORT, () => {
        logger.info('Billing service started successfully', {
          port: environment.PORT,
          nodeEnv: environment.NODE_ENV
        });
      });
    } catch (error) {
      logger.error('Failed to start billing service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      process.exit(1);
    }
  }
}

// Start the server
const server = new BillingServer();
server.start().catch((error) => {
  logger.error('Server startup failed', { error });
  process.exit(1);
});