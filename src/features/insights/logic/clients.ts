import { Insight, InsightContext } from "../types";
import { allInsightRules } from "./rules";
import { upsellLiquidityInsight, cashFlowRiskInsight } from "./real-estate-rules";
import { ClientFinancialSummary, ClientPaymentView } from "@/features/clients/types";
import { MonetaryItem } from "@/hooks/use-smart-currency";

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
    // NEW: Smart calculation helper
    calculateDisplayAmount: (item: MonetaryItem) => number;
}

export function generateClientInsights(context: ClientInsightsContext): Insight[] {
    const {
        summary,
        payments,
        kpis,
        formatCurrency,
        calculateDisplayAmount,
        primaryCurrencyCode
    } = context;

    const manualInsights: Insight[] = [];

    // --- 1. PRESERVE SPECIFIC DOMAIN RULES (Manual) ---

    // A. Debtors Analysis
    const clientBalances = summary.reduce((acc, s) => {
        if (!acc[s.client_id]) {
            acc[s.client_id] = 0;
        }

        const val = calculateDisplayAmount({
            amount: s.balance_due,
            functional_amount: s.functional_balance_due,
            currency_code: s.currency_code
        });

        acc[s.client_id] += val;
        return acc;
    }, {} as Record<string, number>);

    // 2. Filter clients with actual positive debt (net balance > 0)
    const debtThreshold = 1;
    const debtValues = Object.values(clientBalances).filter(balance => balance > debtThreshold);

    const clientsWithBalance = debtValues.length;
    const totalPendingDebt = debtValues.reduce((sum, val) => sum + val, 0);

    if (clientsWithBalance > 0) {
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
                    payload: { status: 'pending' }
                }
            ]
        });
    }

    // B. No Recent Payments
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

    // Group payments by month for Time Series Analysis
    const monthlyGroups: Record<string, number> = {};
    payments.forEach(p => {
        const month = p.payment_month || p.payment_date.substring(0, 7);
        const val = calculateDisplayAmount({
            amount: Number(p.amount),
            functional_amount: Number(p.functional_amount),
            currency_code: p.currency_code
        });

        monthlyGroups[month] = (monthlyGroups[month] || 0) + val;
    });

    const monthlyData = Object.entries(monthlyGroups)
        .map(([month, value]) => ({ month, value }))
        .sort((a, b) => a.month.localeCompare(b.month));

    // Group by Client
    const clientConcentrationMap: Record<string, number> = {};
    payments.forEach(p => {
        const name = p.client_name || "Desconocido";
        const val = calculateDisplayAmount({
            amount: Number(p.amount),
            functional_amount: Number(p.functional_amount),
            currency_code: p.currency_code
        });
        clientConcentrationMap[name] = (clientConcentrationMap[name] || 0) + val;
    });

    const clientConcentration = Object.entries(clientConcentrationMap)
        .map(([name, value]) => ({ name, value }))
        .filter(c => c.value > 0)
        .sort((a, b) => b.value - a.value);

    const genericContext: InsightContext = {
        totalValue: kpis.totalPaid, // Mapped to "Total Value" (Income)

        monthlyData: monthlyData,
        categoryData: clientConcentration,

        paymentCount: payments.length,
        monthCount: monthlyData.length,

        termLabels: {
            singular: 'ingreso',
            plural: 'ingresos',
            verbIncrease: 'aumenta',
            verbDecrease: 'disminuye'
        },

        // Default Thresholds Configuration
        // Default Thresholds Configuration
        thresholds: {
            growthSignificant: 15,
            trendStable: 4,
            concentrationPareto: 80,
            minDataPoints: 3,
            upsellLiquidity: 90, // Default 90%
            cashFlowRisk: 1 // Default
        },

        // Pass full summary for real estate rules
        clientSummaries: summary.map(s => ({
            client_id: s.client_id,
            total_committed_amount: s.total_committed_amount,
            total_paid_amount: s.total_paid_amount,
            balance_due: s.balance_due,
            currency_code: s.currency_code
        }))
    };

    // --- 3. RUN GENERIC & REAL ESTATE RULES ---
    const activeRules = [...allInsightRules, upsellLiquidityInsight, cashFlowRiskInsight];

    const genericInsights = activeRules
        .map(rule => rule(genericContext))
        .filter((i): i is Insight => i !== null);

    return [...manualInsights, ...genericInsights].sort((a, b) => (a.priority || 99) - (b.priority || 99)).slice(0, 5);
}
