export interface Subscription {
    id: string;
    userId: string;
    planName: 'free' | 'paid';
    status: 'active' | 'cancelled' | 'expired' | 'past_due';
    stripeCustomerId: string | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateSubscriptionRequest {
    planName: 'paid';
    paymentMethodId: string;
}
export interface UpdateSubscriptionRequest {
    planName?: 'free' | 'paid';
    status?: 'active' | 'cancelled' | 'expired';
}
export interface UsageInfo {
    sessionsUsed: number;
    sessionsLimit: number;
    resetDate: Date | null;
    canStartSession: boolean;
}
export interface BillingInfo {
    subscription: Subscription;
    usage: UsageInfo;
    invoices: Invoice[];
}
export interface Invoice {
    id: string;
    stripeInvoiceId: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed';
    dueDate: Date;
    paidAt: Date | null;
}
//# sourceMappingURL=subscription.types.d.ts.map