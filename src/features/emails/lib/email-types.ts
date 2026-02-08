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
    productName: string;
    amount: string;
    currency: string;
    reference: string;
}

export interface BankTransferVerifiedPayload extends EmailPayload {
    firstName: string;
    planName: string;
    amount: string;
    currency: string;
    verifiedAt: string;
}

export interface CoursePurchaseConfirmationPayload extends EmailPayload {
    firstName: string;
    courseName: string;
    amount: string;
    currency: string;
    transactionId: string;
    purchaseDate: string;
}

export interface AdminSaleNotificationPayload extends EmailPayload {
    buyerName: string;
    buyerEmail: string;
    productType: 'subscription' | 'course';
    productName: string;
    amount: string;
    currency: string;
    paymentId: string;
    purchaseDate: string;
}

export interface AdminNewTransferPayload extends EmailPayload {
    payerName: string;
    payerEmail: string;
    productName: string;
    amount: string;
    currency: string;
    transferId: string;
    receiptUrl: string;
}

export interface TeamInvitationPayload extends EmailPayload {
    organizationName: string;
    inviterName: string;
    roleName: string;
    acceptUrl: string;
}

export type AnyEmailPayload =
    | WelcomeEmailPayload
    | PurchaseConfirmationPayload
    | CoursePurchaseConfirmationPayload
    | AdminSaleNotificationPayload
    | AdminNewTransferPayload
    | SubscriptionActivatedPayload
    | SubscriptionExpiringPayload
    | SubscriptionExpiredPayload
    | BankTransferPendingPayload
    | BankTransferVerifiedPayload
    | TeamInvitationPayload;
