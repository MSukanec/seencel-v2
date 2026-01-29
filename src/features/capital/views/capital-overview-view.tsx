"use client";

import { useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { LazyAreaChart } from "@/components/charts/lazy-charts";
import { EmptyState } from "@/components/ui/empty-state";
import { useMoney } from "@/hooks/use-money";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Landmark
} from "lucide-react";

interface CapitalOverviewViewProps {
    movements: any[];
    participants: any[];
    wallets: { id: string; wallet_name: string }[];
}

export function CapitalOverviewView({
    movements,
    participants,
    wallets,
}: CapitalOverviewViewProps) {
    const { format } = useMoney();

    // Calculate summary data
    const summary = useMemo(() => {
        const totalContributions = movements
            .filter(m => m.type === 'contribution')
            .reduce((sum, m) => sum + Number(m.functional_amount || m.amount || 0), 0);

        const totalWithdrawals = movements
            .filter(m => m.type === 'withdrawal')
            .reduce((sum, m) => sum + Number(m.functional_amount || m.amount || 0), 0);

        const netCapital = totalContributions - totalWithdrawals;
        const activeParticipants = participants.length;

        return {
            totalContributions,
            totalWithdrawals,
            netCapital,
            activeParticipants,
        };
    }, [movements, participants]);

    // Prepare chart data - contributions and withdrawals over time
    const chartData = useMemo(() => {
        const monthlyData: Record<string, { month: string; contributions: number; withdrawals: number }> = {};

        movements.forEach(m => {
            const date = new Date(m.payment_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthLabel, contributions: 0, withdrawals: 0 };
            }

            const amount = Number(m.functional_amount || m.amount || 0);
            if (m.type === 'contribution') {
                monthlyData[monthKey].contributions += amount;
            } else if (m.type === 'withdrawal') {
                monthlyData[monthKey].withdrawals += amount;
            }
        });

        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    }, [movements]);

    // Recent activity (last 5 movements)
    const recentActivity = useMemo(() => {
        return [...movements]
            .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
            .slice(0, 5);
    }, [movements]);

    // Show empty state if no data
    if (movements.length === 0 && participants.length === 0) {
        return (
            <div className="h-full flex items-center justify-center min-h-[400px]">
                <EmptyState
                    icon={Landmark}
                    title="Comenzá a gestionar el capital"
                    description="Agregá participantes y registrá aportes o retiros para ver el dashboard de capital."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardKpiCard
                    title="Capital Neto"
                    value={format(summary.netCapital)}
                    icon={<TrendingUp className="w-4 h-4" />}
                    trend={{ value: summary.netCapital >= 0 ? "Positivo" : "Negativo", direction: summary.netCapital >= 0 ? "up" : "down" }}
                />
                <DashboardKpiCard
                    title="Aportes Totales"
                    value={format(summary.totalContributions)}
                    icon={<ArrowUpRight className="w-4 h-4" />}
                    iconClassName="text-amount-positive"
                />
                <DashboardKpiCard
                    title="Retiros Totales"
                    value={format(summary.totalWithdrawals)}
                    icon={<ArrowDownRight className="w-4 h-4" />}
                    iconClassName="text-amount-negative"
                />
                <DashboardKpiCard
                    title="Participantes"
                    value={summary.activeParticipants.toString()}
                    icon={<Users className="w-4 h-4" />}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardCard
                    title="Evolución del Capital"
                    description="Aportes y retiros mensuales"
                    icon={<TrendingUp className="w-4 h-4" />}
                >
                    {chartData.length > 0 ? (
                        <LazyAreaChart
                            data={chartData}
                            xKey="month"
                            yKey="contributions"
                            height={250}
                        />
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                            Sin datos para mostrar
                        </div>
                    )}
                </DashboardCard>

                <DashboardCard
                    title="Actividad Reciente"
                    description="Últimos movimientos de capital"
                    icon={<Activity className="w-4 h-4" />}
                >
                    {recentActivity.length > 0 ? (
                        <div className="space-y-4">
                            {recentActivity.map((movement, i) => {
                                const isContribution = movement.type === 'contribution';
                                const participant = participants.find(p => p.id === movement.participant_id);

                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isContribution
                                            ? 'bg-amount-positive/10 text-amount-positive'
                                            : 'bg-amount-negative/10 text-amount-negative'
                                            }`}>
                                            {isContribution ? (
                                                <ArrowUpRight className="h-4 w-4" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {participant?.name || "Participante"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isContribution ? "Aporte" : "Retiro"} · {formatDistanceToNow(new Date(movement.payment_date), { addSuffix: true, locale: es })}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-semibold ${isContribution ? 'text-amount-positive' : 'text-amount-negative'
                                            }`}>
                                            {isContribution ? '+' : '-'}{movement.currency_symbol || "$"} {Number(movement.amount).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                            Sin movimientos recientes
                        </div>
                    )}
                </DashboardCard>
            </div>
        </div>
    );
}
