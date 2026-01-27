/**
 * KPI Calculator - Financial KPI Calculations
 * 
 * Centralized calculations for financial KPIs used across the application.
 * All KPI logic should be defined here, not in individual components.
 * 
 * This ensures:
 * - Consistent calculations across all views
 * - Easy testing (pure functions)
 * - Single place to audit financial logic
 */

import { MoneyInput, MoneyConfig, DisplayMode, createMoney } from './money';
import { calculateDisplayAmount, sumMoneyWithSign, MoneySum } from './money-service';

/**
 * Movement interface for KPI calculations
 */
export interface KPIMovement extends MoneyInput {
    amount_sign?: number | null;
    payment_date?: string | null;
    wallet_id?: string | null;
    movement_type?: string | null;
}

/**
 * Result of KPI calculation
 */
export interface FinanceKPIs {
    /** Total income (ingresos) */
    totalIngresos: number;

    /** Total expenses (egresos) */
    totalEgresos: number;

    /** Net balance (ingresos - egresos) */
    balance: number;

    /** Monthly average of income */
    monthlyAverage: number;

    /** Trend percentage (current vs last month) */
    trendPercent: number;

    /** Trend direction */
    trendDirection: 'up' | 'down' | 'neutral';

    /** Number of months with data */
    monthCount: number;

    /** Total number of movements */
    totalMovements: number;

    /** Breakdown of income by currency */
    ingresosBreakdown: MoneySum['breakdown'];

    /** Breakdown of expenses by currency */
    egresosBreakdown: MoneySum['breakdown'];
}

/**
 * Calculate all finance KPIs from a list of movements
 * 
 * @param movements - Array of financial movements
 * @param mode - Display mode for calculations
 * @param config - Money configuration
 * @returns FinanceKPIs object
 */
export function calculateFinanceKPIs(
    movements: KPIMovement[],
    mode: DisplayMode,
    config: MoneyConfig
): FinanceKPIs {
    if (!movements || movements.length === 0) {
        return {
            totalIngresos: 0,
            totalEgresos: 0,
            balance: 0,
            monthlyAverage: 0,
            trendPercent: 0,
            trendDirection: 'neutral',
            monthCount: 0,
            totalMovements: 0,
            ingresosBreakdown: [],
            egresosBreakdown: [],
        };
    }

    // Calculate totals using MoneyService
    const { ingresos, egresos, balance } = sumMoneyWithSign(movements, mode, config);

    // Count unique months
    const monthsSet = new Set<string>();
    for (const m of movements) {
        if (m.payment_date) {
            monthsSet.add(m.payment_date.substring(0, 7)); // "YYYY-MM"
        }
    }
    const monthCount = monthsSet.size || 1;

    // Monthly average
    const monthlyAverage = ingresos.total / monthCount;

    // Calculate trend (this month vs last month)
    const { trendPercent, trendDirection } = calculateTrend(movements, mode, config);

    return {
        totalIngresos: ingresos.total,
        totalEgresos: egresos.total,
        balance,
        monthlyAverage,
        trendPercent,
        trendDirection,
        monthCount,
        totalMovements: movements.length,
        ingresosBreakdown: ingresos.breakdown,
        egresosBreakdown: egresos.breakdown,
    };
}

/**
 * Calculate trend comparing current month to previous month
 */
function calculateTrend(
    movements: KPIMovement[],
    mode: DisplayMode,
    config: MoneyConfig
): { trendPercent: number; trendDirection: 'up' | 'down' | 'neutral' } {
    // Group movements by month
    const monthlyIngresos = new Map<string, number>();

    for (const m of movements) {
        const sign = Number(m.amount_sign ?? 1);
        if (sign <= 0) continue; // Only ingresos for trend

        const month = m.payment_date?.substring(0, 7) || '';
        if (!month) continue;

        const money = createMoney(m, config);
        const amount = calculateDisplayAmount(money, mode, config);

        const current = monthlyIngresos.get(month) || 0;
        monthlyIngresos.set(month, current + amount);
    }

    // Get this month and last month
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toISOString().slice(0, 7);

    const thisMonthIngresos = monthlyIngresos.get(thisMonth) || 0;
    const lastMonthIngresos = monthlyIngresos.get(lastMonth) || 0;

    if (lastMonthIngresos === 0) {
        return { trendPercent: 0, trendDirection: 'neutral' };
    }

    const trendPercent = ((thisMonthIngresos - lastMonthIngresos) / lastMonthIngresos) * 100;

    return {
        trendPercent,
        trendDirection: trendPercent > 0 ? 'up' : trendPercent < 0 ? 'down' : 'neutral',
    };
}

/**
 * Calculate cash flow data for charts (monthly ingresos vs egresos)
 */
export interface CashFlowDataPoint {
    month: string;
    rawMonth: string;
    ingresos: number;
    egresos: number;
    balance: number;
}

export function calculateCashFlowData(
    movements: KPIMovement[],
    mode: DisplayMode,
    config: MoneyConfig,
    monthsToShow: number = 12
): CashFlowDataPoint[] {
    if (!movements || movements.length === 0) return [];

    // Group by month
    const monthly = new Map<string, { ingresos: number; egresos: number }>();

    for (const m of movements) {
        const month = m.payment_date?.substring(0, 7) || '';
        if (!month) continue;

        const money = createMoney(m, config);
        const amount = calculateDisplayAmount(money, mode, config);
        const sign = Number(m.amount_sign ?? 1);

        const current = monthly.get(month) || { ingresos: 0, egresos: 0 };
        if (sign > 0) {
            current.ingresos += amount;
        } else {
            current.egresos += amount;
        }
        monthly.set(month, current);
    }

    // Sort and take last N months
    const sorted = Array.from(monthly.entries())
        .filter(([month]) => month && month.length >= 7)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-monthsToShow);

    // Format for display
    return sorted.map(([rawMonth, data]) => {
        const [year, monthNum] = rawMonth.split('-').map(Number);
        const date = new Date(year, (monthNum || 1) - 1, 1);
        const formatted = isNaN(date.getTime())
            ? rawMonth
            : new Intl.DateTimeFormat('es', { month: 'short', year: '2-digit' }).format(date);

        return {
            month: formatted,
            rawMonth,
            ingresos: data.ingresos,
            egresos: data.egresos,
            balance: data.ingresos - data.egresos,
        };
    });
}

/**
 * Calculate wallet balances from movements
 */
export interface WalletBalance {
    walletId: string;
    walletName: string;
    balance: number;
}

export function calculateWalletBalances(
    movements: KPIMovement[],
    wallets: { id: string; wallet_name: string }[],
    mode: DisplayMode,
    config: MoneyConfig
): WalletBalance[] {
    const walletMap = new Map<string, number>();

    for (const m of movements) {
        const walletId = m.wallet_id || 'unknown';
        const money = createMoney(m, config);
        const amount = calculateDisplayAmount(money, mode, config);
        const sign = Number(m.amount_sign ?? 1);

        const current = walletMap.get(walletId) || 0;
        walletMap.set(walletId, current + (amount * sign));
    }

    // Map to wallet names
    const getWalletName = (id: string) =>
        wallets.find(w => w.id === id)?.wallet_name || 'Sin billetera';

    return Array.from(walletMap.entries())
        .map(([walletId, balance]) => ({
            walletId,
            walletName: getWalletName(walletId),
            balance,
        }))
        .sort((a, b) => b.balance - a.balance);
}
