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
                // Standard 3.4.4: Calculate functional amount dynamically
                const rawAmount = Number(m.amount) * (Number(m.exchange_rate) || 1);
                const sign = Number(m.amount_sign ?? 1);
                const signedAmount = rawAmount * sign;

                if (signedAmount >= 0) entry.income += signedAmount;
                else entry.expense += Math.abs(signedAmount);

                entry.balance += signedAmount;
            }
        });

        return Array.from(result.values());
    }, [movements, days]);

    const totalBalance = useMemo(() => {
        return movements.reduce((acc, m) => {
            // Standard 3.4.4: Calculate functional amount dynamically
            const rawAmount = Number(m.amount) * (Number(m.exchange_rate) || 1);
            const sign = Number(m.amount_sign ?? 1);
            return acc + (rawAmount * sign);
        }, 0);
    }, [movements]);

    return { data, totalBalance };
}

