"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { FilePlus2, Plus, FileText, MoreHorizontal, Pencil, Trash2, Calendar, Hash, Copy } from "lucide-react";
import { toast } from "sonner";

import { Toolbar } from "@/components/layout/dashboard/shared/toolbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ViewEmptyState } from "@/components/shared/empty-state";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { useModal } from "@/stores/modal-store";
import { QuoteForm } from "../forms/quote-form";
import { deleteQuote, duplicateQuote } from "../actions";
import { QuoteView, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from "../types";
import { cn } from "@/lib/utils";

// ============================================================================
// QUOTE CHANGE ORDERS VIEW
// ============================================================================
// Tab view for managing Change Orders (Órdenes de Cambio) of a contract
// Professional design for architects - clean and minimal
// ============================================================================

interface QuoteChangeOrdersViewProps {
    contract: QuoteView;
    changeOrders: QuoteView[];
    currencies: { id: string; name: string; symbol: string }[];
}

export function QuoteChangeOrdersView({
    contract,
    changeOrders,
    currencies
}: QuoteChangeOrdersViewProps) {
    const router = useRouter();
    const { openModal, closeModal } = useModal();

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<QuoteView | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Sort by most recent first
    const sortedChangeOrders = [...changeOrders].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
    });

    // Calculate totals
    const totalImpact = changeOrders.reduce((sum, co) => sum + (co.total_with_tax || 0), 0);
    const impactPercentage = contract.total_with_tax
        ? ((totalImpact / contract.total_with_tax) * 100)
        : 0;
    const approvedCount = changeOrders.filter(co => co.status === 'approved').length;

    const handleCreateChangeOrder = () => {
        openModal(
            <QuoteForm
                mode="create"
                organizationId={contract.organization_id}
                projectId={contract.project_id || undefined}
                financialData={{
                    currencies: currencies.map(c => ({
                        ...c,
                        code: c.symbol,
                        is_default: c.id === contract.currency_id,
                        exchange_rate: 1
                    })),
                    defaultCurrencyId: contract.currency_id,
                    defaultTaxLabel: contract.tax_label || "IVA",
                    defaultWalletId: "",
                    wallets: [],
                    preferences: {} as any
                }}
                clients={[]}
                projects={[]}
                parentQuoteId={contract.id}
                parentQuoteName={contract.name}
            />,
            {
                title: "Nueva Orden de Cambio",
                description: `Para contrato: ${contract.name}`,
                size: "md"
            }
        );
    };

    const handleEdit = (co: QuoteView) => {
        openModal(
            <QuoteForm
                mode="edit"
                organizationId={contract.organization_id}
                projectId={contract.project_id || undefined}
                initialData={co as any}
                financialData={{
                    currencies: currencies.map(c => ({
                        ...c,
                        code: c.symbol,
                        is_default: c.id === contract.currency_id,
                        exchange_rate: 1
                    })),
                    defaultCurrencyId: contract.currency_id,
                    defaultTaxLabel: contract.tax_label || "IVA",
                    defaultWalletId: "",
                    wallets: [],
                    preferences: {} as any
                }}
                clients={[]}
                projects={[]}
            />,
            {
                title: "Editar Orden de Cambio",
                description: "Modificar nombre o descripción del adicional",
                size: "md"
            }
        );
    };

    const handleDeleteClick = (co: QuoteView) => {
        setItemToDelete(co);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const result = await deleteQuote(itemToDelete.id);
            if (result.success) {
                toast.success("Orden de cambio eliminada");
                router.refresh();
            } else {
                toast.error(result.error || "Error al eliminar");
            }
        } catch {
            toast.error("Error inesperado");
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return `${contract.currency_symbol || '$'} ${Math.abs(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Early return: Empty State
    if (changeOrders.length === 0) {
        return (
            <div className="h-full flex flex-col">
                <Toolbar
                    portalToHeader
                    actions={[{ label: "Nueva Orden de Cambio", icon: Plus, onClick: handleCreateChangeOrder }]}
                />
                <div className="flex-1 flex items-center justify-center">
                    <ViewEmptyState
                        mode="empty"
                        icon={FilePlus2}
                        viewName="Órdenes de Cambio"
                        featureDescription="No hay órdenes de cambio registradas para este contrato."
                        onAction={handleCreateChangeOrder}
                        actionLabel="Nueva Orden de Cambio"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toolbar
                portalToHeader
                actions={[{ label: "Nueva Orden de Cambio", icon: Plus, onClick: handleCreateChangeOrder }]}
            />

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DashboardKpiCard
                    title="Órdenes de Cambio"
                    value={changeOrders.length}
                    icon={<FileText className="h-5 w-5" />}
                    description={`${approvedCount} aprobada${approvedCount !== 1 ? 's' : ''}`}
                    size="default"
                />
                <DashboardKpiCard
                    title="Impacto Total"
                    value={`${totalImpact >= 0 ? '+' : ''}${formatCurrency(totalImpact)}`}
                    icon={<Hash className="h-5 w-5" />}
                    trend={{
                        value: `${impactPercentage >= 0 ? '+' : ''}${impactPercentage.toFixed(1)}%`,
                        label: "del contrato",
                        direction: impactPercentage >= 0 ? "up" : "down"
                    }}
                    size="default"
                />
                <DashboardKpiCard
                    title="Valor Actualizado"
                    value={formatCurrency((contract.total_with_tax || 0) + totalImpact)}
                    icon={<Calendar className="h-5 w-5" />}
                    description="Contrato + Órdenes"
                    size="default"
                />
            </div>

            {/* Change Order List */}
            <div className="space-y-3">
                {sortedChangeOrders.map((co, index) => (
                    <Card
                        key={co.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/organization/quotes/${co.id}` as any)}

                    >
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                {/* Order Number */}
                                <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                    <span className="font-semibold text-muted-foreground">
                                        #{co.change_order_number || index + 1}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <h3 className="font-medium text-foreground truncate">
                                                {co.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                <span>{formatDate(co.created_at)}</span>
                                                <span>•</span>
                                                <span>{co.item_count || 0} ítem{(co.item_count || 0) !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>

                                        {/* Amount & Status */}
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <div className="text-right">
                                                <p className={cn(
                                                    "font-mono font-medium",
                                                    (co.total_with_tax || 0) >= 0 ? "text-foreground" : "text-destructive"
                                                )}>
                                                    {(co.total_with_tax || 0) >= 0 ? '+' : ''}{formatCurrency(co.total_with_tax || 0)}
                                                </p>
                                            </div>

                                            <Badge
                                                variant="outline"
                                                className={QUOTE_STATUS_COLORS[co.status]}
                                            >
                                                {QUOTE_STATUS_LABELS[co.status]}
                                            </Badge>

                                            {/* Actions Menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(co); }}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const result = await duplicateQuote(co.id);
                                                        if (result.error) {
                                                            toast.error(result.error);
                                                        } else {
                                                            toast.success("Orden de cambio duplicada");
                                                            router.refresh();
                                                        }
                                                    }}>
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Duplicar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(co); }}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar orden de cambio?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la orden de cambio
                            <strong> "{itemToDelete?.name}"</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
