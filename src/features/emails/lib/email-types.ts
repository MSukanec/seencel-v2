export interface EmailPayload {
    to: string;
    subject: string;
}

export interface WelcomeEmailPayload extends EmailPayload {
    firstName: string;
    email: string;
}

export interface PurchaseConfirmationPayload extends EmailPayload {
    firstName: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    amount: string;
    currency: string;
    paymentMethod: 'mercadopago' | 'paypal' | 'bank_transfer';
    transactionId: string;
    purchaseDate: string;
}

export interface SubscriptionActivatedPayload extends EmailPayload {
    firstName: string;
    planName: string;
    billingCycle: 'monthly' | 'annual';
    expiresAt: string;
    dashboardUrl: string;
}

export interface SubscriptionExpiringPayload extends EmailPayload {
    firstName: string;
    planName: string;
    expiresAt: string;
    daysRemaining: number;
    renewUrl: string;
}

export interface SubscriptionExpiredPayload extends EmailPayload {
    firstName: string;
    planName: string;
    expiredAt: string;
    reactivateUrl: string;
}

export interface BankTransferPendingPayload extends EmailPayload {
    firstName: string;
    planName: string;
    amount: string;
    currency: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    reference: string;
    expiresAt: string;
}

export interface BankTransferVerifiedPayload extends EmailPayload {
    firstName: string;
    planName: string;
    amount: string;
    currency: string;
    verifiedAt: string;
}

export type AnyEmailPayload =
    | WelcomeEmailPayload
    | PurchaseConfirmationPayload
    | SubscriptionActivatedPayload
    | SubscriptionExpiringPayload
    | SubscriptionExpiredPayload
    | BankTransferPendingPayload
    | BankTransferVerifiedPayload;
