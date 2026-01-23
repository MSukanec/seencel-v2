"use client";

import { z } from "zod";

// ==========================================
// Material Payment Schema
// ==========================================

export const materialPaymentSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    purchase_id: z.string().uuid().nullable(),
    wallet_id: z.string().uuid().nullable(),
    amount: z.number(),
    currency_id: z.string().uuid(),
    exchange_rate: z.number().nullable(),
    payment_date: z.string(),
    notes: z.string().nullable(),
    reference: z.string().nullable(),
    status: z.enum(["confirmed", "pending", "rejected", "void"]),
    image_url: z.string().nullable(),
    created_by: z.string().uuid().nullable(),
    updated_by: z.string().uuid().nullable(),
    functional_amount: z.number().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string(),
    is_deleted: z.boolean().default(false).nullable(),
});

export type MaterialPayment = z.infer<typeof materialPaymentSchema>;

// ==========================================
// Material Payment View (with joined data)
// ==========================================

export const materialPaymentViewSchema = materialPaymentSchema.extend({
    wallet_name: z.string().nullable(),
    currency_symbol: z.string().nullable(),
    currency_code: z.string().nullable(),
    purchase_reference: z.string().nullable(), // Or purchase concept
});

export type MaterialPaymentView = z.infer<typeof materialPaymentViewSchema>;

// ==========================================
// Re-export OrganizationFinancialData from clients
// (Could be moved to a shared location later)
// ==========================================

export interface OrganizationCurrency {
    id: string;
    name: string;
    code: string;
    symbol: string;
    is_default: boolean;
    exchange_rate: number;
}

export interface OrganizationWallet {
    id: string;
    wallet_id: string;
    name: string;
    balance: number;
    currency_symbol: string;
    currency_code?: string;
    is_default: boolean;
}

export interface OrganizationFinancialData {
    defaultCurrencyId: string | null;
    defaultWalletId: string | null;
    currencies: OrganizationCurrency[];
    wallets: OrganizationWallet[];
}

// ==========================================
// Material Purchase (minimal for dropdown)
// ==========================================

export interface MaterialPurchase {
    id: string;
    reference: string | null;
    concept: string | null;
    supplier_name: string | null;
}

