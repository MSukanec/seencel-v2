"use client";

import { useFinanceDashboardSafe } from "@/features/finance/context/finance-dashboard-context";
import { BentoCard } from "@/components/widgets/grid/bento-card";
import { WidgetEmptyState } from "@/components/widgets/grid/widget-empty-state";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function RecentTransactionsWidget({ size = 'md' }: { size?: 'md' | 'tall' }) {
    const ctx = useFinanceDashboardSafe();

    if (!ctx) {
        return (
            <WidgetEmptyState
                icon={Clock}
                title="Últimos Movimientos"
                description="Disponible en el dashboard de Finanzas"
                href="/organization/finance"
                actionLabel="Ir a Finanzas"
            />
        );
    }

    const { filteredMovements } = ctx;
    const recent = filteredMovements.slice(0, 5);

    return (
        <BentoCard
            size={size as any}
            title="Últimos Movimientos"
            subtitle="Actividad reciente"
            icon={<Clock className="w-4 h-4" />}
        >
            <div className="space-y-3 overflow-y-auto h-full">
                {recent.length > 0 ? (
                    recent.map((movement, i) => {
                        const isPositive = Number(movement.amount_sign ?? 1) > 0;
                        const hasAvatar = movement.creator_avatar_url;
                        const creatorInitial = movement.creator_full_name?.charAt(0)?.toUpperCase() || '?';

                        return (
                            <div key={i} className="flex items-center gap-3">
                                {hasAvatar ? (
                                    <img
                                        src={movement.creator_avatar_url}
                                        alt={movement.creator_full_name || 'Usuario'}
                                        className="h-8 w-8 rounded-full object-cover ring-1 ring-border"
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-1 ring-border">
                                        {creatorInitial}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate leading-none mb-1">
                                        {movement.description || movement.entity_name || "Movimiento"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {formatDistanceToNow(new Date(movement.payment_date), { addSuffix: true, locale: es })}
                                    </p>
                                </div>

                                <span className={cn(
                                    "text-sm font-semibold tabular-nums",
                                    isPositive ? "text-emerald-500" : "text-muted-foreground"
                                )}>
                                    {isPositive ? "+" : "-"}{Math.abs(Number(movement.amount)).toLocaleString('es-AR')}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        Sin actividad
                    </div>
                )}
            </div>
        </BentoCard>
    );
}
