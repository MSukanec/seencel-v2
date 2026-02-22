"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, CreditCard, Landmark, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { useModal } from "@/stores/modal-store";
import { useOptimisticList } from "@/hooks/use-optimistic-action";

import { AdminPaymentForm } from "../forms/admin-payment-form";
import { BankTransferForm } from "../components/bank-transfer-form";
import { BankTransferDetailModal } from "../components/bank-transfer-detail-modal";
import { deletePayment, deleteBankTransfer } from "../actions";
import type { AdminPayment, AdminBankTransfer } from "../queries";

// ============================================================================
// PROPS
// ============================================================================

interface AdminFinancePaymentsViewProps {
    payments: AdminPayment[];
    bankTransfers: AdminBankTransfer[];
}

// ============================================================================
// HELPERS
// ============================================================================

function getStatusBadge(status: string) {
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

function getProviderBadge(provider: string, gateway?: string | null) {
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
// TAB SWITCHER COMPONENT
// ============================================================================

interface TabSwitcherProps {
    activeTab: "payments" | "transfers";
    onTabChange: (tab: "payments" | "transfers") => void;
    paymentsCount: number;
    transfersCount: number;
}

function TabSwitcher({ activeTab, onTabChange, paymentsCount, transfersCount }: TabSwitcherProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
            <button
                onClick={() => onTabChange("payments")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === "payments"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                <CreditCard className="h-4 w-4" />
                <span>Pagos</span>
                <span className="text-xs opacity-60">({paymentsCount})</span>
            </button>
            <button
                onClick={() => onTabChange("transfers")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === "transfers"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
            >
                <Landmark className="h-4 w-4" />
                <span>Transferencias</span>
                <span className="text-xs opacity-60">({transfersCount})</span>
            </button>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdminFinancePaymentsView({ payments, bankTransfers }: AdminFinancePaymentsViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"payments" | "transfers">("payments");

    // Optimistic delete for payments
    const {
        optimisticItems: optimisticPayments,
        removeItem: optimisticRemovePayment
    } = useOptimisticList({
        items: payments,
        getItemId: (p) => p.id,
    });

    // Optimistic delete for transfers
    const {
        optimisticItems: optimisticTransfers,
        removeItem: optimisticRemoveTransfer
    } = useOptimisticList({
        items: bankTransfers,
        getItemId: (t) => t.id,
    });

    // ========================================
    // PAYMENTS HANDLERS
    // ========================================

    const handleCreatePayment = () => {
        openModal(
            <AdminPaymentForm />,
            { title: "Nuevo Pago", description: "Registra un pago manualmente.", size: "md" }
        );
    };

    const handleEditPayment = (payment: AdminPayment) => {
        openModal(
            <AdminPaymentForm initialData={payment} />,
            { title: "Editar Pago", description: `Modificando pago de ${payment.user?.full_name || payment.user?.email}`, size: "md" }
        );
    };

    const handleDeletePayment = (payment: AdminPayment) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>¿Estás seguro de eliminar el pago de <strong>{payment.user?.full_name || payment.user?.email}</strong>?</p>
                <p className="text-sm text-muted-foreground">Monto: {formatCurrency(payment.amount, payment.currency)}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            const paymentId = payment.id;
                            closeModal();
                            optimisticRemovePayment(paymentId, async () => {
                                try {
                                    await deletePayment(paymentId);
                                    toast.success("Pago eliminado");
                                } catch {
                                    toast.error("Error al eliminar pago");
                                    router.refresh();
                                }
                            });
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>,
            { title: "Eliminar Pago", description: "Esta acción no se puede deshacer." }
        );
    };

    // ========================================
    // TRANSFERS HANDLERS
    // ========================================

    const handleViewTransfer = (transfer: AdminBankTransfer) => {
        openModal(
            <BankTransferDetailModal
                transfer={transfer}
                onEdit={() => {
                    closeModal();
                    handleEditTransfer(transfer);
                }}
                onClose={closeModal}
            />,
            { title: "Detalle de Transferencia", description: `Transferencia de ${transfer.user?.full_name || transfer.user?.email}`, size: "lg" }
        );
    };

    const handleEditTransfer = (transfer: AdminBankTransfer) => {
        openModal(
            <BankTransferForm
                transfer={transfer}
                onSuccess={() => { closeModal(); router.refresh(); }}
                onCancel={closeModal}
            />,
            { title: "Revisar Transferencia", description: `Transferencia de ${transfer.user?.full_name || transfer.user?.email}`, size: "lg" }
        );
    };

    const handleDeleteTransfer = (transfer: AdminBankTransfer) => {
        openModal(
            <div className="flex flex-col gap-4">
                <p>¿Estás seguro de eliminar la transferencia de <strong>{transfer.user?.full_name || transfer.user?.email}</strong>?</p>
                <p className="text-sm text-muted-foreground">Monto: {formatCurrency(transfer.amount, transfer.currency)}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeModal}>Cancelar</Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            const transferId = transfer.id;
                            closeModal();
                            optimisticRemoveTransfer(transferId, async () => {
                                const result = await deleteBankTransfer(transferId);
                                if (result.success) {
                                    toast.success("Transferencia eliminada");
                                } else {
                                    toast.error(result.error || "Error al eliminar");
                                    router.refresh();
                                }
                            });
                        }}
                    >
                        Eliminar
                    </Button>
                </div>
            </div>,
            { title: "Eliminar Transferencia", description: "Esta acción no se puede deshacer." }
        );
    };

    // ========================================
    // PAYMENT COLUMNS
    // ========================================

    const paymentColumns: ColumnDef<AdminPayment>[] = [
        {
            id: "user",
            accessorFn: (row) => row.user?.full_name || row.user?.email || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
            cell: ({ row }) => {
                const user = row.original.user;
                const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || user?.email?.[0]?.toUpperCase() || "?";
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
            id: "provider",
            accessorFn: (row) => row.provider,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
            cell: ({ row }) => getProviderBadge(row.original.provider, row.original.gateway),
        },
        {
            id: "amount",
            accessorFn: (row) => row.amount,
            header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
            cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.amount, row.original.currency)}</span>,
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => getStatusBadge(row.original.status),
        },
        {
            id: "product",
            accessorFn: (row) => row.course?.title || row.product_type || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Producto" />,
            cell: ({ row }) => {
                const payment = row.original;
                // If there's a course, show its title
                if (payment.course) {
                    return <span className="text-sm">{payment.course.title}</span>;
                }
                // For other product types, show a readable label
                const productLabels: Record<string, string> = {
                    subscription: "Suscripción",
                    course: "Curso",
                    seats: "Asientos",
                    seat_purchase: "Asientos",
                    upgrade: "Upgrade de Plan",
                };
                const label = payment.product_type
                    ? productLabels[payment.product_type] || payment.product_type
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
        },
    ];

    // ========================================
    // TRANSFER COLUMNS
    // ========================================

    const transferColumns: ColumnDef<AdminBankTransfer>[] = [
        {
            accessorKey: "created_at",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {format(new Date(row.original.created_at), "dd/MM/yy HH:mm", { locale: es })}
                </span>
            ),
        },
        {
            id: "user",
            accessorFn: (row) => row.user?.full_name || row.user?.email || "",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
            cell: ({ row }) => {
                const user = row.original.user;
                const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || user?.email?.[0]?.toUpperCase() || "?";
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm">{user?.full_name || row.original.payer_name || "Sin nombre"}</span>
                            <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                    </div>
                );
            },
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
        },
    ];

    // ========================================
    // FILTER OPTIONS
    // ========================================

    const paymentStatusOptions = [
        { label: "Completado", value: "completed" },
        { label: "Pendiente", value: "pending" },
        { label: "Rechazado", value: "rejected" },
    ];

    const transferStatusOptions = [
        { label: "Pendiente", value: "pending" },
        { label: "Aprobado", value: "approved" },
        { label: "Rechazado", value: "rejected" },
    ];

    // ========================================
    // RENDER
    // ========================================

    const renderPaymentsContent = () => {
        if (optimisticPayments.length === 0) {
            return (
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={CreditCard}
                        viewName="Pagos Registrados"
                        featureDescription="Los pagos aparecerán cuando los usuarios compren cursos."
                    />
                </div>
            );
        }

        return (
            <DataTable
                columns={paymentColumns}
                data={optimisticPayments}
                enableRowSelection={true}
                enableRowActions={true}
                onEdit={handleEditPayment}
                onDelete={handleDeletePayment}
                searchPlaceholder="Buscar pagos..."
                pageSize={50}
                facetedFilters={[{ columnId: "status", title: "Estado", options: paymentStatusOptions }]}
                initialSorting={[{ id: "created_at", desc: true }]}
            />
        );
    };

    const renderTransfersContent = () => {
        if (optimisticTransfers.length === 0) {
            return (
                <div className="h-full flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={Landmark}
                        viewName="Transferencias Bancarias"
                        featureDescription="Las transferencias bancarias aparecerán aquí."
                    />
                </div>
            );
        }

        return (
            <DataTable
                columns={transferColumns}
                data={optimisticTransfers}
                enableRowSelection={true}
                enableRowActions={true}
                onRowClick={handleViewTransfer}
                onEdit={handleEditTransfer}
                onDelete={handleDeleteTransfer}
                searchPlaceholder="Buscar transferencias..."
                pageSize={50}
                facetedFilters={[{ columnId: "status", title: "Estado", options: transferStatusOptions }]}
                initialSorting={[{ id: "created_at", desc: true }]}
            />
        );
    };

    return (
        <>
            <Toolbar
                portalToHeader
                leftActions={
                    <TabSwitcher
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        paymentsCount={optimisticPayments.length}
                        transfersCount={optimisticTransfers.length}
                    />
                }
                actions={activeTab === "payments" ? [{ label: "Nuevo Pago", icon: Plus, onClick: handleCreatePayment }] : []}
            />
            {activeTab === "payments" ? renderPaymentsContent() : renderTransfersContent()}
        </>
    );
}
