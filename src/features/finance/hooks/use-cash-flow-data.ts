import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

interface CashFlowDataPoint {
    date: string;
    income: number;
    expense: number;
    balance: number;
}

export function useCashFlowData(movements: any[], days = 14) {
    const data = useMemo(() => {
        const result = new Map<string, CashFlowDataPoint>();

        // Init dates
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = format(d, 'yyyy-MM-dd');
            result.set(key, { date: key, income: 0, expense: 0, balance: 0 });
        }

        // Fill data
        movements.forEach(m => {
            const date = m.payment_date?.split('T')[0];
            if (result.has(date)) {
                const entry = result.get(date)!;
                // Unified view uses 'amount' (usually positive) and 'amount_sign' (1 or -1)
                // Fallback to simple amount if sign not present
                const rawAmount = Number(m.amount);
                const sign = Number(m.amount_sign ?? 1);
                const signedAmount = rawAmount * sign;

                if (signedAmount >= 0) entry.income += signedAmount;
                else entry.expense += Math.abs(signedAmount);

                entry.balance += signedAmount;
            }
        });

        // Calculate running balance or daily balance? 
        // Original code seemed to just sum daily balance.
        // If we want cash flow over time (accumulated), we'd need running total.
        // But the chart seems to show "Trend" so daily flux or area. 
        // Original code returns Array.from(result.values()) which are daily aggregates.

        return Array.from(result.values());
    }, [movements, days]);

    const totalBalance = useMemo(() => {
        return movements.reduce((acc, m) => {
            const rawAmount = Number(m.amount);
            const sign = Number(m.amount_sign ?? 1);
            return acc + (rawAmount * sign);
        }, 0);
    }, [movements]);

    return { data, totalBalance };
}
