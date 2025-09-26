export interface Subscription {
  id: string;
  userId: string;
  planName: string;
  status: SubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus = 
  | 'active' 
  | 'cancelled' 
  | 'past_due' 
  | 'unpaid' 
  | 'trialing' 
  | 'incomplete' 
  | 'incomplete_expired';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: number;
  currency: string;
  interval: PlanInterval;
  intervalCount: number;
  features: string[];
  stripePriceId: string;
  isActive: boolean;
  trialPeriodDays?: number;
}

export type PlanInterval = 'month' | 'year';

export interface CreateSubscriptionRequest {
  planId: string;
  paymentMethodId: string;
  trialPeriodDays?: number;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  clientSecret?: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface CancelSubscriptionResponse {
  cancelled: boolean;
  effectiveEndDate: string;
  remainingAccess: {
    daysLeft: number;
    endDate: string;
  };
}

export interface Transaction {
  id: string;
  subscriptionId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  invoiceUrl?: string;
  createdAt: Date;
  paidAt?: Date;
}

export type TransactionStatus = 
  | 'draft' 
  | 'open' 
  | 'paid' 
  | 'uncollectible' 
  | 'void'
  | 'refunded';

export interface BillingHistory {
  currentPlan: {
    id: string;
    name: string;
    status: SubscriptionStatus;
    nextBillingDate?: string;
    amount: number;
  } | null;
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export interface StripeCustomer {
  id: string;
  userId: string;
  stripeCustomerId: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface Usage {
  subscriptionId: string;
  period: string;
  practiceMinutes: number;
  scenariosAccessed: number;
  reportsGenerated: number;
  createdAt: Date;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
}