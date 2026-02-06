"use client";

import { useTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Plus, MoreHorizontal, Send, CheckCircle, XCircle, Eye, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { ContentLayout } from "@/components/layout";
import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableColumnHeader } from "@/components/shared/data-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/stores/modal-store";

import { PurchaseOrderForm } from "../forms/purchase-order-form";
import {
    PurchaseOrderView,
    PurchaseOrderStatus,
    OrganizationFinancialData,
    MaterialRequirement,
    PURCHASE_ORDER_STATUS_LABELS,
    PURCHASE_ORDER_STATUS_COLORS
} from "../types";
import { updatePurchaseOrderStatus, deletePurchaseOrder } from "../actions";
import { CatalogMaterial, MaterialUnit } from "../queries";

interface MaterialsOrdersViewProps {
    projectId: string;
    orgId: string;
    orders: PurchaseOrderView[];
    providers: { id: string; name: string }[];
    financialData: OrganizationFinancialData;
    materials?: CatalogMaterial[];
    units?: MaterialUnit[];
    requirements?: MaterialRequirement[];
}

export function MaterialsOrdersView({
    projectId,
    orgId,
    orders,
    providers,
    financialData,
    materials = [],
    units = [],
    requirements = [],
}: MaterialsOrdersViewProps) {
    const { openModal, closeModal } = useModal();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Search state for Toolbar
    const [searchQuery, setSearchQuery] = useState("");

    // ========================================
    // HANDLERS
    // ========================================

    const handleNewOrder = () => {
        openModal(
            <PurchaseOrderForm
                projectId={projectId}
                organizationId={orgId}
                providers={providers}
                financialData={financialData}
                materials={materials}
                units={units}
                requirements={requirements}
                onSuccess={() => {
                    closeModal();
                    router.refresh();
                }}
            />,
            {
                title: "Nueva Orden de Compra",
                description: "Creá una orden de compra para solicitar materiales a un proveedor.",
                size: "lg"
            }
        );
    };

    const handleViewOrder = (order: PurchaseOrderView) => {
        // TODO: Open order detail modal or fetch items
        toast.info(`Ver orden ${order.order_number}`);
    };

    const handleUpdateStatus = async (orderId: string, newStatus: PurchaseOrderStatus) => {
        startTransition(async () => {
            const result = await updatePurchaseOrderStatus(orderId, newStatus);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Estado actualizado");
                router.refresh();
            }
        });
    };

    const handleDeleteOrder = async (orderId: string) => {
        startTransition(async () => {
            const result = await deletePurchaseOrder(orderId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Orden eliminada");
                router.refresh();
            }
        });
    };

    const handleImport = () => {
        // TODO: Open import modal
        toast.info("Funcionalidad de importación próximamente");
    };

    const handleExport = () => {
        // TODO: Export to Excel
        toast.info("Funcionalidad de exportación próximamente");
    };

    // ========================================
    // COLUMNS - Defined inline following general-costs pattern
    // ========================================
    const columns: ColumnDef<PurchaseOrderView>[] = useMemo(() => [
        {
            accessorKey: "order_number",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Nº Orden" />,
            cell: ({ row }) => (
                <span className="font-mono font-medium">
                    {row.original.order_number || "—"}
                </span>
            ),
        },
        {
            accessorKey: "order_date",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.order_date
                        ? format(new Date(row.original.order_date), "dd MMM yyyy", { locale: es })
                        : "—"
                    }
                </span>
            ),
        },
        {
            accessorKey: "provider_name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Proveedor" />,
            cell: ({ row }) => (
                <span>{row.original.provider_name || "Sin asignar"}</span>
            ),
        },
        {
            accessorKey: "item_count",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Items" />,
            cell: ({ row }) => (
                <Badge variant="outline">{row.original.item_count}</Badge>
            ),
        },
        {
            accessorKey: "total",
            header: () => <div className="text-right">Total</div>,
            cell: ({ row }) => (
                <div className="text-right font-medium tabular-nums">
                    {row.original.currency_symbol || "$"}
                    {row.original.total.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
            cell: ({ row }) => {
                const status = row.original.status as PurchaseOrderStatus;
                return (
                    <Badge className={PURCHASE_ORDER_STATUS_COLORS[status]}>
                        {PURCHASE_ORDER_STATUS_LABELS[status]}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const order = row.original;
                const status = order.status as PurchaseOrderStatus;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {status === "draft" && (
                                <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, "sent")}
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Enviar a proveedor
                                </DropdownMenuItem>
                            )}

                            {(status === "sent" || status === "quoted") && (
                                <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, "approved")}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Aprobar
                                </DropdownMenuItem>
                            )}

                            {status !== "converted" && status !== "rejected" && (
                                <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, "rejected")}
                                    className="text-destructive"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Rechazar
                                </DropdownMenuItem>
                            )}

                            {status === "draft" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => handleDeleteOrder(order.id)}
                                        className="text-destructive"
                                    >
                                        Eliminar
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], []);

    // Status filter options
    const statusOptions = [
        { label: "Borrador", value: "draft" },
        { label: "Enviada", value: "sent" },
        { label: "Cotizada", value: "quoted" },
        { label: "Aprobada", value: "approved" },
        { label: "Rechazada", value: "rejected" },
        { label: "Convertida", value: "converted" },
    ];

    // Filter orders by search
    const filteredOrders = searchQuery
        ? orders.filter(o =>
            o.provider_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : orders;

    // ========================================
    // RENDER
    // ========================================
    return (
        <>
            {/* Toolbar with portal to header - Split button with Import/Export options */}
            <Toolbar
                portalToHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Buscar órdenes por proveedor..."
                actions={[
                    {
                        label: "Nueva Orden",
                        icon: Plus,
                        onClick: handleNewOrder,
                        variant: "default"
                    },
                    {
                        label: "Importar",
                        icon: Upload,
                        onClick: handleImport
                    },
                    {
                        label: "Exportar",
                        icon: Download,
                        onClick: handleExport
                    }
                ]}
            />

            <ContentLayout variant="wide" className="pb-6">
                {/* Empty State - sin botón, la acción está en la toolbar del header */}
                {(!orders || orders.length === 0) ? (
                    <ViewEmptyState
                        mode="empty"
                        icon={ClipboardList}
                        viewName="Órdenes de Compra"
                        featureDescription="Creá tu primera orden de compra usando el botón en la barra superior."
                        onAction={handleNewOrder}
                        actionLabel="Nueva Orden"
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredOrders}
                        facetedFilters={[
                            {
                                columnId: "status",
                                title: "Estado",
                                options: statusOptions
                            }
                        ]}
                        initialSorting={[{ id: "order_date", desc: true }]}
                    />
                )}
            </ContentLayout>
        </>
    );
}
