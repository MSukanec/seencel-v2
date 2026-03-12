"use server";


import { sanitizeError } from "@/lib/error-utils";
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

// NOTE: getActiveOrganizationId() was removed (Marzo 2026).
// Use requireAuthContext() or getAuthContext() from @/lib/auth instead.
// The page.tsx already resolves orgId and passes it to all views/actions.

// --- Categories ---

export async function getGeneralCostCategories(organizationId: string): Promise<GeneralCostCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('finance').from('general_cost_categories')
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
        .schema('finance').from('general_costs')
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

export async function getGeneralCostConceptStats(organizationId: string) {
    const supabase = await createClient();

    // Get stats for last 12 months grouped by concept
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const fromDate = twelveMonthsAgo.toISOString().split('T')[0];

    const { data, error } = await supabase
        .schema('finance').from('general_costs_payments')
        .select(`
            general_cost_id,
            amount,
            payment_date,
            currency:currencies(code, symbol)
        `)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .not('general_cost_id', 'is', null)
        .gte('payment_date', fromDate);

    if (error || !data) return {};

    // Aggregate by concept
    const statsMap: Record<string, {
        general_cost_id: string;
        total_payments: number;
        total_amount: number;
        last_payment_date: string | null;
        currency_code: string | null;
        currency_symbol: string | null;
    }> = {};

    for (const row of data) {
        const id = row.general_cost_id!;
        if (!statsMap[id]) {
            statsMap[id] = {
                general_cost_id: id,
                total_payments: 0,
                total_amount: 0,
                last_payment_date: null,
                currency_code: (row.currency as any)?.code ?? null,
                currency_symbol: (row.currency as any)?.symbol ?? null,
            };
        }
        statsMap[id].total_payments++;
        statsMap[id].total_amount += Number(row.amount);
        if (!statsMap[id].last_payment_date || row.payment_date > statsMap[id].last_payment_date!) {
            statsMap[id].last_payment_date = row.payment_date;
        }
    }

    return statsMap;
}

/**
 * Fetch detail data for a specific concept: recent payments + monthly evolution.
 * Used by the concept detail panel.
 */
export async function getConceptDetailData(conceptId: string, organizationId: string) {
    const supabase = await createClient();

    const [recentRes, monthlyRes] = await Promise.all([
        // Recent payments for this concept
        supabase
            .schema('finance').from('general_costs_payments_view')
            .select('id, payment_date, amount, currency_code, currency_symbol, status, wallet_name')
            .eq('organization_id', organizationId)
            .eq('general_cost_id', conceptId)
            .order('payment_date', { ascending: false })
            .limit(10),
        // Monthly aggregation for chart
        supabase
            .schema('finance').from('general_costs_payments')
            .select('payment_date, amount')
            .eq('organization_id', organizationId)
            .eq('general_cost_id', conceptId)
            .eq('is_deleted', false)
            .order('payment_date', { ascending: true }),
    ]);

    const recentPayments = recentRes.data || [];

    // Aggregate monthly for chart
    const monthlyMap: Record<string, number> = {};
    for (const row of (monthlyRes.data || [])) {
        const month = row.payment_date.substring(0, 7); // YYYY-MM
        monthlyMap[month] = (monthlyMap[month] || 0) + Number(row.amount);
    }
    const monthlyData = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12) // Last 12 months
        .map(([month, amount]) => ({ month: `${month}-01`, amount }));

    return { recentPayments, monthlyData };
}

// --- Payments ---

