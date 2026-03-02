"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ExternalLink } from "lucide-react";

import { DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { AdminPayment, AdminBankTransfer } from "../queries";

// ============================================================================
// HELPERS
// ============================================================================

export function getStatusBadge(status: string) {
    switch (status) {
        case "completed":
        case "approved":
            return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Aprobado</Badge>;
        case "pending":
            return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pendiente</Badge>;
        case "rejected":
            return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Rechazado</Badge>;
        case "refunded":
            return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Reembolsado</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

export function getProviderBadge(provider: string, gateway?: string | null) {
    const displayProvider = gateway || provider;
    const normalizedProvider = displayProvider?.toLowerCase();

    let bgColor = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    let displayName = displayProvider;

    if (normalizedProvider?.includes("mercadopago")) {
        displayName = "MercadoPago";
        bgColor = "bg-sky-500/10 text-sky-500 border-sky-500/20";
    } else if (normalizedProvider?.includes("stripe")) {
        displayName = "Stripe";
        bgColor = "bg-violet-500/10 text-violet-500 border-violet-500/20";
    } else if (normalizedProvider?.includes("paypal")) {
        displayName = "PayPal";
        bgColor = "bg-blue-500/10 text-blue-500 border-blue-500/20";
    } else if (normalizedProvider?.includes("transfer") || normalizedProvider?.includes("manual")) {
        displayName = "Transferencia";
        bgColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }

    return <Badge className={bgColor}>{displayName}</Badge>;
}

export function formatCurrency(amount: number | null, currency: string | null): string {
    if (amount === null) return "—";
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// ============================================================================
// FILTER OPTIONS
// ============================================================================

export const PAYMENT_STATUS_OPTIONS = [
    { label: "Completado", value: "completed" },
    { label: "Pendiente", value: "pending" },
    { label: "Rechazado", value: "rejected" },
];

export const TRANSFER_STATUS_OPTIONS = [
    { label: "Pendiente", value: "pending" },
    { label: "Aprobado", value: "approved" },
    { label: "Rechazado", value: "rejected" },
];

// ============================================================================
// PRODUCT LABELS
// ============================================================================

const PRODUCT_LABELS: Record<string, string> = {
    subscription: "Suscripción",
    course: "Curso",
    seats: "Asientos",
    seat_purchase: "Asientos",
    upgrade: "Upgrade de Plan",
};

// ============================================================================
// USER CELL (shared between payments & transfers)
// ============================================================================

function UserCell({ user, fallbackName }: { user?: { full_name?: string | null; email: string; avatar_url?: string | null } | null; fallbackName?: string }) {
    const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || user?.email?.[0]?.toUpperCase() || "?";
    return (
        <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-medium text-sm">{user?.full_name || fallbackName || "Sin nombre"}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
        </div>
    );
}

// ============================================================================
// PAYMENT COLUMNS
// ============================================================================

export function getPaymentColumns(): ColumnDef<AdminPayment>[] {
    return [
        {
            id: "user",
            accessorFn: (row) => row.user?.full_name || row.user?.email || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
            cell: ({ row }) => <UserCell user={row.original.user} />,
            enableHiding: false,
        },
        {
            id: "provider",
            accessorFn: (row) => row.provider,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
            cell: ({ row }) => getProviderBadge(row.original.provider, row.original.gateway),
            size: 130,
        },
        {
            id: "amount",
            accessorFn: (row) => row.amount,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
            cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.amount, row.original.currency)}</span>,
            size: 120,
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => getStatusBadge(row.original.status),
            size: 110,
        },
        {
            id: "product",
            accessorFn: (row) => row.course?.title || row.product_type || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Producto" />,
            cell: ({ row }) => {
                const payment = row.original;
                if (payment.course) {
                    return <span className="text-sm">{payment.course.title}</span>;
                }
                const label = payment.product_type
                    ? PRODUCT_LABELS[payment.product_type] || payment.product_type
                    : null;
                if (label) {
                    return (
                        <div className="flex flex-col">
                            <span className="text-sm">{label}</span>
                            {payment.organization && (
                                <span className="text-xs text-muted-foreground">{payment.organization.name}</span>
                            )}
                        </div>
                    );
                }
                return <span className="text-muted-foreground text-sm">—</span>;
            },
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.created_at), "dd/MM/yy HH:mm", { locale: es })}
                </span>
            ),
            size: 130,
        },
    ];
}

// ============================================================================
// TRANSFER COLUMNS
// ============================================================================

export function getTransferColumns(): ColumnDef<AdminBankTransfer>[] {
    return [
        {
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.created_at), "dd/MM/yy HH:mm", { locale: es })}
                </span>
            ),
            size: 130,
        },
        {
            id: "user",
            accessorFn: (row) => row.user?.full_name || row.user?.email || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
            cell: ({ row }) => <UserCell user={row.original.user} fallbackName={row.original.payer_name || undefined} />,
            enableHiding: false,
        },
        {
            id: "amount",
            accessorFn: (row) => row.amount,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
            cell: ({ row }) => {
                const transfer = row.original;
                const hasDiscount = transfer.discount_percent && transfer.discount_percent > 0;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{formatCurrency(transfer.amount, transfer.currency)}</span>
                        {hasDiscount && <span className="text-xs text-emerald-500">-{transfer.discount_percent}% descuento</span>}
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => getStatusBadge(row.original.status),
            size: 110,
        },
        {
            id: "course",
            accessorFn: (row) => row.course?.title || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Curso" />,
            cell: ({ row }) => {
                const course = row.original.course;
                if (course) return <span className="text-sm">{course.title}</span>;
                return <span className="text-muted-foreground text-sm">—</span>;
            },
        },
        {
            id: "receipt",
            header: "Comprobante",
            cell: ({ row }) => {
                const url = row.original.receipt_url;
                if (!url) return <span className="text-muted-foreground text-sm">—</span>;
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />Ver
                    </a>
                );
            },
            size: 110,
        },
    ];
}
