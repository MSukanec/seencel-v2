// Types for Quotes module

export interface Quote {
    id: string;
    organization_id: string;
    project_id: string | null;
    client_id: string | null;
    name: string;
    description: string | null;
    status: QuoteStatus;
    quote_type: QuoteType;
    version: number;
    currency_id: string;
    exchange_rate: number | null;
    tax_pct: number;
    tax_label: string | null;
    discount_pct: number;
    quote_date: string | null;
    valid_until: string | null;
    approved_at: string | null;
    approved_by: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected';
export type QuoteType = 'quote' | 'contract' | 'change_order';

// View type with joined data and calculated fields
export interface QuoteView extends Quote {
    currency_name: string | null;
    currency_symbol: string | null;
    project_name: string | null;
    client_name: string | null;
    item_count: number;
    subtotal: number;
    subtotal_with_markup: number;
    total_after_discount: number;
    total_with_tax: number;
}

export interface QuoteItem {
    id: string;
    quote_id: string;
    organization_id: string;
    project_id: string | null;
    task_id: string | null;
    description: string | null;
    quantity: number;
    unit_price: number;
    currency_id: string;
    markup_pct: number;
    tax_pct: number;
    cost_scope: CostScope;
    sort_key: number;
    created_at: string;
    updated_at: string;
    created_by: string;
}

export type CostScope = 'materials_and_labor' | 'materials_only' | 'labor_only';

// View type with joined data
export interface QuoteItemView extends QuoteItem {
    task_name: string | null;
    custom_name: string | null;
    division_name: string | null;
    unit: string | null;
    cost_scope_label: string;
    position: number;
    subtotal: number;
    subtotal_with_markup: number;
}

// For forms
export interface QuoteFormData {
    name: string;
    description?: string;
    client_id?: string;
    project_id?: string;
    quote_type: QuoteType;
    version?: number;
    currency_id: string;
    exchange_rate?: number;
    tax_pct?: number;
    tax_label?: string;
    discount_pct?: number;
    valid_until?: string;
    status?: QuoteStatus;
}

// Status labels for UI
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    approved: 'Aprobado',
    rejected: 'Rechazado'
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
    draft: 'text-amber-500 border-amber-500/30',
    sent: 'text-blue-500 border-blue-500/30',
    approved: 'text-green-500 border-green-500/30',
    rejected: 'text-red-500 border-red-500/30'
};

export const QUOTE_TYPE_LABELS: Record<QuoteType, string> = {
    quote: 'Cotización',
    contract: 'Contrato',
    change_order: 'Adicional'
};

export const QUOTE_TYPE_COLORS: Record<QuoteType, string> = {
    quote: 'text-purple-500 border-purple-500/30',
    contract: 'text-emerald-500 border-emerald-500/30',
    change_order: 'text-orange-500 border-orange-500/30'
};
