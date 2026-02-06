"use client";

import { useRouter } from "next/navigation";
import { Ticket, Plus } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteCoupon, type Coupon } from "@/features/admin/coupon-actions";
import { AdminCouponForm } from "@/features/admin/components/forms/admin-coupon-form";
import { ColumnDef } from "@tanstack/react-table";
import { useOptimisticList } from "@/hooks/use-optimistic-action";


interface AdminFinanceCouponsViewProps {
    coupons: Coupon[];
}

/**
 * Admin Finance Coupons View
 * Receives coupons from server, no client-side fetching.
 */
export function AdminFinanceCouponsView({ coupons }: AdminFinanceCouponsViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

    // Optimistic updates
    const {
        optimisticItems,
        removeItem: optimisticRemove,
    } = useOptimisticList({
        items: coupons,
        getItemId: (c) => c.id,
    });

    const handleCreate = () => {
        openModal(
            <AdminCouponForm
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Crear Cupón",
                description: "Ingresá los datos del nuevo cupón de descuento.",
                size: "lg",
            }
        );
    };

    const handleEdit = (coupon: Coupon) => {
        openModal(
            <AdminCouponForm
                initialData={coupon}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
                onCancel={closeModal}
            />,
            {
                title: "Editar Cupón",
                description: `Modificá los datos del cupón ${coupon.code}.`,
                size: "lg",
            }
        );
    };

    const handleDelete = (coupon: Coupon) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>
                    ¿Estás seguro de eliminar el cupón <strong>{coupon.code}</strong>?
                </p>
                {(coupon.redemption_count ?? 0) > 0 && (
                    <p className="text-sm text-destructive">
                        ⚠️ Este cupón ya tiene {coupon.redemption_count} uso(s) registrados.
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            const couponId = coupon.id;
                            closeModal();
                            optimisticRemove(couponId, async () => {
                                const result = await deleteCoupon(couponId);
                                if (result.success) {
                                    toast.success("Cupón eliminado");
                                } else {
                                    let errorMsg = result.error || "Error al eliminar";
                                    if (errorMsg.includes("foreign key constraint")) {
                                        errorMsg = "No se puede eliminar: El cupón ya fue usado.";
                                    }
                                    toast.error(errorMsg);
                                    router.refresh();
                                }
                            });
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>,
            {
                title: "Eliminar Cupón",
                description: "Esta acción no se puede deshacer.",
            }
        );
    };

    // Table columns
    const columns: ColumnDef<Coupon>[] = [
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
        },
        {
            accessorKey: "applies_to",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Aplica a" />,
            cell: ({ row }) => {
                const map: Record<string, string> = {
                    courses: "Cursos",
                    subscriptions: "Planes",
                    all: "Ambos",
                };
                return <span>{map[row.original.applies_to] || row.original.applies_to}</span>;
            },
            filterFn: (row, id, value) => value.includes(row.original.applies_to),
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
        },
    ];

    // Faceted filters
    const appliesToOptions = [
        { label: "Cursos", value: "courses" },
        { label: "Planes", value: "subscriptions" },
        { label: "Ambos", value: "all" },
    ];

    const statusOptions = [
        { label: "Activo", value: "true" },
        { label: "Inactivo", value: "false" },
    ];

    // Empty state
    if (optimisticItems.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[{ label: "Nuevo Cupón", icon: Plus, onClick: handleCreate }]}
                />
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Ticket}
                        viewName="Cupones de Descuento"
                        featureDescription="Creá tu primer cupón de descuento."
                        onAction={handleCreate}
                        actionLabel="Nuevo Cupón"
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader
                actions={[{ label: "Nuevo Cupón", icon: Plus, onClick: handleCreate }]}
            />
            <DataTable
                columns={columns}
                data={optimisticItems}
                enableRowSelection={true}
                enableRowActions={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchPlaceholder="Buscar cupones..."
                pageSize={50}
                facetedFilters={[
                    { columnId: "applies_to", title: "Aplica a", options: appliesToOptions },
                    { columnId: "is_active", title: "Estado", options: statusOptions },
                ]}
                initialSorting={[{ id: "code", desc: false }]}
            />
        </>
    );
}

