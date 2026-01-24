"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";

import { ContentLayout } from "@/components/layout";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/modal-store";

import { PurchaseOrdersDataTable } from "../components/tables/purchase-orders-data-table";
import { PurchaseOrderForm } from "../components/forms/purchase-order-form";
import {
    PurchaseOrderView,
    PurchaseOrderStatus,
    OrganizationFinancialData,
    MaterialRequirement
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

    // Empty State
    if (!orders || orders.length === 0) {
        return (
            <ContentLayout variant="wide" className="pb-6">
                <EmptyState
                    icon={ClipboardList}
                    title="Sin órdenes de compra"
                    description="Creá tu primera orden de compra para solicitar materiales a proveedores."
                    action={
                        <Button onClick={handleNewOrder}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Orden
                        </Button>
                    }
                />
            </ContentLayout>
        );
    }

    return (
        <ContentLayout variant="wide" className="pb-6">
            <PurchaseOrdersDataTable
                data={orders}
                projectId={projectId}
                orgId={orgId}
                financialData={financialData}
                providers={providers}
                onNewOrder={handleNewOrder}
                onViewOrder={handleViewOrder}
                onUpdateStatus={handleUpdateStatus}
                onDeleteOrder={handleDeleteOrder}
            />
        </ContentLayout>
    );
}

