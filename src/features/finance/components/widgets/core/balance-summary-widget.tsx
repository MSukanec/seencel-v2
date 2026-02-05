"use client";

import { useFinanceDashboard } from "@/features/finance/context/finance-dashboard-context";
import { useMoney } from "@/hooks/use-money";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

// Colors
const INCOME_COLOR = "oklch(69.766% 0.16285 126.686)";
const EXPENSE_COLOR = "oklch(54.392% 0.19137 24.073)";
const BALANCE_COLOR = "oklch(70% 0.1 250)"; // Blue for balance line

// Custom Tooltip
function CustomTooltip({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    return (
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium">
                        {entry.name}: ${entry.value.toLocaleString('es-AR')}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function BalanceSummaryWidget() {
    const { kpis, trends } = useFinanceDashboard();
    const { format } = useMoney();

    // Combine data for the chart
    const chartData = trends.income.map((item, i) => ({
        label: item.label,
        income: item.value,
        expenses: trends.expenses[i]?.value || 0,
        balance: trends.balance[i]?.value || 0,
    }));

    const isPositive = kpis.balance >= 0;

    return (
        <Card className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">Resumen Financiero</h3>
                    <p className="text-xs text-muted-foreground">Ingresos, egresos y balance</p>
                </div>
            </div>

            {/* Content: Two columns */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left column: KPI values */}
                <div className="flex flex-col justify-center gap-3 shrink-0 w-48">
                    {/* Income */}
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${INCOME_COLOR}20` }}>
                            <TrendingUp className="w-4 h-4" style={{ color: INCOME_COLOR }} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Ingresos</p>
                            <p className="text-lg font-semibold" style={{ color: INCOME_COLOR }}>
                                {format(kpis.ingresos)}
                            </p>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md" style={{ backgroundColor: `${EXPENSE_COLOR}20` }}>
                            <TrendingDown className="w-4 h-4" style={{ color: EXPENSE_COLOR }} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Egresos</p>
                            <p className="text-lg font-semibold" style={{ color: EXPENSE_COLOR }}>
                                {format(kpis.egresos)}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border my-1" />

                    {/* Balance */}
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10">
                            <Wallet className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Balance</p>
                            <p className={`text-xl font-bold ${isPositive ? 'text-amount-positive' : 'text-amount-negative'}`}>
                                {format(kpis.balance)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right column: Combined Chart */}
                <div className="flex-1 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                            <YAxis hide domain={[0, 'auto']} />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="top"
                                height={24}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '11px' }}
                            />
                            {/* Income bars */}
                            <Bar
                                dataKey="income"
                                name="Ingresos"
                                fill={INCOME_COLOR}
                                radius={[4, 4, 0, 0]}
                                barSize={16}
                            />
                            {/* Expense bars */}
                            <Bar
                                dataKey="expenses"
                                name="Egresos"
                                fill={EXPENSE_COLOR}
                                radius={[4, 4, 0, 0]}
                                barSize={16}
                            />
                            {/* Balance line (dashed) */}
                            <Line
                                type="monotone"
                                dataKey="balance"
                                name="Balance"
                                stroke={BALANCE_COLOR}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Card>
    );
}
