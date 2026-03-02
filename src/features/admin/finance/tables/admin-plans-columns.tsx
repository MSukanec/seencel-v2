"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { AdminPlan } from "../queries";

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export const PLAN_STATUS_OPTIONS = [
    { label: "Activo", value: "true" },
    { label: "Inactivo", value: "false" },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatUSD(amount: number | null): string {
    if (amount === null) return "—";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ============================================================================
// COLUMNS
// ============================================================================

export function getPlanColumns(): ColumnDef<AdminPlan>[] {
    return [
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
            cell: ({ row }) => {
                const plan = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{plan.name}</span>
                        {plan.slug && <span className="text-xs text-muted-foreground">{plan.slug}</span>}
                    </div>
                );
            },
            enableHiding: false,
        },
        {
            accessorKey: "is_active",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <Badge className={isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}>
                        {isActive ? "Activo" : "Inactivo"}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => value.includes(String(row.original.is_active)),
            size: 100,
        },
        {
            id: "billing_type",
            accessorFn: (row) => row.billing_type || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
            cell: ({ row }) => {
                const type = row.original.billing_type;
                const label = type === "per_user" ? "Por usuario" : type === "flat" ? "Fijo" : type || "—";
                return <span className="text-sm">{label}</span>;
            },
            size: 110,
        },
        {
            id: "monthly_amount",
            accessorFn: (row) => row.monthly_amount,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Mensual" />,
            cell: ({ row }) => (
                <span className="font-medium">{formatUSD(row.original.monthly_amount)}</span>
            ),
            size: 100,
        },
        {
            id: "annual_amount",
            accessorFn: (row) => row.annual_amount,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Anual" />,
            cell: ({ row }) => {
                const plan = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{formatUSD(plan.annual_amount)}</span>
                        {plan.annual_discount_percent && plan.annual_discount_percent > 0 && (
                            <span className="text-xs text-emerald-500">-{plan.annual_discount_percent}%</span>
                        )}
                    </div>
                );
            },
        },
        {
            id: "active_subscriptions_count",
            accessorFn: (row) => row.active_subscriptions_count,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Suscripciones" />,
            cell: ({ row }) => {
                const count = row.original.active_subscriptions_count;
                return (
                    <Badge variant="outline" className="font-mono">
                        {count}
                    </Badge>
                );
            },
        },
    ];
}
