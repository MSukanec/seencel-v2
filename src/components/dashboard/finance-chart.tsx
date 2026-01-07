"use client";

import { useMemo, useId } from "react";
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { ExpandableCard } from "@/components/ui/expandable-card";

export function FinanceChart({ movements }: { movements: any[] }) {
    const gradientId = useId();
    const data = useMemo(() => {
        // Process data for last 14 days
        const days = 14;
        const result = new Map();

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
                const entry = result.get(date);
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

        return Array.from(result.values());
    }, [movements]);

    // Calculate total balance from the signed amounts
    const totalBalance = movements.reduce((acc, m) => {
        const rawAmount = Number(m.amount);
        const sign = Number(m.amount_sign ?? 1);
        return acc + (rawAmount * sign);
    }, 0);

    return (
        <ExpandableCard
            className="bg-card border border-border rounded-xl p-6 h-full flex flex-col"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Flujo de Caja</h3>
                        <p className="text-xs text-muted-foreground">Últimos 14 días</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold tracking-tight">
                        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-500">
                        <TrendingUp className="w-3 h-3" /> Balance Total
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`colorIncome-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#colorIncome-${gradientId})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ExpandableCard>
    );
}
