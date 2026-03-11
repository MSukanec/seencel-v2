"use client";

import { memo, useCallback } from "react";
import { ListItem } from "../list-item-base";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, RefreshCw, CircleCheck, Clock, AlertTriangle } from "lucide-react";
import type { GeneralCost } from "@/features/general-costs/types";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// Types
// ============================================================================

export interface ConceptPaymentStats {
    general_cost_id: string;
    total_payments: number;
    total_amount: number;
    last_payment_date: string | null;
    currency_code: string | null;
    currency_symbol: string | null;
}

export interface GeneralCostListItemProps {
    /** The concept data */
    concept: GeneralCost;
    /** Payment stats for this concept (optional) */
    stats?: ConceptPaymentStats;
    /** Callback when edit is clicked */
    onEdit?: (concept: GeneralCost) => void;
    /** Callback when delete is clicked */
    onDelete?: (concept: GeneralCost) => void;
    /** Callback when the item is clicked */
    onClick?: (concept: GeneralCost) => void;
}

// ============================================================================
// Helpers
// ============================================================================

const RECURRENCE_LABELS: Record<string, string> = {
    monthly: "Mensual",
    bimonthly: "Bimestral",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
};

function getRecurrenceLabel(
    interval: string | null,
    expectedDay: number | null,
    expectedAmount: number | null,
    currencySymbol?: string | null
): string {
    if (!interval) return "Recurrente";
    const label = RECURRENCE_LABELS[interval] || interval;
    const parts = [label];
    if (expectedDay) parts.push(`día ${expectedDay}`);
    if (expectedAmount) parts.push(formatMoney(expectedAmount, currencySymbol));
    return parts.join(" · ");
}

function formatMoney(amount: number, symbol?: string | null): string {
    const formatted = Math.abs(amount).toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return `${symbol || "$"}${formatted}`;
}

function formatShortDate(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Recurrence status logic ─────────────────────────────

type RecurrenceStatus = "on_time" | "pending" | "overdue" | null;

const INTERVAL_MONTHS: Record<string, number> = {
    monthly: 1,
    bimonthly: 2,
    quarterly: 3,
    semiannual: 6,
    annual: 12,
};

/**
 * Determines the recurrence status of a concept based on its last payment
 * and the current date relative to the expected period.
 */
function getRecurrenceStatus(
    concept: GeneralCost,
    stats?: ConceptPaymentStats
): RecurrenceStatus {
    if (!concept.is_recurring || !concept.recurrence_interval) return null;

    const intervalMonths = INTERVAL_MONTHS[concept.recurrence_interval] ?? 1;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDay = now.getDate();
    const expectedDay = concept.expected_day ?? 1;

    // Calculate period start (current period)
    // For monthly: current month. For quarterly: current quarter start month, etc.
    const periodStartMonth = currentMonth - (currentMonth % intervalMonths);
    const periodStart = new Date(currentYear, periodStartMonth, 1);

    // Check if there's a payment within this period
    if (stats?.last_payment_date) {
        const lastPayment = new Date(stats.last_payment_date + "T12:00:00");
        if (lastPayment >= periodStart) {
            return "on_time"; // Paid in this period
        }
    }

    // No payment in this period
    if (currentDay >= expectedDay) {
        return "overdue"; // Past the expected day
    }

    return "pending"; // Before the expected day
}

const STATUS_CONFIG: Record<string, {
    label: string;
    icon: typeof CircleCheck;
    className: string;
    tooltipPrefix: string;
}> = {
    on_time: {
        label: "Al día",
        icon: CircleCheck,
        className: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5",
        tooltipPrefix: "Pago registrado este período",
    },
    pending: {
        label: "Pendiente",
        icon: Clock,
        className: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5",
        tooltipPrefix: "Aún no se registró pago",
    },
    overdue: {
        label: "Vencido",
        icon: AlertTriangle,
        className: "border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5",
        tooltipPrefix: "Sin pago y ya pasó el día esperado",
    },
};

// ============================================================================
// Component
// ============================================================================

export const GeneralCostListItem = memo(function GeneralCostListItem({
    concept,
    stats,
    onEdit,
    onDelete,
    onClick,
}: GeneralCostListItemProps) {

    const handleEdit = useCallback(() => onEdit?.(concept), [onEdit, concept]);
    const handleDelete = useCallback(() => onDelete?.(concept), [onDelete, concept]);
    const handleClick = useCallback(() => onClick?.(concept), [onClick, concept]);

    const hasStats = stats && stats.total_payments > 0;

    // Recurrence status
    const recurrenceStatus = getRecurrenceStatus(concept, stats);
    const statusConfig = recurrenceStatus ? STATUS_CONFIG[recurrenceStatus] : null;
    const StatusIcon = statusConfig?.icon;

    // Stats line
    const statsLine = hasStats
        ? `${stats.total_payments} pago${stats.total_payments !== 1 ? "s" : ""}${stats.last_payment_date ? ` · último ${formatShortDate(stats.last_payment_date)}` : ""}`
        : null;

    // Tooltip for recurrence status
    const statusTooltip = statusConfig
        ? `${statusConfig.tooltipPrefix}${concept.expected_day ? ` · Esperado: día ${concept.expected_day}` : ""}${stats?.last_payment_date ? ` · Último: ${formatShortDate(stats.last_payment_date)}` : ""}`
        : null;

    return (
        <ListItem
            variant="card"
            onClick={onClick ? handleClick : undefined}
        >
            {/* Color strip: recurring = indigo, one-time = olive */}
            <ListItem.ColorStrip color={concept.is_recurring ? "chart-7" : "chart-1"} />

            <ListItem.Content>
                {/* Line 1: Name */}
                <ListItem.Title>{concept.name}</ListItem.Title>

                {/* Line 2: Badges + stats */}
                <div className="flex items-center gap-2 flex-wrap">
                    {concept.is_recurring && (
                        <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal text-muted-foreground border-muted-foreground/20">
                            <RefreshCw className="h-2.5 w-2.5" />
                            {getRecurrenceLabel(concept.recurrence_interval, concept.expected_day, concept.expected_amount)}
                        </Badge>
                    )}
                    {statusConfig && StatusIcon && (
                        <TooltipProvider delayDuration={200}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className={`text-[10px] h-5 gap-1 font-medium ${statusConfig.className}`}>
                                        <StatusIcon className="h-2.5 w-2.5" />
                                        {statusConfig.label}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs max-w-64">
                                    {statusTooltip}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {statsLine && (
                        <span className="text-[11px] text-muted-foreground">{statsLine}</span>
                    )}
                </div>
            </ListItem.Content>

            {/* Right side: Total spent or "Sin pagos" */}
            <ListItem.Trailing>
                {hasStats ? (
                    <>
                        <ListItem.Value className="text-foreground">
                            {formatMoney(stats.total_amount, stats.currency_symbol)}
                        </ListItem.Value>
                        <ListItem.ValueSubtext>últimos 12 meses</ListItem.ValueSubtext>
                    </>
                ) : (
                    <span className="text-xs text-muted-foreground/50 italic">Sin pagos</span>
                )}
            </ListItem.Trailing>

            {/* Actions */}
            {(onEdit || onDelete) && (
                <ListItem.Actions>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {onEdit && (
                                <DropdownMenuItem onClick={handleEdit} className="text-xs gap-2">
                                    <Pencil className="h-3.5 w-3.5" />
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-xs gap-2 text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Eliminar
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ListItem.Actions>
            )}
        </ListItem>
    );
});
