"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
    GeneralCost,
    GeneralCostByCategory,
    GeneralCostCategory,
    GeneralCostMonthlySummary,
    GeneralCostPaymentView,
    EnhancedDashboardData
} from "@/features/general-costs/types";

import { generateGeneralCostsInsights } from "@/features/insights/logic/general-costs";
import { CHART_COLORS } from "@/components/charts/chart-config";

export async function getActiveOrganizationId(): Promise<string | null> {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 2. Get User Preferences
    const { data: userData } = await supabase
        .from('users')
        .select(`
            id,
            user_preferences!inner (
                last_organization_id
            )
        `)
        .eq('auth_id', user.id)
        .single();

    if (!userData || !userData.user_preferences) return null;

    // Handle array or single object response for user_preferences
    const pref = Array.isArray((userData.user_preferences as any))
        ? (userData.user_preferences as any)[0]
        : (userData.user_preferences as any);

    return pref?.last_organization_id || null;
}

// --- Categories ---

export async function getGeneralCostCategories(organizationId: string): Promise<GeneralCostCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('general_cost_categories')
        .select('*')
        .or(`organization_id.eq.${organizationId},is_system.eq.true`)
        .eq('is_deleted', false)
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return data as GeneralCostCategory[];
}

// --- Concepts (General Costs) ---

