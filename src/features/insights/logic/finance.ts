/**
 * Finance Insights Adapter
 * 
 * Generates insights for organization-wide finances including:
 * - Cash flow analysis (ingresos vs egresos)
 * - Wallet balance distribution and alerts
 * - Trends and projections
 * - Activity alerts
 * - Movement type analysis
 */

import { Insight, InsightContext } from "../types";
import { allInsightRules } from "./rules";

// =============================================
// TYPES
// =============================================

export interface FinanceMovement {
    id: string;
    payment_date: string;
    amount: number;
    functional_amount?: number;
    amount_sign: number; // 1 = income, -1 = expense
    wallet_id?: string;
    movement_type?: string;
}

export interface WalletInfo {
    id: string;
    wallet_name: string;
}

export interface FinanceInsightsContext {
    movements: FinanceMovement[];
    wallets: WalletInfo[];
    formatCurrency: (amount: number) => string;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function getWalletName(walletId: string | undefined, wallets: WalletInfo[]): string {
    if (!walletId) return 'Sin billetera';
    return wallets.find(w => w.id === walletId)?.wallet_name || 'Sin billetera';
}

function getMovementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        'client_payment': 'Pagos de Clientes',
        'material_payment': 'Materiales',
        'personnel_payment': 'Personal',
        'partner_contribution': 'Aportes de Socios',
        'partner_withdrawal': 'Retiros de Socios',
        'general_cost_payment': 'Gastos Generales',
        'equipment_rental': 'Alquiler de Equipos',
        'wallet_transfer': 'Transferencias',
        'currency_exchange': 'Cambios de Moneda'
    };
    return labels[type] || type || 'Otros';
}

// =============================================
// MAIN GENERATOR
// =============================================

