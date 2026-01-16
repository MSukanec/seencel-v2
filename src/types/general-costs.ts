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
}

export interface GeneralCostPaymentView {
    id: string;
    organization_id: string;
    payment_date: string;
    payment_month: string;
    amount: number;
    currency_id: string;
    exchange_rate: number | null;
    status: string;
    wallet_id: string;
    general_cost_id: string | null;
    general_cost_name: string | null;
    is_recurring: boolean | null;
    recurrence_interval: string | null;
    category_id: string | null;
    category_name: string | null;
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
        expenseConcentration: DashboardKpi;
    };
    charts: {
        monthlyEvolution: { month: string; amount: number }[];
        categoryDistribution: { name: string; value: number; color?: string }[];
    };
    insights: Insight[];
    recentActivity: GeneralCostPaymentView[];
}
