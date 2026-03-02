"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { DataTableColumnHeader } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { Coupon } from "@/features/admin/coupon-actions";

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export const COUPON_APPLIES_TO_OPTIONS = [
    { label: "Cursos", value: "courses" },
    { label: "Planes", value: "subscriptions" },
    { label: "Ambos", value: "all" },
];

export const COUPON_STATUS_OPTIONS = [
    { label: "Activo", value: "true" },
    { label: "Inactivo", value: "false" },
];

// ============================================================================
// HELPERS
// ============================================================================

const APPLIES_TO_MAP: Record<string, string> = {
    courses: "Cursos",
    subscriptions: "Planes",
    all: "Ambos",
};

// ============================================================================
// COUPON COLUMNS
// ============================================================================

export function getCouponColumns(): ColumnDef<Coupon>[] {
    return [
        {
            accessorKey: "code",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
            cell: ({ row }) => (
                <span className="font-mono font-semibold">{row.original.code}</span>
            ),
        },
        {
            id: "discount",
            accessorFn: (row) => row.amount,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Descuento" />,
            cell: ({ row }) => {
                const coupon = row.original;
                if (coupon.type === "percent") {
                    return <span>{coupon.amount}%</span>;
                }
                return <span>${coupon.amount} {coupon.currency}</span>;
            },
            size: 100,
        },
        {
            accessorKey: "applies_to",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Aplica a" />,
            cell: ({ row }) => (
                <span>{APPLIES_TO_MAP[row.original.applies_to] || row.original.applies_to}</span>
            ),
            filterFn: (row, id, value) => value.includes(row.original.applies_to),
            size: 100,
        },
        {
            id: "uses",
            accessorFn: (row) => row.redemption_count || 0,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usos" />,
            cell: ({ row }) => {
                const coupon = row.original;
                const current = coupon.redemption_count || 0;
                const max = coupon.max_redemptions;
                return (
                    <span className="text-muted-foreground">
                        {current}{max ? `/${max}` : ""}
                    </span>
                );
            },
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
                    <span className={cn(isExpired && "text-destructive")}>
                        {format(date, "dd MMM yyyy", { locale: es })}
                    </span>
                );
            },
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
    ];
}
