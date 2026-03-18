"use client";

/**
 * Admin Academy — Enrollment Column Definitions (Column Factories)
 *
 * Standard 19.0: Columns + constants extraídas de la vista.
 * Read-only table — no inline editing.
 */

import { type ColumnDef } from "@tanstack/react-table";
import {
    createStatusColumn,
    createDateColumn,
} from "@/components/shared/data-table/columns";
import { DataTableAvatarCell } from "@/components/shared/data-table/data-table-avatar-cell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard } from "lucide-react";
import type { AdminCourseEnrollment } from "@/features/admin/academy-queries";

// ─── Status Config ──────────────────────────────────────

import type { StatusOption } from "@/components/shared/data-table/columns/status-column";

export const ENROLLMENT_STATUS_OPTIONS: StatusOption[] = [
    { value: "active", label: "Activo", variant: "positive" },
    { value: "completed", label: "Completado", variant: "info" },
    { value: "expired", label: "Expirado", variant: "negative" },
    { value: "cancelled", label: "Cancelado", variant: "neutral" },
];

// ─── Payment Config ─────────────────────────────────────

const PAYMENT_PROVIDERS: Record<string, { label: string; color: string }> = {
    mercadopago: { label: "MercadoPago", color: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
    stripe: { label: "Stripe", color: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
    paypal: { label: "PayPal", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    transfer: { label: "Transferencia", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    manual: { label: "Transferencia", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    bank_transfer: { label: "Transferencia", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
};

function resolvePaymentDisplay(payment: AdminCourseEnrollment["payment"]) {
    if (!payment) return null;
    const key = (payment.provider || payment.gateway || "").toLowerCase();
    return PAYMENT_PROVIDERS[key] || { label: payment.provider || "Otro", color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" };
}

// ─── Column Factory ─────────────────────────────────────

export function getEnrollmentColumns(): ColumnDef<AdminCourseEnrollment>[] {
    return [
        // 1. Alumno — avatar + nombre + email
        {
            accessorKey: "user",
            header: "Alumno",
            cell: ({ row }) => {
                const user = row.original.user;
                const initials = user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || "?";

                return (
                    <DataTableAvatarCell
                        src={user?.avatar_url || undefined}
                        fallback={initials}
                        title={user?.full_name || "Sin nombre"}
                        subtitle={user?.email}
                    />
                );
            },
            enableSorting: true,
            enableHiding: false,
        },

        // 2. Curso — texto plano (custom column, nested property)
        {
            id: "course",
            accessorFn: (row) => row.course?.title || "",
            header: "Curso",
            cell: ({ row }) => (
                <span className="text-sm">{row.original.course?.title || "—"}</span>
            ),
            enableSorting: true,
        },

        // 3. Estado — badge semántico
        createStatusColumn<AdminCourseEnrollment>({
            accessorKey: "status",
            title: "Estado",
            options: ENROLLMENT_STATUS_OPTIONS,
            showLabel: true,
        }),

        // 4. Progreso — barra + porcentaje
        {
            id: "progress",
            accessorFn: (row) => row.progress_pct || 0,
            header: "Progreso",
            cell: ({ row }) => {
                const progress = row.original.progress_pct || 0;
                const done = row.original.done_lessons || 0;
                const total = row.original.total_lessons || 0;

                return (
                    <div className="w-24">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{done}/{total}</span>
                            <span className="font-medium font-mono">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </div>
                );
            },
            enableSorting: true,
        },

        // 5. Pago — provider badge con monto
        {
            id: "payment",
            accessorFn: (row) => row.payment?.provider || "none",
            header: "Pago",
            cell: ({ row }) => {
                const payment = row.original.payment;
                const display = resolvePaymentDisplay(payment);

                if (!display) {
                    return <Badge variant="outline" className="text-muted-foreground text-xs">Sin pago</Badge>;
                }

                return (
                    <div className="flex flex-col gap-1">
                        <Badge className={display.color}>
                            <CreditCard className="h-3 w-3 mr-1" />
                            {display.label}
                        </Badge>
                        {payment?.amount && (
                            <span className="text-xs text-muted-foreground font-mono">
                                ${payment.amount} {payment.currency}
                            </span>
                        )}
                    </div>
                );
            },
            enableSorting: false,
        },

        // 6. Inscripción — fecha
        createDateColumn<AdminCourseEnrollment>({
            accessorKey: "created_at",
            title: "Inscripción",
        }),

        // 7. Vencimiento — fecha con lógica de expirado
        {
            id: "expires_at",
            accessorFn: (row) => row.expires_at || "",
            header: "Vencimiento",
            cell: ({ row }) => {
                const expiresAt = row.original.expires_at;
                if (!expiresAt) {
                    return <Badge variant="outline" className="text-xs">Lifetime</Badge>;
                }
                const isExpired = new Date(expiresAt) < new Date();
                const formatted = new Date(expiresAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                });
                return (
                    <span className={`text-sm font-mono ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
                        {formatted}
                    </span>
                );
            },
            enableSorting: true,
        },
    ];
}
