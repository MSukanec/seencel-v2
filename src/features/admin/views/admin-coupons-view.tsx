"use client";

import { useEffect, useState, useTransition } from "react";
import { Ticket, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/stores/modal-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    getCoupons,
    deleteCoupon,
    toggleCouponStatus,
    type Coupon,
} from "@/features/admin/coupon-actions";
import { AdminCouponForm } from "@/features/admin/components/forms/admin-coupon-form";
import { ColumnDef } from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminCouponsView() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const { openModal, closeModal } = useModal();

    // Delete confirmation state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCoupons = async () => {
        setIsLoading(true);
        const data = await getCoupons();
        setCoupons(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const handleCreate = () => {
        openModal(
            <AdminCouponForm
                onSuccess={() => {
                    closeModal();
                    loadCoupons();
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
                    loadCoupons();
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

    const handleDeleteClick = (coupon: Coupon) => {
        setCouponToDelete(coupon);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!couponToDelete) return;

        setIsDeleting(true);
        const result = await deleteCoupon(couponToDelete.id);
        setIsDeleting(false);

        if (result.success) {
            toast.success("Cupón eliminado");
            setIsDeleteDialogOpen(false);
            loadCoupons();
        } else {
            // Better error message for FK constraints
            let errorMsg = result.error || "Error al eliminar";
            if (errorMsg.includes("foreign key constraint")) {
                errorMsg = "No se puede eliminar: El cupón ya fue usado en suscripciones u órdenes.";
            }
            toast.error(errorMsg);
        }
    };

    const handleToggleStatus = async (coupon: Coupon) => {
        startTransition(async () => {
            const result = await toggleCouponStatus(coupon.id, !coupon.is_active);
            if (result.success) {
                toast.success(coupon.is_active ? "Cupón desactivado" : "Cupón activado");
                loadCoupons();
            } else {
                toast.error(result.error || "Error al cambiar estado");
            }
        });
    };

    const columns: ColumnDef<Coupon>[] = [
        {
            accessorKey: "code",
            header: "Código",
            cell: ({ row }) => (
                <span className="font-mono font-semibold">{row.original.code}</span>
            ),
        },
        {
            accessorKey: "type",
            header: "Descuento",
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
            header: "Aplica a",
            cell: ({ row }) => {
                const map = {
                    courses: "Cursos",
                    subscriptions: "Planes",
                    all: "Ambos",
                };
                return <span>{map[row.original.applies_to]}</span>;
            },
        },
        {
            accessorKey: "redemption_count",
            header: "Usos",
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
            header: "Expira",
            cell: ({ row }) => {
                const expiresAt = row.original.expires_at;
                if (!expiresAt) return <span className="text-muted-foreground">-</span>;
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
            header: "Estado",
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Activo" : "Inactivo"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => {
                const coupon = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(coupon)}>
                                {coupon.is_active ? (
                                    <>
                                        <ToggleLeft className="mr-2 h-4 w-4" />
                                        Desactivar
                                    </>
                                ) : (
                                    <>
                                        <ToggleRight className="mr-2 h-4 w-4" />
                                        Activar
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => handleDeleteClick(coupon)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Cargando cupones...</div>
            </div>
        );
    }

    if (coupons.length === 0) {
        return (
            <>
                <Toolbar
                    portalToHeader
                    actions={[
                        { label: "Crear Cupón", icon: Plus, onClick: handleCreate },
                    ]}
                />
                <div className="h-full flex items-center justify-center">
                    <EmptyState
                        icon={Ticket}
                        title="Sin Cupones"
                        description="Creá tu primer cupón de descuento."
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Toolbar
                portalToHeader
                actions={[
                    { label: "Crear Cupón", icon: Plus, onClick: handleCreate },
                ]}
            />
            <div className="p-6">
                <DataTable
                    columns={columns}
                    data={coupons}
                    searchPlaceholder="Buscar cupones..."
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cupón?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el cupón
                            <strong> {couponToDelete?.code}</strong>.
                            {couponToDelete && (couponToDelete.redemption_count ?? 0) > 0 && (
                                <span className="block mt-2 text-destructive">
                                    ⚠️ Este cupón ya tiene {couponToDelete.redemption_count} uso(s) registrados.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
