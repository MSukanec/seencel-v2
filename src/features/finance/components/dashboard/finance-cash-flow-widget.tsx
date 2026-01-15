"use client";

import { useCashFlowData } from "@/features/finance/hooks/use-cash-flow-data";
import { BaseAreaChart } from "@/components/charts/base-area-chart";
import { formatCurrency } from "@/components/charts/chart-config";
import { DollarSign, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function FinanceCashFlowWidget({ movements, className }: { movements: any[], className?: string }) {
    const { data, totalBalance } = useCashFlowData(movements);

    return (
        <Card className={cn("p-6 flex flex-col h-full border rounded-2xl bg-card/50 backdrop-blur-sm shadow-sm", className)}>
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
                        {formatCurrency(totalBalance)}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-500">
                        <TrendingUp className="w-3 h-3" /> Balance Total
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <BaseAreaChart
                    data={data}
                    xKey="date"
                    yKey="income"
                    height={300} // Let container control height via flex
                    color="#10b981"
                    showGrid={true}
                    xAxisFormatter={(val) => {
                        const d = new Date(val);
                        // Simple day/month format
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    tooltipFormatter={formatCurrency}
                />
            </div>
        </Card>
    );
}