export async function getGeneralCostPayments(organizationId: string): Promise<GeneralCostPaymentView[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .schema('finance').from('general_costs_payments_view')
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

    const [monthlySummaryRes, byCategoryRes, recentPaymentsRes, fixedCostsRes, allRecurringRes, lastPaymentsRes] = await Promise.all([
        supabase
            .schema('finance').from('general_costs_monthly_summary_view')
            .select('*')
            .eq('organization_id', organizationId)
            .order('payment_month', { ascending: true }) // Ascending for charts
            .limit(12),
        supabase
            .schema('finance').from('general_costs_by_category_view')
            .select('*')
            .eq('organization_id', organizationId),
        supabase
            .schema('finance').from('general_costs_payments_view')
            .select('*')
            .eq('organization_id', organizationId)
            .order('payment_date', { ascending: false })
            .limit(10), // 10 most recent
        // Fixed costs: recurring WITH expected_amount (for KPI card)
        supabase
            .schema('finance').from('general_costs')
            .select('id, name, expected_amount, recurrence_interval, expected_day')
            .eq('organization_id', organizationId)
            .eq('is_recurring', true)
            .eq('is_deleted', false)
            .not('expected_amount', 'is', null),
        // All recurring: for obligations status (regardless of expected_amount)
        supabase
            .schema('finance').from('general_costs')
            .select('id, name, expected_amount, recurrence_interval, expected_day')
            .eq('organization_id', organizationId)
            .eq('is_recurring', true)
            .eq('is_deleted', false),
        // All payments for recurring concepts (heatmap + obligation status)
        supabase
            .schema('finance').from('general_costs_payments')
            .select('general_cost_id, payment_date, amount, exchange_rate, covers_period')
            .eq('organization_id', organizationId)
            .eq('is_deleted', false)
            .order('payment_date', { ascending: false }),
    ]);

    const monthlySummary = (monthlySummaryRes.data || []) as GeneralCostMonthlySummary[];
    const byCategory = (byCategoryRes.data || []) as GeneralCostByCategory[];
    const recentPayments = (recentPaymentsRes.data || []) as GeneralCostPaymentView[];
    const fixedCostsConcepts = fixedCostsRes.data || [];
    const allRecurringConcepts = allRecurringRes.data || [];
    const allPayments = lastPaymentsRes.data || [];

    // --- KPI Calculations ---
    const totalPaymentsCount = monthlySummary.reduce((acc, curr) => acc + curr.payments_count, 0);

    // Sort logic for trend calculation
    const sortedSummary = [...monthlySummary].sort((a, b) => new Date(a.payment_month).getTime() - new Date(b.payment_month).getTime());
    const lastMonth = sortedSummary[sortedSummary.length - 1] || { total_amount: 0, payment_month: '' };

    // Average Monthly (Simple avg of available months)
    const totalAmountAllMonths = sortedSummary.reduce((acc, curr) => acc + curr.total_amount, 0);
    const avgMonthly = sortedSummary.length > 0 ? totalAmountAllMonths / sortedSummary.length : 0;

    // Mensualize helper
    const mensualize = (amount: number, interval: string) => {
        const multiplier = interval === 'quarterly' ? 1 / 3
            : interval === 'yearly' ? 1 / 12
                : interval === 'weekly' ? 4.33
                    : 1;
        return amount * multiplier;
    };

    // Fixed Monthly Costs — sum expected_amount mensualized
    const fixedMonthlyCosts = fixedCostsConcepts.reduce((acc: number, c: any) => {
        return acc + mensualize(Number(c.expected_amount) || 0, c.recurrence_interval || 'monthly');
    }, 0);

    // Total Expense
    const totalExpense = totalAmountAllMonths;

    // --- Trends ---
    const monthlyAmounts = sortedSummary.map(m => m.total_amount);
    const prevMonth = sortedSummary.length >= 2 ? sortedSummary[sortedSummary.length - 2] : null;

    const calcTrend = (current: number, previous: number | null) => {
        if (!previous || previous === 0) return { value: 0, direction: 'neutral' as const };
        const pct = Math.round(((current - previous) / previous) * 100);
        return {
            value: Math.abs(pct),
            direction: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'neutral' as const,
        };
    };

    const totalExpenseTrend = calcTrend(lastMonth.total_amount, prevMonth?.total_amount ?? null);

    // Avg trend: compare last 3 months avg vs previous 3 months avg
    const last3 = sortedSummary.slice(-3);
    const prev3 = sortedSummary.slice(-6, -3);
    const avgLast3 = last3.length > 0 ? last3.reduce((s, m) => s + m.total_amount, 0) / last3.length : 0;
    const avgPrev3 = prev3.length > 0 ? prev3.reduce((s, m) => s + m.total_amount, 0) / prev3.length : 0;
    const avgTrend = calcTrend(avgLast3, avgPrev3 || null);

    // --- Fixed Costs Breakdown (top concepts by mensualized amount) ---
    const fixedCostsBreakdown = fixedCostsConcepts
        .map((c: any) => ({
            name: c.name as string,
            amount: mensualize(Number(c.expected_amount) || 0, c.recurrence_interval || 'monthly'),
        }))
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 5);

    // --- Recurring Obligations Status ---
    // Build last payment map per concept
    const lastPaymentMap: Record<string, string> = {};
    for (const p of allPayments) {
        if (p.general_cost_id && !lastPaymentMap[p.general_cost_id]) {
            lastPaymentMap[p.general_cost_id] = p.payment_date;
        }
    }

    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const recurringObligations = allRecurringConcepts.map((c: any) => {
        const lastPayment = lastPaymentMap[c.id] || null;
        const expectedDay = c.expected_day || null;

        // Determine status
        let status: 'on_track' | 'pending' | 'overdue' = 'pending';
        if (lastPayment) {
            const lastDate = new Date(lastPayment);
            const isThisMonth = lastDate.getMonth() === currentMonth && lastDate.getFullYear() === currentYear;
            if (isThisMonth) {
                status = 'on_track';
            } else if (expectedDay && currentDay > expectedDay) {
                status = 'overdue';
            }
        } else if (expectedDay && currentDay > expectedDay) {
            status = 'overdue';
        }

        return {
            id: c.id as string,
            name: c.name as string,
            expectedAmount: Number(c.expected_amount) || 0,
            recurrenceInterval: (c.recurrence_interval || 'monthly') as string,
            expectedDay,
            status,
            lastPaymentDate: lastPayment,
        };
    }).sort((a, b) => {
        // Overdue first, then pending, then on_track
        const order: Record<string, number> = { overdue: 0, pending: 1, on_track: 2 };
        return (order[a.status] ?? 1) - (order[b.status] ?? 1);
    });

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
            fixedMonthlyCosts: {
                label: "Costos Fijos Mensuales",
                value: fixedMonthlyCosts,
                description: `${allRecurringConcepts.length} conceptos recurrentes`
            }
        },
        trends: {
            monthlyAmounts,
            totalExpenseTrend,
            avgTrend,
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
        fixedCostsBreakdown,
        recurringObligations,
        // --- Heatmap: recurring concepts × months ---
        heatmapData: (() => {
            // Build last 12 month columns
            const now = new Date();
            const cols: { key: string; label: string }[] = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }).replace('.', '');
                cols.push({ key, label });
            }

            // Rows = all recurring concepts
            const heatRows = allRecurringConcepts.map((c: any) => ({
                id: c.id as string,
                label: c.name as string,
            }));

            // Build matrix: concept.id → month_key → total amount
            const matrix: Record<string, Record<string, number>> = {};
            for (const p of allPayments) {
                if (!p.general_cost_id) continue;
                // Use covers_period if available, otherwise fallback to payment_date
                const periodDate = p.covers_period ? new Date(p.covers_period) : new Date(p.payment_date);
                const monthKey = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;
                // Only include months in our range
                if (!cols.some(c => c.key === monthKey)) continue;

                if (!matrix[p.general_cost_id]) matrix[p.general_cost_id] = {};
                const amount = Number(p.amount) * (Number(p.exchange_rate) || 1);
                matrix[p.general_cost_id][monthKey] = (matrix[p.general_cost_id][monthKey] || 0) + amount;
            }

            return { rows: heatRows, columns: cols, data: matrix };
        })(),
        insights: insights,
        recentActivity: recentPayments
    };
}

