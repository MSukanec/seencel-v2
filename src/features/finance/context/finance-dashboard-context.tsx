"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { useMoney } from "@/hooks/use-money";
import { useCurrency } from "@/stores/organization-store";
import { startOfDay, endOfDay, isAfter, isBefore, isEqual } from "date-fns";
import { DateRangeFilterValue } from "@/components/layout/dashboard/shared/toolbar/toolbar-date-range-filter";

// === TYPES ===
interface FinanceDashboardContextValue {
    // Raw Data
    movements: any[];
    filteredMovements: any[];
    wallets: any[];

    // Filters
    dateRange: DateRangeFilterValue | undefined;
    setDateRange: (range: DateRangeFilterValue | undefined) => void;

    // Calculated KPIs (Functional Currency)
    kpis: {
        ingresos: number;
        egresos: number;
        balance: number;
        monthlyAverage: number;
        trendPercent: number;
        trendDirection: string;
        ingresosBreakdown: any[];
        egresosBreakdown: any[];
        totalMovements: number;
    };

    // Bento Chart Data (Trends with labels)
    trends: {
        income: { label: string; value: number }[];
        expenses: { label: string; value: number }[];
        balance: { label: string; value: number }[];
        movements: { label: string; value: number }[];
    };

    // Helpers
    isMixView: boolean;
}

const FinanceDashboardContext = createContext<FinanceDashboardContextValue | null>(null);

interface FinanceDashboardProviderProps {
    children: ReactNode;
    movements: any[];
    wallets: any[];
    dateRange: DateRangeFilterValue | undefined;
    setDateRange: (range: DateRangeFilterValue | undefined) => void;
}

export function FinanceDashboardProvider({
    children,
    movements,
    wallets,
    dateRange,
    setDateRange
}: FinanceDashboardProviderProps) {
    // 1. Centralized Money Hooks
    const money = useMoney();
    const moneyForKPIs = useMoney({ forcedMode: 'functional' });
    const isMixView = money.displayMode === 'mix';

    // 2. Filter Movements
    const filteredMovements = useMemo(() => {
        if (!dateRange || (!dateRange.from && !dateRange.to)) {
            return movements;
        }
        return movements.filter(m => {
            const date = startOfDay(new Date(m.payment_date));
            const from = dateRange.from ? startOfDay(dateRange.from) : null;
            const to = dateRange.to ? endOfDay(dateRange.to) : null;
            if (from && to) {
                return (isAfter(date, from) || isEqual(date, from)) &&
                    (isBefore(date, to) || isEqual(date, to));
            }
            if (from) return isAfter(date, from) || isEqual(date, from);
            if (to) return isBefore(date, to) || isEqual(date, to);
            return true;
        });
    }, [movements, dateRange]);

    // 3. KPI Calculations
    const kpis = useMemo(() => {
        const kpiMovements = filteredMovements.map(m => ({
            amount: m.amount,
            currency_code: m.currency_code,
            exchange_rate: m.exchange_rate,
            amount_sign: m.amount_sign,
            payment_date: m.payment_date,
            wallet_id: m.wallet_id,
        }));

        const result = moneyForKPIs.calculateKPIs(kpiMovements);

        // Map breakdown helper
        const mapBreakdown = (breakdown: typeof result.ingresosBreakdown) => {
            return breakdown.map(b => ({
                currencyCode: b.currencyCode,
                symbol: b.symbol,
                nativeTotal: b.nativeTotal,
                functionalTotal: b.nativeTotal * (b.isPrimary ? 1 : moneyForKPIs.config.currentExchangeRate),
                isPrimary: b.isPrimary,
            }));
        };

        return {
            ingresos: result.totalIngresos,
            egresos: result.totalEgresos,
            balance: result.balance,
            monthlyAverage: result.monthlyAverage,
            trendPercent: result.trendPercent,
            trendDirection: result.trendDirection,
            ingresosBreakdown: mapBreakdown(result.ingresosBreakdown),
            egresosBreakdown: mapBreakdown(result.egresosBreakdown),
            totalMovements: result.totalMovements,
        };
    }, [filteredMovements, moneyForKPIs]);

    // 4. Trends from Real Data (grouped by month)
    const trends = useMemo(() => {
        const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // Initialize monthly data structure
        const monthlyData: Record<number, { income: number; expenses: number; count: number }> = {};
        for (let i = 0; i < 12; i++) {
            monthlyData[i] = { income: 0, expenses: 0, count: 0 };
        }

        // Aggregate movements by month
        filteredMovements.forEach(m => {
            const date = new Date(m.payment_date);
            const monthIndex = date.getMonth();
            const functionalAmount = moneyForKPIs.toFunctionalAmount({
                amount: m.amount,
                currency_code: m.currency_code,
                exchange_rate: m.exchange_rate
            });

            // Check for 'plus' string OR positive sign (1)
            const isIncome = m.amount_sign === 'plus' || m.amount_sign === 1 || m.amount_sign === '1';

            if (isIncome) {
                monthlyData[monthIndex].income += functionalAmount;
            } else {
                monthlyData[monthIndex].expenses += functionalAmount;
            }
            monthlyData[monthIndex].count += 1;
        });

        // Convert to chart format
        const income = monthLabels.map((label, i) => ({
            label,
            value: Math.round(monthlyData[i].income)
        }));

        const expenses = monthLabels.map((label, i) => ({
            label,
            value: Math.round(monthlyData[i].expenses)
        }));

        const balance = monthLabels.map((label, i) => ({
            label,
            value: Math.round(monthlyData[i].income - monthlyData[i].expenses)
        }));

        const movements = monthLabels.map((label, i) => ({
            label,
            value: monthlyData[i].count
        }));

        return { income, expenses, balance, movements };
    }, [filteredMovements, moneyForKPIs]);

    const value = {
        movements,
        filteredMovements,
        wallets,
        dateRange,
        setDateRange,
        kpis,
        trends,
        isMixView
    };

    return (
        <FinanceDashboardContext.Provider value={value}>
            {children}
        </FinanceDashboardContext.Provider>
    );
}

// === HOOK (strict — throws if no provider) ===
export function useFinanceDashboard() {
    const context = useContext(FinanceDashboardContext);
    if (!context) {
        throw new Error("useFinanceDashboard must be used within a FinanceDashboardProvider");
    }
    return context;
}

// === HOOK (safe — returns null if no provider, for widgets on any dashboard) ===
export function useFinanceDashboardSafe() {
    return useContext(FinanceDashboardContext);
}
