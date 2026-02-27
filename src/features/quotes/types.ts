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
    // Change Orders Architecture
    parent_quote_id: string | null;        // For change_orders: reference to parent contract
    original_contract_value: number | null; // Frozen value when contract is approved
    change_order_number: number | null;     // Sequential number (CO #1, CO #2, etc.)
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
    // For contracts with change orders (from contract_summary_view)
    parent_contract_name?: string;          // For COs: name of parent contract
}

// Contract with aggregated change order data
export interface ContractSummary {
    id: string;
    name: string;
    project_id: string | null;
    organization_id: string;
    client_id: string | null;
    status: QuoteStatus;
    currency_id: string;
    original_contract_value: number;
    change_order_count: number;
    approved_change_order_count: number;
    pending_change_order_count: number;
    approved_changes_value: number;
    pending_changes_value: number;
    revised_contract_value: number;        // original + approved
    potential_contract_value: number;      // original + approved + pending
    created_at: string;
    updated_at: string;
}

export interface QuoteItem {
    id: string;
    quote_id: string;
    organization_id: string;
    project_id: string | null;
    task_id: string | null;
    recipe_id: string | null;
    description: string | null;
    quantity: number;
    unit_price: number;
    currency_id: string;
    markup_pct: number;
    tax_pct: number;
    cost_scope: CostScope;
    sort_key: number;
    // Snapshot costs (frozen on sent)
    snapshot_mat_cost: number;
    snapshot_lab_cost: number;
    snapshot_ext_cost: number;
    created_at: string;
    updated_at: string;
    created_by: string;
}

export type CostScope = 'materials_and_labor' | 'labor_only';

// View type with joined data
export interface QuoteItemView extends QuoteItem {
    task_name: string | null;
    custom_name: string | null;
    division_name: string | null;
    unit: string | null;
    cost_scope_label: string;
    position: number;
    recipe_name: string | null;
    // Live costs from recipe (always current catalog)
    live_mat_cost: number;
    live_lab_cost: number;
    live_ext_cost: number;
    live_unit_price: number;
    // Effective = live if draft, snapshot if sent/approved
    effective_unit_price: number;
}

// ── Resource breakdown types (for Resources view) ────────────────────────────

export interface QuoteResourceMaterial {
    material_id: string;
    material_name: string;
    unit_name: string | null;
    unit_symbol: string | null;
    unit_quantity: number;       // qty per unit of task (from recipe)
    total_quantity: number;      // aggregated across all items using this material
    waste_percentage: number;
    unit_price: number | null;   // current catalog price
    total_cost: number;          // total_quantity × unit_price
    task_names: string[];        // which items use this material
}

export interface QuoteResourceLabor {
    labor_type_id: string;
    labor_name: string;
    unit_name: string | null;
    unit_symbol: string | null;
    unit_quantity: number;
    total_quantity: number;
    unit_price: number | null;
    total_cost: number;
    task_names: string[];
}

export interface QuoteResourceExternalService {
    service_id: string;
    service_name: string;
    unit_price: number;
    contact_name: string | null;
    task_names: string[];
    total_cost: number;
}

export interface QuoteResources {
    materials: QuoteResourceMaterial[];
    labor: QuoteResourceLabor[];
    externalServices: QuoteResourceExternalService[];
    totals: {
        materials: number;
        labor: number;
        externalServices: number;
        grand_total: number;
    };
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
    draft: 'text-[#c9a03e] border-[#c9a03e]/30',   /* chart-4 — Oro */
    sent: 'text-[#6366F1] border-[#6366F1]/30',   /* chart-7 — Índigo */
    approved: 'text-[#758a57] border-[#758a57]/30',   /* chart-1 — Oliva */
    rejected: 'text-[#b04912] border-[#b04912]/30',   /* chart-3 — Naranja cálido */
};

export const QUOTE_TYPE_LABELS: Record<QuoteType, string> = {
    quote: 'Cotización',
    contract: 'Contrato',
    change_order: 'Adicional'
};

export const QUOTE_TYPE_COLORS: Record<QuoteType, string> = {
    quote: 'text-[#7c72ab] border-[#7c72ab]/30',   /* chart-2 — Lavanda */
    contract: 'text-[#758a57] border-[#758a57]/30',   /* chart-1 — Oliva */
    change_order: 'text-[#c9a03e] border-[#c9a03e]/30',   /* chart-4 — Oro */
};



