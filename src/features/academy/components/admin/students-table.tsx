"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Trash2 } from "lucide-react";
import { useModal } from "@/providers/modal-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EnrollmentForm } from "./enrollment-form";
import { deleteEnrollment } from "@/actions/enrollment-actions";
import type { AdminCourseEnrollment, AdminCourse } from "@/features/admin/academy-queries";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

interface StudentsDataTableProps {
    enrollments: AdminCourseEnrollment[];
    courses: AdminCourse[];
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
    } else if (provider === "transfer" || gateway === "transfer" || provider === "manual") {
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

export function StudentsDataTable({ enrollments, courses }: StudentsDataTableProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();

    // 🚀 OPTIMISTIC UI: Instant visual updates for delete
    const {
        optimisticItems: optimisticEnrollments,
        removeItem: optimisticRemove
    } = useOptimisticList({
        items: enrollments,
        getItemId: (enrollment) => enrollment.id,
    });

    const handleSuccess = () => {
        router.refresh();
        closeModal();
    };

    const handleOpenCreate = () => {
        openModal(
            <EnrollmentForm onSuccess={handleSuccess} />,
            {
                title: "Inscribir Alumno",
                description: "Agrega un alumno a un curso.",
                size: "md"
            }
        );
    };

    const handleOpenEdit = (enrollment: AdminCourseEnrollment) => {
        openModal(
            <EnrollmentForm initialData={enrollment} onSuccess={handleSuccess} />,
            {
                title: "Editar Inscripción",
                description: `Modificando inscripción de ${enrollment.user?.full_name || enrollment.user?.email}`,
                size: "md"
            }
        );
    };

    // 🚀 OPTIMISTIC DELETE: Enrollment disappears instantly
    const handleDelete = (enrollment: AdminCourseEnrollment) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>
                    ¿Estás seguro de eliminar la inscripción de{" "}
                    <strong>{enrollment.user?.full_name || enrollment.user?.email}</strong> en{" "}
                    <strong>{enrollment.course?.title}</strong>?
                </p>
                <p className="text-sm text-muted-foreground">
                    Esto eliminará su progreso en el curso. Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            const enrollmentId = enrollment.id;
                            closeModal(); // Close modal immediately

                            // 🚀 Optimistic update - enrollment disappears NOW
                            optimisticRemove(enrollmentId, async () => {
                                try {
                                    await deleteEnrollment(enrollmentId);
                                    toast.success("Inscripción eliminada");
                                } catch (error) {
                                    toast.error("Error al eliminar inscripción");
                                    router.refresh(); // Recover on error
                                }
                            });
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>,
            {
                title: "Eliminar Inscripción",
                description: "Esta acción no se puede deshacer."
            }
        );
    };

    const handleBulkDelete = (selected: AdminCourseEnrollment[], onClear?: () => void) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>
                    ¿Estás seguro de eliminar <strong>{selected.length}</strong> inscripciones?
                </p>
                <p className="text-sm text-muted-foreground">
                    Esto eliminará el progreso de todos estos alumnos. Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={async () => {
                            try {
                                await Promise.all(selected.map((e) => deleteEnrollment(e.id)));
                                router.refresh();
                                onClear?.();
                                closeModal();
                                toast.success(`${selected.length} inscripciones eliminadas`);
                            } catch (error) {
                                toast.error("Error al eliminar inscripciones");
                            }
                        }}
                    >
                        Eliminar {selected.length}
                    </Button>
                </div>
            </div>,
            {
                title: "Eliminar Inscripciones",
                description: "Estás a punto de eliminar múltiples registros."
            }
        );
    };

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
            data={optimisticEnrollments}
            searchPlaceholder="Buscar alumnos..."
            enableRowSelection={true}
            enableRowActions={true}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
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
                        handleBulkDelete(selected, () => table.resetRowSelection());
                    }}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar ({table.getFilteredSelectedRowModel().rows.length})
                </Button>
            )}
            toolbar={() => (
                <Button onClick={handleOpenCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Inscribir Alumno
                </Button>
            )}
            initialSorting={[{ id: "created_at", desc: true }]}
            emptyState={
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="font-medium text-lg">No hay alumnos inscritos</h3>
                    <p className="text-muted-foreground text-sm mt-1">Inscribe tu primer alumno a un curso</p>
                </div>
            }
        />
    );
}
