import { Insight, InsightContext } from "../types";
import { allInsightRules } from "./rules";
import { ClientFinancialSummary, ClientPaymentView } from "@/features/clients/types";

// Helper Interface for KPI structure needed
export interface KPISummary {
    totalCommitted: number;
    totalPaid: number;
    totalBalance: number;
    trendPercent: number;
}

interface ClientInsightsContext {
    summary: ClientFinancialSummary[];
    payments: ClientPaymentView[];
    kpis: KPISummary;
    primaryCurrencyCode: string;
    displayCurrency: 'primary' | 'secondary';
    // Helper to format currency passed from component
    formatCurrency: (amount: number, currencyCode?: string) => string;
    // Current rate for internal conversions
    currentRate: number;
    secondaryCurrencyCode?: string;
}

export function generateClientInsights(context: ClientInsightsContext): Insight[] {
    const { summary, payments, kpis, formatCurrency, primaryCurrencyCode, displayCurrency, currentRate, secondaryCurrencyCode } = context;
    const manualInsights: Insight[] = [];

    // --- 1. PRESERVE SPECIFIC DOMAIN RULES (Manual) ---
    // (These are specific to collections/debt and not covered by generic financial rules)

    // A. Debtors Analysis
    const debtors = summary.filter(s => s.balance_due > 0);
    const clientsWithBalance = debtors.length;

    if (clientsWithBalance > 0) {
        // Smart calc for total pending
        const totalPendingDebt = debtors.reduce((acc, s) => {
            const itemCode = s.currency_code || primaryCurrencyCode;
            const targetCurrencyCode = displayCurrency === 'secondary' && secondaryCurrencyCode
                ? secondaryCurrencyCode
                : primaryCurrencyCode;

            const functional = s.functional_balance_due;
            const original = s.balance_due;

            let val = 0;
            if (displayCurrency === 'secondary') {
                if (itemCode === targetCurrencyCode) {
                    val = original;
                } else {
                    const rate = currentRate === 0 ? 1 : currentRate;
                    val = functional / rate;
                }
            } else {
                val = functional;
            }
            return acc + val;
        }, 0);

        manualInsights.push({
            id: "balance-pending",
            title: `${clientsWithBalance} clientes con saldo pendiente`,
            description: `Hay ${formatCurrency(totalPendingDebt)} por cobrar de estos clientes.`,
            severity: clientsWithBalance > 3 ? "warning" : "info",
            actions: [
                {
                    id: 'filter-debtors',
                    label: 'Ver deudores',
                    type: 'filter',
                    payload: { status: 'pending' } // Hypothetical payload
                }
            ]
        });
    }

    // B. No Recent Payments
    // We can let the generic "Operational Load" rule handle low volume? 
    // But this specific "No payments in 30 days" is quite specific critical alert.
    const recentPayments = payments.filter(p => {
        const daysDiff = (Date.now() - new Date(p.payment_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
    });
    if (recentPayments.length === 0 && payments.length > 0) {
        manualInsights.push({
            id: "no-recent",
            title: "Sin pagos en los últimos 30 días",
            description: "No se han registrado cobros recientemente. Considera hacer seguimiento.",
            severity: "critical",
            actions: [
                {
                    id: 'view-activity',
                    label: 'Ver actividad',
                    type: 'navigate',
                    payload: { tab: 'activity' }
                }
            ]
        });
    }

    // --- 2. ADAPTER: MAP TO GENERIC CONTEXT FOR ADVANCED RULES ---
    // We treat "Clients" as "Categories" to use the Concentration Rule (Whale Client detection)

    // Group payments by month for Time Series Analysis
    // We need to normalize amounts to the display currency first to be consistent
    const monthlyGroups: Record<string, number> = {};
    payments.forEach(p => {
        const month = p.payment_month || p.payment_date.substring(0, 7);
        // Normalize amount logic
        let val = Number(p.amount); // Default
        const pCode = p.currency_code || primaryCurrencyCode;
        if (displayCurrency === 'secondary') {
            // If not target currency, convert
            const targetCode = secondaryCurrencyCode || 'USD';
            if (pCode !== targetCode) {
                val = (Number(p.functional_amount) || val) / (currentRate || 1);
            }
        } else {
            // Primary: use functional
            val = Number(p.functional_amount) || val;
        }

        monthlyGroups[month] = (monthlyGroups[month] || 0) + val;
    });

    // Convert to array
    const monthlyData = Object.entries(monthlyGroups)
        .map(([month, value]) => ({ month, value }))
        .sort((a, b) => a.month.localeCompare(b.month));

    // Group by Client for Concentration Analysis (Using Payments to ensure we have Names)
    const clientConcentrationMap: Record<string, number> = {};
    payments.forEach(p => {
        const name = p.client_name || "Desconocido";
        // Normalize amount
        let val = Number(p.amount);
        const pCode = p.currency_code || primaryCurrencyCode;
        if (displayCurrency === 'secondary') {
            const targetCode = secondaryCurrencyCode || 'USD';
            if (pCode !== targetCode) {
                val = (Number(p.functional_amount) || val) / (currentRate || 1);
            }
        } else {
            val = Number(p.functional_amount) || val;
        }
        clientConcentrationMap[name] = (clientConcentrationMap[name] || 0) + val;
    });

    const clientConcentration = Object.entries(clientConcentrationMap)
        .map(([name, value]) => ({ name, value }))
        .filter(c => c.value > 0)
        .sort((a, b) => b.value - a.value);

    const genericContext: InsightContext = {
        totalGasto: kpis.totalPaid, // Mapped to "Total Value" (Income)

        monthlyData: monthlyData,
        categoryData: clientConcentration, // Clients = Categories

        paymentCount: payments.length,
        monthCount: monthlyData.length,

        // Optional: Income/Expense context if we had egresos
        totalIngresos: kpis.totalPaid,
        totalEgresos: 0 // We are in Clients view (Revenue only usually)
    };

    // --- 3. RUN GENERIC RULES ---
    const genericInsights = allInsightRules
        .map(rule => rule(genericContext))
        .filter((i): i is Insight => i !== null)
        // Post-processing: Tweaking titles for "Revenue" context instead of "Expense"
        .map(insight => {
            // Quick text replacement hack to adapt "Gasto" rules to "Ingreso" context
            // A better way would be passing 'contextType': 'income' | 'expense' to context.
            // For now, simple string replacement works wonders for immediate value.
            return {
                ...insight,
                title: insight.title.replace(/gasto/gi, 'ingreso'),
                description: insight.description.replace(/gasto/gi, 'ingreso'),
                context: insight.context?.replace(/gasto/gi, 'ingreso')
            };
        });

    // Merge Manual + Generic
    return [...manualInsights, ...genericInsights].sort((a, b) => (a.priority || 99) - (b.priority || 99)).slice(0, 5);
}