// --- Mutations ---


// Categories Mutations

export async function createGeneralCostCategory(data: Partial<GeneralCostCategory>) {
    const supabase = await createClient();
    const { data: newCategory, error } = await supabase
        .schema('finance').from('general_cost_categories')
        .insert({
            organization_id: data.organization_id,
            name: data.name,
            description: data.description,
            is_system: data.is_system || false
        })
        .select()
        .single();

    if (error) throw new Error(sanitizeError(error));
    revalidatePath('/organization/general-costs');
    return newCategory;
}

export async function updateGeneralCostCategory(id: string, data: Partial<GeneralCostCategory>) {
    const supabase = await createClient();
    const { data: updatedCategory, error } = await supabase
        .schema('finance').from('general_cost_categories')
        .update({
            name: data.name,
            description: data.description,
            // Prevent updating system flag or organization_id if not intended
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(sanitizeError(error));
    revalidatePath('/organization/general-costs');
    return updatedCategory;
}

export async function deleteGeneralCostCategory(id: string) {
    const supabase = await createClient();
    // Soft delete
    const { error } = await supabase
        .schema('finance').from('general_cost_categories')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(sanitizeError(error));
    revalidatePath('/organization/general-costs');
    return true;
}

// Concepts (General Costs) Mutations

export async function createGeneralCost(data: Partial<GeneralCost>) {
    const supabase = await createClient();
    const { data: newCost, error } = await supabase
        .schema('finance').from('general_costs')
        .insert({
            organization_id: data.organization_id,
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            is_recurring: data.is_recurring || false,
            recurrence_interval: data.recurrence_interval,
            expected_day: data.expected_day,
            expected_amount: data.expected_amount,
            expected_currency_id: data.expected_currency_id
        })
        .select()
        .single();

    if (error) throw new Error(sanitizeError(error));
    revalidatePath('/organization/general-costs');
    return newCost;
}

export async function updateGeneralCost(id: string, data: Partial<GeneralCost>) {
    const supabase = await createClient();
    const { data: updatedCost, error } = await supabase
        .schema('finance').from('general_costs')
        .update({
            name: data.name,
            description: data.description,
            category_id: data.category_id,
            is_recurring: data.is_recurring,
            recurrence_interval: data.recurrence_interval,
            expected_day: data.expected_day,
            expected_amount: data.expected_amount,
            expected_currency_id: data.expected_currency_id
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(sanitizeError(error));
    revalidatePath('/organization/general-costs');
    return updatedCost;
}

export async function deleteGeneralCost(id: string) {
    const supabase = await createClient();
    // Soft delete — Rule: NUNCA .delete() real
    const { error } = await supabase
        .schema('finance').from('general_costs')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(sanitizeError(error));
    revalidatePath('/organization/general-costs');
    return true;
}

// Payments Mutations

export async function createGeneralCostPayment(data: Partial<GeneralCostPaymentView> & { media_files?: any[] }) {
    const supabase = await createClient();
    // We must map from the View type (potentially) to the Table schema
    // data.general_cost_id, data.amount, etc.
    const { data: newPayment, error } = await supabase
        .schema('finance').from('general_costs_payments')
        .insert({
            organization_id: data.organization_id,
            general_cost_id: data.general_cost_id,
            amount: data.amount,
            currency_id: data.currency_id,
            wallet_id: data.wallet_id,
            payment_date: data.payment_date,
            status: data.status || 'confirmed',
            notes: data.notes,
            reference: data.reference,
            exchange_rate: data.exchange_rate,
            covers_period: data.covers_period || null,
        })
        .select()
        .single();

    if (error) throw new Error(sanitizeError(error));

    // Handle media files if provided (correct pattern: media_files -> media_links)
    if (data.media_files && data.media_files.length > 0 && newPayment) {
        for (const mediaData of data.media_files) {
            // Skip existing files
            if (mediaData.id === 'existing') continue;
            if (!mediaData.path || !mediaData.bucket) continue;

            // Map MIME type to db file_type
            const dbType = mediaData.type?.startsWith('image/')
                ? 'image'
                : mediaData.type === 'application/pdf'
                    ? 'pdf'
                    : 'other';

            // 1. First create media_file record
            const { data: fileData, error: fileError } = await supabase
                .from('media_files')
                .insert({
                    organization_id: data.organization_id,
                    bucket: mediaData.bucket,
                    file_path: mediaData.path,
                    file_name: mediaData.name,
                    file_type: dbType,
                    file_size: mediaData.size,
                    is_public: false
                })
                .select()
                .single();

            if (fileError) {
                console.error('Error creating media_file:', fileError);
                continue;
            }

            // 2. Then create media_link with the media_file_id
            if (fileData) {
                const { error: linkError } = await supabase
                    .from('media_links')
                    .insert({
                        media_file_id: fileData.id,
                        organization_id: data.organization_id,
                        general_cost_payment_id: newPayment.id,
                        category: 'financial',
                        visibility: 'private'
                    });

                if (linkError) {
                    console.error('Error creating media_link:', linkError);
                }
            }
        }
    }

    revalidatePath('/organization/general-costs');
    return newPayment;
}

export async function duplicateGeneralCostPayment(paymentId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Fetch the original payment
    const { data: original, error: fetchError } = await supabase
        .schema('finance').from('general_costs_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

    if (fetchError || !original) {
        return { success: false, error: "No se encontró el pago original" };
    }

    // 2. Insert a copy (strip system fields, set today as date, mark as pending)
    const today = new Date().toISOString().split('T')[0];
    const { error: insertError } = await supabase
        .schema('finance').from('general_costs_payments')
        .insert({
            organization_id: original.organization_id,
            general_cost_id: original.general_cost_id,
            amount: original.amount,
            currency_id: original.currency_id,
            wallet_id: original.wallet_id,
            payment_date: today,
            status: 'pending',
            notes: original.notes ? `${original.notes} (copia)` : '(copia)',
            reference: original.reference,
            exchange_rate: original.exchange_rate,
            covers_period: original.covers_period,
        });

    if (insertError) {
        console.error('[duplicateGeneralCostPayment] Error:', insertError);
        return { success: false, error: "Error al duplicar el pago" };
    }

    revalidatePath('/organization/general-costs');
    return { success: true };
}

export async function updateGeneralCostPayment(id: string, data: Partial<GeneralCostPaymentView> & { media_files?: any[] }) {
    const supabase = await createClient();
    const { data: updatedPayment, error } = await supabase
        .schema('finance').from('general_costs_payments')
        .update({
            general_cost_id: data.general_cost_id,
            amount: data.amount,
            currency_id: data.currency_id,
            wallet_id: data.wallet_id,
            payment_date: data.payment_date,
            status: data.status,
            notes: data.notes,
            reference: data.reference,
            exchange_rate: data.exchange_rate,
            covers_period: data.covers_period !== undefined ? (data.covers_period || null) : undefined,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw new Error(sanitizeError(error));

    // Handle media files if provided (correct pattern: media_files -> media_links)
    if (data.media_files && data.media_files.length > 0 && updatedPayment) {
        for (const mediaData of data.media_files) {
            // Skip existing files
            if (mediaData.id === 'existing') continue;
            if (!mediaData.path || !mediaData.bucket) continue;

            // Map MIME type to db file_type
            const dbType = mediaData.type?.startsWith('image/')
                ? 'image'
                : mediaData.type === 'application/pdf'
                    ? 'pdf'
                    : 'other';

            // 1. First create media_file record
            const { data: fileData, error: fileError } = await supabase
                .from('media_files')
                .insert({
                    organization_id: updatedPayment.organization_id,
                    bucket: mediaData.bucket,
                    file_path: mediaData.path,
                    file_name: mediaData.name,
                    file_type: dbType,
                    file_size: mediaData.size,
                    is_public: false
                })
                .select()
                .single();

            if (fileError) {
                console.error('Error creating media_file:', fileError);
                continue;
            }

            // 2. Then create media_link with the media_file_id
            if (fileData) {
                const { error: linkError } = await supabase
                    .from('media_links')
                    .insert({
                        media_file_id: fileData.id,
                        organization_id: updatedPayment.organization_id,
                        general_cost_payment_id: updatedPayment.id,
                        category: 'financial',
                        visibility: 'private'
                    });

                if (linkError) {
                    console.error('Error creating media_link:', linkError);
                }
            }
        }
    }

    revalidatePath('/organization/general-costs');
    return updatedPayment;
}

export async function deleteGeneralCostPayment(id: string) {
    const supabase = await createClient();
    // Soft delete — Rule: NUNCA .delete() real
    const { error } = await supabase
        .schema('finance').from('general_costs_payments')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) throw new Error(sanitizeError(error));
    revalidatePath('/organization/general-costs');
    return true;
}

/**
 * Update one or more fields on a general cost payment (inline editing).
 * Handles special resolution:
 * - wallet_name → wallet_id (looks up wallets by name)
 * - payment_date, status → direct update
 */
export async function updateGeneralCostPaymentField(
    paymentId: string,
    fields: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Build DB-safe fields
    const dbFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(fields)) {
        if (key === 'wallet_name') {
            // Resolve wallet_name → wallet_id
            const { data: wallet } = await supabase
                .schema('finance').from('organization_wallets_view')
                .select('id')
                .eq('wallet_name', value)
                .limit(1)
                .single();

            if (wallet) {
                dbFields.wallet_id = wallet.id;
            }
        } else if (['status', 'payment_date', 'notes', 'reference', 'general_cost_id', 'amount', 'exchange_rate', 'currency_id', 'wallet_id', 'covers_period'].includes(key)) {
            // Direct DB-safe fields
            dbFields[key] = value;
        }
        // Skip UI-only fields (e.g. wallet_icon, category_name, etc.)
    }

    if (Object.keys(dbFields).length === 0) {
        return { success: true }; // Nothing to update
    }

    const { error } = await supabase
        .schema('finance')
        .from('general_costs_payments')
        .update(dbFields)
        .eq('id', paymentId);

    if (error) {
        console.error('[updateGeneralCostPaymentField] Error:', error);
        return { success: false, error: "Error al actualizar el pago" };
    }

    revalidatePath('/organization/general-costs');
    return { success: true };
}

// ─── Inline Attachment Management ────────────────────────

/**
 * Fetch existing attachments for a specific payment as UploadedFile[]
 * (compatible with AttachmentChip)
 */
export async function getPaymentAttachments(paymentId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('media_links')
        .select(`
            media_file_id,
            media_files!inner (
                id,
                file_name,
                file_path,
                file_type,
                file_size,
                bucket,
                is_deleted
            )
        `)
        .eq('general_cost_payment_id', paymentId)
        .eq('is_deleted', false)
        .eq('media_files.is_deleted', false);

    if (error || !data) {
        console.error('[getPaymentAttachments] Error:', error);
        return [];
    }

    // Convert to UploadedFile format
    return data.map((link: any) => {
        const f = link.media_files;
        const { data: { publicUrl } } = supabase.storage.from(f.bucket).getPublicUrl(f.file_path);

        return {
            id: f.id,
            url: publicUrl,
            path: f.file_path,
            name: f.file_name || 'archivo',
            type: f.file_type || 'other',
            size: f.file_size || 0,
            bucket: f.bucket,
        };
    });
}

/**
 * Link an uploaded file to a payment (creates media_files + media_links)
 */
export async function linkPaymentAttachment(
    paymentId: string,
    organizationId: string,
    file: { path: string; name: string; type: string; size: number; bucket: string }
) {
    const supabase = await createClient();

    const dbType = file.type?.startsWith('image/')
        ? 'image'
        : file.type === 'application/pdf'
            ? 'pdf'
            : 'other';

    // 1. Create media_file record
    const { data: fileData, error: fileError } = await supabase
        .from('media_files')
        .insert({
            organization_id: organizationId,
            bucket: file.bucket,
            file_path: file.path,
            file_name: file.name,
            file_type: dbType,
            file_size: file.size,
            is_public: false,
        })
        .select()
        .single();

    if (fileError || !fileData) {
        console.error('[linkPaymentAttachment] media_files error:', fileError);
        return { success: false, error: 'Error al registrar archivo' };
    }

    // 2. Create media_link
    const { error: linkError } = await supabase
        .from('media_links')
        .insert({
            media_file_id: fileData.id,
            organization_id: organizationId,
            general_cost_payment_id: paymentId,
            category: 'financial',
            visibility: 'private',
        });

    if (linkError) {
        console.error('[linkPaymentAttachment] media_links error:', linkError);
        return { success: false, error: 'Error al vincular archivo' };
    }

    revalidatePath('/organization/general-costs');
    return { success: true };
}
