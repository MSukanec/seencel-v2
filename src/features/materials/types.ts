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

// ==========================================
// Material Requirement (calculated from construction_tasks)
// ==========================================

export interface MaterialRequirement {
    project_id: string;
    organization_id: string;
    material_id: string;
    material_name: string;
    unit_name: string | null;
    category_id: string | null;
    category_name: string | null;
    total_required: number;
    task_count: number;
    construction_task_ids: string[];
}

// ==========================================
// Material Requirement Detail (for drill-down)
// ==========================================

export interface MaterialRequirementDetail {
    construction_task_id: string;
    task_name: string;
    task_quantity: number;
    material_amount_per_unit: number;
    total_for_task: number;
}

// ==========================================
// Purchase Order Status
// ==========================================

export type PurchaseOrderStatus =
    | "draft"
    | "sent"
    | "quoted"
    | "approved"
    | "rejected"
    | "converted";

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
    draft: "Borrador",
    sent: "Enviada",
    quoted: "Cotizada",
    approved: "Aprobada",
    rejected: "Rechazada",
    converted: "Convertida",
};

export const PURCHASE_ORDER_STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    quoted: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    converted: "bg-purple-100 text-purple-800",
};

// ==========================================
// Purchase Order
// ==========================================

export interface PurchaseOrder {
    id: string;
    organization_id: string;
    project_id: string;
    order_number: string | null;
    order_date: string;
    expected_delivery_date: string | null;
    status: PurchaseOrderStatus;
    notes: string | null;
    currency_id: string | null;
    subtotal: number;
    tax_amount: number;
    provider_id: string | null;
    requested_by: string | null;
    approved_by: string | null;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
}

// ==========================================
// Purchase Order View (with joined data)
// ==========================================

export interface PurchaseOrderView extends PurchaseOrder {
    total: number;
    currency_symbol: string | null;
    currency_code: string | null;
    provider_name: string | null;
    project_name: string | null;
    item_count: number;
}

// ==========================================
// Purchase Order Item
// ==========================================

export interface PurchaseOrderItem {
    id: string;
    purchase_order_id: string;
    material_id: string | null;
    description: string;
    quantity: number;
    unit_id: string | null;
    unit_price: number | null;
    notes: string | null;
    organization_id: string | null;
    project_id: string | null;
    created_at: string;
    created_by: string | null;
    // Joined fields
    material_name?: string | null;
    unit_name?: string | null;
}

// ==========================================
// Purchase Order Form Data
// ==========================================

export interface PurchaseOrderFormData {
    provider_id?: string | null;
    order_date: string;
    expected_delivery_date?: string | null;
    currency_id?: string | null;
    notes?: string | null;
    items: PurchaseOrderItemFormData[];
}

export interface PurchaseOrderItemFormData {
    id?: string;
    material_id?: string | null;
    description: string;
    quantity: number;
    unit_id?: string | null;
    unit_price?: number | null;
    notes?: string | null;
}


