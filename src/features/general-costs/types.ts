export interface GeneralCostCategory {
    id: string;
    organization_id: string | null;
    name: string;
    description: string | null;
    created_at: string;
    is_system: boolean;
    is_deleted: boolean;
    deleted_at: string | null;
    updated_at: string;
}

export interface GeneralCost {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
    deleted_at: string | null;
    created_by: string | null;
    category_id: string | null;
    is_recurring: boolean;
    recurrence_interval: string | null;
    expected_day: number | null;
    expected_amount: number | null;
    expected_currency_id: string | null;

    // Virtual/Joined fields
    category?: GeneralCostCategory;
}

export interface GeneralCostPayment {
    id: string;
    organization_id: string;
    amount: number;
    currency_id: string;
    exchange_rate: number | null;
    payment_date: string;
    notes: string | null;
    reference: string | null;
    created_at: string | null;
    updated_at: string;
    wallet_id: string;
    general_cost_id: string | null;
    status: 'pending' | 'confirmed' | 'overdue' | 'cancelled';
    created_by: string | null;
    is_deleted: boolean;
    deleted_at: string | null;
    covers_period: string | null;
}

export interface GeneralCostPaymentView {
    id: string;
    organization_id: string;
    payment_date: string;
    payment_month: string;
    covers_period: string | null;
    amount: number;
    currency_id: string;
    currency_code?: string;
    currency_symbol?: string;
    exchange_rate: number | null;
    status: string;
    wallet_id: string;
    wallet_name?: string;
    notes?: string;
    reference?: string;
    general_cost_id: string | null;
    general_cost_name: string | null;
    is_recurring: boolean | null;
    recurrence_interval: string | null;
    category_id: string | null;
    category_name: string | null;
    // Creator info
    created_by?: string;
    creator_full_name?: string;
    creator_avatar_url?: string;
    // Attachments
    has_attachments?: boolean;
}

export interface GeneralCostMonthlySummary {
    organization_id: string;
    payment_month: string;
    total_amount: number;
    payments_count: number;
}

export interface GeneralCostByCategory {
    organization_id: string;
    payment_month: string;
    category_id: string | null;
    category_name: string | null;
    total_amount: number;
}

export interface DashboardKpi {
    label: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    description?: string;
}

import { Insight } from "@/features/insights/types";

export interface EnhancedDashboardData {
    kpis: {
        totalExpense: DashboardKpi;
        monthlyAverage: DashboardKpi;
        totalPayments: DashboardKpi;
        fixedMonthlyCosts: DashboardKpi;
    };
    /** Trend data for sparklines and comparisons */
    trends: {
        monthlyAmounts: number[];          // Last 12 months of total amounts (for sparklines)
        totalExpenseTrend: { value: number; direction: 'up' | 'down' | 'neutral' };
        avgTrend: { value: number; direction: 'up' | 'down' | 'neutral' };
    };
    charts: {
        monthlyEvolution: { month: string; amount: number }[];
        categoryDistribution: { name: string; value: number; color?: string }[];
    };
    /** Top recurring concepts breakdown for fixed costs card */
    fixedCostsBreakdown: { name: string; amount: number }[];
    /** Recurring concepts with their obligation status */
    recurringObligations: {
        id: string;
        name: string;
        expectedAmount: number;
        recurrenceInterval: string;
        expectedDay: number | null;
        status: 'on_track' | 'pending' | 'overdue';
        lastPaymentDate: string | null;
    }[];
    /** Heatmap matrix: recurring concepts × months */
    heatmapData: {
        rows: { id: string; label: string }[];
        columns: { key: string; label: string }[];
        data: Record<string, Record<string, number>>;
    };
    insights: Insight[];
    recentActivity: GeneralCostPaymentView[];
}

