
import { z } from "zod";

// ==========================================
// Enums & Constants
// ==========================================

export const CLIENT_STATUS = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    DELETED: "deleted",
    POTENTIAL: "potential",
    REJECTED: "rejected",
    COMPLETED: "completed",
} as const;

export const COMMITMENT_METHOD = {
    FIXED: "fixed",
} as const;

export const PAYMENT_SCHEDULE_STATUS = {
    PENDING: "pending",
    PAID: "paid",
    OVERDUE: "overdue",
    CANCELLED: "cancelled",
} as const;

export const PAYMENT_STATUS = {
    CONFIRMED: "confirmed",
    PENDING: "pending",
    REJECTED: "rejected",
    VOID: "void",
} as const;

// ==========================================
// Client Roles
// ==========================================

export const clientRoleSchema = z.object({
    id: z.string().uuid(),
    organization_id: z.string().uuid().nullable(),
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().nullable(),
    is_system: z.boolean().default(false),
    created_at: z.string().nullable(),
    updated_at: z.string(),
    is_deleted: z.boolean().default(false),
});

export type ClientRole = z.infer<typeof clientRoleSchema>;

// ==========================================
// Project Clients (The main "Client" entity)
// ==========================================

export const projectClientSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    contact_id: z.string().uuid().nullable(),
    organization_id: z.string().uuid(),
    is_primary: z.boolean().default(true),
    notes: z.string().nullable(),
    status: z.enum([
        CLIENT_STATUS.ACTIVE,
        CLIENT_STATUS.INACTIVE,
        CLIENT_STATUS.DELETED,
        CLIENT_STATUS.POTENTIAL,
        CLIENT_STATUS.REJECTED,
        CLIENT_STATUS.COMPLETED
    ]),
    client_role_id: z.string().uuid().nullable(),
    created_by: z.string().uuid().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    is_deleted: z.boolean().default(false),
});

export type ProjectClient = z.infer<typeof projectClientSchema>;

// View: project_clients_view
export const projectClientViewSchema = projectClientSchema.extend({
    contact_full_name: z.string().nullable(),
    contact_first_name: z.string().nullable(),
    contact_last_name: z.string().nullable(),
    contact_email: z.string().email().nullable(),
    contact_phone: z.string().nullable(),
    contact_company_name: z.string().nullable(),
    contact_image_url: z.string().nullable(),
    linked_user_id: z.string().uuid().nullable(),
    linked_user_avatar_url: z.string().nullable(),
    contact_avatar_url: z.string().nullable(),
    role_name: z.string().nullable(),
});

export type ProjectClientView = z.infer<typeof projectClientViewSchema>;

// ==========================================
// Client Commitments
// ==========================================

export const clientCommitmentSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    client_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    amount: z.number().positive("El monto debe ser positivo"),
    currency_id: z.string().uuid(),
    exchange_rate: z.number().positive(),
    commitment_method: z.enum([COMMITMENT_METHOD.FIXED]).default(COMMITMENT_METHOD.FIXED),
    unit_name: z.string().nullable(),
    concept: z.string().nullable(),
    description: z.string().nullable(),
    created_by: z.string().uuid().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    is_deleted: z.boolean().default(false),
});

export type ClientCommitment = z.infer<typeof clientCommitmentSchema>;

// ==========================================
// Client Payment Schedule
// ==========================================

export const clientPaymentScheduleSchema = z.object({
    id: z.string().uuid(),
    commitment_id: z.string().uuid(),
    due_date: z.string(), // date string
    amount: z.number(),
    currency_id: z.string().uuid(),
    status: z.enum([
        PAYMENT_SCHEDULE_STATUS.PENDING,
        PAYMENT_SCHEDULE_STATUS.PAID,
        PAYMENT_SCHEDULE_STATUS.OVERDUE,
        PAYMENT_SCHEDULE_STATUS.CANCELLED
    ]).default(PAYMENT_SCHEDULE_STATUS.PENDING),
    paid_at: z.string().nullable(), // timestamp
    payment_method: z.string().nullable(),
    notes: z.string().nullable(),
    organization_id: z.string().uuid(),
    created_by: z.string().uuid().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    is_deleted: z.boolean().default(false),
});

export type ClientPaymentSchedule = z.infer<typeof clientPaymentScheduleSchema>;

// ==========================================
// Client Payments
// ==========================================

export const clientPaymentSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    commitment_id: z.string().uuid().nullable(),
    schedule_id: z.string().uuid().nullable(),
    organization_id: z.string().uuid(),
    wallet_id: z.string().uuid(),
    client_id: z.string().uuid().nullable(),
    amount: z.number().positive(),
    currency_id: z.string().uuid(),
    exchange_rate: z.number().nullable(),
    payment_date: z.string(),
    notes: z.string().nullable(),
    reference: z.string().nullable(),
    status: z.enum([
        PAYMENT_STATUS.CONFIRMED,
        PAYMENT_STATUS.PENDING,
        PAYMENT_STATUS.REJECTED,
        PAYMENT_STATUS.VOID
    ]).default(PAYMENT_STATUS.CONFIRMED),
    created_by: z.string().uuid().nullable(),
    created_at: z.string().nullable(),
    updated_at: z.string(),
    is_deleted: z.boolean().default(false).nullable(),
});

export type ClientPayment = z.infer<typeof clientPaymentSchema>;

// View: client_payments_view
export const clientPaymentViewSchema = clientPaymentSchema.extend({
    payment_month: z.string().nullable(),
    client_name: z.string().nullable(),
    client_first_name: z.string().nullable(),
    client_last_name: z.string().nullable(),
    client_company_name: z.string().nullable(),
    client_email: z.string().email().nullable(),
    client_phone: z.string().nullable(),
    client_role_name: z.string().nullable(),
    client_image_url: z.string().nullable(),
    client_linked_user_avatar_url: z.string().nullable(),
    client_avatar_url: z.string().nullable(),
    wallet_name: z.string().nullable(),
    currency_symbol: z.string().nullable(),
    currency_code: z.string().nullable(),
    commitment_concept: z.string().nullable(),
    schedule_notes: z.string().nullable(),
    // Creator info (from organization_members -> users)
    creator_full_name: z.string().nullable(),
    creator_avatar_url: z.string().nullable(),
});

export type ClientPaymentView = z.infer<typeof clientPaymentViewSchema>;

// ==========================================
// Client Financial Summary
// ==========================================

export const clientFinancialSummarySchema = z.object({
    client_id: z.string().uuid(),
    project_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    currency_id: z.string().uuid().nullable(),
    currency_code: z.string().nullable(),
    currency_symbol: z.string().nullable(),
    total_committed_amount: z.number(),
    total_paid_amount: z.number(),
    balance_due: z.number(),
    commitment_exchange_rate: z.number().nullable(), // Exchange rate from commitments
});

export type ClientFinancialSummary = z.infer<typeof clientFinancialSummarySchema>;




// ==========================================
// Financial Data (from getOrganizationFinancialData)
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
    defaultTaxLabel: string | null;
    currencies: OrganizationCurrency[];
    wallets: OrganizationWallet[];
    preferences: {
        default_currency_id?: string | null;
        functional_currency_id?: string | null;
        default_wallet_id?: string | null;
        currency_decimal_places: number;
        use_currency_exchange?: boolean | null;
        insight_config?: any;
        default_tax_label?: string | null;
    } | null;
}

