"use client";

/**
 * General Cost Concept Detail Panel
 *
 * Read-only panel showing concept info, mini KPIs, 
 * payment evolution chart, and recent payments list.
 */

import { useEffect, useMemo, useState } from "react";
import { usePanel } from "@/stores/panel-store";
import { useMoney } from "@/hooks/use-money";
import { Badge } from "@/components/ui/badge";
import { DetailSection } from "@/components/shared/forms/detail-field";
import { LazyAreaChart } from "@/components/charts/lazy-charts";
import { capitalizeMonth } from "@/components/charts/chart-config";
import { Skeleton } from "@/components/ui/skeleton";
import { parseDateFromDB } from "@/lib/timezone-data";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getConceptDetailData } from "@/features/general-costs/actions";
import {
    FileText,
    RefreshCw,
    CalendarDays,
    TrendingUp,
    CreditCard,
    DollarSign,
} from "lucide-react";
import type { GeneralCost } from "@/features/general-costs/types";
import type { ConceptPaymentStats } from "@/components/shared/list-item/items/general-cost-list-item";

// ─── Types ───────────────────────────────────────────────

interface PaymentRow {
    id: string;
    payment_date: string;
    amount: number;
    currency_code?: string;
    currency_symbol?: string;
    status: string;
    wallet_name?: string;
}

interface ConceptDetailPanelProps {
    concept: GeneralCost;
    stats?: ConceptPaymentStats;
    organizationId: string;
}

// ─── Helpers ─────────────────────────────────────────────

const RECURRENCE_LABELS: Record<string, string> = {
    monthly: "Mensual",
    weekly: "Semanal",
    quarterly: "Trimestral",
    yearly: "Anual",
};

const STATUS_STYLES: Record<string, string> = {
    confirmed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    overdue: "bg-red-500/10 text-red-600 border-red-500/20",
    cancelled: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
    confirmed: "Confirmado",
    pending: "Pendiente",
    overdue: "Vencido",
    cancelled: "Cancelado",
};

// ─── Component ───────────────────────────────────────────

export function GeneralCostConceptDetailPanel({
    concept,
    stats,
    organizationId,
}: ConceptDetailPanelProps) {
    const { setPanelMeta, closePanel } = usePanel();
    const money = useMoney();

    // ─── Self-fetch detail data ──────────────────────────
    const [recentPayments, setRecentPayments] = useState<PaymentRow[]>([]);
    const [monthlyData, setMonthlyData] = useState<{ month: string; amount: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getConceptDetailData(concept.id, organizationId)
            .then(({ recentPayments: rp, monthlyData: md }) => {
                setRecentPayments(rp as PaymentRow[]);
                setMonthlyData(md);
            })
            .finally(() => setLoading(false));
    }, [concept.id, organizationId]);

    // ─── Panel Meta ──────────────────────────────────────
    useEffect(() => {
        setPanelMeta({
            title: concept.name,
            description: concept.category?.name || "Sin categoría",
            icon: FileText,
            size: "lg",
            footer: {
                cancelLabel: "Cerrar",
            },
        });
    }, [setPanelMeta, concept, closePanel]);

    // ─── KPI Calculations ────────────────────────────────
    const totalSpent = stats?.total_amount ?? 0;
    const totalPayments = stats?.total_payments ?? 0;
    const avgPayment = totalPayments > 0 ? totalSpent / totalPayments : 0;
    const currencySymbol = stats?.currency_symbol || "$";

    // ─── Chart data formatting ───────────────────────────
    const chartData = useMemo(() =>
        monthlyData.map(m => ({
            month: m.month,
            amount: m.amount,
        })),
        [monthlyData]);

    const formatChartLabel = (value: string) => {
        try {
            const date = new Date(value);
            return capitalizeMonth(format(date, "MMM yy", { locale: es }));
        } catch {
            return value;
        }
    };

    // ─── Render ──────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* Expected Amount (if recurring) */}
            {concept.is_recurring && concept.expected_amount && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 text-center">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Monto Esperado por Período
                    </p>
                    <p className="text-2xl font-bold font-mono text-primary">
                        {money.format(concept.expected_amount)}
                    </p>
                </div>
            )}

            {/* Mini KPIs */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-0.5">Total Gastado</p>
                    <p className="text-sm font-bold font-mono">
                        {money.format(totalSpent)}
                    </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-0.5">Promedio</p>
                    <p className="text-sm font-bold font-mono">
                        {money.format(avgPayment)}
                    </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <CreditCard className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-0.5">Pagos</p>
                    <p className="text-sm font-bold font-mono">{totalPayments}</p>
                </div>
            </div>

            {/* Description */}
            {concept.description && (
                <DetailSection title="Descripción">
                    <p className="text-sm text-foreground">{concept.description}</p>
                </DetailSection>
            )}

            {/* Mini Chart */}
            {chartData.length > 1 && (
                <DetailSection title="Evolución de Pagos">
                    <div className="h-[180px]">
                        <LazyAreaChart
                            data={chartData}
                            xKey="month"
                            yKey="amount"
                            height={180}
                            xAxisFormatter={formatChartLabel}
                        />
                    </div>
                </DetailSection>
            )}

            {/* Recent Payments */}
            <DetailSection title={`Últimos Pagos (${recentPayments.length})`}>
                {recentPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4 text-center">
                        Sin pagos registrados
                    </p>
                ) : (
                    <div className="space-y-1">
                        {recentPayments.map((payment) => {
                            const date = parseDateFromDB(payment.payment_date);
                            return (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-sm">
                                            {date ? format(date, "dd/MM/yyyy") : payment.payment_date}
                                        </span>
                                        {payment.wallet_name && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                {payment.wallet_name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] h-5 ${STATUS_STYLES[payment.status] || ""}`}
                                        >
                                            {STATUS_LABELS[payment.status] || payment.status}
                                        </Badge>
                                        <span className="text-sm font-mono font-medium">
                                            {payment.currency_symbol || "$"}
                                            {payment.amount.toLocaleString("es-AR", {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DetailSection>

        </div>
    );
}
