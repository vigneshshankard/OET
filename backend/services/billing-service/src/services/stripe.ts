import Stripe from 'stripe';
import { environment } from '../config/environment';
import logger from '../utils/logger';
import {
  SubscriptionPlan,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  PaymentMethod,
  SubscriptionStatus
} from '../types/billing';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(environment.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    
    logger.info('Stripe service initialized');
  }

  // Customer Management
  async createCustomer(params: {
    email: string;
    name?: string;
    userId: string;
  }): Promise<Stripe.Customer> {
    try {
      const customerParams: any = {
        email: params.email,
        metadata: {
          userId: params.userId
        }
      };

      if (params.name) {
        customerParams.name = params.name;
      }

      const customer = await this.stripe.customers.create(customerParams);

      logger.info('Stripe customer created', { 
        customerId: customer.id, 
        userId: params.userId 
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: params.userId
      });
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
      return customer;
    } catch (error) {
      logger.error('Failed to retrieve Stripe customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId
      });
      throw error;
    }
  }

  async updateCustomer(customerId: string, params: {
    email?: string;
    name?: string;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, params);
      
      logger.info('Stripe customer updated', { customerId });
      return customer;
    } catch (error) {
      logger.error('Failed to update Stripe customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId
      });
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    paymentMethodId?: string;
    trialPeriodDays?: number;
  }): Promise<Stripe.Subscription> {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      };

      if (params.paymentMethodId) {
        subscriptionParams.default_payment_method = params.paymentMethodId;
      }

      if (params.trialPeriodDays) {
        subscriptionParams.trial_period_days = params.trialPeriodDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      logger.info('Stripe subscription created', { 
        subscriptionId: subscription.id,
        customerId: params.customerId
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create Stripe subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: params.customerId
      });
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve Stripe subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId
      });
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, params: {
    priceId?: string;
    cancelAtPeriodEnd?: boolean;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    try {
      const updateParams: Stripe.SubscriptionUpdateParams = {};

      if (params.priceId) {
        updateParams.items = [{ price: params.priceId }];
      }

      if (params.cancelAtPeriodEnd !== undefined) {
        updateParams.cancel_at_period_end = params.cancelAtPeriodEnd;
      }

      if (params.metadata) {
        updateParams.metadata = params.metadata;
      }

      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateParams);

      logger.info('Stripe subscription updated', { subscriptionId });
      return subscription;
    } catch (error) {
      logger.error('Failed to update Stripe subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId
      });
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Stripe.Subscription> {
    try {
      let subscription: Stripe.Subscription;

      if (cancelAtPeriodEnd) {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      } else {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      }

      logger.info('Stripe subscription cancelled', { 
        subscriptionId, 
        cancelAtPeriodEnd 
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel Stripe subscription', {
        error: error instanceof Error ? error.message : 'Unknown error',
        subscriptionId
      });
      throw error;
    }
  }

  // Payment Method Management
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      logger.info('Payment method attached', { paymentMethodId, customerId });
      return paymentMethod;
    } catch (error) {
      logger.error('Failed to attach payment method', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentMethodId,
        customerId
      });
      throw error;
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

      logger.info('Payment method detached', { paymentMethodId });
      return paymentMethod;
    } catch (error) {
      logger.error('Failed to detach payment method', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentMethodId
      });
      throw error;
    }
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data.map(pm => {
        const method: any = {
          id: pm.id,
          type: pm.type,
          isDefault: false // Will be set by calling service based on subscription default_payment_method
        };

        if (pm.card) {
          method.card = {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year
          };
        }

        return method;
      });
    } catch (error) {
      logger.error('Failed to get payment methods', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId
      });
      throw error;
    }
  }

  // Invoice Management
  async getInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit
      });

      return invoices.data;
    } catch (error) {
      logger.error('Failed to get invoices', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId
      });
      throw error;
    }
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      logger.error('Failed to get invoice', {
        error: error instanceof Error ? error.message : 'Unknown error',
        invoiceId
      });
      throw error;
    }
  }

  // Price and Product Management
  async createPrice(params: {
    productId: string;
    unitAmount: number;
    currency: string;
    recurring: {
      interval: 'month' | 'year';
      intervalCount?: number;
    };
  }): Promise<Stripe.Price> {
    try {
      const price = await this.stripe.prices.create({
        product: params.productId,
        unit_amount: params.unitAmount,
        currency: params.currency,
        recurring: params.recurring
      });

      logger.info('Stripe price created', { priceId: price.id });
      return price;
    } catch (error) {
      logger.error('Failed to create Stripe price', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getPrices(productId?: string): Promise<Stripe.Price[]> {
    try {
      const params: Stripe.PriceListParams = {
        active: true
      };

      if (productId) {
        params.product = productId;
      }

      const prices = await this.stripe.prices.list(params);
      return prices.data;
    } catch (error) {
      logger.error('Failed to get Stripe prices', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Webhook Management
  async constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        environment.STRIPE_WEBHOOK_SECRET
      );

      logger.info('Webhook event constructed', { type: event.type, eventId: event.id });
      return event;
    } catch (error) {
      logger.error('Failed to construct webhook event', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Utility Methods
  mapStripeStatusToSubscriptionStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': 'active',
      'canceled': 'cancelled', 
      'past_due': 'past_due',
      'unpaid': 'unpaid',
      'trialing': 'trialing',
      'incomplete': 'incomplete',
      'incomplete_expired': 'incomplete_expired'
    };

    return statusMap[stripeStatus] || 'incomplete';
  }

  calculateDaysRemaining(periodEnd: number): number {
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = periodEnd - now;
    return Math.max(0, Math.ceil(secondsRemaining / 86400)); // 86400 seconds in a day
  }
}