export async function getGeneralCosts(organizationId: string): Promise<GeneralCost[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('general_costs')
        .select(`
            *,
            category:general_cost_categories(*)
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('name');

    if (error) {
        console.error('Error fetching general costs:', error);
        return [];
    }

    return data as GeneralCost[];
}

// --- Payments ---

export async function getGeneralCostPayments(organizationId: string): Promise<GeneralCostPaymentView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('general_costs_payments_view')
        .select('*')
        .eq('organization_id', organizationId)
        .order('payment_date', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return data as GeneralCostPaymentView[];
}

// --- Dashboard ---

export async function getGeneralCostsDashboard(organizationId: string): Promise<EnhancedDashboardData> {
    const supabase = await createClient();

    const [monthlySummaryRes, byCategoryRes, recentPaymentsRes] = await Promise.all([
        supabase
            .from('general_costs_monthly_summary_view')
            .select('*')
            .eq('organization_id', organizationId)
            .order('payment_month', { ascending: true }) // Ascending for charts
            .limit(12),
        supabase
            .from('general_costs_by_category_view')
            .select('*')
            .eq('organization_id', organizationId),
        supabase
            .from('general_costs_payments_view')
            .select('*')
            .eq('organization_id', organizationId)
            .order('payment_date', { ascending: false })
            .limit(10) // 10 most recent
    ]);

    const monthlySummary = (monthlySummaryRes.data || []) as GeneralCostMonthlySummary[];
    const byCategory = (byCategoryRes.data || []) as GeneralCostByCategory[];
    const recentPayments = (recentPaymentsRes.data || []) as GeneralCostPaymentView[];

    // --- KPI Calculations ---
    const totalPaymentsCount = monthlySummary.reduce((acc, curr) => acc + curr.payments_count, 0);

    // Sort logic for trend calculation
    const sortedSummary = [...monthlySummary].sort((a, b) => new Date(a.payment_month).getTime() - new Date(b.payment_month).getTime());
    const lastMonth = sortedSummary[sortedSummary.length - 1] || { total_amount: 0, payment_month: '' };

    // Average Monthly (Simple avg of available months)
    const totalAmountAllMonths = sortedSummary.reduce((acc, curr) => acc + curr.total_amount, 0);
    const avgMonthly = sortedSummary.length > 0 ? totalAmountAllMonths / sortedSummary.length : 0;

    // Concentration (Top Category) - need to aggregate by category first
    const aggregatedByCategory = Object.values(
        byCategory.reduce((acc, c) => {
            const key = c.category_id || 'other';
            if (!acc[key]) {
                acc[key] = {
                    category_id: c.category_id,
                    category_name: c.category_name || "Otros",
                    total_amount: 0
                };
            }
            acc[key].total_amount += c.total_amount;
            return acc;
        }, {} as Record<string, { category_id: string | null; category_name: string; total_amount: number }>)
    ).sort((a, b) => b.total_amount - a.total_amount);

    const topCategory = aggregatedByCategory[0];
    const concentrationPercent = topCategory && totalAmountAllMonths > 0
        ? Math.round((topCategory.total_amount / totalAmountAllMonths) * 100)
        : 0;

    // Total Expense (Sum of all visible months or year to date? Standard is usually YTD or All time in view)
    // For now, let's show the sum of the fetched history (last 12 months)
    const totalExpense = totalAmountAllMonths;

    // Insights Generation
    const insights = generateGeneralCostsInsights({
        monthlySummary,
        byCategory,
        recentPayments
    });

    return {
        kpis: {
            totalExpense: {
                label: "Gasto Total",
                value: totalExpense,
                description: "Últimos 12 meses"
            },
            monthlyAverage: {
                label: "Promedio Mensual",
                value: avgMonthly,
                description: `Promedio por mes (${sortedSummary.length} meses)`
            },
            totalPayments: {
                label: "Total Pagos",
                value: totalPaymentsCount,
                description: `≈ ${Math.round(totalPaymentsCount / (sortedSummary.length || 1))} pagos por mes`
            },
            expenseConcentration: {
                label: "Concentración del Gasto",
                value: `${concentrationPercent}%`,
                description: topCategory?.category_name || "Sin datos"
            }
        },
        charts: {
            monthlyEvolution: sortedSummary.map(m => ({
                month: m.payment_month,
                amount: m.total_amount
            })),
            // Aggregate by category (since view returns per category per month)
            categoryDistribution: Object.values(
                byCategory.reduce((acc, c) => {
                    const key = c.category_id || 'other';
                    if (!acc[key]) {
                        acc[key] = {
                            name: c.category_name || "Otros",
                            value: 0
                        };
                    }
                    acc[key].value += c.total_amount;
                    return acc;
                }, {} as Record<string, { name: string; value: number }>)
            ).map((item, index) => ({
                ...item,
                color: CHART_COLORS.categorical[index % CHART_COLORS.categorical.length]
            })).sort((a, b) => b.value - a.value)
        },
        insights: insights,
        recentActivity: recentPayments
    };
}

// --- Mutations ---


// Categories Mutations

export async function createGeneralCostCategory(data: Partial<GeneralCostCategory>) {
    const supabase = await createClient();
    const { data: newCategory, error } = await supabase
        .from('general_cost_categories')
        .insert({
            organization_id: data.organization_id,
            name: data.name,
            description: data.description,
            is_system: data.is_system || false
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return newCategory;
}

export async function updateGeneralCostCategory(id: string, data: Partial<GeneralCostCategory>) {
    const supabase = await createClient();
    const { data: updatedCategory, error } = await supabase
        .from('general_cost_categories')
        .update({
            name: data.name,
            description: data.description,
            // Prevent updating system flag or organization_id if not intended
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return updatedCategory;
}

export async function deleteGeneralCostCategory(id: string) {
    const supabase = await createClient();
    // Soft delete
    const { error } = await supabase
        .from('general_cost_categories')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return true;
}

// Concepts (General Costs) Mutations

export async function createGeneralCost(data: Partial<GeneralCost>) {
    const supabase = await createClient();
    const { data: newCost, error } = await supabase
        .from('general_costs')
        .insert({
            organization_id: data.organization_id,
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            is_recurring: data.is_recurring || false,
            recurrence_interval: data.recurrence_interval,
            expected_day: data.expected_day
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return newCost;
}

export async function updateGeneralCost(id: string, data: Partial<GeneralCost>) {
    const supabase = await createClient();
    const { data: updatedCost, error } = await supabase
        .from('general_costs')
        .update({
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            is_recurring: data.is_recurring,
            recurrence_interval: data.recurrence_interval,
            expected_day: data.expected_day
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return updatedCost;
}

export async function deleteGeneralCost(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('general_costs')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return true;
}

// Payments Mutations

export async function createGeneralCostPayment(data: Partial<GeneralCostPaymentView>) {
    const supabase = await createClient();
    // We must map from the View type (potentially) to the Table schema
    // data.general_cost_id, data.amount, etc.
    const { data: newPayment, error } = await supabase
        .from('general_costs_payments')
        .insert({
            organization_id: data.organization_id,
            general_cost_id: data.general_cost_id,
            amount: data.amount,
            currency_id: data.currency_id,
            wallet_id: data.wallet_id,
            payment_date: data.payment_date,
            status: data.status || 'confirmed',
            // fields from view might not map 1:1, ensure we use basic fields
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return newPayment;
}

export async function updateGeneralCostPayment(id: string, data: Partial<GeneralCostPaymentView>) {
    const supabase = await createClient();
    const { data: updatedPayment, error } = await supabase
        .from('general_costs_payments')
        .update({
            general_cost_id: data.general_cost_id,
            amount: data.amount,
            currency_id: data.currency_id,
            wallet_id: data.wallet_id,
            payment_date: data.payment_date,
            status: data.status,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return updatedPayment;
}

export async function deleteGeneralCostPayment(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('general_costs_payments')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/organization/general-costs');
    return true;
}

