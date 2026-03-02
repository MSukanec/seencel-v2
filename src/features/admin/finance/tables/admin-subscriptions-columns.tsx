"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { DataTableColumnHeader } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { AdminSubscription } from "../queries";

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export const SUBSCRIPTION_STATUS_OPTIONS = [
    { label: "Activa", value: "active" },
    { label: "Cancelada", value: "cancelled" },
    { label: "Expirada", value: "expired" },
    { label: "Pendiente", value: "pending" },
];

export const BILLING_PERIOD_OPTIONS = [
    { label: "Mensual", value: "monthly" },
    { label: "Anual", value: "annual" },
];

// ============================================================================
// HELPERS
// ============================================================================

function getStatusBadge(status: string) {
    switch (status) {
        case "active":
            return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activa</Badge>;
        case "cancelled":
            return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelada</Badge>;
        case "expired":
            return <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">Expirada</Badge>;
        case "pending":
            return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendiente</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

function getBillingPeriodLabel(period: string) {
    return period === "annual" ? "Anual" : "Mensual";
}

function formatCurrency(amount: number | null, currency: string | null): string {
    if (amount === null) return "—";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ============================================================================
// COLUMNS
// ============================================================================

export function getSubscriptionColumns(): ColumnDef<AdminSubscription>[] {
    return [
        {
            id: "organization",
            accessorFn: (row) => row.organization?.name || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Organización" />,
            cell: ({ row }) => (
                <span className="font-medium text-sm">{row.original.organization?.name || "—"}</span>
            ),
            enableHiding: false,
        },
        {
            id: "plan",
            accessorFn: (row) => row.plan?.name || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
            cell: ({ row }) => {
                const plan = row.original.plan;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{plan?.name || "—"}</span>
                        {plan?.slug && <span className="text-xs text-muted-foreground">{plan.slug}</span>}
                    </div>
                );
            },
            size: 130,
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => getStatusBadge(row.original.status),
            filterFn: (row, id, value) => value.includes(row.original.status),
            size: 100,
        },
        {
            accessorKey: "billing_period",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Período" />,
            cell: ({ row }) => (
                <Badge variant="outline">{getBillingPeriodLabel(row.original.billing_period)}</Badge>
            ),
            filterFn: (row, id, value) => value.includes(row.original.billing_period),
            size: 100,
        },
        {
            id: "amount",
            accessorFn: (row) => row.amount,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
            cell: ({ row }) => (
                <span className="font-medium">{formatCurrency(row.original.amount, row.original.currency)}</span>
            ),
            size: 120,
        },
        {
            accessorKey: "expires_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Expira" />,
            cell: ({ row }) => {
                const expiresAt = row.original.expires_at;
                if (!expiresAt) return <span className="text-muted-foreground">—</span>;
                const date = new Date(expiresAt);
                const isExpired = date < new Date();
                return (
                    <span className={cn("text-sm", isExpired && "text-destructive")}>
                        {format(date, "dd MMM yyyy", { locale: es })}
                    </span>
                );
            },
            size: 120,
        },
        {
            id: "payer",
            accessorFn: (row) => row.payer_email || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Pagador" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">{row.original.payer_email || "—"}</span>
            ),
            size: 160,
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Creada" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.created_at), "dd/MM/yy", { locale: es })}
                </span>
            ),
        },
    ];
}
