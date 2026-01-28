"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditCard, Trash2 } from "lucide-react";
import type { AdminCourseEnrollment, AdminCourse } from "@/features/admin/academy-queries";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StudentsTableProps {
    enrollments: AdminCourseEnrollment[];
    courses: AdminCourse[];
    onEdit: (enrollment: AdminCourseEnrollment) => void;
    onDelete: (enrollment: AdminCourseEnrollment) => void;
}

function getStatusBadge(status: string) {
    switch (status) {
        case "active":
            return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Activo</Badge>;
        case "completed":
            return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Completado</Badge>;
        case "expired":
            return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Expirado</Badge>;
        case "cancelled":
            return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Cancelado</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}

function getPaymentBadge(payment: AdminCourseEnrollment["payment"]) {
    if (!payment) {
        return <Badge variant="outline" className="text-muted-foreground">Sin pago</Badge>;
    }

    const provider = payment.provider?.toLowerCase();
    const gateway = payment.gateway?.toLowerCase();

    let displayName = payment.provider;
    let bgColor = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";

    if (provider === "mercadopago" || gateway === "mercadopago") {
        displayName = "MercadoPago";
        bgColor = "bg-sky-500/10 text-sky-500 border-sky-500/20";
    } else if (provider === "stripe" || gateway === "stripe") {
        displayName = "Stripe";
        bgColor = "bg-violet-500/10 text-violet-500 border-violet-500/20";
    } else if (provider === "paypal" || gateway === "paypal") {
        displayName = "PayPal";
        bgColor = "bg-blue-500/10 text-blue-500 border-blue-500/20";
    } else if (provider === "transfer" || gateway === "transfer" || provider === "manual" || provider === "bank_transfer") {
        displayName = "Transferencia";
        bgColor = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }

    return (
        <div className="flex flex-col gap-1">
            <Badge className={bgColor}>
                <CreditCard className="h-3 w-3 mr-1" />
                {displayName}
            </Badge>
            {payment.amount && (
                <span className="text-xs text-muted-foreground">
                    ${payment.amount} {payment.currency}
                </span>
            )}
        </div>
    );
}

/**
 * Pure table component for students/enrollments.
 * CRUD actions are handled by parent view via props.
 */
export function StudentsTable({ enrollments, courses, onEdit, onDelete }: StudentsTableProps) {
    const columns: ColumnDef<AdminCourseEnrollment>[] = [
        {
            id: "student",
            accessorFn: (row) => row.user?.full_name || row.user?.email || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Alumno" />,
            cell: ({ row }) => {
                const user = row.original.user;
                const initials = user?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || "?";

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{user?.full_name || "Sin nombre"}</span>
                            <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                    </div>
                );
            },
            enableHiding: false,
        },
        {
            id: "course",
            accessorFn: (row) => row.course?.title || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Curso" />,
            cell: ({ row }) => (
                <span className="text-sm">{row.original.course?.title || "—"}</span>
            ),
            filterFn: (row, id, value) => {
                return value.includes(row.original.course_id);
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => getStatusBadge(row.original.status),
            filterFn: (row, id, value) => {
                return value.includes(row.original.status);
            },
        },
        {
            id: "progress",
            accessorFn: (row) => row.progress_pct || 0,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Progreso" />,
            cell: ({ row }) => {
                const progress = row.original.progress_pct || 0;
                const done = row.original.done_lessons || 0;
                const total = row.original.total_lessons || 0;

                return (
                    <div className="w-24">
                        <div className="flex justify-between text-xs mb-1">
                            <span>{done}/{total}</span>
                            <span className="font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </div>
                );
            },
        },
        {
            id: "payment",
            accessorFn: (row) => row.payment?.provider || "none",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Pago" />,
            cell: ({ row }) => getPaymentBadge(row.original.payment),
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Inscripción" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.created_at), "dd/MM/yy", { locale: es })}
                </span>
            ),
        },
        {
            id: "expires_at",
            accessorFn: (row) => row.expires_at || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimiento" />,
            cell: ({ row }) => {
                const expiresAt = row.original.expires_at;
                if (!expiresAt) {
                    return <Badge variant="outline" className="text-xs">Lifetime</Badge>;
                }
                const isExpired = new Date(expiresAt) < new Date();
                return (
                    <span className={`text-sm ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
                        {format(new Date(expiresAt), "dd/MM/yy", { locale: es })}
                    </span>
                );
            },
        },
    ];

    // Build faceted filters
    const courseOptions = courses.map((c) => ({
        label: c.title,
        value: c.id,
    }));

    const statusOptions = [
        { label: "Activo", value: "active" },
        { label: "Completado", value: "completed" },
        { label: "Expirado", value: "expired" },
        { label: "Cancelado", value: "cancelled" },
    ];

    return (
        <DataTable
            columns={columns}
            data={enrollments}
            enableRowSelection={true}
            enableRowActions={true}
            onEdit={onEdit}
            onDelete={onDelete}
            pageSize={50}
            facetedFilters={[
                {
                    columnId: "course",
                    title: "Curso",
                    options: courseOptions,
                },
                {
                    columnId: "status",
                    title: "Estado",
                    options: statusOptions,
                },
            ]}
            bulkActions={({ table }) => (
                <Button
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                        const selected = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
                        selected.forEach(onDelete);
                    }}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
            )}
            initialSorting={[{ id: "created_at", desc: true }]}
        />
    );
}