export function generateFinanceInsights(context: FinanceInsightsContext): Insight[] {
    const { movements, wallets, formatCurrency } = context;

    if (!movements || movements.length === 0) return [];

    const manualInsights: Insight[] = [];

    // =============================================
    // 1. CALCULATE KPIs
    // =============================================
    let totalIngresos = 0;
    let totalEgresos = 0;

    movements.forEach(m => {
        const amount = Math.abs(Number(m.functional_amount || m.amount) || 0);
        if (m.amount_sign === 1) {
            totalIngresos += amount;
        } else {
            totalEgresos += amount;
        }
    });

    const balance = totalIngresos - totalEgresos;
    const ratio = totalIngresos > 0 ? (totalEgresos / totalIngresos) * 100 : 0;

    // =============================================
    // 2. CASH FLOW INSIGHTS
    // =============================================

    // 2a. Ratio Egresos/Ingresos Alto (margen bajo)
    if (ratio > 90 && totalIngresos > 0) {
        manualInsights.push({
            id: 'high-expense-ratio',
            title: 'Margen ajustado',
            description: `Los egresos representan el ${Math.round(ratio)}% de los ingresos. El margen es muy bajo.`,
            severity: ratio > 100 ? 'critical' : 'warning',
            icon: 'AlertTriangle',
            priority: 1,
            context: `Ingresos: ${formatCurrency(totalIngresos)} | Egresos: ${formatCurrency(totalEgresos)}`,
            actionHint: 'Revisá los egresos para identificar oportunidades de optimización.',
        });
    }

    // 2b. Balance Negativo General
    if (balance < 0) {
        manualInsights.push({
            id: 'negative-balance',
            title: 'Balance negativo',
            description: `Los egresos superan a los ingresos por ${formatCurrency(Math.abs(balance))}.`,
            severity: 'critical',
            icon: 'TrendingDown',
            priority: 1,
            context: 'Se ha gastado más de lo que ha ingresado en el período.',
            actionHint: 'Priorizá cobros pendientes o reducí gastos.',
        });
    }

    // =============================================
    // 3. WALLET BALANCE INSIGHTS
    // =============================================

    // Calculate wallet balances
    const walletBalances: Record<string, number> = {};
    movements.forEach(m => {
        const walletName = getWalletName(m.wallet_id, wallets);
        const amount = Number(m.functional_amount || m.amount) || 0;
        const signedAmount = amount * (m.amount_sign || 1);
        walletBalances[walletName] = (walletBalances[walletName] || 0) + signedAmount;
    });

    const walletEntries = Object.entries(walletBalances);
    const totalWalletBalance = walletEntries.reduce((sum, [_, val]) => sum + Math.max(0, val), 0);

    // 3a. Billetera Vacía o Negativa
    const negativeWallets = walletEntries.filter(([_, val]) => val < 0);
    if (negativeWallets.length > 0) {
        const worstWallet = negativeWallets.sort((a, b) => a[1] - b[1])[0];
        manualInsights.push({
            id: 'negative-wallet',
            title: `Billetera en rojo: ${worstWallet[0]}`,
            description: `Esta cuenta tiene un saldo negativo de ${formatCurrency(Math.abs(worstWallet[1]))}.`,
            severity: 'critical',
            icon: 'Wallet',
            priority: 1,
            actionHint: 'Transferí fondos a esta cuenta o revisá los movimientos.',
        });
    }

    // 3b. Concentración de Fondos (> 85% en una billetera)
    if (walletEntries.length > 1 && totalWalletBalance > 0) {
        const sortedWallets = walletEntries.filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]);
        if (sortedWallets.length > 0) {
            const topWallet = sortedWallets[0];
            const topPercentage = (topWallet[1] / totalWalletBalance) * 100;

            if (topPercentage > 85) {
                manualInsights.push({
                    id: 'wallet-concentration',
                    title: 'Alta concentración de fondos',
                    description: `El ${Math.round(topPercentage)}% de tus fondos están en "${topWallet[0]}".`,
                    severity: 'warning',
                    icon: 'PieChart',
                    priority: 3,
                    context: `${formatCurrency(topWallet[1])} de ${formatCurrency(totalWalletBalance)} totales.`,
                    actionHint: 'Considerá diversificar entre cuentas para reducir riesgos.',
                });
            }
        }
    }

    // 3c. Billetera Inactiva (sin movimientos en 30+ días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const walletLastActivity: Record<string, Date> = {};
    movements.forEach(m => {
        const walletName = getWalletName(m.wallet_id, wallets);
        const paymentDate = new Date(m.payment_date);
        if (!walletLastActivity[walletName] || paymentDate > walletLastActivity[walletName]) {
            walletLastActivity[walletName] = paymentDate;
        }
    });

    const inactiveWallets = Object.entries(walletLastActivity)
        .filter(([name, lastDate]) => lastDate < thirtyDaysAgo && walletBalances[name] > 1000)
        .map(([name]) => name);

    if (inactiveWallets.length > 0) {
        manualInsights.push({
            id: 'inactive-wallet',
            title: `${inactiveWallets.length} billetera(s) sin actividad`,
            description: `"${inactiveWallets[0]}"${inactiveWallets.length > 1 ? ` y ${inactiveWallets.length - 1} más` : ''} no tienen movimientos hace más de 30 días.`,
            severity: 'info',
            icon: 'Clock',
            priority: 4,
            actionHint: 'Verificá si hay fondos que podrían utilizarse.',
        });
    }

    // =============================================
    // 4. ACTIVITY ALERTS
    // =============================================

    // 4a. Sin Ingresos Recientes (15 días)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const recentIngresos = movements.filter(m =>
        m.amount_sign === 1 && new Date(m.payment_date) >= fifteenDaysAgo
    );

    const hasHistoricalIncome = movements.some(m => m.amount_sign === 1);

    if (recentIngresos.length === 0 && hasHistoricalIncome) {
        manualInsights.push({
            id: 'no-recent-income',
            title: 'Sin ingresos en 15 días',
            description: 'No se han registrado cobros o aportes recientemente.',
            severity: 'warning',
            icon: 'AlertCircle',
            priority: 2,
            actionHint: 'Hacé seguimiento a los clientes con pagos pendientes.',
        });
    }

    // 4b. Pico de Egresos (último mes muy por encima del promedio)
    const monthlyEgresos: Record<string, number> = {};
    movements.forEach(m => {
        if (m.amount_sign === -1) {
            const month = m.payment_date.substring(0, 7);
            const amount = Math.abs(Number(m.functional_amount || m.amount) || 0);
            monthlyEgresos[month] = (monthlyEgresos[month] || 0) + amount;
        }
    });

    const egresoMonths = Object.entries(monthlyEgresos).sort((a, b) => b[0].localeCompare(a[0]));
    if (egresoMonths.length >= 3) {
        const lastMonth = egresoMonths[0];
        const previousMonths = egresoMonths.slice(1, 4);
        const avgPrevious = previousMonths.reduce((sum, [_, v]) => sum + v, 0) / previousMonths.length;

        if (avgPrevious > 0 && lastMonth[1] > avgPrevious * 1.5) {
            const increasePercent = Math.round(((lastMonth[1] - avgPrevious) / avgPrevious) * 100);
            manualInsights.push({
                id: 'expense-spike',
                title: 'Pico de egresos detectado',
                description: `Los egresos del último mes son ${increasePercent}% mayores al promedio de los meses anteriores.`,
                severity: 'warning',
                icon: 'TrendingUp',
                priority: 2,
                context: `Último mes: ${formatCurrency(lastMonth[1])} | Promedio: ${formatCurrency(avgPrevious)}`,
                actionHint: 'Revisá qué gastos fueron extraordinarios.',
            });
        }
    }

    // =============================================
    // 5. MOVEMENT TYPE ANALYSIS
    // =============================================

    // 5a. Mayor Egreso por Tipo
    const egresosByType: Record<string, number> = {};
    movements.forEach(m => {
        if (m.amount_sign === -1) {
            const type = getMovementTypeLabel(m.movement_type || '');
            const amount = Math.abs(Number(m.functional_amount || m.amount) || 0);
            egresosByType[type] = (egresosByType[type] || 0) + amount;
        }
    });

    const typeSorted = Object.entries(egresosByType).sort((a, b) => b[1] - a[1]);
    if (typeSorted.length > 0 && totalEgresos > 0) {
        const topType = typeSorted[0];
        const topTypePercent = Math.round((topType[1] / totalEgresos) * 100);

        if (topTypePercent > 50) {
            manualInsights.push({
                id: 'top-expense-type',
                title: `Principal egreso: ${topType[0]}`,
                description: `El ${topTypePercent}% de los egresos corresponde a "${topType[0]}".`,
                severity: 'info',
                icon: 'BarChart3',
                priority: 4,
                context: `${formatCurrency(topType[1])} de ${formatCurrency(totalEgresos)} en egresos.`,
                actionHint: 'Este es tu mayor centro de costos.',
            });
        }
    }

    // 5b. Origen Principal de Ingresos
    const ingresosByType: Record<string, number> = {};
    movements.forEach(m => {
        if (m.amount_sign === 1) {
            const type = getMovementTypeLabel(m.movement_type || '');
            const amount = Math.abs(Number(m.functional_amount || m.amount) || 0);
            ingresosByType[type] = (ingresosByType[type] || 0) + amount;
        }
    });

    const incomeTypeSorted = Object.entries(ingresosByType).sort((a, b) => b[1] - a[1]);
    if (incomeTypeSorted.length > 1 && totalIngresos > 0) {
        const topIncomeType = incomeTypeSorted[0];
        const topIncomePercent = Math.round((topIncomeType[1] / totalIngresos) * 100);

        if (topIncomePercent > 70) {
            manualInsights.push({
                id: 'income-concentration',
                title: 'Concentración de ingresos',
                description: `El ${topIncomePercent}% de los ingresos proviene de "${topIncomeType[0]}".`,
                severity: topIncomePercent > 90 ? 'warning' : 'info',
                icon: 'Target',
                priority: 3,
                context: `Diversificar fuentes de ingreso reduce riesgos.`,
            });
        }
    }

    // =============================================
    // 6. MONTHLY TRENDS (Use Generic Rules)
    // =============================================

    // Group by month for time series
    const monthlyData: Record<string, { ingresos: number; egresos: number }> = {};
    movements.forEach(m => {
        const month = m.payment_date.substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { ingresos: 0, egresos: 0 };
        }
        const amount = Math.abs(Number(m.functional_amount || m.amount) || 0);
        if (m.amount_sign === 1) {
            monthlyData[month].ingresos += amount;
        } else {
            monthlyData[month].egresos += amount;
        }
    });

    const sortedMonthly = Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
            month,
            value: data.ingresos - data.egresos, // Net cash flow
            balance: data.ingresos - data.egresos
        }));

    // 6a. Detect months with negative cash flow
    const negativeMonths = sortedMonthly.filter(m => m.value < 0);
    if (negativeMonths.length > 0 && sortedMonthly.length >= 3) {
        const recentNegative = negativeMonths.slice(-3).length;
        if (recentNegative >= 2) {
            manualInsights.push({
                id: 'negative-cashflow-trend',
                title: 'Flujo de caja negativo recurrente',
                description: `${recentNegative} de los últimos meses tuvieron más egresos que ingresos.`,
                severity: 'critical',
                icon: 'TrendingDown',
                priority: 1,
                actionHint: 'Esto puede indicar un problema de liquidez sostenido.',
            });
        }
    }

    // Build generic context for trend rules
    const genericContext: InsightContext = {
        totalValue: totalIngresos,
        totalIngresos,
        totalEgresos,
        balance,
        monthlyData: sortedMonthly,
        categoryData: typeSorted.map(([name, value]) => ({ name, value })),
        monthCount: sortedMonthly.length,
        paymentCount: movements.length,
        termLabels: {
            singular: 'flujo',
            plural: 'movimientos',
            verbIncrease: 'aumenta',
            verbDecrease: 'disminuye'
        },
        thresholds: {
            growthSignificant: 15,
            trendStable: 4,
            concentrationPareto: 80,
            minDataPoints: 3,
            upsellLiquidity: 90,
            cashFlowRisk: 1
        }
    };

    // Run generic rules (trends, projections, etc.)
    const genericInsights = allInsightRules
        .map(rule => rule(genericContext))
        .filter((i): i is Insight => i !== null);

    // =============================================
    // COMBINE & SORT
    // =============================================

    const allInsights = [...manualInsights, ...genericInsights]
        .sort((a, b) => (a.priority || 99) - (b.priority || 99))
        .slice(0, 5);

    return allInsights;
}
