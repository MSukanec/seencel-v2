"use client";

// ==========================================
// Labor Payment Status
// ==========================================

export type LaborPaymentStatus = "confirmed" | "pending" | "rejected" | "void";

export const LABOR_PAYMENT_STATUS_LABELS: Record<LaborPaymentStatus, string> = {
    confirmed: "Confirmado",
    pending: "Pendiente",
    rejected: "Rechazado",
    void: "Anulado",
};

export const LABOR_PAYMENT_STATUS_COLORS: Record<LaborPaymentStatus, string> = {
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    void: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

// ==========================================
// Labor Status (Worker assigned to project)
// ==========================================

export type LaborStatus = "active" | "absent" | "inactive";

export const LABOR_STATUS_LABELS: Record<LaborStatus, string> = {
    active: "Activo",
    absent: "Ausente",
    inactive: "Inactivo",
};

// ==========================================
// Labor Category (OFICIO - Albañilería, Electricidad, etc.)
// ==========================================

export interface LaborCategory {
    id: string;
    organization_id: string | null;
    name: string;
    description: string | null;
    is_system: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
}

// ==========================================
// Labor Level (NIVEL - Ayudante, Oficial, Capataz, etc.)
// ==========================================

export interface LaborLevel {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// ==========================================
// Labor Role (ROL - Producción, Supervisión, Dirección)
// ==========================================

export interface LaborRole {
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// ==========================================
// Labor Type (TIPO USABLE - Combinación concreta para recetas)
// ==========================================

export interface LaborType {
    id: string;
    labor_category_id: string;
    labor_level_id: string;
    labor_role_id: string | null;
    name: string;
    description: string | null;
    unit_id: string;
    created_at: string;
    updated_at: string;
    // Optional joined fields (populated when fetching with joins)
    category_name?: string | null;
    level_name?: string | null;
    role_name?: string | null;
    unit_name?: string | null;
    unit_symbol?: string | null;
}

// Extended type with price for organization catalog
export interface LaborTypeWithPrice extends LaborType {
    current_price: number | null;
    currency_id: string | null;
    currency_code: string | null;
    currency_symbol: string | null;
}

// Extended type with joined data for views
export interface LaborTypeView extends LaborType {
    category_name: string | null;
    level_name: string | null;
    role_name: string | null;
    unit_name: string | null;
}

// ==========================================
// Project Labor (Worker assigned to project)
// ==========================================

export interface ProjectLabor {
    id: string;
    project_id: string;
    organization_id: string;
    contact_id: string;
    labor_type_id: string | null;
    start_date: string | null;
    end_date: string | null;
    status: LaborStatus;
    notes: string | null;
    created_by: string | null;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
}

// ==========================================
// Labor Payment View (from labor_payments_view)
// ==========================================

export interface LaborPaymentView {
    id: string;
    organization_id: string;
    project_id: string;
    labor_id: string | null;
    payment_date: string;
    payment_month: string;
    amount: number;
    currency_id: string;
    exchange_rate: number;
    status: LaborPaymentStatus;
    wallet_id: string | null;
    notes: string | null;
    reference: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
    import_batch_id: string | null;
    functional_amount: number;
    currency_code: string;
    currency_symbol: string;
    currency_name: string;
    org_wallet_id: string | null;
    wallet_name: string | null;
    contact_id: string | null;
    labor_type_id: string | null;
    labor_status: LaborStatus | null;
    contact_first_name: string | null;
    contact_last_name: string | null;
    contact_display_name: string | null;
    contact_national_id: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    contact_image_url: string | null;
    labor_type_name: string | null;
    project_name: string | null;
    creator_member_id: string | null;
    creator_name: string | null;
    creator_avatar_url: string | null;
    has_attachments: boolean;
}

// ==========================================
// Project Labor View (from project_labor_view)
// ==========================================

export interface ProjectLaborView {
    id: string;
    project_id: string;
    organization_id: string;
    contact_id: string;
    labor_type_id: string | null;
    status: LaborStatus;
    notes: string | null;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
    // Datos del contacto
    contact_first_name: string | null;
    contact_last_name: string | null;
    contact_full_name: string | null;
    contact_display_name: string | null;
    contact_national_id: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    contact_image_url: string | null;
    // Datos del tipo de labor
    labor_type_name: string | null;
    labor_type_description: string | null;
    // Datos del proyecto
    project_name: string | null;
    // Creador
    creator_member_id: string | null;
    creator_name: string | null;
    creator_avatar_url: string | null;
    // Extras
    contact_has_attachments: boolean;
    total_payments_count: number;
    total_amount_paid: number;
}

// ==========================================
// Dashboard Types
// ==========================================

export interface LaborDashboardKpi {
    label: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    description?: string;
}

export interface LaborDashboardData {
    kpis: {
        totalExpense: LaborDashboardKpi;
        monthlyAverage: LaborDashboardKpi;
        totalPayments: LaborDashboardKpi;
        activeWorkers: LaborDashboardKpi;
    };
    charts: {
        monthlyEvolution: { month: string; amount: number }[];
        categoryDistribution: { name: string; value: number; color?: string }[];
    };
}

// ==========================================
// Legacy aliases (for backward compatibility)
// ==========================================

export type Worker = ProjectLabor & {
    name: string;
    role: string;
    category_name: string | null;
    document_number: string | null;
    phone: string | null;
    total_paid: number;
};
export type LaborPayment = LaborPaymentView;

// ==========================================
// Mock Data (to be removed when real data is ready)
// ==========================================

export const MOCK_LABOR_CATEGORIES: LaborCategory[] = [];
export const MOCK_WORKERS: Worker[] = [];
export const MOCK_LABOR_PAYMENTS: LaborPaymentView[] = [];
export const MOCK_DASHBOARD_DATA: LaborDashboardData = {
    kpis: {
        totalExpense: { label: "Total Pagado", value: 0, description: "Acumulado del proyecto" },
        monthlyAverage: { label: "Promedio Mensual", value: 0, description: "Últimos 3 meses" },
        totalPayments: { label: "Pagos Realizados", value: 0, description: "Total de recibos" },
        activeWorkers: { label: "Trabajadores Activos", value: 0, description: "En nómina actual" },
    },
    charts: {
        monthlyEvolution: [],
        categoryDistribution: [],
    },
};
